"use client";

import { useState, useEffect } from "react";
import { X, Github, Globe, Mail, Phone, Award, Target, Clock } from "lucide-react";

interface MemberProfile {
  id: string;
  name: string;
  email: string;
  role?: string;
  phone?: string;
  github?: string;
  portfolio?: string;
  bio?: string;
  experience?: string;
  skills?: string[];
  interests?: string[];
  points?: number;
  badges?: string[];
  projectsCompleted?: number;
  avatar?: string;
  createdAt?: any;
}

interface MemberProfileModalProps {
  userId: string;
  onClose: () => void;
}

export default function MemberProfileModal({ userId, onClose }: MemberProfileModalProps) {
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/profile?userId=${userId}`);
        if (!res.ok) {
          throw new Error("Failed to fetch profile");
        }
        const data = await res.json();
        setProfile(data.data);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load member profile");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-gray-900 p-8">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-gray-900 p-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Error</h2>
            <button
              onClick={onClose}
              className="rounded-full p-2 transition hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-white/60">{error || "Profile not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-gray-900 p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-4">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 text-2xl font-bold text-white">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold">{profile.name}</h2>
                <p className="text-sm text-white/60">
                  {profile.specialRole ?? profile.role ?? "Club Member"}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 transition hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Contact Information */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="mb-4 text-lg font-semibold">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-white/60" />
                  <span className="text-white/80">{profile.email}</span>
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-white/60" />
                    <span className="text-white/80">{profile.phone}</span>
                  </div>
                )}
                {profile.github && (
                  <div className="flex items-center gap-3 text-sm">
                    <Github className="h-4 w-4 text-white/60" />
                    <a
                      href={profile.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 transition hover:text-emerald-300 hover:underline"
                    >
                      {profile.github.replace('https://github.com/', '@')}
                    </a>
                  </div>
                )}
                {profile.portfolio && (
                  <div className="flex items-center gap-3 text-sm">
                    <Globe className="h-4 w-4 text-white/60" />
                    <a
                      href={profile.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 transition hover:text-emerald-300 hover:underline"
                    >
                      Portfolio
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h3 className="mb-3 text-lg font-semibold">About</h3>
                <p className="text-sm leading-relaxed text-white/70">{profile.bio}</p>
              </div>
            )}

            {/* Experience */}
            {profile.experience && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h3 className="mb-3 text-lg font-semibold">Experience</h3>
                <p className="text-sm text-white/70">{profile.experience}</p>
              </div>
            )}

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h3 className="mb-3 text-lg font-semibold">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Interests */}
            {profile.interests && profile.interests.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h3 className="mb-3 text-lg font-semibold">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-400"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Stats */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 p-6">
              <div className="mb-2 flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-400" />
                <h3 className="font-semibold">Points</h3>
              </div>
              <p className="text-3xl font-bold text-emerald-400">
                {profile.points ?? 0}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6">
              <div className="mb-2 flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-400" />
                <h3 className="font-semibold">Badges</h3>
              </div>
              <p className="text-3xl font-bold text-purple-400">
                {profile.badges?.length ?? 0}
              </p>
              {profile.badges && profile.badges.length > 0 && (
                <div className="mt-3 space-y-1">
                  {profile.badges.map((badge, index) => (
                    <div
                      key={index}
                      className="rounded-lg bg-white/5 px-2 py-1 text-xs text-white/70"
                    >
                      {badge}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 p-6">
              <div className="mb-2 flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-400" />
                <h3 className="font-semibold">Projects</h3>
              </div>
              <p className="text-3xl font-bold text-blue-400">
                {profile.projectsCompleted ?? 0}
              </p>
              <p className="mt-1 text-xs text-white/50">Completed</p>
            </div>

            {profile.createdAt && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <Clock className="h-4 w-4" />
                  <span>
                    Member since{" "}
                    {new Date(
                      profile.createdAt.toDate
                        ? profile.createdAt.toDate()
                        : profile.createdAt
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
