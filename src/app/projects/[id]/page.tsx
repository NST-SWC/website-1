import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import {
  ArrowLeft,
  BookOpen,
  ExternalLink,
  Layers,
  MessageCircle,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";

import { PageContainer } from "@/components/shared/page-container";
import { PageIntro } from "@/components/shared/page-intro";
import ProjectUpdateForm from "@/components/projects/project-update-form";
import { getDb } from "@/lib/firebase/admin";
import type {
  ClubUser,
  FirestoreDateValue,
  ProjectInterestRequest,
  ShowcaseProject,
} from "@/types";

export const dynamic = "force-dynamic";

type ProjectRecord = ShowcaseProject & {
  id: string;
};

type ProjectMemberRecord = {
  id: string;
  userName?: string;
  userEmail?: string;
  role?: string;
  joinedAt?: FirestoreDateValue;
};

type ProjectInterestRecord = Partial<ProjectInterestRequest> & {
  id: string;
  createdAt?: FirestoreDateValue;
  interests?: string[];
};

type ProjectActivityEntry = {
  id: string;
  title: string;
  description: string;
  timestamp: Date | null;
};

type ProjectDetail = {
  project: ProjectRecord;
  members: ProjectMemberRecord[];
  pendingRequests: ProjectInterestRecord[];
  activities: ProjectActivityEntry[];
};

type Params = {
  params: Promise<{ id: string }>;
};

const statusMeta: Record<
  ShowcaseProject["status"],
  { message: string; pill: string; accent: string }
> = {
  active: {
    message: "This squad is actively shipping every sprint.",
    pill: "bg-orange-500/15 text-orange-300",
    accent: "border-orange-500/30 text-emerald-100 bg-orange-500/5",
  },
  recruiting: {
    message: "New members are welcome. Submit a join request to jump in.",
    pill: "bg-orange-500/15 text-sky-200",
    accent: "border-orange-500/30 text-sky-100 bg-orange-500/5",
  },
  waitlist: {
    message: "Squad is currently full. Waitlist to get notified when space opens.",
    pill: "bg-amber-400/15 text-amber-200",
    accent: "border-amber-400/30 text-amber-100 bg-amber-400/5",
  },
  completed: {
    message: "Project shipped. Check docs and demos for the final build.",
    pill: "bg-white/15 text-white/80",
    accent: "border-white/20 text-white/80 bg-white/5",
  },
};

const getSessionUser = async (): Promise<ClubUser | null> => {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("code404-user");
    if (!sessionCookie?.value) return null;

    const decoded = decodeURIComponent(sessionCookie.value);
    return JSON.parse(decoded) as ClubUser;
  } catch (error) {
    console.warn("⚠️ Unable to parse session user:", error);
    return null;
  }
};

const canManageProject = (project: ProjectRecord, user: ClubUser | null) => {
  if (!user) return false;
  const ownerName = project.owner?.toLowerCase();

  return (
    user.role === "admin" ||
    project.ownerId === user.id ||
    (ownerName ? ownerName.startsWith(user.name.toLowerCase()) : false)
  );
};

const isTeamMember = (
  members: ProjectMemberRecord[],
  project: ProjectRecord,
  user: ClubUser | null,
) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (project.ownerId === user.id) return true;

  const normalize = (value?: string) => value?.toLowerCase().trim();
  const userEmail = normalize(user.email);

  return members.some((member) => {
    const memberEmail = normalize(member.userEmail);
    const hasUserIdMatch =
      member.id === user.id ||
      ("userId" in member &&
        (member as { userId?: string }).userId === user.id);

    const hasEmailMatch =
      memberEmail && userEmail ? memberEmail === userEmail : false;

    return hasUserIdMatch || hasEmailMatch;
  });
};

const toDate = (value?: FirestoreDateValue): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value === "object") {
    if ("toDate" in value && typeof value.toDate === "function") {
      try {
        return value.toDate();
      } catch {
        return null;
      }
    }
    if ("seconds" in value && typeof value.seconds === "number") {
      return new Date(value.seconds * 1000);
    }
    if ("_seconds" in value && typeof value._seconds === "number") {
      return new Date(value._seconds * 1000);
    }
  }
  return null;
};

const formatDateLabel = (value?: FirestoreDateValue) => {
  const date = toDate(value);
  return date
    ? date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;
};

const ensureArray = (values?: ShowcaseProject["tech"]) => {
  if (!values) return [];
  return Array.isArray(values) ? values : [values];
};

const buildActivityFeed = (
  project: ShowcaseProject,
  members: ProjectMemberRecord[],
  requests: ProjectInterestRecord[],
): ProjectActivityEntry[] => {
  const entries: ProjectActivityEntry[] = [];

  members.forEach((member) => {
    entries.push({
      id: `member-${member.id}`,
      title: `${member.userName ?? "New member"} joined the squad`,
      description: member.role ? `Role: ${member.role}` : "New contributor",
      timestamp: toDate(member.joinedAt),
    });
  });

  requests.forEach((request) => {
    entries.push({
      id: `request-${request.id}`,
      title: `${request.userName ?? "Builder"} requested access`,
      description: request.interests?.length
        ? `Focus: ${request.interests.slice(0, 2).join(", ")}`
        : "Waiting for approval",
      timestamp:
        toDate(request.createdAt) ||
        toDate((request as { requestedAt?: FirestoreDateValue }).requestedAt),
    });
  });

  entries.push({
    id: "project-updated",
    title: project.status === "completed" ? "Project shipped" : "Project updated",
    description:
      project.latestUpdate ??
      `Status changed to ${project.status.replace(/^\w/, (char) => char.toUpperCase())}`,
    timestamp: toDate(project.updatedAt) || toDate(project.createdAt),
  });

  return entries
    .filter((entry) => entry.timestamp)
    .sort(
      (a, b) => (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0),
    )
    .slice(0, 5);
};

const getProjectDetail = async (id: string): Promise<ProjectDetail | null> => {
  try {
    const db = getDb();
    const doc = await db.collection("projects").doc(id).get();
    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as ShowcaseProject;

    const [membersSnapshot, requestsSnapshot] = await Promise.all([
      db.collection("projectMembers").where("projectId", "==", id).get(),
      db
        .collection("projectInterests")
        .where("projectId", "==", id)
        .get()
        .catch(() => null),
    ]);

    const members = membersSnapshot.docs.map((memberDoc) => {
      const data = memberDoc.data() as ProjectMemberRecord;
      return {
        ...data,
        id: data.id ?? memberDoc.id,
      };
    });

    const pendingRequests = (requestsSnapshot ? requestsSnapshot.docs : []).map(
      (requestDoc) => {
        const data = requestDoc.data() as ProjectInterestRecord;
        return {
          ...data,
          id: data.id ?? requestDoc.id,
        };
      },
    );

    const activities = buildActivityFeed(data, members, pendingRequests);

    return {
      project: {
        ...data,
        id: data.id ?? doc.id,
      },
      members,
      pendingRequests,
      activities,
    };
  } catch (error) {
    console.error("❌ Unable to load project detail:", error);
    return null;
  }
};

const TimelineBadge = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="flex flex-col rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
    <span className="text-xs uppercase tracking-[0.35em] text-white/50">
      {label}
    </span>
    <span className="mt-2 text-base font-semibold text-white">{value}</span>
  </div>
);

const ActivityRow = ({
  entry,
}: {
  entry: ProjectActivityEntry;
}) => (
  <div className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/5 p-4">
    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-orange-400" />
    <div>
      <p className="text-sm font-semibold text-white">{entry.title}</p>
      <p className="text-xs text-white/60">{entry.description}</p>
      <p className="text-xs text-white/40">{entry.timestamp?.toLocaleString() ?? "Just now"}</p>
    </div>
  </div>
);

const ProjectLinks = ({
  project,
}: {
  project: ProjectRecord;
}) => {
  const links = [
    { label: "GitHub Repository", url: project.githubUrl, icon: ExternalLink },
    { label: "Live Demo", url: project.demoUrl, icon: Sparkles },
    { label: "Docs / Notion", url: project.docsUrl, icon: BookOpen },
  ] as const;

  return (
    <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
      <p className="text-xs uppercase tracking-[0.35em] text-white/50">
        Project links
      </p>
      <div className="mt-4 space-y-3">
        {links.map(({ label, url, icon: Icon }) =>
          url ? (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10"
            >
              <span>{label}</span>
              <Icon className="h-4 w-4 text-white/60" />
            </a>
          ) : (
            <div
              key={label}
              className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/0 px-4 py-3 text-sm text-white/40"
            >
              <span>{label}</span>
              <Icon className="h-4 w-4 text-white/25" />
            </div>
          ),
        )}
      </div>
    </div>
  );
};

export default async function ProjectDetailPage({ params }: Params) {
  const { id } = await params;
  const detail = await getProjectDetail(id);

  if (!detail) {
    notFound();
  }

  const { project, members, pendingRequests, activities } = detail;
  const sessionUser = await getSessionUser();
  const allowManage = canManageProject(project, sessionUser);
  const allowUpdates = isTeamMember(members, project, sessionUser);
  const showRequestAccess = !allowUpdates && project.status !== "completed";

  const stack = ensureArray(project.tech);
  const activeMembers = members.filter((member) => (member.role ?? "member") !== "removed");
  const memberCount = activeMembers.length || (typeof project.members === "number" ? project.members : 0);
  const membersLabel = `${memberCount} member${memberCount === 1 ? "" : "s"}`;
  const pendingCount = pendingRequests.filter((req) => (req.status ?? "pending") === "pending").length;
  const status = statusMeta[project.status] ?? statusMeta.active;
  const createdAtLabel = formatDateLabel(project.createdAt) ?? "Fresh drop";
  const updatedAtLabel = formatDateLabel(project.updatedAt) ?? "In progress";
  const latestUpdate =
    project.latestUpdate ??
    (project.status === "completed"
      ? "Project wrapped up. Read the docs for the full case study."
      : `Last sync ${updatedAtLabel?.toLowerCase() ?? "recently"}.`);
  const teamPreview = activeMembers.sort(
    (a, b) => (toDate(b.joinedAt)?.getTime() ?? 0) - (toDate(a.joinedAt)?.getTime() ?? 0),
  );

  return (
    <PageContainer>
      <PageIntro
        badge="PROJECT DETAIL"
        title={project.title}
        description={project.summary ?? project.description}
        actions={
          <>
            <Link
              href="/projects"
              className="flex items-center gap-2 rounded-full border border-white/10 px-5 py-2 text-sm text-white/70 transition hover:border-orange-400/60 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to projects
            </Link>
            {showRequestAccess ? (
              <Link
                href="/dashboard"
                className="rounded-full bg-gradient-to-r from-[#00f5c4] to-[#00c2ff] px-5 py-2 text-sm font-medium text-black transition hover:opacity-90"
              >
                Request access
              </Link>
            ) : (
              <div className="rounded-full border border-white/10 px-5 py-2 text-sm text-white/60">
                You’re on this squad
              </div>
            )}
          </>
        }
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.6fr_0.4fr]">
        <section className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-3 text-white/80">
              <Layers className="h-5 w-5 text-orange-400" />
              <p className="text-sm uppercase tracking-[0.35em]">Overview</p>
            </div>
            <p className="mt-4 text-base leading-relaxed text-white/70">
              {project.description}
            </p>
            <div
              className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${status.accent}`}
            >
              {status.message}
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <TimelineBadge label="Squad lead" value={project.owner} />
              <TimelineBadge label="Members" value={membersLabel} />
              <TimelineBadge label="Created" value={createdAtLabel} />
              <TimelineBadge label="Updated" value={updatedAtLabel} />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                  Latest Update
                </p>
                <h2 className="mt-2 text-xl font-semibold">Squad timeline</h2>
              </div>
              <MessageCircle className="h-5 w-5 text-orange-400" />
            </div>
            <ProjectUpdateForm
              projectId={project.id}
              defaultText={latestUpdate}
              canEdit={allowUpdates}
            />
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                  Tech stack
                </p>
                {stack.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {stack.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-white/70"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-white/60">Stack TBA.</p>
                )}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                  Activity feed
                </p>
                {activities.length ? (
                  <div className="mt-3 space-y-3">
                    {activities.map((entry) => (
                      <ActivityRow key={entry.id} entry={entry} />
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-white/60">
                    Awaiting the first squad update.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                  Active builders
                </p>
                <h2 className="mt-2 text-xl font-semibold">Core squad</h2>
              </div>
              <Users className="h-5 w-5 text-orange-400" />
            </div>
            {teamPreview.length ? (
              <div className="mt-4 space-y-3">
                {teamPreview.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">
                        {member.userName ?? member.userEmail ?? "Member"}
                      </p>
                      <p className="text-xs uppercase tracking-[0.25em] text-white/50">
                        {member.role ?? "member"}
                      </p>
                    </div>
                    <span className="text-xs text-white/50">
                      {formatDateLabel(member.joinedAt) ?? "New"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-white/60">
                Squad roster coming soon.
              </p>
            )}
            <div className="mt-4 flex items-center gap-2 text-xs text-white/50">
              <UserPlus className="h-4 w-4 text-orange-400" />
              {membersLabel}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-white/50">
              Squad status
            </p>
            <span
              className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs capitalize ${status.pill}`}
            >
              {project.status}
            </span>
            <div className="mt-6 space-y-3 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-orange-400" />
                {membersLabel}
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-orange-400" />
                Lead: {project.owner}
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {allowManage && (
                <Link
                  href={`/dashboard/projects/${project.id}/manage`}
                  className="inline-flex w-full items-center justify-center rounded-full border border-white/15 px-5 py-2 text-sm text-white/80 transition hover:border-orange-400/60"
                >
                  Manage project
                </Link>
              )}
              {project.chatUrl ? (
                <a
                  href={project.chatUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#00f5c4] to-[#00c2ff] px-5 py-2 text-sm font-medium text-black transition hover:opacity-90"
                >
                  <MessageCircle className="h-4 w-4" />
                  Open squad chat
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-white/20 px-5 py-2 text-sm text-white/40"
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat link coming soon
                </button>
              )}
            </div>
          </div>

          <ProjectLinks project={project} />

          {allowManage && (
            <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                Join requests
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">{pendingCount}</p>
              <p className="text-sm text-white/60">waiting for review</p>
              <Link
                href={`/dashboard/projects/${project.id}/manage`}
                className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-white/15 px-5 py-2 text-sm text-white/80 transition hover:border-orange-400/60"
              >
                Review requests
              </Link>
            </div>
          )}

          {showRequestAccess ? (
            <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                Next steps
              </p>
              <p className="mt-2 text-sm text-white/70">
                Ready to collaborate? Drop a request and the squad lead will
                follow-up with onboarding steps.
              </p>
              <Link
                href="/dashboard"
                className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#00f5c4] to-[#00c2ff] px-5 py-2 text-sm font-medium text-black transition hover:opacity-90"
              >
                Request to join
              </Link>
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                Next steps
              </p>
              <p className="mt-2 text-sm text-white/70">
                You already have access. Check squad chat or the dashboard for tasks.
              </p>
              {project.chatUrl ? (
                <a
                  href={project.chatUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#00f5c4] to-[#00c2ff] px-5 py-2 text-sm font-medium text-black transition hover:opacity-90"
                >
                  Open squad chat
                </a>
              ) : (
                <Link
                  href="/dashboard"
                  className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-white/15 px-5 py-2 text-sm text-white/80 transition hover:border-orange-400/60"
                >
                  Go to dashboard
                </Link>
              )}
            </div>
          )}
        </aside>
      </div>
    </PageContainer>
  );
}
