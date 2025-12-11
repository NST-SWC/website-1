"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { Plus, Settings } from "lucide-react";
import { getFirebaseApp, hasFirebaseConfig } from "@/lib/firebase/client";
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { PageContainer } from "@/components/shared/page-container";
import { PageIntro } from "@/components/shared/page-intro";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { registerProjectInterest } from "@/lib/firebase/firestore";
import type { ShowcaseProject } from "@/types";

const PROJECT_STATUS_KEY = "project-interest-status";

const readProjectCache = () => {
  if (typeof window === "undefined") return {};
  try {
    const stored = window.localStorage.getItem(PROJECT_STATUS_KEY);
    return stored ? (JSON.parse(stored) as Record<string, string>) : {};
  } catch (error) {
    console.warn("Unable to read project cache", error);
    return {};
  }
};

const ProjectsPage = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ShowcaseProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectState, setProjectState] = useState<Record<string, string>>(
    readProjectCache,
  );
  const canRequest = useMemo(() => Boolean(user), [user]);

  // Fetch projects from Firebase
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        console.log("🔄 Fetching projects from API...");
        const response = await fetch("/api/projects");
        const result = await response.json();
        
        if (result.ok && result.data) {
          console.log(`✅ Fetched ${result.data.length} projects`);
          setProjects(result.data);
        } else {
          console.warn("⚠️  Failed to fetch projects:", result.message);
        }
      } catch (error) {
        console.error("❌ Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();

    // If Firebase is configured, set up a real-time listener to auto-update projects (members count)
    if (hasFirebaseConfig) {
      try {
        const app = getFirebaseApp();
        if (app) {
          const db = getFirestore(app);
          const q = query(collection(db, "projects"));
          const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
              const live = snapshot.docs.map(
                (doc: QueryDocumentSnapshot) => {
                  const data = doc.data() as ShowcaseProject;
                  return {
                    ...data,
                    id: data?.id ?? doc.id,
                  };
                },
              );
              setProjects(live);
              setLoading(false);
            },
            (err) => {
              console.warn("Realtime projects listener error:", err);
            },
          );

          return () => unsubscribe();
        }
      } catch (err) {
        console.warn("Unable to initialize realtime projects listener", err);
      }
    }
  }, []);

  const handleJoin = async (projectId: string) => {
    if (!user) return;
    setProjectState((prev) => ({ ...prev, [projectId]: "sending" }));
    const result = await registerProjectInterest(projectId, user.id);
    setProjectState((prev) => {
      const next = {
        ...prev,
        [projectId]: result.ok ? "sent" : "error",
      };
      if (typeof window !== "undefined" && result.ok) {
        window.localStorage.setItem(PROJECT_STATUS_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  return (
  <PageContainer>
    <PageIntro
      badge="PROJECTS"
      title="Collaborative builds & squads"
      description="The Dev Club pairs members with active product squads. Browse live initiatives, stacks, and open roles."
      actions={
        <div className="flex gap-3">
          {user && (
            <Link
              href="/dashboard/projects/create"
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#00f5c4] to-[#00c2ff] px-5 py-2 text-sm font-medium text-black transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Create Project
            </Link>
          )}
          <Link
            href="/"
            className="rounded-full border border-white/10 px-5 py-2 text-sm text-white/70 transition hover:border-orange-400/60 hover:text-white"
          >
            ← Back home
          </Link>
        </div>
      }
    />      <div className="mt-10 grid gap-6">
        {loading ? (
          <div className="text-center text-white/60 py-12">
            <p>Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center text-white/60 py-12">
            <p className="mb-4">No projects found yet.</p>
            {user && (
              <Link
                href="/dashboard/projects/create"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#00f5c4] to-[#00c2ff] px-5 py-2 text-sm font-medium text-black transition hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Create First Project
              </Link>
            )}
          </div>
        ) : (
          projects.map((project) => {
          const status = projectState[project.id];
          // Check ownership by user ID (more reliable than name matching)
          const isOwner = user && (project.ownerId === user.id || (project.owner && project.owner.startsWith(user.name)));
          return (
            <article
              key={project.id}
              className="rounded-3xl border border-white/10 bg-white/5 p-6"
            >
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold">{project.title}</h2>
                <span className="rounded-full border border-white/15 px-3 py-1 text-xs capitalize text-white/70">
                  {project.status}
                </span>
                <span className="text-xs uppercase tracking-[0.3em] text-white/50">
                  {project.members} members
                </span>
              </div>
              <p className="mt-3 text-sm text-white/70">{project.description}</p>
              {(() => {
                const techList = Array.isArray(project.tech)
                  ? project.tech
                  : project.tech
                    ? [project.tech]
                    : [];
                if (!techList.length) return null;
                return (
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/70">
                    {techList.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full border border-white/15 px-3 py-1"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                );
              })()}
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/60">
                <span>Owner: {project.owner}</span>
                <span className="text-xs uppercase tracking-[0.3em] text-white/40">
                  {project.status === "recruiting"
                    ? "New contributors welcome"
                    : "Core team active"}
                </span>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                {isOwner ? (
                  <Link
                    href={`/dashboard/projects/${project.id}/manage`}
                    className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#00f5c4] to-[#00c2ff] px-5 py-2 text-sm font-medium text-black transition hover:opacity-90"
                  >
                    <Settings className="h-4 w-4" />
                    Manage Project
                  </Link>
                ) : (
                  <Button
                    onClick={() => handleJoin(project.id)}
                    disabled={!canRequest || status === "sent"}
                    glow
                  >
                    {status === "sending"
                      ? "Sending..."
                      : status === "sent"
                        ? "Request sent"
                        : canRequest
                          ? "Request to join"
                          : "Login to join"}
                  </Button>
                )}
                <Link
                  href={`/projects/${project.id}`}
                  className="rounded-full border border-white/20 px-5 py-2 text-sm text-white/80 transition hover:border-orange-400/50"
                >
                  View details
                </Link>
              </div>
            </article>
          );
        })
        )}
      </div>
    </PageContainer>
  );
};

export default ProjectsPage;
