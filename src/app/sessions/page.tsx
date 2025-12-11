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
        badge="CLUB CALENDAR"
        title="DevForge Club Calendar"
        description="All upcoming events, workshops, and rituals for the club."
        actions={
          <Link
            href="/events"
            className="rounded-full border border-white/10 px-5 py-2 text-sm text-white/70 transition hover:border-orange-400/60 hover:text-white"
          >
            View events
          </Link>
        }
      />

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Club Calendar</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-sm text-left border border-white/10 rounded-2xl bg-gradient-to-br from-black/40 to-slate-900/60 shadow-lg">
            <thead>
              <tr className="bg-black/60">
                <th className="px-6 py-3 text-orange-300 font-semibold">Date</th>
                <th className="px-6 py-3 text-orange-300 font-semibold">Day</th>
                <th className="px-6 py-3 text-orange-300 font-semibold">Event</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">24 Nov</td><td className="px-6 py-3">Mon</td><td className="px-6 py-3">Opening Club Meet + Announcements</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">25 Nov</td><td className="px-6 py-3">Tue</td><td className="px-6 py-3">Tech Tips Tuesday</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">26 Nov</td><td className="px-6 py-3">Wed</td><td className="px-6 py-3">Kickoff: Start 100DaysOfInteresting</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">27 Nov</td><td className="px-6 py-3">Thu</td><td className="px-6 py-3">Lightning Talk Planning + Club Meet</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">28 Nov</td><td className="px-6 py-3">Fri</td><td className="px-6 py-3">Code Debugging Challenge</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">29 Nov</td><td className="px-6 py-3">Sat</td><td className="px-6 py-3">First Newsletter Release</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">30 Nov</td><td className="px-6 py-3">Sun</td><td className="px-6 py-3">Saturday Event (Main Event)</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">1 Dec</td><td className="px-6 py-3">Mon</td><td className="px-6 py-3">Review Week + Plan December</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">2 Dec</td><td className="px-6 py-3">Tue</td><td className="px-6 py-3">Tech Tips Tuesday</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">3 Dec</td><td className="px-6 py-3">Wed</td><td className="px-6 py-3">Share Interesting Link</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">4 Dec</td><td className="px-6 py-3">Thu</td><td className="px-6 py-3">Lightning Talk #1</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">5 Dec</td><td className="px-6 py-3">Fri</td><td className="px-6 py-3">Mini Frontend Layout Challenge</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">6 Dec</td><td className="px-6 py-3">Sat</td><td className="px-6 py-3">Workshop / Group Coding Session</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">7 Dec</td><td className="px-6 py-3">Sun</td><td className="px-6 py-3">Mini Event / Project Work Day</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">8 Dec</td><td className="px-6 py-3">Mon</td><td className="px-6 py-3">Weekly Review + Newsletter Content</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">9 Dec</td><td className="px-6 py-3">Tue</td><td className="px-6 py-3">Tech Tips Tuesday</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">10 Dec</td><td className="px-6 py-3">Wed</td><td className="px-6 py-3">Code Puzzle Day (JS/BugFix Games)</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">11 Dec</td><td className="px-6 py-3">Thu</td><td className="px-6 py-3">Lightning Talk #2</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">12 Dec</td><td className="px-6 py-3">Fri</td><td className="px-6 py-3">CSS Battle / UI Challenge</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">13 Dec</td><td className="px-6 py-3">Sat</td><td className="px-6 py-3">Code-Along / Debug Night</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">14 Dec</td><td className="px-6 py-3">Sun</td><td className="px-6 py-3">Club Project Sprint #1</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">15 Dec</td><td className="px-6 py-3">Mon</td><td className="px-6 py-3">Weekly Review</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">16 Dec</td><td className="px-6 py-3">Tue</td><td className="px-6 py-3">Tech Tips Tuesday</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">17 Dec</td><td className="px-6 py-3">Wed</td><td className="px-6 py-3">Mini Build Challenge (30-Minute Build)</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">18 Dec</td><td className="px-6 py-3">Thu</td><td className="px-6 py-3">Lightning Talk #3</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">19 Dec</td><td className="px-6 py-3">Fri</td><td className="px-6 py-3">Meme & Chill Coding Session</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">20 Dec</td><td className="px-6 py-3">Sat</td><td className="px-6 py-3">Mini Workshop</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">21 Dec</td><td className="px-6 py-3">Sun</td><td className="px-6 py-3">Club Project Sprint #2</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">22 Dec</td><td className="px-6 py-3">Mon</td><td className="px-6 py-3">Weekly Review + Newsletter</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">23 Dec</td><td className="px-6 py-3">Tue</td><td className="px-6 py-3">Tech Tips Tuesday</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">24 Dec</td><td className="px-6 py-3">Wed</td><td className="px-6 py-3">Code Golf Challenge (Shortest Code Wins)</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">25 Dec</td><td className="px-6 py-3">Thu</td><td className="px-6 py-3">Christmas Break / Meme Day</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">26 Dec</td><td className="px-6 py-3">Fri</td><td className="px-6 py-3">Minecraft Multiplayer Build Contest</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">27 Dec</td><td className="px-6 py-3">Sat</td><td className="px-6 py-3">Lightning Talk #4</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">28 Dec</td><td className="px-6 py-3">Sun</td><td className="px-6 py-3">End-of-Year Meet + Project Update</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">29 Dec</td><td className="px-6 py-3">Mon</td><td className="px-6 py-3">Newsletter Release</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">30 Dec</td><td className="px-6 py-3">Tue</td><td className="px-6 py-3">Game Night (Skribbl / Code Games)</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-black/30 transition">
                <td className="px-6 py-3">31 Dec</td><td className="px-6 py-3">Wed</td><td className="px-6 py-3">New Year Reflection Post</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </PageContainer>
  );
};

export default SessionsPage;
