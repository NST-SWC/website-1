"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Layers,
  Clock,
  Plus,
  Users,
  Settings,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { PageContainer } from "@/components/shared/page-container";
import { Button } from "@/components/ui/button";
import { registerProjectInterest, rsvpToEvent } from "@/lib/firebase/firestore";
import { formatDate } from "@/lib/utils";
import type { ShowcaseProject } from "@/types";

const STORAGE_KEYS = {
  projects: "project-interest-status",
  events: "event-rsvp-status",
};

const toneMap: Record<string, string> = {
  emerald: "from-orange-500/25 to-orange-600/10 text-orange-300",
  sky: "from-orange-500/25 to-orange-600/10 text-sky-200",
  indigo: "from-indigo-400/25 to-red-600/10 text-indigo-200",
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
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<ShowcaseProject[]>([]);
  const [userProjects, setUserProjects] = useState<any[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    activeProjects: 0,
    upcomingSessions: 0,
  });
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [projectStatus, setProjectStatus] = useState<Record<string, string>>(() =>
    readCache(STORAGE_KEYS.projects),
  );

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      console.log("🔒 Not authenticated, redirecting to home");
      router.push("/");
    }
  }, [isAuthenticated, router]);

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
    // Removed auto-refresh to save Firebase reads
    // Dashboard will only load on page refresh or navigation
  }, [user?.id]);

  // Fetch projects from Firebase (only on page load)
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
    // Removed auto-refresh to save Firebase reads
  }, []);

  const profile = useMemo(
    () => ({
      role: user?.role ?? "student",
    }),
    [user],
  );

  // Dynamic stat cards based on user data (removed points and badges)
  const dynamicStatCards = useMemo(() => [
    { label: "Active Projects", value: stats.activeProjects, icon: Layers, tone: "emerald" },
    { label: "Upcoming Sessions", value: stats.upcomingSessions, icon: Clock, tone: "indigo" },
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
  };

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-orange-300">
            Welcome back
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            {user?.name ?? "Member"}
          </h1>
          <p className="text-sm text-white/60">
            Here&apos;s what&apos;s happening in the club today.
          </p>
        </div>

          <section className="grid gap-4 grid-cols-2 lg:grid-cols-3">
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
                  <p className="text-sm uppercase tracking-[0.3em] text-orange-300">
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
                    className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 transition hover:border-orange-400 hover:text-white"
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
                      className="text-orange-500 hover:text-orange-400 underline"
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
                      {(project.memberCount ?? project.members) !== undefined && (
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {project.memberCount ?? project.members} members
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
                        className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:border-orange-400 hover:text-white"
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
                    <p className="text-sm uppercase tracking-[0.3em] text-orange-300">
                      Sessions
                    </p>
                    <h2 className="text-2xl font-semibold">Upcoming schedule</h2>
                  </div>
                  <Link
                    href="/sessions"
                    className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 transition hover:border-orange-400 hover:text-white"
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
        </div>
      </PageContainer>
  );
}
