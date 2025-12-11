"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/shared/page-container";
import { PageIntro } from "@/components/shared/page-intro";
import { useAuth } from "@/context/auth-context";
import { 
  User, 
  Mail, 
  Phone, 
  Github, 
  Globe, 
  Award, 
  TrendingUp,
  Settings,
  Camera,
  Save,
  X,
  Upload
} from "lucide-react";
import { uploadAvatar } from "@/lib/firebase/storage";

type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  github?: string;
  portfolio?: string;
  bio?: string;
  skills?: string[];
  interests?: string[];
  role: string;
  experience?: string;
  availability?: string;
  points?: number;
  badges?: number;
  projectsCompleted?: number;
  avatar?: string;
  createdAt?: any;
  updatedAt?: any;
};

export default function ProfilePage() {
  const { user, logout, updateUser, isAuthenticated } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      console.log("🔒 Not authenticated, redirecting to home");
      router.push("/");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        console.log("🔄 Fetching profile for user:", user.id);
        const response = await fetch(`/api/profile?userId=${user.id}`);
        const result = await response.json();

        if (result.ok && result.data) {
          console.log("✅ Profile fetched:", result.data);
          setProfile(result.data);
          setEditedProfile(result.data);
        } else {
          // Create default profile if none exists
          const defaultProfile: UserProfile = {
            id: user.id,
            name: user.name || "",
            email: user.email || "",
            role: user.role || "student",
            points: 0,
            badges: 0,
            projectsCompleted: 0,
            skills: [],
            interests: [],
          };
          setProfile(defaultProfile);
          setEditedProfile(defaultProfile);
        }
      } catch (error) {
        console.error("❌ Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!editedProfile) return;

    setSaving(true);
    try {
      console.log("💾 Saving profile:", editedProfile);
      const response = await fetch(`/api/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedProfile),
      });

      const result = await response.json();

      if (result.ok) {
        alert("✅ Profile updated successfully!");
        setProfile(editedProfile);
        setIsEditing(false);
        
        // Update auth context with new profile data
        updateUser({
          name: editedProfile.name,
          email: editedProfile.email,
          avatar: editedProfile.avatar,
          github: editedProfile.github,
          portfolio: editedProfile.portfolio,
        });
        console.log("✅ Auth context updated with profile changes");
      } else {
        alert("❌ Failed to update profile: " + result.message);
      }
    } catch (error) {
      console.error("❌ Error saving profile:", error);
      alert("❌ Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const handleAvatarClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) {
      console.log("❌ No file or user ID");
      return;
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      alert("❌ Please upload a valid image file (JPEG, PNG, GIF, or WebP)");
      event.target.value = ""; // Reset input
      return;
    }

    // Validate file size (max 2MB for base64 storage)
    // Base64 encoding increases size by ~33%, so 2MB file becomes ~2.6MB base64
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      alert("❌ Image size must be less than 2MB (base64 storage limitation)");
      event.target.value = ""; // Reset input
      return;
    }

    setUploadingAvatar(true);
    console.log("🚀 Starting avatar upload process...");
    
    // Set a timeout to prevent infinite loading
    const uploadTimeout = setTimeout(() => {
      console.error("⏱️ Upload timeout after 30 seconds");
      setUploadingAvatar(false);
      alert("❌ Upload is taking too long. Please check your internet connection and try again.");
    }, 30000);

    try {
      console.log("📤 Uploading avatar...", { 
        fileName: file.name, 
        fileSize: `${(file.size / 1024).toFixed(2)} KB`,
        fileType: file.type 
      });
      
      const avatarUrl = await uploadAvatar(file, user.id);
      clearTimeout(uploadTimeout);
      
      console.log("✅ Avatar uploaded successfully:", avatarUrl);
      
      // Update both editedProfile and profile immediately
      const updatedProfile = {
        ...editedProfile!,
        avatar: avatarUrl,
      };
      
      setEditedProfile(updatedProfile);
      setProfile(updatedProfile);

      console.log("💾 Saving avatar URL to database...");
      // Save to database
      const response = await fetch(`/api/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          avatar: avatarUrl,
        }),
      });

      const result = await response.json();
      console.log("💾 Database save result:", result);
      
      if (result.ok) {
        // Update auth context with new avatar
        updateUser({ avatar: avatarUrl });
        console.log("✅ Auth context updated with new avatar");
        alert("✅ Avatar updated successfully!");
      } else {
        console.error("Failed to save avatar to database:", result);
        alert("⚠️ Avatar uploaded but may not be saved. Please try saving your profile.");
      }
    } catch (error) {
      clearTimeout(uploadTimeout);
      console.error("❌ Error uploading avatar:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // More specific error messages
      let userMessage = `❌ Failed to upload avatar: ${errorMessage}`;
      
      if (errorMessage.includes("Failed to read")) {
        userMessage += "\n\n🔧 Solution: Try a different image file";
      } else if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
        userMessage += "\n\n🔧 Solution: Check your internet connection";
      }
      
      alert(userMessage);
    } finally {
      setUploadingAvatar(false);
      // Reset the file input so the same file can be selected again
      if (event.target) {
        event.target.value = "";
      }
      console.log("🏁 Avatar upload process completed");
    }
  };

  const addSkill = (skill: string) => {
    if (!skill.trim() || !editedProfile) return;
    setEditedProfile({
      ...editedProfile,
      skills: [...(editedProfile.skills || []), skill.trim()],
    });
  };

  const removeSkill = (index: number) => {
    if (!editedProfile) return;
    setEditedProfile({
      ...editedProfile,
      skills: editedProfile.skills?.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
          <p className="mt-4 text-white/60">Loading profile...</p>
        </div>
      </PageContainer>
    );
  }

  if (!profile) {
    return (
      <PageContainer>
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Profile not found</h1>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 text-orange-500 hover:underline"
          >
            ← Back to dashboard
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageIntro
        badge="MY PROFILE"
        title={profile.name || "Your Profile"}
        description="Manage your profile, track your progress, and showcase your skills."
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_350px]">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Profile Header */}
          <section className="rounded-3xl border border-white/10 bg-black/40 p-6">
            <div className="flex items-start gap-6">
              <div className="relative">
                {editedProfile?.avatar ? (
                  <img
                    src={editedProfile.avatar}
                    alt={editedProfile.name}
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-3xl font-bold text-black">
                    {profile.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                {isEditing && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                    <button
                      onClick={handleAvatarClick}
                      disabled={uploadingAvatar}
                      className="absolute bottom-0 right-0 rounded-full bg-orange-500 p-2 text-black transition hover:bg-orange-600 disabled:opacity-50"
                      title="Upload avatar"
                    >
                      {uploadingAvatar ? (
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
                      ) : (
                        <Camera className="h-3 w-3" />
                      )}
                    </button>
                  </>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold">{profile.name}</h2>
                    <p className="text-sm text-white/60 capitalize">{profile.role}</p>
                    {isEditing && (
                      <p className="mt-2 text-xs text-orange-500">
                        💡 Click the camera icon to upload your profile picture (max 2MB)
                      </p>
                    )}
                  </div>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/5"
                    >
                      <Settings className="h-4 w-4" />
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/5"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-sm font-medium text-black transition hover:opacity-90 disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" />
                        {saving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Personal Information */}
          <section className="rounded-3xl border border-white/10 bg-black/40 p-6">
            <div className="mb-4 flex items-center gap-3">
              <User className="h-5 w-5 text-orange-500" />
              <h3 className="text-xl font-semibold">Personal Information</h3>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm text-white/60 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editedProfile?.name || ""}
                    onChange={(e) =>
                      setEditedProfile({ ...editedProfile!, name: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none transition focus:border-orange-500/50 disabled:opacity-50"
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Email</label>
                  <input
                    type="email"
                    value={editedProfile?.email || ""}
                    onChange={(e) =>
                      setEditedProfile({ ...editedProfile!, email: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none transition focus:border-orange-500/50 disabled:opacity-50"
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm text-white/60 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editedProfile?.phone || ""}
                    onChange={(e) =>
                      setEditedProfile({ ...editedProfile!, phone: e.target.value })
                    }
                    placeholder="+1 (555) 000-0000"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none transition focus:border-orange-500/50 disabled:opacity-50"
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Experience Level</label>
                  <select
                    value={editedProfile?.experience || "beginner"}
                    onChange={(e) =>
                      setEditedProfile({ ...editedProfile!, experience: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none transition focus:border-orange-500/50 disabled:opacity-50"
                    disabled={!isEditing}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-1">Bio</label>
                <textarea
                  value={editedProfile?.bio || ""}
                  onChange={(e) =>
                    setEditedProfile({ ...editedProfile!, bio: e.target.value })
                  }
                  rows={3}
                  placeholder="Tell us about yourself..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none transition focus:border-orange-500/50 disabled:opacity-50"
                  disabled={!isEditing}
                />
              </div>
            </div>
          </section>

          {/* Links */}
          <section className="rounded-3xl border border-white/10 bg-black/40 p-6">
            <div className="mb-4 flex items-center gap-3">
              <Globe className="h-5 w-5 text-orange-500" />
              <h3 className="text-xl font-semibold">Links & Social</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">GitHub Username</label>
                <div className="flex items-center gap-2">
                  <Github className="h-4 w-4 text-white/40" />
                  <input
                    type="text"
                    value={editedProfile?.github || ""}
                    onChange={(e) =>
                      setEditedProfile({ ...editedProfile!, github: e.target.value })
                    }
                    placeholder="username"
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none transition focus:border-orange-500/50 disabled:opacity-50"
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-1">Portfolio Website</label>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-white/40" />
                  <input
                    type="url"
                    value={editedProfile?.portfolio || ""}
                    onChange={(e) =>
                      setEditedProfile({ ...editedProfile!, portfolio: e.target.value })
                    }
                    placeholder="https://your-portfolio.com"
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none transition focus:border-orange-500/50 disabled:opacity-50"
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Skills */}
          <section className="rounded-3xl border border-white/10 bg-black/40 p-6">
            <div className="mb-4 flex items-center gap-3">
              <Award className="h-5 w-5 text-purple-400" />
              <h3 className="text-xl font-semibold">Skills</h3>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {(editedProfile?.skills || []).map((skill, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm"
                >
                  <span>{skill}</span>
                  {isEditing && (
                    <button
                      onClick={() => removeSkill(index)}
                      className="text-white/40 hover:text-red-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {isEditing && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a skill (press Enter)"
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none transition focus:border-orange-500/50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addSkill(e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }}
                />
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Stats */}
          <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
            <h3 className="mb-4 text-sm uppercase tracking-[0.3em] text-orange-300">
              Your Stats
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-white/60">Points</span>
                </div>
                <span className="text-2xl font-semibold">{profile.points || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-purple-400" />
                  <span className="text-sm text-white/60">Badges</span>
                </div>
                <span className="text-2xl font-semibold">{profile.badges || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-white/60">Projects</span>
                </div>
                <span className="text-2xl font-semibold">
                  {profile.projectsCompleted || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
            <h3 className="mb-4 text-sm uppercase tracking-[0.3em] text-orange-300">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm transition hover:bg-white/10"
              >
                View Dashboard
              </button>
              <button
                onClick={() => router.push("/projects")}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm transition hover:bg-white/10"
              >
                Browse Projects
              </button>
              <button
                onClick={() => router.push("/leaderboard")}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm transition hover:bg-white/10"
              >
                View Leaderboard
              </button>
            </div>
          </div>

          {/* Account */}
          <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
            <h3 className="mb-4 text-sm uppercase tracking-[0.3em] text-orange-300">
              Account
            </h3>
            <div className="space-y-2">
              <button
                onClick={logout}
                className="w-full rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-left text-sm text-red-400 transition hover:bg-red-500/20"
              >
                Logout
              </button>
            </div>
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}
