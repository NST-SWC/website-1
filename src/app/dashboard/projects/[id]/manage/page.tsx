"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { showcaseProjects } from "@/lib/data";
import { PageContainer } from "@/components/shared/page-container";
import { PageIntro } from "@/components/shared/page-intro";
import { useAuth } from "@/context/auth-context";
import { Settings, Users, CheckCircle, ExternalLink, ArrowLeft } from "lucide-react";

type ProjectInterest = {
  id: string;
  projectId: string;
  userId: string;
  status: string;
  createdAt?: any;
  userName?: string;
  userEmail?: string;
};

const ManageProjectPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const projectId = params.id as string;

  const project = showcaseProjects.find((p) => p.id === projectId);
  const [localRequests, setLocalRequests] = useState<ProjectInterest[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch project interests from Firestore
  useEffect(() => {
    const fetchInterests = async () => {
      try {
        const response = await fetch(`/api/project-interests?projectId=${projectId}&status=pending`);
        const result = await response.json();
        
        if (result.ok && result.data) {
          console.log("✅ Fetched project interests:", result.data);
          setLocalRequests(result.data);
        } else {
          console.warn("⚠️  Failed to fetch interests:", result.message);
        }
      } catch (error) {
        console.error("❌ Error fetching interests:", error);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchInterests();
    }
  }, [projectId]);

  if (!project) {
    return (
      <PageContainer>
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Project not found</h1>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 text-emerald-400 hover:underline"
          >
            ← Back to dashboard
          </button>
        </div>
      </PageContainer>
    );
  }

  // Check if user is the project owner
  if (!user || !(project.ownerId === user.id || project.owner.startsWith(user.name))) {
    return (
      <PageContainer>
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Access Denied</h1>
          <p className="mt-2 text-white/60">
            Only the project owner can manage this project.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 text-emerald-400 hover:underline"
          >
            ← Back to dashboard
          </button>
        </div>
      </PageContainer>
    );
  }

  const handleApprove = async (interestId: string) => {
    const request = localRequests.find((r) => r.id === interestId);
    if (!request) return;

    try {
      const response = await fetch("/api/project-interests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interestId,
          status: "approved",
          projectId: request.projectId,
          userId: request.userId,
        }),
      });

      const result = await response.json();
      
      if (result.ok) {
        console.log("✅ Approved request:", interestId);
        alert(`✅ Approved ${request.userName || request.userId} to join ${project?.title}!`);
        setLocalRequests((prev) => prev.filter((r) => r.id !== interestId));
      } else {
        alert(`Failed to approve: ${result.message}`);
      }
    } catch (error) {
      console.error("❌ Error approving request:", error);
      alert("Failed to approve request. Please try again.");
    }
  };

  const handleReject = async (interestId: string) => {
    const request = localRequests.find((r) => r.id === interestId);
    if (!request) return;

    try {
      const response = await fetch("/api/project-interests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interestId,
          status: "rejected",
        }),
      });

      const result = await response.json();
      
      if (result.ok) {
        console.log("❌ Rejected request:", interestId);
        alert(`❌ Rejected ${request.userName || request.userId}'s request`);
        setLocalRequests((prev) => prev.filter((r) => r.id !== interestId));
      } else {
        alert(`Failed to reject: ${result.message}`);
      }
    } catch (error) {
      console.error("❌ Error rejecting request:", error);
      alert("Failed to reject request. Please try again.");
    }
  };

  return (
    <PageContainer>
      <PageIntro
        badge="PROJECT MANAGEMENT"
        title={`Manage ${project.title}`}
        description="Update project details, manage members, and approve join requests."
        actions={
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 rounded-full border border-white/10 px-5 py-2 text-sm text-white/70 transition hover:border-emerald-300/60 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </button>
        }
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Main Content */}
        <div className="space-y-8">
          {/* Project Info */}
          <section className="rounded-3xl border border-white/10 bg-black/40 p-6">
            <div className="mb-4 flex items-center gap-3">
              <Settings className="h-5 w-5 text-emerald-400" />
              <h2 className="text-xl font-semibold">Project Details</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60">Project Name</label>
                <input
                  type="text"
                  defaultValue={project.title}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none transition focus:border-emerald-400/50"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm text-white/60">Description</label>
                <textarea
                  defaultValue={project.description}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none transition focus:border-emerald-400/50"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm text-white/60">Tech Stack</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {project.tech.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/60">Status</label>
                <select
                  defaultValue={project.status}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none transition focus:border-emerald-400/50"
                  disabled
                >
                  <option value="active">Active</option>
                  <option value="recruiting">Recruiting</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <p className="text-xs text-white/50">
                💡 Editing is disabled in demo mode. Connect to Firestore to enable.
              </p>
            </div>
          </section>

          {/* Join Requests */}
          <section className="rounded-3xl border border-white/10 bg-black/40 p-6">
            <div className="mb-4 flex items-center gap-3">
              <Users className="h-5 w-5 text-sky-400" />
              <h2 className="text-xl font-semibold">Join Requests</h2>
              <span className="rounded-full bg-sky-400/10 px-3 py-1 text-xs text-sky-400">
                {localRequests.length} pending
              </span>
            </div>

            {localRequests.length > 0 ? (
              <div className="space-y-4">
                {localRequests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{request.userName || request.userId}</h3>
                        <p className="text-sm text-white/60">{request.userEmail || "No email"}</p>
                        <p className="mt-2 text-xs text-white/50">
                          Requested {request.createdAt ? new Date(request.createdAt.toDate ? request.createdAt.toDate() : request.createdAt).toLocaleDateString() : "recently"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => handleApprove(request.id)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-400 transition hover:bg-emerald-400/20"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        className="flex-1 rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/5"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/20 p-8 text-center text-sm text-white/60">
                No pending join requests
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Quick Stats */}
          <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
            <h3 className="mb-4 text-sm uppercase tracking-[0.3em] text-emerald-200">
              Quick Stats
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Members</span>
                <span className="text-lg font-semibold">{project.members}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Status</span>
                <span className="rounded-full border border-white/15 px-3 py-1 text-xs capitalize text-white/70">
                  {project.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Pending</span>
                <span className="text-lg font-semibold text-sky-400">
                  {localRequests.length}
                </span>
              </div>
            </div>
          </div>

          {/* Project Links */}
          <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
            <h3 className="mb-4 text-sm uppercase tracking-[0.3em] text-emerald-200">
              Project Links
            </h3>
            <div className="space-y-3">
              <a
                href="#"
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:bg-white/10"
              >
                <span>GitHub Repository</span>
                <ExternalLink className="h-4 w-4 text-white/50" />
              </a>
              <a
                href="#"
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:bg-white/10"
              >
                <span>Live Demo</span>
                <ExternalLink className="h-4 w-4 text-white/50" />
              </a>
              <a
                href="#"
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:bg-white/10"
              >
                <span>Documentation</span>
                <ExternalLink className="h-4 w-4 text-white/50" />
              </a>
            </div>
            <p className="mt-3 text-xs text-white/50">
              💡 Link management coming soon
            </p>
          </div>
        </aside>
      </div>
    </PageContainer>
  );
};

export default ManageProjectPage;
