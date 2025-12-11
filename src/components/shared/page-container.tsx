"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/context/auth-context";
import Navbar from "./navbar";

const guestLinks = [
  { label: "Home", href: "/" },
  { label: "Projects", href: "/projects" },
  { label: "Events", href: "/events" },
  { label: "Sessions", href: "/sessions" },
];

export const PageContainer = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <div className="min-h-screen bg-[#010107] text-white">
      {isAuthenticated ? (
        <Navbar />
      ) : (
        <header className="sticky top-0 z-30 border-b border-white/10 bg-black/80 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/"
              className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70 transition hover:text-orange-400"
            >
              DevForge
            </Link>
            <nav className="flex flex-wrap items-center gap-2 text-sm text-white/70">
              {guestLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-3 py-1 transition ${
                    isActive(link.href)
                      ? "bg-orange-400/10 font-semibold text-orange-300"
                      : "hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/"
                className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white/70 transition hover:border-orange-400/60 hover:text-white"
              >
                Login
              </Link>
            </nav>
          </div>
        </header>
      )}
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
};
