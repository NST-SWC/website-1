"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/shared/page-container";
import { PageIntro } from "@/components/shared/page-intro";
import { useAuth } from "@/context/auth-context";
import { ArrowLeft, Plus, X } from "lucide-react";

const techOptions = [
  "React",
  "Next.js",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "Python",
  "Firebase",
  "Tailwind",
  "Vue.js",
  "Express",
  "MongoDB",
  "PostgreSQL",
  "GraphQL",
  "Docker",
  "AWS",
];

const CreateProjectPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTech, setSelectedTech] = useState<string[]>([]);
  const [status, setStatus] = useState<"active" | "recruiting" | "completed">("recruiting");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) {
    return (
      <PageContainer>
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Login Required</h1>
          <p className="mt-2 text-white/60">
            You must be logged in to create a project.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 text-orange-500 hover:underline"
          >
            ← Back to home
          </button>
        </div>
      </PageContainer>
    );
  }

  const toggleTech = (tech: string) => {
    setSelectedTech((prev) =>
      prev.includes(tech)
        ? prev.filter((t) => t !== tech)
        : [...prev, tech]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim() || selectedTech.length === 0) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const projectData = {
        title: title.trim(),
        description: description.trim(),
        tech: selectedTech,
        status,
        owner: `${user.name}${user.role === "admin" ? " • Admin" : ""}`,
        ownerId: user.id,
      };

      console.log("🚀 Creating project:", projectData);

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      });

      const result = await response.json();

      if (result.ok) {
        console.log("✅ Project created successfully:", result.data);
        alert(`🎉 Project "${title}" created successfully!`);
        router.push("/projects");
      } else {
        console.error("❌ Failed to create project:", result);
        alert(`Failed to create project: ${result.message}`);
      }
    } catch (error) {
      console.error("❌ Error creating project:", error);
      alert("Failed to create project. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <PageIntro
        badge="CREATE PROJECT"
        title="Start a new project"
        description="Create a collaborative project and invite members to join your squad."
        actions={
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-full border border-white/10 px-5 py-2 text-sm text-white/70 transition hover:border-orange-400/60 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Cancel
          </button>
        }
      />

      <form onSubmit={handleSubmit} className="mt-10 max-w-3xl">
        <div className="space-y-6 rounded-3xl border border-white/10 bg-black/40 p-8">
          {/* Project Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-white/80">
              Project Title <span className="text-red-400">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., AI Study Companion"
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 outline-none transition focus:border-orange-500/50 focus:bg-white/10"
              maxLength={100}
              required
            />
            <p className="mt-1 text-xs text-white/50">
              {title.length}/100 characters
            </p>
          </div>

          {/* Project Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-white/80">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project, its goals, and what you are building..."
              rows={5}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 outline-none transition focus:border-orange-500/50 focus:bg-white/10"
              maxLength={500}
              required
            />
            <p className="mt-1 text-xs text-white/50">
              {description.length}/500 characters
            </p>
          </div>

          {/* Tech Stack */}
          <div>
            <label className="block text-sm font-medium text-white/80">
              Tech Stack <span className="text-red-400">*</span>
            </label>
            <p className="mt-1 text-xs text-white/50">
              Select the technologies you will use (at least 1)
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {techOptions.map((tech) => {
                const isSelected = selectedTech.includes(tech);
                return (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => toggleTech(tech)}
                    className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                      isSelected
                        ? "border-orange-500/50 bg-orange-500/10 text-orange-500"
                        : "border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10"
                    }`}
                  >
                    {tech}
                    {isSelected && <X className="h-3 w-3" />}
                  </button>
                );
              })}
            </div>
            {selectedTech.length > 0 && (
              <p className="mt-2 text-xs text-orange-500">
                {selectedTech.length} {selectedTech.length === 1 ? "technology" : "technologies"} selected
              </p>
            )}
          </div>

          {/* Project Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-white/80">
              Project Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "recruiting" | "active" | "completed")
              }
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-orange-500/50 focus:bg-white/10"
            >
              <option value="recruiting">Recruiting - Looking for members</option>
              <option value="active">Active - Currently building</option>
              <option value="completed">Completed - Finished project</option>
            </select>
          </div>

          {/* Project Owner Info */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/60">
              <strong className="text-white/80">Project Owner:</strong> {user.name}
              {user.role === "admin" && (
                <span className="ml-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-xs text-orange-500">
                  Admin
                </span>
              )}
            </p>
            <p className="mt-1 text-xs text-white/50">
              You will be able to manage members and approve join requests
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !description.trim() || selectedTech.length === 0}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#00f5c4] to-[#00c2ff] px-6 py-3 text-sm font-medium text-black transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>Creating...</>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Project
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-full border border-white/20 px-6 py-3 text-sm text-white/80 transition hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </PageContainer>
  );
};

export default CreateProjectPage;
