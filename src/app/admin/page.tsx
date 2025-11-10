"use client";

import Link from "next/link";
import { adminQueue, projectInterestRequests } from "@/lib/data";
import RequestCard from "@/components/admin/request-card";
import { PageContainer } from "@/components/shared/page-container";
import { PageIntro } from "@/components/shared/page-intro";
import { CheckCircle, Users } from "lucide-react";

const AdminPage = () => {
  const handleApprove = (requestId: string, userName: string) => {
    alert(`✅ Approved ${userName}! (Demo mode - not persisted)`);
  };

  const handleHold = (requestId: string) => {
    alert("⏸️  On hold (Demo mode)");
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

    {/* Project Interest Requests Section */}
    <div className="mt-10">
      <div className="mb-6 flex items-center gap-3">
        <Users className="h-5 w-5 text-emerald-400" />
        <h2 className="text-xl font-semibold text-white">
          Project Join Requests
        </h2>
        <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-400">
          {projectInterestRequests.filter((r) => r.status === "pending").length} pending
        </span>
      </div>

      {projectInterestRequests.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {projectInterestRequests
            .filter((r) => r.status === "pending")
            .map((request) => (
              <div
                key={request.id}
                className="rounded-3xl border border-white/10 bg-black/40 p-6"
              >
                <div className="mb-4">
                  <p className="text-sm uppercase tracking-[0.3em] text-emerald-200">
                    {request.projectName}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    {request.userName}
                  </h3>
                  <p className="text-sm text-white/60">{request.userEmail}</p>
                </div>

                <div className="mb-4 flex items-center gap-2 text-xs text-white/50">
                  <span>Requested {request.requestedAt}</span>
                </div>

                <div className="flex gap-3">
                  <button
                    className="flex-1 rounded-full bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-400 transition hover:bg-emerald-400/20"
                    onClick={() => handleApprove(request.id, request.userName)}
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

    {/* Club Membership Requests Section */}
    <div className="mt-12">
      <div className="mb-6 flex items-center gap-3">
        <CheckCircle className="h-5 w-5 text-sky-400" />
        <h2 className="text-xl font-semibold text-white">
          Club Membership Requests
        </h2>
        <span className="rounded-full bg-sky-400/10 px-3 py-1 text-xs text-sky-400">
          {adminQueue.length} pending
        </span>
      </div>

      {adminQueue.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {adminQueue.map((request) => (
            <div key={request.id}>
              <RequestCard request={request} />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-white/20 p-8 text-center text-sm text-white/60">
          No pending membership requests
        </div>
      )}
    </div>

    <div className="mt-8 rounded-3xl border border-dashed border-white/20 p-5 text-sm text-white/70">
      💡 <strong>Demo Mode:</strong> Approvals are logged but not persisted to database.
      Connect Firebase credentials to enable full functionality.
    </div>
  </PageContainer>
  );
};

export default AdminPage;
