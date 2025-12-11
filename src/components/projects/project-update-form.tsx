"use client";

import { useState, useTransition, FormEvent } from "react";

type ProjectUpdateFormProps = {
  projectId: string;
  defaultText?: string;
  canEdit: boolean;
};

const ProjectUpdateForm = ({ projectId, defaultText, canEdit }: ProjectUpdateFormProps) => {
  const [latestText, setLatestText] = useState(defaultText ?? "");
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextUpdate = draft.trim();
    if (!nextUpdate) {
      setStatus("error");
      setMessage("Add a short update before publishing.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latestUpdate: nextUpdate }),
        });

        const result = await response.json();
        if (response.ok && result.ok) {
          setLatestText(nextUpdate);
          setDraft("");
          setStatus("success");
          setMessage("Update posted for the squad.");
        } else {
          setStatus("error");
          setMessage(result.message || "Failed to post update.");
        }
      } catch (error) {
        console.error("Unable to save update", error);
        setStatus("error");
        setMessage("Network error. Try again.");
      }
    });
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm text-white/70">{latestText || "No updates yet."}</p>
      </div>

      {canEdit && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Share a quick squad update..."
            className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-400/50"
            rows={3}
            disabled={isPending}
          />
          <div className="flex items-center justify-between gap-3 text-xs text-white/50">
            <span>Team members can post updates for the activity feed.</span>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#00f5c4] to-[#00c2ff] px-4 py-2 text-xs font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? "Posting..." : "Post update"}
            </button>
          </div>
          {message && (
            <p
              className={`text-xs ${
                status === "success" ? "text-orange-400" : "text-red-300"
              }`}
            >
              {message}
            </p>
          )}
        </form>
      )}
    </div>
  );
};

export default ProjectUpdateForm;
