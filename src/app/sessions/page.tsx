"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { PageContainer } from "@/components/shared/page-container";
import { PageIntro } from "@/components/shared/page-intro";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";

const getRelativeTime = (date: Date | null) => {
  if (!date) return "";
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return "just now";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const SessionsPage = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Check if user is admin or mentor
  const canManageSessions = user?.role === "admin" || user?.role === "mentor";

  const fetchSessions = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      try {
        const response = await fetch("/api/sessions", { cache: "no-store" });
        const result = await response.json();
        if (result.ok) {
          setSessions(result.data || []);
          setLastUpdated(new Date());
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
      } finally {
        if (showSpinner) {
          setLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    fetchSessions(true);
  }, [fetchSessions]);

  useEffect(() => {
    const id = setInterval(() => fetchSessions(false), 60_000);
    return () => clearInterval(id);
  }, [fetchSessions]);

  const todayKey = new Date().toISOString().split("T")[0];
  const getSessionBadge = (date: string) => {
    if (date === todayKey) return "Today";
    const target = new Date(date);
    const diff = target.getTime() - Date.now();
    if (diff <= 0) return "Completed";
    const daysAway = Math.ceil(diff / (24 * 60 * 60 * 1000));
    if (daysAway <= 2) return "This week";
    return null;
  };

  return (
  <PageContainer>
    <PageIntro
      badge="CLUB SESSIONS"
      title="Wednesday & Friday build nights"
      description="Live workshops start 12 November. We meet twice a week to cover HTML, CSS, and front-end fundamentals before jumping into collaborative projects."
      actions={
        <div className="flex gap-3">
          {canManageSessions && (
            <Link
              href="/admin/sessions"
              className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-5 py-2 text-sm text-cyan-400 transition hover:border-cyan-400 hover:bg-cyan-500/20"
            >
              Manage Sessions
            </Link>
          )}
          <Link
            href="/events"
            className="rounded-full border border-white/10 px-5 py-2 text-sm text-white/70 transition hover:border-emerald-300/60 hover:text-white"
          >
            View events
          </Link>
        </div>
      }
    />

    <section className="mt-10 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Upcoming calendar</h2>
        <p className="text-xs text-white/60">
          {refreshing
            ? "Refreshing…"
            : lastUpdated
              ? `Updated ${getRelativeTime(lastUpdated)}`
              : "Auto-refresh enabled"}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          <div className="col-span-full text-center text-white/60 py-12">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="col-span-full text-center text-white/60 py-12">No upcoming sessions</div>
        ) : (
          sessions.map((session) => (
            <article
              key={session.id}
              className="rounded-3xl border border-white/10 bg-white/5 p-6"
            >
              <div className="flex flex-wrap items-center justify-between text-xs uppercase tracking-[0.3em] text-white/60">
                <span>{session.type}</span>
                <span className="flex items-center gap-2">
                  {formatDate(session.date, { weekday: "long" })}
                  {getSessionBadge(session.date) && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[0.6rem] font-semibold tracking-wide text-white/80">
                      {getSessionBadge(session.date)}
                    </span>
                  )}
                </span>
              </div>
              <h3 className="mt-2 text-xl font-semibold">{session.title}</h3>
              <p className="text-sm text-white/70">{session.description || session.focus || 'Workshop session'}</p>
              <p className="mt-4 text-xs text-white/50">
                Starts {formatDate(session.date, { month: "long", day: "numeric" })}
              </p>
            </article>
          ))
        )}
      </div>
    </section>

    {sessions.length > 0 && (
      <section className="mt-12 space-y-6">
        <h2 className="text-2xl font-semibold">Session breakdown</h2>
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          <table className="w-full border-collapse text-left text-sm text-white/80">
            <thead className="bg-white/5 text-xs uppercase tracking-[0.3em] text-white/60">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Topics</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((item) => {
                const topics: string[] = Array.isArray(item.topics) && item.topics.length > 0
                  ? item.topics
                  : item.description
                    ? [item.description]
                    : ["Live workshop"];
                const weekdayLabel = item.weekday || formatDate(item.date, { weekday: "long" });
                return (
                  <tr
                    key={item.id || `${item.title}-${item.date}`}
                    className="border-t border-white/10 [&:nth-child(even)]:bg-white/3"
                  >
                    <td className="px-4 py-4 align-top text-white/60">
                      {formatDate(item.date, { month: "short", day: "numeric" })}
                      <br />
                      <span className="text-xs">{weekdayLabel}</span>
                    </td>
                    <td className="px-4 py-4 align-top font-semibold">{item.title}</td>
                    <td className="px-4 py-4">
                      <ul className="list-disc pl-5 text-white/70">
                        {topics.map((topic) => (
                          <li key={topic}>{topic}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    )}
  </PageContainer>
  );
};

export default SessionsPage;
