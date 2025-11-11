"use client";

import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";

const authedLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Projects", href: "/projects" },
  { label: "Events", href: "/events" },
  { label: "Sessions", href: "/sessions" },
  { label: "Leaderboard", href: "/leaderboard" },
];

const adminLinks = [
  { label: "Admin", href: "/admin" },
];

export const PageContainer = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated, logout } = useAuth();

  // Show admin links only if user is admin
  const navigationLinks = isAuthenticated 
    ? [...authedLinks, ...(user?.role === "admin" ? adminLinks : [])]
    : [{ label: "Home", href: "/" }];

  return (
    <div className="min-h-screen bg-[#010107] text-white">
      <div className="sticky top-0 z-30 border-b border-white/5 bg-[#010107]/80 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-sm uppercase tracking-[0.4em] text-white/70">

            CODE 4O4 Dev Club
          </Link>
          <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
            {navigationLinks.map(
              (link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full px-3 py-1 transition hover:text-white"
                >
                  {link.label}
                </Link>
              ),
            )}
            {isAuthenticated && user && (
              <>
                <Button variant="ghost" onClick={logout}>
                  Logout
                </Button>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-white/80 transition hover:border-emerald-300 hover:text-white"
                >
                  <div className="relative h-8 w-8 overflow-hidden rounded-full border border-white/20">
                    <Image
                      src={user.avatar}
                      alt={user.name}
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  </div>
                  <span>{user.name.split(" ")[0]}</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
};
