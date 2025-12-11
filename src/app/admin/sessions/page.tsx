"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/shared/page-container";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Calendar, Clock, MapPin } from "lucide-react";

interface Session {
  id: string;
  title: string;
  date: string;
  weekday: string;
  topics: string[];
  description?: string;
  duration?: string;
  location?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
  archivedAt?: string;
}

export default function SessionsManagePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    weekday: "",
    topics: "",
    description: "",
    duration: "90 minutes",
    location: "Online",
  });
  const [submitting, setSubmitting] = useState(false);
  const { upcomingSessions, pastSessions } = useMemo(() => {
    const todayKey = new Date().toISOString().split("T")[0];
    const upcoming: Session[] = [];
    const past: Session[] = [];
    sessions.forEach((session) => {
      const status = session.status || (session.date < todayKey ? "archived" : "upcoming");
      if (status === "archived") {
        past.push(session);
      } else {
        upcoming.push(session);
      }
    });
    return {
      upcomingSessions: upcoming.sort((a, b) => a.date.localeCompare(b.date)),
      pastSessions: past.sort((a, b) => b.date.localeCompare(a.date)),
    };
  }, [sessions]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
      return;
    }

    if (user?.role !== "admin" && user?.role !== "mentor") {
      router.push("/dashboard");
      return;
    }

    fetchSessions();
  }, [isAuthenticated, user, router]);

  const fetchSessions = async () => {
    try {
      const response = await fetch(`/api/sessions/all?userId=${user?.id}`);
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

  const handleOpenModal = (session?: Session) => {
    if (session) {
      setEditingSession(session);
      setFormData({
        title: session.title,
        date: session.date,
        weekday: session.weekday || "",
        topics: session.topics.join("\n"),
        description: session.description || "",
        duration: session.duration || "90 minutes",
        location: session.location || "Online",
      });
    } else {
      setEditingSession(null);
      setFormData({
        title: "",
        date: "",
        weekday: "",
        topics: "",
        description: "",
        duration: "90 minutes",
        location: "Online",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSession(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const topicsArray = formData.topics.split("\n").filter((t) => t.trim());
      const payload = {
        ...formData,
        topics: topicsArray,
        userId: user?.id,
        ...(editingSession && { sessionId: editingSession.id }),
      };

      const url = "/api/sessions";
      const method = editingSession ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.ok) {
        await fetchSessions();
        handleCloseModal();
      } else {
        alert(result.error || "Failed to save session");
      }
    } catch (error) {
      console.error("Error saving session:", error);
      alert("Failed to save session");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this session?")) return;

    try {
      const response = await fetch(
        `/api/sessions?sessionId=${sessionId}&userId=${user?.id}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (result.ok) {
        await fetchSessions();
      } else {
        alert(result.error || "Failed to delete session");
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      alert("Failed to delete session");
    }
  };

  if (!isAuthenticated || (user?.role !== "admin" && user?.role !== "mentor")) {
    return null;
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Manage Sessions</h1>
            <p className="mt-2 text-white/60">
              Create workshops, update agendas, and keep the archive tidy.
            </p>
          </div>
          <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Session
          </Button>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
          Past sessions automatically move to the archive after their scheduled date—no manual cleanup required.
        </div>

        {loading ? (
          <div className="py-12 text-center text-white/60">Loading sessions...</div>
        ) : (
          <>
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Upcoming sessions</h2>
                <span className="text-sm text-white/50">
                  {upcomingSessions.length} scheduled
                </span>
              </div>
              {upcomingSessions.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-6 py-12 text-center text-white/60">
                  Everything from this week has been archived. Plan the next workshop!
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {upcomingSessions.map((session) => (
                    <div
                      key={session.id}
                      className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold">{session.title}</h3>
                          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-white/60">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {session.date} ({session.weekday})
                            </span>
                            {session.duration && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {session.duration}
                              </span>
                            )}
                          </div>
                          {session.location && (
                            <div className="mt-1 flex items-center gap-1 text-sm text-white/60">
                              <MapPin className="h-4 w-4" />
                              {session.location}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenModal(session)}
                            className="rounded-lg p-2 transition hover:bg-white/10"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(session.id)}
                            className="rounded-lg p-2 text-red-400 transition hover:bg-red-500/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {session.description && (
                        <p className="text-sm text-white/70">{session.description}</p>
                      )}
                      {session.topics && session.topics.length > 0 && (
                        <div>
                          <p className="mb-2 text-sm font-medium text-white/80">Topics:</p>
                          <ul className="space-y-1 text-sm text-white/60">
                            {session.topics.map((topic, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-orange-400">•</span>
                                {topic}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-4 border-t border-white/5 pt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Archived sessions</h2>
                <span className="text-sm text-white/50">Auto-cleanup enabled</span>
              </div>

              {pastSessions.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 bg-black/30 px-6 py-8 text-center text-white/60">
                  No archived sessions yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {pastSessions.map((session) => (
                    <div
                      key={session.id}
                      className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70"
                    >
                      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/40">
                        <span>{session.date}</span>
                        <span>Archived</span>
                      </div>
                      <div className="mt-2 flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-base font-semibold text-white">{session.title}</h3>
                          <p className="text-xs text-white/60">{session.weekday}</p>
                          {session.description && (
                            <p className="mt-2 text-sm text-white/60">{session.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleOpenModal(session)}
                          className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white/70 transition hover:border-orange-400/60 hover:text-white"
                        >
                          Reschedule
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingSession ? "Edit Session" : "Create New Session"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Session Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Weekday</label>
                  <input
                    type="text"
                    value={formData.weekday}
                    onChange={(e) =>
                      setFormData({ ...formData, weekday: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2"
                    placeholder="e.g., Wednesday"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Duration</label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2"
                    placeholder="e.g., 90 minutes"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2"
                    placeholder="e.g., Online"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 h-24 resize-none"
                  placeholder="Brief description of the session"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Topics (one per line)
                </label>
                <textarea
                  value={formData.topics}
                  onChange={(e) =>
                    setFormData({ ...formData, topics: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 h-32 resize-none"
                  placeholder="Topic 1&#10;Topic 2&#10;Topic 3"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? "Saving..."
                    : editingSession
                    ? "Update Session"
                    : "Create Session"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
