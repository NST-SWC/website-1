"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  Menu,
  X,
  Home,
  Folder,
  Calendar,
  BookOpen,
  Trophy,
  Shield,
  LogOut,
  UserPlus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import NotificationBell from "@/components/notifications/notification-bell";

const baseNavItems = [
  { name: "Dashboard", path: "/dashboard", icon: Home, description: "Home base" },
  { name: "Projects", path: "/projects", icon: Folder, description: "Squad builds" },
  { name: "Events", path: "/events", icon: Calendar, description: "Live schedule" },
  { name: "Calendar", path: "/sessions", icon: Calendar, description: "Club calendar" },
  { name: "Leaderboard", path: "/leaderboard", icon: Trophy, description: "Club stats" },
];

type NavbarProps = {
  showGuestCtas?: boolean;
  onLogin?: () => void;
  onJoin?: () => void;
};

export default function Navbar({ showGuestCtas = false, onLogin, onJoin }: NavbarProps = {}) {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    function beforeInstallHandler(event: any) {
      event.preventDefault();
      setDeferredPrompt(event);
      setCanInstall(true);
    }
    window.addEventListener("beforeinstallprompt", beforeInstallHandler as any);
    return () => window.removeEventListener("beforeinstallprompt", beforeInstallHandler as any);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateStandalone = () => {
      const mediaMatch = typeof window.matchMedia === "function"
        ? window.matchMedia("(display-mode: standalone)").matches
        : false;
      const iosStandalone = (window.navigator as any)?.standalone;
      setIsStandalone(Boolean(mediaMatch || iosStandalone));
    };
    updateStandalone();
    if (typeof window.matchMedia !== "function") {
      return;
    }
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const listener = () => updateStandalone();
    mediaQuery.addEventListener
      ? mediaQuery.addEventListener("change", listener)
      : mediaQuery.addListener(listener);
    document.addEventListener("visibilitychange", listener);
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", listener);
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(listener);
      }
      document.removeEventListener("visibilitychange", listener);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setCanInstall(false);
    } catch (error) {
      console.warn("Error prompting install", error);
    }
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const showInstallButton = canInstall && !isStandalone;

  const navItems = useMemo(() => {
    if ((user?.role === "admin" || user?.role === "mentor") && isAuthenticated) {
      return [...baseNavItems, { name: "Admin", path: "/admin", icon: Shield, description: "Crew tools" }];
    }
    return baseNavItems;
  }, [user?.role, isAuthenticated]);

  const shouldShowBell = isAuthenticated || showGuestCtas;

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  const handleLoginClick = () => {
    if (onLogin) {
      onLogin();
      setIsMobileMenuOpen(false);
    } else {
      window.location.href = "/";
    }
  };

  const handleJoinClick = () => {
    if (onJoin) {
      onJoin();
      setIsMobileMenuOpen(false);
    } else {
      window.location.href = "/";
    }
  };

  const isActive = (path: string) => pathname === path || pathname?.startsWith(`${path}/`);

  return (
    <>
      <nav className="sticky top-0 z-40 hidden items-center justify-between border-b border-white/10 bg-transparent px-4 py-3 text-white backdrop-blur-sm lg:flex md:px-10">
        <Link
          href="/"
          className="flex-shrink-0 font-semibold tracking-[0.3em] text-xs hover:text-orange-400 md:text-sm"
        >
          DevForge
        </Link>

        <ul className="flex gap-6 xl:gap-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <Link
                  href={item.path}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 transition ${
                    isActive(item.path)
                      ? "bg-orange-400/10 font-semibold text-orange-400"
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-3">
          {showInstallButton && (
            <button
              onClick={promptInstall}
              className="rounded-full bg-gradient-to-r from-[#00f5c4] to-[#00b0ff] px-4 py-2 text-sm font-semibold text-black shadow-[0_0_25px_rgba(0,176,255,0.45)] transition hover:scale-[1.01]"
              aria-label="Install app"
            >
              Install
            </button>
          )}
          {shouldShowBell && <NotificationBell buttonVariant="solid" />}
          {isAuthenticated ? (
            <>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-white/5 hover:text-orange-400"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 transition hover:border-orange-400/50 hover:bg-white/5"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={user?.name || "Avatar"} className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-xs font-semibold">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                <span className="hidden text-sm xl:inline">{user?.name || "User"}</span>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleLoginClick}
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-orange-400/60 hover:text-white"
              >
                Login
              </button>
              {showGuestCtas && (
                <button
                  onClick={handleJoinClick}
                  className="rounded-full bg-gradient-to-r from-orange-400 to-orange-600 px-4 py-2 text-sm font-semibold text-black shadow-lg shadow-orange-500/40"
                >
                  Join
                </button>
              )}
            </div>
          )}
        </div>
      </nav>

      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-transparent px-3 py-2 backdrop-blur-sm lg:hidden">
        <button
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          className="rounded-md p-2 text-white hover:bg-white/10"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/" className="text-xs font-semibold tracking-[0.2em] text-white hover:text-orange-400">
          DevForge
        </Link>
        <div className="flex items-center gap-2">
          {shouldShowBell && <NotificationBell buttonVariant="icon" />}
          {!isAuthenticated && showGuestCtas && (
            <button
              onClick={handleJoinClick}
              className="flex items-center gap-1 rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/80"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Join
            </button>
          )}
          {showInstallButton && (
            <button
              onClick={promptInstall}
              className="rounded-full bg-gradient-to-r from-[#00f5c4] to-[#00b0ff] px-3 py-1.5 text-sm font-semibold text-black shadow-[0_0_22px_rgba(0,176,255,0.35)]"
            >
              Install
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ y: "12%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "12%", opacity: 0 }}
              transition={{ type: "spring", damping: 18, stiffness: 220 }}
              className="mx-4 mt-6 rounded-[32px] border border-white/10 bg-gradient-to-br from-[#03101b]/95 via-slate-900/80 to-[#071827]/95 p-6 text-white shadow-[0_40px_120px_rgba(3,7,17,0.75)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.45em] text-white/60">DevForge</p>
                  <p className="text-2xl font-semibold">
                    {isAuthenticated && user?.name ? `Welcome back, ${user.name.split(" ")[0]}` : "Welcome"}
                  </p>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-full border border-white/15 p-2 text-white/70 hover:text-white"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 space-y-3">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-3 transition ${
                        isActive(item.path)
                          ? "border-orange-400/60 bg-orange-400/10 text-white"
                          : "border-white/10 bg-white/5 text-white/80 hover:border-orange-400/40 hover:text-white"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold">{item.name}</p>
                        <p className="text-xs text-white/60">{item.description}</p>
                      </div>
                      <Icon className="h-5 w-5" />
                    </Link>
                  );
                })}
              </div>

              <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-3">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user?.name || "User avatar"}
                          className="h-12 w-12 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 text-lg font-semibold">
                          {user?.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-base font-semibold">{user?.name || "Member"}</p>
                        <p className="text-xs uppercase tracking-[0.4em] text-white/60">{user?.role || "student"}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-white/80 hover:border-red-400/60 hover:text-red-300"
                      >
                        Logout
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3">
                      <Link
                        href="/dashboard"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-orange-400 to-orange-600 px-4 py-3 text-sm font-semibold text-black shadow-lg shadow-orange-500/40"
                      >
                        Open Dashboard
                        <Home className="h-4 w-4" />
                      </Link>
                      <Link
                        href="/projects"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-between rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold text-white/80 hover:border-orange-400/50 hover:text-white"
                      >
                        View Projects
                        <Folder className="h-4 w-4" />
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                    <p>Join DevForge to unlock dashboard, projects, and weekly sessions.</p>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={handleLoginClick}
                        className="flex-1 rounded-full border border-white/20 px-3 py-2 text-xs font-semibold text-white/80"
                      >
                        Login
                      </button>
                      {showGuestCtas && (
                        <button
                          onClick={handleJoinClick}
                          className="flex-1 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 px-3 py-2 text-xs font-semibold text-black"
                        >
                          Join the club
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
