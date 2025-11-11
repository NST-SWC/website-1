"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { PageContainer } from "@/components/shared/page-container";
import { PageIntro } from "@/components/shared/page-intro";
import { CheckCircle, Users, X } from "lucide-react";

type ProjectInterest = {
  id: string;
  projectId: string;
  userId: string;
  status: string;
  createdAt?: any;
  projectName?: string;
  userName?: string;
  userEmail?: string;
};

type PendingMember = {
  id: string;
  name: string;
  email: string;
  phone: string;
  github?: string;
  portfolio?: string;
  interests: string[];
  experience: string;
  goals: string;
  role: string;
  availability: string;
  createdAt?: any;
  status: string;
};

const AdminPage = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [projectInterests, setProjectInterests] = useState<ProjectInterest[]>([]);
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"members" | "projects">("members");
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [credentials, setCredentials] = useState<{ username: string; password: string; name: string; email: string } | null>(null);

  // Check if user is admin
  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      router.push("/");
    }
  }, [isAuthenticated, user, router]);

  // Don't render anything if not admin
  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  // Fetch pending members
  useEffect(() => {
    const fetchPendingMembers = async () => {
      try {
        console.log("🔄 Fetching pending members...");
        const response = await fetch("/api/pending-members");
        const result = await response.json();
        
        if (result.ok && result.data) {
          console.log("✅ Fetched pending members:", result.data);
          setPendingMembers(result.data);
        } else {
          console.warn("⚠️  Failed to fetch pending members:", result.message);
        }
      } catch (error) {
        console.error("❌ Error fetching pending members:", error);
      }
    };

    fetchPendingMembers();
    
    // Refresh every 5 seconds
    const interval = setInterval(fetchPendingMembers, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch project interests from Firestore
  useEffect(() => {
    const fetchInterests = async () => {
      try {
        console.log("🔄 Fetching all project interests...");
        const response = await fetch("/api/project-interests?status=pending");
        const result = await response.json();
        
        if (result.ok && result.data) {
          console.log("✅ Fetched interests:", result.data);
          setProjectInterests(result.data);
        } else {
          console.warn("⚠️  Failed to fetch:", result.message);
        }
      } catch (error) {
        console.error("❌ Error fetching interests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInterests();
    
    // Refresh every 5 seconds to show new requests
    const interval = setInterval(fetchInterests, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleApproveMember = async (memberId: string, memberEmail: string, memberName: string) => {
    if (!confirm(`Approve ${memberName} to join the club?`)) return;
    
    try {
      const response = await fetch("/api/pending-members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          decision: "approved",
          adminId: "admin-1", // TODO: Get from auth context
        }),
      });

      const result = await response.json();
      
      if (result.ok) {
        const userId = result.userId || memberId;
        const credentials = result.credentials || {};
        const username = credentials.username || "newmember";
        const password = credentials.password || "member123";
        
        // Show credentials modal
        setCredentials({
          username: username,
          password: password,
          name: memberName,
          email: memberEmail,
        });
        setShowCredentialsModal(true);
        
        // Copy credentials to clipboard
        const credentialsText = `Username: ${username}\nPassword: ${password}`;
        navigator.clipboard.writeText(credentialsText).then(() => {
          console.log("📋 Credentials copied to clipboard");
        });
        
        setPendingMembers((prev) => prev.filter((m) => m.id !== memberId));
      } else {
        alert(`Failed: ${result.message}`);
      }
    } catch (error) {
      console.error("❌ Error:", error);
      alert("Failed to approve member");
    }
  };

  const handleRejectMember = async (memberId: string) => {
    if (!confirm("Reject this membership request?")) return;
    
    try {
      const response = await fetch("/api/pending-members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          decision: "rejected",
          adminId: "admin-1", // TODO: Get from auth context
        }),
      });

      const result = await response.json();
      
      if (result.ok) {
        alert("❌ Member request rejected");
        setPendingMembers((prev) => prev.filter((m) => m.id !== memberId));
      } else {
        alert(`Failed: ${result.message}`);
      }
    } catch (error) {
      console.error("❌ Error:", error);
      alert("Failed to reject member");
    }
  };

  const handleApprove = async (interestId: string, projectId: string, userId: string) => {
    try {
      const response = await fetch("/api/project-interests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interestId,
          status: "approved",
          projectId,
          userId,
        }),
      });

      const result = await response.json();
      
      if (result.ok) {
        alert("✅ Approved!");
        // Remove from list
        setProjectInterests((prev) => prev.filter((r) => r.id !== interestId));
      } else {
        alert(`Failed: ${result.message}`);
      }
    } catch (error) {
      console.error("❌ Error:", error);
      alert("Failed to approve");
    }
  };

  const handleHold = async (interestId: string) => {
    alert("⏸️  On hold (will implement status change)");
  };

  return (
  <PageContainer>
    <PageIntro
      badge="ADMIN PORTAL"
      title="Member approvals & reviews"
      description="Track pending join requests, review interest tags, and approve contributors once you've met them."
      actions={
        <Link
          href="/"
          className="rounded-full border border-white/10 px-5 py-2 text-sm text-white/70 transition hover:border-emerald-300/60 hover:text-white"
        >
          ← Back home
        </Link>
      }
    />

    {/* Tab Navigation */}
    <div className="mt-8 flex gap-4 border-b border-white/10">
      <button
        onClick={() => setActiveTab("members")}
        className={`px-6 py-3 text-sm font-medium transition ${
          activeTab === "members"
            ? "border-b-2 border-emerald-400 text-emerald-400"
            : "text-white/60 hover:text-white"
        }`}
      >
        Club Member Requests ({pendingMembers.length})
      </button>
      <button
        onClick={() => setActiveTab("projects")}
        className={`px-6 py-3 text-sm font-medium transition ${
          activeTab === "projects"
            ? "border-b-2 border-emerald-400 text-emerald-400"
            : "text-white/60 hover:text-white"
        }`}
      >
        Project Join Requests ({projectInterests.length})
      </button>
    </div>

    {/* Club Member Requests */}
    {activeTab === "members" && (
      <div className="mt-8">
        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-black/40 p-8 text-center text-sm text-white/60">
            Loading requests...
          </div>
        ) : pendingMembers.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {pendingMembers.map((member) => (
              <div
                key={member.id}
                className="rounded-3xl border border-white/10 bg-black/40 p-6"
              >
                <div className="mb-4">
                  <p className="text-sm uppercase tracking-[0.3em] text-sky-400">
                    {member.role || "Student"} • {member.experience || "Beginner"}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    {member.name}
                  </h3>
                  <p className="text-sm text-white/60">{member.email}</p>
                  <p className="text-sm text-white/60">{member.phone}</p>
                </div>

                {member.interests && member.interests.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-white/50 mb-2">Interests:</p>
                    <div className="flex flex-wrap gap-2">
                      {member.interests.map((interest, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-400"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {member.goals && (
                  <div className="mb-4">
                    <p className="text-xs text-white/50 mb-1">Goals:</p>
                    <p className="text-sm text-white/70">{member.goals}</p>
                  </div>
                )}

                {(member.github || member.portfolio) && (
                  <div className="mb-4 flex flex-wrap gap-3 text-xs">
                    {member.github && (
                      <a
                        href={`https://github.com/${member.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition"
                      >
                        🔗 GitHub: {member.github}
                      </a>
                    )}
                    {member.portfolio && (
                      <a
                        href={member.portfolio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 transition"
                      >
                        🌐 Portfolio
                      </a>
                    )}
                  </div>
                )}

                {member.availability && (
                  <div className="mb-4">
                    <p className="text-xs text-white/50 mb-1">Availability:</p>
                    <p className="text-sm text-white/70">{member.availability}</p>
                  </div>
                )}

                <div className="mb-4 flex items-center gap-2 text-xs text-white/50">
                  <span>
                    Requested{" "}
                    {member.createdAt
                      ? new Date(
                          member.createdAt.toDate
                            ? member.createdAt.toDate()
                            : member.createdAt
                        ).toLocaleDateString()
                      : "recently"}
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    className="flex-1 rounded-full bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-400 transition hover:bg-emerald-400/20"
                    onClick={() => handleApproveMember(member.id, member.email, member.name)}
                  >
                    <CheckCircle className="inline h-4 w-4 mr-1" />
                    Approve & Add to Club
                  </button>
                  <button
                    className="flex-1 rounded-full border border-red-500/30 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
                    onClick={() => handleRejectMember(member.id)}
                  >
                    <X className="inline h-4 w-4 mr-1" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/20 p-8 text-center text-sm text-white/60">
            No pending club membership requests
          </div>
        )}
      </div>
    )}

    {/* Project Join Requests */}
    {activeTab === "projects" && (
      <div className="mt-8">
        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-black/40 p-8 text-center text-sm text-white/60">
            Loading requests...
          </div>
        ) : projectInterests.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {projectInterests.map((request) => (
              <div
                key={request.id}
                className="rounded-3xl border border-white/10 bg-black/40 p-6"
              >
                <div className="mb-4">
                  <p className="text-sm uppercase tracking-[0.3em] text-emerald-200">
                    {request.projectName || `Project: ${request.projectId}`}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    {request.userName || `User: ${request.userId}`}
                  </h3>
                  <p className="text-sm text-white/60">
                    {request.userEmail || "No email available"}
                  </p>
                </div>

                <div className="mb-4 flex items-center gap-2 text-xs text-white/50">
                  <span>
                    Requested{" "}
                    {request.createdAt
                      ? new Date(
                          request.createdAt.toDate
                            ? request.createdAt.toDate()
                            : request.createdAt
                        ).toLocaleDateString()
                      : "recently"}
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    className="flex-1 rounded-full bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-400 transition hover:bg-emerald-400/20"
                    onClick={() => handleApprove(request.id, request.projectId, request.userId)}
                  >
                    <CheckCircle className="inline h-4 w-4 mr-1" />
                    Approve
                  </button>
                  <button
                    className="flex-1 rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/5"
                    onClick={() => handleHold(request.id)}
                  >
                    Hold
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/20 p-8 text-center text-sm text-white/60">
            No pending project join requests
          </div>
        )}
      </div>
    )}

    {/* Credentials Modal */}
    {showCredentialsModal && credentials && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="relative max-w-lg w-full rounded-3xl border border-emerald-400/30 bg-black/95 p-8">
          <button
            onClick={() => setShowCredentialsModal(false)}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-400/10 mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-2">
              Member Approved!
            </h3>
            <p className="text-sm text-white/60">
              {credentials.name} has been added to the club
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-white/50 mb-1">Member Name</p>
              <p className="text-white font-medium">{credentials.name}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-white/50 mb-1">Email</p>
              <p className="text-white font-medium">{credentials.email}</p>
            </div>

            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
              <p className="text-xs text-emerald-400/70 mb-1">Username</p>
              <p className="text-emerald-300 font-mono text-sm">{credentials.username}</p>
            </div>

            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
              <p className="text-xs text-emerald-400/70 mb-1">Password</p>
              <p className="text-emerald-300 font-mono text-sm">{credentials.password}</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                const text = `Username: ${credentials.username}\nPassword: ${credentials.password}`;
                navigator.clipboard.writeText(text);
                alert("📋 Credentials copied to clipboard!");
              }}
              className="w-full rounded-full bg-emerald-400/10 border border-emerald-400/30 px-6 py-3 text-sm font-medium text-emerald-400 transition hover:bg-emerald-400/20"
            >
              📋 Copy Credentials
            </button>

            <button
              onClick={() => setShowCredentialsModal(false)}
              className="w-full rounded-full border border-white/10 px-6 py-3 text-sm text-white/70 transition hover:bg-white/5"
            >
              Close
            </button>
          </div>

          <div className="mt-6 rounded-xl bg-blue-400/5 border border-blue-400/20 p-4 text-xs text-blue-400/80">
            <p className="font-medium text-blue-400 mb-1">📧 Next Step:</p>
            <p>Send these credentials to {credentials.email} manually via email.</p>
          </div>
        </div>
      </div>
    )}

    <div className="mt-8 rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-5 text-sm text-emerald-400/90">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">ℹ️</div>
        <div>
          <strong className="text-emerald-300">Admin Portal Instructions:</strong>
          <ul className="mt-2 space-y-1 text-xs text-emerald-400/80">
            <li>• <strong>Approve:</strong> Auto-generates username (firstname) and password (firstname123), copies to clipboard</li>
            <li>• <strong>Reject:</strong> Removes the request from pending list</li>
            <li>• After approval, manually send the credentials to the member via email</li>
            <li>• Page auto-refreshes every 5 seconds to show new requests</li>
          </ul>
        </div>
      </div>
    </div>
  </PageContainer>
  );
};

export default AdminPage;
