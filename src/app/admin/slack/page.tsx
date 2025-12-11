"use client";

import { useState } from "react";
import Link from "next/link";
import { Send, Sparkles } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { PageContainer } from "@/components/shared/page-container";
import { PageIntro } from "@/components/shared/page-intro";

const buttonBase =
  "rounded-full border px-5 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:ring-offset-2 focus:ring-offset-black";

export default function AdminSlackPage() {
  const { user } = useAuth();
  const [title, setTitle] = useState("Dev Club Announcement");
  const [body, setBody] = useState("Share a short blurb about the announcement.");
  const [url, setUrl] = useState("");
  const [ping, setPing] = useState<"" | "here" | "channel">("");
  const [channel, setChannel] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  if (!user || user.role !== "admin") {
    return <div className="p-6 text-sm text-white/70">You must be an admin to access this page.</div>;
  }

  const sendSlack = async () => {
    setSending(true);
    setResult(null);
    try {
      const parsedChannels = channel
        .split(",")
        .map((ch) => ch.trim())
        .filter(Boolean);

      const payload: Record<string, any> = {
        title: title.trim(),
        body: body.trim(),
        url: url.trim() || undefined,
        ping: ping || undefined,
      };

      if (parsedChannels.length === 1) {
        payload.channel = parsedChannels[0];
      } else if (parsedChannels.length > 1) {
        payload.channels = parsedChannels;
      }

      const res = await fetch("/api/slack/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to send");
      }

      const destinations = Array.isArray(data.results) && data.results.length > 0
        ? data.results
            .map((r: any) => `#${r.channel || "dev-club"}`)
            .join(", ")
        : `#${data.channel || "dev-club"}`;

      setResult(`✅ Sent to ${destinations}`);
    } catch (error: any) {
      setResult(`❌ ${error.message || "Unable to send Slack message"}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <PageContainer>
      <PageIntro
        badge="ADMIN"
        title="Slack announcements"
        description="Post important updates straight into the Dev Club Slack channel with optional @here/@channel ping and deep links."
        actions={
          <div className="flex gap-3">
            <Link
              href="/admin/webpush"
              className={`${buttonBase} border-orange-600/30 bg-orange-600/10 text-orange-400 hover:border-orange-500 hover:bg-orange-600/20`}
            >
              Web Push
            </Link>
            <Link
              href="/admin"
              className={`${buttonBase} border-white/15 text-white/70 hover:border-white/30 hover:text-white`}
            >
              ← Back to Admin
            </Link>
          </div>
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 rounded-3xl border border-white/10 bg-black/50 p-6">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-[0.2em] text-white/50">Title</label>
              <input
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-orange-500/60 focus:outline-none"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Dev Club Announcement"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-[0.2em] text-white/50">Ping</label>
              <select
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-orange-500/60 focus:outline-none"
                value={ping}
                onChange={(e) => setPing(e.target.value as any)}
              >
                <option value="">No ping</option>
                <option value="here">@here</option>
                <option value="channel">@channel</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs uppercase tracking-[0.2em] text-white/50">Message</label>
            <textarea
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-orange-500/60 focus:outline-none"
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share the announcement details..."
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-[0.2em] text-white/50">Button URL (optional)</label>
              <input
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-orange-500/60 focus:outline-none"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-[0.2em] text-white/50">Channel override</label>
              <input
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-orange-500/60 focus:outline-none"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                placeholder="Comma separated channel IDs, blank uses default"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={sendSlack}
              disabled={sending}
              className="inline-flex items-center gap-2 rounded-full bg-orange-600/90 px-5 py-3 text-sm font-semibold text-black shadow-lg shadow-orange-600/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {sending ? "Sending..." : "Send to Slack"}
            </button>
            <button
              onClick={() => {
                setTitle("Dev Club Announcement");
                setBody("Share a short blurb about the announcement.");
                setUrl("");
                setPing("");
                setChannel("");
                setResult(null);
              }}
              className="rounded-full border border-white/15 px-4 py-3 text-sm text-white/70 transition hover:border-white/30 hover:text-white"
            >
              Reset
            </button>
          </div>

          {result && (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
              {result}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-orange-500/20 bg-orange-500/5 p-5 text-sm text-emerald-100/80">
          <div className="flex items-start gap-3">
            <div className="mt-1 text-orange-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-orange-300 font-semibold">Tips</p>
                <ul className="mt-1 space-y-1 text-xs text-emerald-100/80">
                  <li>• Use <code>@here</code> for time-sensitive updates, <code>@channel</code> for major announcements.</li>
                  <li>• Add a URL so Slack renders a button and deep-links into the portal.</li>
                  <li>• Leave Channels empty to use the default Dev Club channel; provide multiple IDs comma-separated to fan out.</li>
                </ul>
              </div>
              <div>
                <p className="text-orange-300 font-semibold">Requirements</p>
                <p className="mt-1 text-xs text-emerald-100/80">
                  Set SLACK_WEBHOOK_URL (preferred) or SLACK_BOT_TOKEN + SLACK_DEVCLUB_CHANNEL_ID plus SLACK_SEND_SECRET in
                  the environment. This page works only for admins (authenticated in the portal).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
