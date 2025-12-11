"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageContainer } from "@/components/shared/page-container";
import { PageIntro } from "@/components/shared/page-intro";
import { useAuth } from "@/context/auth-context";
import { Settings, Users, CheckCircle, ExternalLink, ArrowLeft, UserCheck, UserMinus } from "lucide-react";
import type { ShowcaseProject } from "@/types";
import MemberProfileModal from "@/components/modals/member-profile-modal";

type ProjectInterest = {
  id: string;
  projectId: string;
  userId: string;
  status: string;
  createdAt?: any;
  userName?: string;
  userEmail?: string;
  projectName?: string;
};

type ProjectMember = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  joinedAt: any;
};

const ManageProjectPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const projectId = params.id as string;

  const [project, setProject] = useState<ShowcaseProject | null>(null);
  const [localRequests, setLocalRequests] = useState<ProjectInterest[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectLoading, setProjectLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<any>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Fetch the project details
  useEffect(() => {
    const fetchProject = async () => {
      try {
        console.log("🔄 Fetching project:", projectId);
        const response = await fetch(`/api/projects`);
        const result = await response.json();
        
        if (result.ok && result.data) {
          const foundProject = result.data.find((p: ShowcaseProject) => p.id === projectId);
          if (foundProject) {
            console.log("✅ Found project:", foundProject);
            setProject(foundProject);
            setEditedProject(foundProject); // Initialize edited project
          } else {
            console.warn("⚠️  Project not found in data");
            setProject(null);
          }
        }
      } catch (error) {
        console.error("❌ Error fetching project:", error);
      } finally {
        setProjectLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  // Fetch project interests from Firestore
  const fetchInterests = async () => {
    try {
      console.log("🔄 Fetching interests for project:", projectId);
      const response = await fetch(`/api/project-interests?projectId=${projectId}&status=pending`);
      const result = await response.json();
      
      if (result.ok && result.data) {
        console.log("✅ Fetched project interests:", result.data);
        setLocalRequests(result.data);
      } else {
        console.warn("⚠️  Failed to fetch interests:", result.message);
        setLocalRequests([]); // Set empty array on error
      }
    } catch (error) {
      console.error("❌ Error fetching interests:", error);
      setLocalRequests([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchInterests();
    }
  }, [projectId]);

  // Fetch current project members
  const fetchMembers = async () => {
    try {
      console.log("🔄 Fetching members for project:", projectId);
      const response = await fetch(`/api/project-members?projectId=${projectId}`);
      const result = await response.json();
      
      if (result.ok && result.data) {
        console.log("✅ Fetched project members:", result.data);
        setMembers(result.data);
      } else {
        console.warn("⚠️  Failed to fetch members:", result.message);
        setMembers([]);
      }
    } catch (error) {
      console.error("❌ Error fetching members:", error);
      setMembers([]);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchMembers();
    }
  }, [projectId]);

  const handleSaveProject = async () => {
    try {
      console.log("💾 Saving project:", editedProject);
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedProject),
      });

      const result = await response.json();
      
      if (result.ok) {
        alert("✅ Project updated successfully!");
        setProject(editedProject);
        setIsEditing(false);
      } else {
        alert("❌ Failed to update project: " + result.message);
      }
    } catch (error) {
      console.error("❌ Error saving project:", error);
      alert("❌ Failed to update project. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setEditedProject(project);
    setIsEditing(false);
  };

  const handleApprove = async (interestId: string, projectId: string, userId: string) => {
    try {
      const response = await fetch(`/api/project-interests`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          interestId,
          status: "approved",
          projectId,
          userId,
          deleteAfter: true // Delete the document after approval
        }),
      });

      const data = await response.json();
      
      if (data.ok) {
        console.log("✅ Approved and deleted request:", interestId);
        alert("✅ User approved to join the project!");
        // Manually refresh lists after approval
        await fetchInterests();
        await fetchMembers();
      }
    } catch (error) {
      console.error("Failed to approve:", error);
      alert("Failed to approve request. Please try again.");
    }
  };

  const handleReject = async (interestId: string) => {
    try {
      const response = await fetch(`/api/project-interests`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          interestId, 
          status: "rejected",
          deleteAfter: true // Delete the document after rejection
        }),
      });

      const data = await response.json();
      
      if (data.ok) {
        console.log("❌ Rejected and deleted request:", interestId);
        alert("❌ Request rejected");
        // Manually refresh after rejection
        await fetchInterests();
      }
    } catch (error) {
      console.error("Failed to reject:", error);
      alert("Failed to reject request. Please try again.");
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this project?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/project-members/${memberId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      const data = await response.json();
      
      if (data.ok) {
        console.log("✅ Member removed:", memberId);
        alert(`✅ ${memberName} has been removed from the project`);
        // Manually refresh members list after removal
        await fetchMembers();
      } else {
        alert("❌ Failed to remove member: " + data.message);
      }
    } catch (error) {
      console.error("Failed to remove member:", error);
      alert("Failed to remove member. Please try again.");
    }
  };

  // Show loading state while fetching project
  if (projectLoading) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
          <p className="mt-4 text-white/60">Loading project...</p>
        </div>
      </PageContainer>
    );
  }

  if (!project) {
    return (
      <PageContainer>
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Project not found</h1>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 text-orange-500 hover:underline"
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
            className="mt-4 text-orange-500 hover:underline"
          >
            ← Back to dashboard
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageIntro
        badge="PROJECT MANAGEMENT"
        title={`Manage ${project.title}`}
        description="Update project details, manage members, and approve join requests."
        actions={
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 rounded-full border border-white/10 px-5 py-2 text-sm text-white/70 transition hover:border-orange-400/60 hover:text-white"
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
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-orange-500" />
                <h2 className="text-xl font-semibold">Project Details</h2>
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/5"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProject}
                      className="rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-sm font-medium text-black transition hover:opacity-90"
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/5"
                  >
                    Edit Project
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60">Project Name</label>
                <input
                  type="text"
                  value={editedProject?.title || ""}
                  onChange={(e) => setEditedProject({ ...editedProject, title: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none transition focus:border-orange-500/50 disabled:opacity-50"
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm text-white/60">Description</label>
                <textarea
                  value={editedProject?.description || ""}
                  onChange={(e) => setEditedProject({ ...editedProject, description: e.target.value })}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none transition focus:border-orange-500/50 disabled:opacity-50"
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm text-white/60">Tech Stack</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(editedProject?.tech || []).map((tech: string) => (
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
                  value={editedProject?.status || "active"}
                  onChange={(e) => setEditedProject({ ...editedProject, status: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none transition focus:border-orange-500/50 disabled:opacity-50"
                  disabled={!isEditing}
                >
                  <option value="active">Active</option>
                  <option value="recruiting">Recruiting</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {!isEditing && (
                <p className="text-xs text-white/50">
                  💡 Click "Edit Project" to modify project details
                </p>
              )}
            </div>
          </section>

          {/* Current Members */}
          <section className="rounded-3xl border border-white/10 bg-black/40 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserCheck className="h-5 w-5 text-orange-500" />
                <h2 className="text-xl font-semibold">Current Members</h2>
                <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs text-orange-500">
                  {members.length} members
                </span>
              </div>
              <button
                onClick={() => setShowMembers(!showMembers)}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/5"
              >
                {showMembers ? "Hide Members" : "Show Members"}
              </button>
            </div>

            {showMembers && (
              <>
                {members.length > 0 ? (
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <button
                              onClick={() => setSelectedMemberId(member.userId)}
                              className="text-left transition hover:text-orange-500"
                            >
                              <h3 className="font-semibold hover:underline">{member.userName}</h3>
                            </button>
                            <p className="text-sm text-white/60">{member.userEmail}</p>
                            <p className="mt-1 text-xs text-white/50">
                              Joined {member.joinedAt ? new Date(member.joinedAt.toDate ? member.joinedAt.toDate() : member.joinedAt).toLocaleDateString() : "recently"}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveMember(member.id, member.userName)}
                            className="flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 transition hover:bg-red-500/20"
                            title="Remove member"
                          >
                            <UserMinus className="h-3 w-3" />
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/20 p-6 text-center text-sm text-white/60">
                    No members yet
                  </div>
                )}
              </>
            )}
          </section>

          {/* Join Requests */}
          <section className="rounded-3xl border border-white/10 bg-black/40 p-6">
            <div className="mb-4 flex items-center gap-3">
              <Users className="h-5 w-5 text-orange-500" />
              <h2 className="text-xl font-semibold">Join Requests</h2>
              <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs text-orange-500">
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
                      <div className="flex-1">
                        <button
                          onClick={() => setSelectedMemberId(request.userId)}
                          className="text-left transition hover:text-orange-500"
                        >
                          <h3 className="text-lg font-semibold hover:underline">{request.userName || request.userId}</h3>
                        </button>
                        <p className="text-sm text-white/60">{request.userEmail || "No email"}</p>
                        <p className="mt-2 text-xs text-white/50">
                          Requested {request.createdAt ? new Date(request.createdAt.toDate ? request.createdAt.toDate() : request.createdAt).toLocaleDateString() : "recently"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => handleApprove(request.id, request.projectId, request.userId)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-500 transition hover:bg-orange-500/20"
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
            <h3 className="mb-4 text-sm uppercase tracking-[0.3em] text-orange-300">
              Quick Stats
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Members</span>
                <span className="text-lg font-semibold">{members.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Status</span>
                <span className="rounded-full border border-white/15 px-3 py-1 text-xs capitalize text-white/70">
                  {project.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Pending</span>
                <span className="text-lg font-semibold text-orange-500">
                  {localRequests.length}
                </span>
              </div>
            </div>
          </div>

          {/* Project Links */}
          <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
            <h3 className="mb-4 text-sm uppercase tracking-[0.3em] text-orange-300">
              Project Links
            </h3>
            
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-white/60 mb-1">GitHub Repository URL</label>
                  <input
                    type="url"
                    value={(editedProject as any)?.githubUrl || ""}
                    onChange={(e) => setEditedProject({ ...editedProject, githubUrl: e.target.value })}
                    placeholder="https://github.com/..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-orange-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1">Live Demo URL</label>
                  <input
                    type="url"
                    value={(editedProject as any)?.demoUrl || ""}
                    onChange={(e) => setEditedProject({ ...editedProject, demoUrl: e.target.value })}
                    placeholder="https://demo.example.com"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-orange-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1">Documentation URL</label>
                  <input
                    type="url"
                    value={(editedProject as any)?.docsUrl || ""}
                    onChange={(e) => setEditedProject({ ...editedProject, docsUrl: e.target.value })}
                    placeholder="https://docs.example.com"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-orange-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1">Squad chat URL</label>
                  <input
                    type="url"
                    value={(editedProject as any)?.chatUrl || ""}
                    onChange={(e) => setEditedProject({ ...editedProject, chatUrl: e.target.value })}
                    placeholder="https://discord.gg/..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-orange-500/50"
                  />
                  <p className="mt-1 text-[11px] text-white/40">
                    Share your Discord, Slack, or WhatsApp invite link.
                  </p>
                </div>
                <p className="text-xs text-white/50">
                  💡 Save changes to update project links
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {(editedProject as any)?.githubUrl ? (
                    <a
                      href={(editedProject as any).githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:bg-white/10"
                    >
                      <span>GitHub Repository</span>
                      <ExternalLink className="h-4 w-4 text-white/50" />
                    </a>
                  ) : (
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/40">
                      <span>GitHub Repository</span>
                      <ExternalLink className="h-4 w-4 text-white/30" />
                    </div>
                  )}
                  
                  {(editedProject as any)?.demoUrl ? (
                    <a
                      href={(editedProject as any).demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:bg-white/10"
                    >
                      <span>Live Demo</span>
                      <ExternalLink className="h-4 w-4 text-white/50" />
                    </a>
                  ) : (
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/40">
                      <span>Live Demo</span>
                      <ExternalLink className="h-4 w-4 text-white/30" />
                    </div>
                  )}
                  
                  {(editedProject as any)?.docsUrl ? (
                    <a
                      href={(editedProject as any).docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:bg-white/10"
                    >
                      <span>Documentation</span>
                      <ExternalLink className="h-4 w-4 text-white/50" />
                    </a>
                  ) : (
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/40">
                      <span>Documentation</span>
                      <ExternalLink className="h-4 w-4 text-white/30" />
                    </div>
                  )}
                  
                  {(editedProject as any)?.chatUrl ? (
                    <a
                      href={(editedProject as any).chatUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:bg-white/10"
                    >
                      <span>Squad Chat</span>
                      <ExternalLink className="h-4 w-4 text-white/50" />
                    </a>
                  ) : (
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/40">
                      <span>Squad Chat</span>
                      <ExternalLink className="h-4 w-4 text-white/30" />
                    </div>
                  )}
                </div>
                <p className="mt-3 text-xs text-white/50">
                  💡 Click "Edit Project" to add or update links
                </p>
              </>
            )}
          </div>
        </aside>
      </div>

      {/* Member Profile Modal */}
      {selectedMemberId && (
        <MemberProfileModal
          userId={selectedMemberId}
          onClose={() => setSelectedMemberId(null)}
        />
      )}
    </PageContainer>
  );
};

export default ManageProjectPage;
