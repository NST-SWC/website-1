"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle,
  Clock,
  Flame,
  Layers,
  ListChecks,
  LogOut,
  Plus,
  Settings,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import {
  adminQueue,
  calendarSessions,
  leaderboardPreview,
  upcomingEvents,
} from "@/lib/data";
import { registerProjectInterest, rsvpToEvent } from "@/lib/firebase/firestore";
import { formatDate } from "@/lib/utils";
import type { ShowcaseProject } from "@/types";

const STORAGE_KEYS = {
  projects: "project-interest-status",
  events: "event-rsvp-status",
};

const navLinks = [
  { label: "Projects", icon: ListChecks, href: "/projects" },
  { label: "Events", icon: CalendarDays, href: "/events" },
  { label: "Sessions", icon: Clock, href: "/sessions" },
  { label: "Leaderboard", icon: Trophy, href: "/leaderboard" },
  { label: "Admin", icon: ShieldCheck, href: "/admin" },
];

const statCards = [
  { label: "Active Projects", value: 1, icon: Layers, tone: "emerald" },
  { label: "Upcoming Events", value: 3, icon: CalendarDays, tone: "sky" },
  { label: "Sprint Sessions", value: 4, icon: Clock, tone: "indigo" },
  { label: "Your Points", value: 1500, icon: Trophy, tone: "amber" },
  { label: "Badges Earned", value: 2, icon: CheckCircle, tone: "purple" },
];

const toneMap: Record<string, string> = {
  emerald: "from-emerald-400/25 to-emerald-500/10 text-emerald-200",
  sky: "from-sky-400/25 to-sky-500/10 text-sky-200",
  indigo: "from-indigo-400/25 to-indigo-500/10 text-indigo-200",
  amber: "from-amber-400/25 to-amber-500/10 text-amber-200",
  purple: "from-purple-400/25 to-purple-500/10 text-purple-200",
};

const readCache = (key: string) => {
  if (typeof window === "undefined") return {};
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as Record<string, string>) : {};
  } catch (error) {
    console.warn(`Failed to parse cache for ${key}`, error);
    return {};
  }
};

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState<ShowcaseProject[]>([]);
  const [userProjects, setUserProjects] = useState<any[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    activeProjects: 0,
    upcomingSessions: 0,
    points: 0,
    badges: 0,
  });
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [projectStatus, setProjectStatus] = useState<Record<string, string>>(() =>
    readCache(STORAGE_KEYS.projects),
  );
  const [eventStatus, setEventStatus] = useState<Record<string, string>>(() =>
    readCache(STORAGE_KEYS.events),
  );
  const [adminDecisions, setAdminDecisions] = useState<Record<string, string>>(
    {},
  );
  const [toast, setToast] = useState<string | null>(null);

  // Fetch user-specific dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) {
        setLoadingDashboard(false);
        return;
      }

      try {
        console.log("🔄 Fetching dashboard data for user:", user.id);
        const response = await fetch(`/api/dashboard?userId=${user.id}`);
        const result = await response.json();
        
        if (result.ok && result.data) {
          console.log("✅ Dashboard data:", result.data);
          setStats(result.data.stats);
          setUserProjects(result.data.projects || []);
          setUpcomingSessions(result.data.sessions || []);
        }
      } catch (error) {
        console.error("❌ Error fetching dashboard data:", error);
      } finally {
        setLoadingDashboard(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Fetch projects from Firebase
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        console.log("🔄 Fetching projects from API...");
        const response = await fetch("/api/projects");
        console.log("📡 Response status:", response.status);
        
        const result = await response.json();
        console.log("📦 API result:", result);
        
        if (result.ok && result.data) {
          console.log(`✅ Fetched ${result.data.length} projects:`, result.data);
          setProjects(result.data);
        } else {
          console.warn("⚠️  API returned ok:false or no data:", result);
        }
      } catch (error) {
        console.error("❌ Error fetching projects:", error);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
    // Auto-refresh projects every 10 seconds
    const interval = setInterval(fetchProjects, 10000);
    return () => clearInterval(interval);
  }, []);

  const profile = useMemo(
    () => ({
      points: stats.points || user?.points || 0,
      badges: stats.badges || user?.badges || 0,
      role: user?.role ?? "student",
    }),
    [user, stats],
  );

  // Dynamic stat cards based on user data
  const dynamicStatCards = useMemo(() => [
    { label: "Active Projects", value: stats.activeProjects, icon: Layers, tone: "emerald" },
    { label: "Upcoming Sessions", value: stats.upcomingSessions, icon: Clock, tone: "indigo" },
    { label: "Your Points", value: stats.points, icon: Trophy, tone: "amber" },
    { label: "Badges Earned", value: stats.badges, icon: CheckCircle, tone: "purple" },
  ], [stats]);

  const handleProjectRequest = async (projectId: string) => {
    setProjectStatus((prev) => ({ ...prev, [projectId]: "sending" }));
    const result = await registerProjectInterest(projectId, user?.id ?? "preview");
    setProjectStatus((prev) => {
      const next = { ...prev, [projectId]: result.ok ? "sent" : "error" };
      if (result.ok && typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(next));
      }
      return next;
    });
    setToast(result.message);
    setTimeout(() => setToast(null), 2500);
  };

  const handleEventRsvp = async (eventId: string) => {
    setEventStatus((prev) => ({ ...prev, [eventId]: "sending" }));
    const result = await rsvpToEvent(eventId, user?.id ?? "preview");
    setEventStatus((prev) => {
      const next = { ...prev, [eventId]: result.ok ? "sent" : "error" };
      if (result.ok && typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(next));
      }
      return next;
    });
    setToast(result.message);
    setTimeout(() => setToast(null), 2500);
  };

  const handleDecision = (requestId: string, decision: "approve" | "hold") => {
    setAdminDecisions((prev) => ({ ...prev, [requestId]: decision }));
    setToast(
      decision === "approve"
        ? "Member approved successfully."
        : "Request moved to review queue.",
    );
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className="min-h-screen bg-[#010107] pb-16 text-white">
      <div className="mx-auto flex max-w-6xl gap-6 px-4 pt-10 sm:px-6 lg:px-8">
        <aside className="hidden w-56 flex-col gap-6 rounded-3xl border border-white/10 bg-black/40 p-6 md:flex">
          <div>
            <p className="text-lg font-semibold">NSTSWC Dev Club</p>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Portal
            </p>
          </div>
          <nav className="flex flex-col gap-2">
            {navLinks
              .filter((link) => link.label !== "Admin" || profile.role === "admin")
              .map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
          </nav>
          <Button variant="ghost" className="mt-auto" onClick={logout}>
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </aside>

        <main className="flex-1 space-y-8">
          <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/40 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-200">
                Welcome back
              </p>
              <h1 className="mt-2 text-3xl font-semibold">
                {user?.name ?? "Test Admin"}
              </h1>
              <p className="text-sm text-white/60">
                Here&apos;s what&apos;s happening in the club today.
              </p>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                  Points
                </p>
                <p className="text-2xl font-semibold text-emerald-200">
                  {profile.points}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                  Badges
                </p>
                <p className="text-2xl font-semibold text-sky-200">
                  {profile.badges}
                </p>
              </div>
            </div>
          </div>

          {toast && (
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200">
              {toast}
            </div>
          )}

          <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {dynamicStatCards.map((card) => (
              <div
                key={card.label}
                className={`rounded-3xl border border-white/10 bg-gradient-to-br ${toneMap[card.tone]} p-4`}
              >
                <card.icon className="h-5 w-5" />
                <p className="mt-4 text-3xl font-semibold">{card.value}</p>
                <p className="text-sm text-white/70">{card.label}</p>
              </div>
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-emerald-200">
                    Your Projects
                  </p>
                  <h2 className="text-2xl font-semibold">Active work</h2>
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/dashboard/projects/create"
                    className="flex items-center gap-1 rounded-full bg-gradient-to-r from-[#00f5c4] to-[#00c2ff] px-4 py-2 text-sm font-medium text-black transition hover:opacity-90"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Create</span>
                  </Link>
                  <Link
                    href="/projects"
                    className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 transition hover:border-emerald-300 hover:text-white"
                  >
                    Browse all
                  </Link>
              </div>
            </div>
            <div className="mt-6 space-y-4">
                {loadingDashboard ? (
                  <div className="text-center text-white/60 py-8">
                    Loading your projects...
                  </div>
                ) : userProjects.length === 0 ? (
                  <div className="text-center text-white/60 py-8">
                    <p className="mb-4">You're not part of any projects yet.</p>
                    <Link
                      href="/projects"
                      className="text-emerald-400 hover:text-emerald-300 underline"
                    >
                      Browse available projects →
                    </Link>
                  </div>
                ) : (
                  userProjects.map((project) => (
                  <div
                    key={project.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-lg font-semibold">{project.title || "Untitled Project"}</p>
                      {project.tech && (
                        <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/60">
                          {Array.isArray(project.tech) ? project.tech.join(" · ") : project.tech}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-white/60">
                      {project.description || "No description available"}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/60">
                      {project.members && (
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {project.members} members
                        </span>
                      )}
                      {project.status && (
                        <span className="uppercase tracking-[0.3em] text-white/40">
                          {project.status}
                        </span>
                      )}
                    </div>
                    {user && (project.ownerId === user.id || (project.owner && project.owner.includes(user.name))) ? (
                      <Link
                        href={`/dashboard/projects/${project.id}/manage`}
                        className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#00f5c4] to-[#00c2ff] px-4 py-2 text-sm font-medium text-black transition hover:opacity-90"
                      >
                        <Settings className="h-4 w-4" />
                        Manage Project
                      </Link>
                    ) : (
                      <Link
                        href={`/projects/${project.id}`}
                        className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:border-emerald-300 hover:text-white"
                      >
                        View Details
                      </Link>
                    )}
                  </div>
                ))
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-emerald-200">
                      Upcoming events
                    </p>
                    <h2 className="text-2xl font-semibold">Stay in the loop</h2>
                  </div>
                  <Link
                    href="/events"
                    className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 transition hover:border-emerald-300 hover:text-white"
                  >
                    View events
                  </Link>
                </div>
                <div className="mt-5 space-y-4">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-center justify-between text-xs text-white/60">
                        <span>
                          {formatDate(event.date, {
                            month: "short",
                            day: "numeric",
                          })}
                          {" · "}
                          {event.time}
                        </span>
                        <span className="uppercase tracking-[0.3em]">
                          {event.type}
                        </span>
                      </div>
                      <p className="mt-1 text-base font-semibold">
                        {event.title}
                      </p>
                      <p className="text-sm text-white/60">{event.summary}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/60">
                        <span>{event.location}</span>
                        <span>
                          {event.attendees}/{event.capacity} seats
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        className="mt-3 text-xs"
                        onClick={() => handleEventRsvp(event.id)}
                        disabled={eventStatus[event.id] === "sent"}
                      >
                        {eventStatus[event.id] === "sent"
                          ? "RSVP’ed"
                          : "RSVP now"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-emerald-200">
                      Sessions
                    </p>
                    <h2 className="text-2xl font-semibold">Upcoming schedule</h2>
                  </div>
                  <Link
                    href="/sessions"
                    className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 transition hover:border-emerald-300 hover:text-white"
                  >
                    View calendar
                  </Link>
                </div>
                <div className="mt-5 space-y-3">
                  {loadingDashboard ? (
                    <div className="text-center text-white/60 py-4">
                      Loading sessions...
                    </div>
                  ) : upcomingSessions.length === 0 ? (
                    <div className="text-center text-white/60 py-4">
                      No upcoming sessions scheduled.
                    </div>
                  ) : (
                    upcomingSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70"
                      >
                        <div>
                          <p className="font-semibold text-white">
                            {session.title || "Session"}
                          </p>
                          {session.description && (
                            <p className="text-xs text-white/60">
                              {session.description}
                            </p>
                          )}
                        </div>
                        <span className="text-xs uppercase tracking-[0.3em] text-white/50">
                          {session.date ? formatDate(session.date) : "TBD"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-emerald-200">
                    Leaderboard
                  </p>
                  <h2 className="text-2xl font-semibold">
                    Top contributors
                  </h2>
                </div>
                <Link
                  href="/leaderboard"
                  className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 transition hover:border-emerald-300 hover:text-white"
                >
                  View all
                </Link>
              </div>
              <div className="mt-5 space-y-3">
                {leaderboardPreview.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-lg font-semibold">
                      #{entry.rank}
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-semibold">{entry.name}</p>
                      <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                        {entry.role}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-emerald-200">
                        {entry.points}
                      </p>
                      <p className="text-xs text-white/60">
                        {entry.badges} badges
                      </p>
                    </div>
                  </div>
                ))}
                <div className="rounded-2xl border border-dashed border-white/20 p-4 text-sm text-white/60">
                  Leaderboard 2.0 arriving soon – track deep work, reviews, and
                  mentorship time.
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-emerald-200">
                    Admin portal
                  </p>
                  <h2 className="text-2xl font-semibold">Pending requests</h2>
                </div>
                <Flame className="h-4 w-4 text-emerald-300" />
              </div>
              <div className="mt-5 space-y-4">
                {adminQueue.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-semibold">
                          {request.name}
                        </p>
                        <p className="text-sm text-white/60">
                          {request.email}
                        </p>
                      </div>
                      <span className="rounded-full border border-white/15 px-3 py-1 text-xs">
                        {request.role}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/60">
                      {request.interests.map((interest) => (
                        <span
                          key={interest}
                          className="rounded-full border border-white/15 px-3 py-1"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Button
                        className="text-sm"
                        onClick={() => handleDecision(request.id, "approve")}
                        disabled={adminDecisions[request.id] === "approve"}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-sm"
                        onClick={() => handleDecision(request.id, "hold")}
                        disabled={adminDecisions[request.id] === "hold"}
                      >
                        Hold
                      </Button>
                    </div>
                    {adminDecisions[request.id] && (
                      <p className="mt-2 text-xs text-white/60">
                        Status: {adminDecisions[request.id]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
