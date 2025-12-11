"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/shared/page-container";
import { PageIntro } from "@/components/shared/page-intro";
import { formatDate } from "@/lib/utils";

const CalendarPage = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch("/api/sessions");
        const result = await response.json();
        if (result.ok) {
          setSessions(result.data || []);
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  return (
  <PageContainer>
    <PageIntro
      badge="CALENDAR"
      title="Sprint rituals & study sessions"
      description="Every week features squad reviews, learning labs, and leadership firesides. Sync this list with your personal calendar once you’re logged in."
      actions={
        <Link
          href="/"
          className="rounded-full border border-white/10 px-5 py-2 text-sm text-white/70 transition hover:border-orange-400/60 hover:text-white"
        >
          ← Back home
        </Link>
      }
    />

    <div className="mt-10 space-y-4">
      {/* Club Calendar Schedule */}
      <div className="mt-10 overflow-x-auto">
        <table className="min-w-full text-sm text-left text-white/80 border border-white/10 rounded-2xl bg-black/30">
          <thead>
            <tr className="bg-black/40">
              <th className="px-4 py-2">Week</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Day</th>
              <th className="px-4 py-2">Event</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>1</td><td>24 Nov</td><td>Mon</td><td>Opening Club Meet + Announcements</td></tr>
            <tr><td>1</td><td>25 Nov</td><td>Tue</td><td>Tech Tips Tuesday</td></tr>
            <tr><td>1</td><td>26 Nov</td><td>Wed</td><td>Kickoff: Start 100DaysOfInteresting</td></tr>
            <tr><td>1</td><td>27 Nov</td><td>Thu</td><td>Lightning Talk Planning + Club Meet</td></tr>
            <tr><td>1</td><td>28 Nov</td><td>Fri</td><td>Code Debugging Challenge</td></tr>
            <tr><td>1</td><td>29 Nov</td><td>Sat</td><td>First Newsletter Release</td></tr>
            <tr><td>1</td><td>30 Nov</td><td>Sun</td><td>Saturday Event (Main Event)</td></tr>
            <tr><td>2</td><td>1 Dec</td><td>Mon</td><td>Review Week + Plan December</td></tr>
            <tr><td>2</td><td>2 Dec</td><td>Tue</td><td>Tech Tips Tuesday</td></tr>
            <tr><td>2</td><td>3 Dec</td><td>Wed</td><td>Share Interesting Link</td></tr>
            <tr><td>2</td><td>4 Dec</td><td>Thu</td><td>Lightning Talk #1</td></tr>
            <tr><td>2</td><td>5 Dec</td><td>Fri</td><td>Mini Frontend Layout Challenge</td></tr>
            <tr><td>2</td><td>6 Dec</td><td>Sat</td><td>Workshop / Group Coding Session</td></tr>
            <tr><td>2</td><td>7 Dec</td><td>Sun</td><td>Mini Event / Project Work Day</td></tr>
            <tr><td>3</td><td>8 Dec</td><td>Mon</td><td>Weekly Review + Newsletter Content</td></tr>
            <tr><td>3</td><td>9 Dec</td><td>Tue</td><td>Tech Tips Tuesday</td></tr>
            <tr><td>3</td><td>10 Dec</td><td>Wed</td><td>Code Puzzle Day (JS/BugFix Games)</td></tr>
            <tr><td>3</td><td>11 Dec</td><td>Thu</td><td>Lightning Talk #2</td></tr>
            <tr><td>3</td><td>12 Dec</td><td>Fri</td><td>CSS Battle / UI Challenge</td></tr>
            <tr><td>3</td><td>13 Dec</td><td>Sat</td><td>Code-Along / Debug Night</td></tr>
            <tr><td>3</td><td>14 Dec</td><td>Sun</td><td>Club Project Sprint #1</td></tr>
            <tr><td>4</td><td>15 Dec</td><td>Mon</td><td>Weekly Review</td></tr>
            <tr><td>4</td><td>16 Dec</td><td>Tue</td><td>Tech Tips Tuesday</td></tr>
            <tr><td>4</td><td>17 Dec</td><td>Wed</td><td>Mini Build Challenge (30-Minute Build)</td></tr>
            <tr><td>4</td><td>18 Dec</td><td>Thu</td><td>Lightning Talk #3</td></tr>
            <tr><td>4</td><td>19 Dec</td><td>Fri</td><td>Meme & Chill Coding Session</td></tr>
            <tr><td>4</td><td>20 Dec</td><td>Sat</td><td>Mini Workshop</td></tr>
            <tr><td>4</td><td>21 Dec</td><td>Sun</td><td>Club Project Sprint #2</td></tr>
            <tr><td>5</td><td>22 Dec</td><td>Mon</td><td>Weekly Review + Newsletter</td></tr>
            <tr><td>5</td><td>23 Dec</td><td>Tue</td><td>Tech Tips Tuesday</td></tr>
            <tr><td>5</td><td>24 Dec</td><td>Wed</td><td>Code Golf Challenge (Shortest Code Wins)</td></tr>
            <tr><td>5</td><td>25 Dec</td><td>Thu</td><td>Christmas Break / Meme Day</td></tr>
            <tr><td>5</td><td>26 Dec</td><td>Fri</td><td>Minecraft Multiplayer Build Contest</td></tr>
            <tr><td>5</td><td>27 Dec</td><td>Sat</td><td>Lightning Talk #4</td></tr>
            <tr><td>5</td><td>28 Dec</td><td>Sun</td><td>End-of-Year Meet + Project Update</td></tr>
            <tr><td>6</td><td>29 Dec</td><td>Mon</td><td>Newsletter Release</td></tr>
            <tr><td>6</td><td>30 Dec</td><td>Tue</td><td>Game Night (Skribbl / Code Games)</td></tr>
            <tr><td>6</td><td>31 Dec</td><td>Wed</td><td>New Year Reflection Post</td></tr>
          </tbody>
        </table>
      </div>
      {loading ? (
        <div className="text-center text-white/60 py-12">Loading sessions...</div>
      ) : sessions.length === 0 ? (
        <div className="text-center text-white/60 py-12">No upcoming sessions</div>
      ) : (
        sessions.map((session) => (
          <article
            key={session.id}
            className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 md:flex-row md:items-center"
          >
            <div className="rounded-2xl border border-white/10 px-5 py-4 text-center">
              <p className="text-3xl font-semibold text-orange-300">
                {new Date(session.date).getDate()}
              </p>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                {formatDate(session.date, { month: "short" })}
              </p>
            </div>
            <div className="flex-1">
              <p className="text-lg font-semibold">{session.title}</p>
              <p className="text-sm text-white/60">{session.description || session.focus || 'Workshop session'}</p>
            </div>
            <span className="text-xs uppercase tracking-[0.3em] text-white/40">
              {session.type}
            </span>
          </article>
        ))
      )}
    </div>
  </PageContainer>
  );
};

export default CalendarPage;
