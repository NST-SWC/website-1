"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock,
  Flame,
  Sparkles,
} from "lucide-react";
import {
  featureCards,
  heroStats,
  journeySteps,
  techStack,
} from "@/lib/data";
import { Button } from "@/components/ui/button";
import { JoinClubModal } from "@/components/modals/join-club-modal";
import { LoginModal } from "@/components/modals/login-modal";
import { useAuth } from "@/context/auth-context";
import Navbar from "@/components/shared/navbar";
import * as Icons from "lucide-react";

const iconMap = Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>;

export const HomeLanding = () => {
  const [joinOpen, setJoinOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleLogin = useCallback(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
      return;
    }
    setLoginOpen(true);
  }, [isAuthenticated, router]);

  return (
    <>
      <Navbar showGuestCtas onLogin={handleLogin} onJoin={() => setJoinOpen(true)} />
      <div className="relative overflow-hidden pb-24 pt-6">
        <BackgroundGlow />
        <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
          <Hero
            onJoin={() => setJoinOpen(true)}
            onLogin={handleLogin}
            user={user}
            isAuthenticated={isAuthenticated}
          />
          <StatsRow />
          <FeatureGrid />
          <JourneySection />
          <Footer />
        </div>
      </div>
      <JoinClubModal open={joinOpen} onClose={() => setJoinOpen(false)} />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
};

type AuthShape = ReturnType<typeof useAuth>;
type MaybeUser = AuthShape["user"];

const Hero = ({
  onJoin,
  onLogin,
  user,
  isAuthenticated,
}: {
  onJoin: () => void;
  onLogin: () => void;
  user: MaybeUser;
  isAuthenticated: boolean;
}) => {
  return (
  <section id="join" className="mt-6 grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="space-y-8"
    >
      <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 px-4 py-1 text-xs uppercase tracking-[0.3em] text-orange-300">
        ⚡ Future of Dev Learning
      </span>
      <div>
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
          {isAuthenticated
            ? `Welcome back, ${user?.name.split(" ")[0] ?? "Member"}`
            : "Build, Learn, Grow Together as Developers"}
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-white/70">
          {isAuthenticated
            ? "You are logged in. Jump into the dashboard, scan live events, or continue collaborating with your squad."
            : "Join DevForge to collaborate on ambitious projects, unlock portal-powered workspaces, get curated mentorship, and climb our gamified leaderboard."}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        {isAuthenticated ? (
          <>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#00f5c4] to-[#00c2ff] px-5 py-2 text-base font-semibold text-black shadow-[0_0_35px_rgba(0,245,196,0.4)] transition hover:scale-[1.01]"
            >
              Open Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2 text-base text-white/80 transition hover:border-orange-400 hover:text-white"
            >
              View Projects
            </Link>
          </>
        ) : (
          <>
            <Button onClick={onJoin} glow className="text-base">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
            <Button onClick={onLogin} variant="secondary" className="text-base">
              Explore Portal
            </Button>
          </>
        )}
        <Link
          href="/projects"
          className="flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
        >
          <Sparkles className="h-4 w-4 text-orange-400" />
          Explore live builds
        </Link>
      </div>
    </motion.div>
  </section>
);
};

const StatsRow = () => (
  <section className="mt-12 grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 sm:grid-cols-2 lg:grid-cols-4">
    {heroStats.map((stat) => (
      <div key={stat.label}>
        <p className="text-3xl font-semibold text-white">{stat.value}</p>
        <p className="text-sm text-white/70">{stat.label}</p>
        <p className="text-xs text-white/60">{stat.detail}</p>
      </div>
    ))}
  </section>
);

const FeatureGrid = () => (
  <section className="mt-16 space-y-6">
    <div>
      <p className="text-sm uppercase tracking-[0.3em] text-orange-300">
        Why join
      </p>
      <h2 className="mt-2 text-3xl font-semibold">Designed for builders</h2>
    </div>
    <div className="grid gap-6 md:grid-cols-2">
      {featureCards.map((feature) => {
        const IconComponent =
          iconMap[feature.icon] || iconMap["Sparkles"] || Sparkles;
        return (
          <div
            key={feature.title}
            className="glow-border relative overflow-hidden p-6"
          >
            <div className="absolute inset-0 opacity-40">
              <div className="matrix-grid h-full" />
            </div>
            <div className="relative space-y-4">
              <IconComponent className="h-10 w-10 text-orange-400" />
              <div>
                <h3 className="text-2xl font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-white/70">
                  {feature.description}
                </p>
              </div>
              <p className="text-sm text-orange-300">{feature.highlight}</p>
            </div>
          </div>
        );
      })}
    </div>

    <div className="mt-10 rounded-3xl border border-white/10 bg-black/50 p-6">
      <p className="text-sm uppercase tracking-[0.35em] text-white/60">
        Tech we love
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {techStack.map((tech) => (
          <span
            key={tech}
            className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-white/70"
          >
            {tech}
          </span>
        ))}
      </div>
    </div>
  </section>
);

const JourneySection = () => (
  <section className="mt-16 rounded-3xl border border-white/10 bg-white/5 p-8">
    <div>
      <p className="text-sm uppercase tracking-[0.3em] text-orange-300">
        Member journey
      </p>
      <h2 className="mt-2 text-3xl font-semibold">How the flow works</h2>
    </div>
    <div className="mt-8 grid gap-6 md:grid-cols-3">
      {journeySteps.map((step) => (
        <div
          key={step.title}
          className="rounded-3xl border border-white/10 bg-black/40 p-6"
        >
          <p className="text-xs uppercase tracking-[0.4em] text-white/60">
            {step.title}
          </p>
          <p className="mt-3 text-sm text-white/70">{step.summary}</p>
          <ul className="mt-4 space-y-2 text-sm text-white/60">
            {step.micro.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-orange-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </section>
);

const Footer = () => (
  <footer className="mt-16 flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/40 p-6 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
         <p>© {new Date().getFullYear()} DevForge</p>
    <div className="flex flex-wrap items-center gap-3">
    </div>
  </footer>
);

const BackgroundGlow = () => (
  <>
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-[#00f5c4]/15 blur-[120px]" />
      <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-[#00b0ff]/20 blur-[140px]" />
      <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[#00ff9d]/10 blur-[160px]" />
    </div>
  </>
);
