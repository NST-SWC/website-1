"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { PageContainer } from "@/components/shared/page-container";
import { PageIntro } from "@/components/shared/page-intro";
import { formatDate } from "@/lib/utils";

const EventsPage = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/events");
        const result = await response.json();
        if (result.ok) {
          setEvents(result.data || []);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <PageContainer>
      <PageIntro
        badge="EVENTS"
        title="Workshops, hack nights & firesides"
        description="Track every club-hosted session. RSVP directly from the dashboard after logging in."
        actions={
          <Link
            href="/"
            className="rounded-full border border-white/10 px-5 py-2 text-sm text-white/70 transition hover:border-emerald-300/60 hover:text-white"
          >
            ← Back home
          </Link>
        }
      />

      <div className="mt-10 grid gap-6">
        {loading ? (
          <div className="text-center text-white/60 py-12">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-center text-white/60 py-12">No upcoming events</div>
        ) : (
          events.map((event) => (
            <article
              key={event.id}
              className="rounded-3xl border border-white/10 bg-white/5 p-6"
            >
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
                <span className="text-xs uppercase tracking-[0.3em] text-white/50">
                  {event.type}
                </span>
                <span>
                  {formatDate(event.date, { weekday: "short", month: "short", day: "numeric" })} ·{" "}
                  {event.time}
                </span>
                <span>{event.location}</span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold">{event.title}</h2>
              <p className="mt-2 text-sm text-white/70">{event.summary}</p>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/60">
                <span>
                  Seats: {event.attendees}/{event.capacity}
                </span>
                <Link
                  href={event.type === "Hackathon" && event.registrationUrl ? event.registrationUrl : "/dashboard"}
                  className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/60 transition hover:border-emerald-300/70 hover:text-white"
                  {...(event.type === "Hackathon" && event.registrationUrl ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {event.type === "Hackathon" ? "REGISTER NOW" : "RSVP via portal"}
                </Link>
              </div>
            </article>
          ))
        )}
      </div>
    </PageContainer>
  );
};

export default EventsPage;
