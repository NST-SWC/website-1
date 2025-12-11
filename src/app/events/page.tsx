"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PageContainer } from "@/components/shared/page-container";
import { PageIntro } from "@/components/shared/page-intro";
import { formatDate } from "@/lib/utils";
import { Calendar, MapPin, Users, ExternalLink, Zap } from "lucide-react";

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
            className="rounded-full border border-white/10 px-5 py-2 text-sm text-white/70 transition hover:border-orange-400/60 hover:text-orange-400"
          >
            ← Back home
          </Link>
        }
      />

      <div className="mt-10 grid gap-6">
        {loading ? (
          <div className="text-center text-white/60 py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="inline-block"
            >
              <Zap className="w-8 h-8 text-orange-500" />
            </motion.div>
            <p className="mt-4">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center text-white/60 py-12">No upcoming events</div>
        ) : (
          events.map((event, index) => {
            const isHackathon = event.type === "Hackathon";

            return (
              <motion.article
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`group relative rounded-3xl border overflow-hidden transition-all duration-300 ${isHackathon
                    ? "border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-black to-red-500/10 hover:border-orange-500/60 hover:shadow-[0_0_30px_-5px_rgba(249,115,22,0.3)]"
                    : "border-white/10 bg-white/5 hover:border-orange-400/40 hover:bg-white/[0.07]"
                  }`}
              >
                {/* Animated gradient overlay for hackathons */}
                {isHackathon && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/10 to-orange-500/0"
                    animate={{
                      x: ["-100%", "100%"],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                )}

                <div className="relative p-6">
                  {/* Event Type Badge */}
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      className={`inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] px-3 py-1.5 rounded-full font-semibold ${isHackathon
                          ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20"
                          : "bg-white/10 text-white/70"
                        }`}
                    >
                      {isHackathon && <Zap className="w-3 h-3" />}
                      {event.type}
                    </motion.span>
                  </div>

                  {/* Event Title */}
                  <h2 className={`text-2xl md:text-3xl font-bold mb-3 transition-colors ${isHackathon
                      ? "text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-300 to-red-400 group-hover:from-orange-300 group-hover:to-red-300"
                      : "text-white group-hover:text-orange-400"
                    }`}>
                    {event.title}
                  </h2>

                  {/* Event Summary */}
                  <p className="text-sm md:text-base text-white/70 mb-4 leading-relaxed">
                    {event.summary}
                  </p>

                  {/* Event Details */}
                  <div className="flex flex-wrap gap-4 mb-4 text-sm text-white/60">
                    <div className="flex items-center gap-2">
                      <Calendar className={`w-4 h-4 ${isHackathon ? "text-orange-400" : "text-orange-500"}`} />
                      <span>
                        {formatDate(event.date, { weekday: "short", month: "short", day: "numeric" })}
                        {event.time && ` · ${event.time}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className={`w-4 h-4 ${isHackathon ? "text-orange-400" : "text-orange-500"}`} />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className={`w-4 h-4 ${isHackathon ? "text-orange-400" : "text-orange-500"}`} />
                      <span>
                        {event.attendees}/{event.capacity} seats
                      </span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      href={isHackathon && event.registrationUrl ? event.registrationUrl : "/dashboard"}
                      className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold uppercase tracking-wider transition-all ${isHackathon
                          ? "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-400 hover:to-red-400 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40"
                          : "bg-white/10 text-white/80 hover:bg-orange-500/20 hover:text-orange-400 border border-white/20 hover:border-orange-400/50"
                        }`}
                      {...(isHackathon && event.registrationUrl ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      {isHackathon ? (
                        <>
                          <Zap className="w-4 h-4" />
                          Register Now
                          <ExternalLink className="w-4 h-4" />
                        </>
                      ) : (
                        "RSVP via portal"
                      )}
                    </Link>
                  </motion.div>
                </div>

                {/* Hackathon special effects */}
                {isHackathon && (
                  <>
                    {/* Corner accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/20 to-transparent blur-2xl" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-red-500/20 to-transparent blur-2xl" />
                  </>
                )}
              </motion.article>
            );
          })
        )}
      </div>
    </PageContainer>
  );
};

export default EventsPage;
