"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Menu, X, Home, Folder, Calendar, BookOpen, Trophy, Shield, LogOut, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // PWA install prompt handling
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    function beforeInstallHandler(e: any) {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    }
    window.addEventListener('beforeinstallprompt', beforeInstallHandler as any);
    return () => window.removeEventListener('beforeinstallprompt', beforeInstallHandler as any);
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      // choice.outcome is 'accepted' or 'dismissed'
      // hide the install button after choice
      setDeferredPrompt(null);
      setCanInstall(false);
      // You may want to record the outcome in analytics
      console.log('PWA install choice:', choice?.outcome);
    } catch (err) {
      console.warn('Error prompting PWA install', err);
    }
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent scroll when mobile menu is open
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

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: Home },
    { name: "Projects", path: "/projects", icon: Folder },
    { name: "Events", path: "/events", icon: Calendar },
    { name: "Sessions", path: "/sessions", icon: BookOpen },
    { name: "Leaderboard", path: "/leaderboard", icon: Trophy },
  ];

  // Only show Admin link for admin and mentor roles
  if (user?.role === "admin" || user?.role === "mentor") {
    navItems.push({ name: "Admin", path: "/admin", icon: Shield });
  }

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + "/");

  return (
    <>
      {/* Desktop Navbar - Hidden on Mobile */}
      <nav className="hidden lg:flex sticky top-0 z-40 items-center justify-between py-3 px-4 md:px-10 bg-black/95 backdrop-blur-sm text-white border-b border-white/10">
        {/* Logo */}
        <Link 
          href="/" 
          className="tracking-[0.3em] font-semibold text-xs md:text-sm hover:text-cyan-400 transition-colors flex-shrink-0"
        >
          CODE 4O4
        </Link>

        {/* Desktop Navigation */}
        <ul className="flex gap-6 xl:gap-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <Link
                  href={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive(item.path)
                      ? "text-cyan-400 bg-cyan-400/10 font-semibold" 
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Desktop Right Side */}
        <div className="flex items-center gap-3">
          {canInstall && (
            <button
              onClick={promptInstall}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500 text-black font-medium hover:opacity-90 transition-all"
              aria-label="Install app"
            >
              Install
            </button>
          )}
          {/* Notification bell removed while notification system is disabled */}
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:text-cyan-400 hover:bg-white/5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Logout</span>
          </button>
          <Link 
            href="/dashboard/profile"
            className="flex items-center gap-2 border border-white/20 rounded-full px-3 py-1.5 hover:border-cyan-400/50 hover:bg-white/5 transition-all"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name || "avatar"}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-xs font-semibold">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
            <span className="text-sm hidden xl:inline">{user?.name || "User"}</span>
          </Link>
        </div>
      </nav>

      {/* Mobile: Top Bar with Menu and Notification */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-black/95 backdrop-blur-sm border-b border-white/10">
        {/* Menu Button - Left */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-6 h-6 text-white" />
        </button>

        {/* Logo - Center */}
        <Link 
          href="/" 
          className="tracking-[0.3em] font-semibold text-xs text-white hover:text-cyan-400 transition-colors"
        >
          CODE 4O4
        </Link>

        {/* Notification Bell removed while notification system is disabled */}
        <div className="flex items-center" />
      </div>

      {/* Mobile Sidebar Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />

            {/* Sidebar - Slides from LEFT */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-gray-900 border-r border-white/10 z-50 lg:hidden overflow-y-auto shadow-2xl"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                  <h2 className="text-lg font-semibold text-white">Menu</h2>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* User Profile */}
                <Link
                  href="/dashboard/profile"
                  className="flex items-center gap-3 p-6 border-b border-white/10 hover:bg-white/5 transition-colors"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name || "avatar"}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-lg font-semibold">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-white">{user?.name || "User"}</p>
                    <p className="text-xs text-gray-400 capitalize">{user?.role || "Member"}</p>
                  </div>
                  <User className="w-4 h-4 text-gray-400" />
                </Link>

                {/* Navigation Links */}
                <nav className="flex-1 p-4">
                  <ul className="space-y-1">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li key={item.name}>
                          <Link
                            href={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                              isActive(item.path)
                                ? "text-cyan-400 bg-cyan-400/10 font-semibold" 
                                : "text-gray-300 hover:text-white hover:bg-white/5"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span>{item.name}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>

                {/* Logout Button */}
                <div className="p-4 border-t border-white/10">
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg text-red-400 hover:bg-red-400/10 transition-all font-medium"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
