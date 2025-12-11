"use client";

import { useState } from "react";
import type { AdminRequest } from "@/types";
import { formatDate } from "@/lib/utils";

export const RequestCard = ({ request }: { request: AdminRequest }) => {
  const [decision, setDecision] = useState<string | null>(null);
  const [loading, setLoading] = useState<"none" | "approve" | "hold">("none");
  const [message, setMessage] = useState<string | null>(null);

  const sendDecision = async (d: "approve" | "hold") => {
    setLoading(d === "approve" ? "approve" : "hold");
    // optimistic UI update
    setDecision(d);

    try {
      // If you have a real API, call it here. We'll attempt a best-effort POST
      // to `/api/admin/decision` (project may not have this route).
      const res = await fetch("/api/admin/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: request.id, decision: d }),
      });

      if (!res.ok) {
        throw new Error("server rejected");
      }

      setMessage(d === "approve" ? "Member approved." : "Moved to review.");
    } catch {
      // If the API doesn't exist or fails, keep the optimistic state but show a message
      setMessage(
        d === "approve"
          ? "Member approved (local preview)."
          : "Request held (local preview).",
      );
    } finally {
      setLoading("none");
      setTimeout(() => setMessage(null), 2500);
    }
  };

  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold">{request.name}</p>
          <p className="text-sm text-white/60">{request.email}</p>
        </div>
        <span className="rounded-full border border-white/15 px-3 py-1 text-xs">
          {request.role}
        </span>
      </div>
      <p className="mt-2 text-xs uppercase tracking-[0.3em] text-white/50">
        Requested on {formatDate(request.requestedAt)}
      </p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/70">
        {request.interests.map((interest) => (
          <span
            key={interest}
            className="rounded-full border border-white/15 px-3 py-1"
          >
            {interest}
          </span>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={() => sendDecision("approve")}
          disabled={decision === "approve" || loading !== "none"}
          className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] ${
            decision === "approve"
              ? "bg-orange-500 text-black"
              : "bg-gradient-to-r from-[#00f5c4] to-[#00c2ff] text-black"
          }`}
        >
          {loading === "approve" ? "Approving..." : "Approve"}
        </button>

        <button
          onClick={() => sendDecision("hold")}
          disabled={decision === "hold" || loading !== "none"}
          className={`rounded-full border border-white/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] ${
            decision === "hold" ? "bg-white/10 text-white/80" : "text-white/70"
          }`}
        >
          {loading === "hold" ? "Holding..." : "Hold"}
        </button>
      </div>

      {decision && (
        <div className="mt-3 text-sm text-white/60">Status: {decision}</div>
      )}
      {message && (
        <div className="mt-3 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-3 text-sm text-orange-300">
          {message}
        </div>
      )}
    </article>
  );
};

export default RequestCard;
