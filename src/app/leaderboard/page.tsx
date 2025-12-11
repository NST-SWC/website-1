import Link from "next/link";
import { PageContainer } from "@/components/shared/page-container";
import { PageIntro } from "@/components/shared/page-intro";

const LeaderboardPage = () => (
  <PageContainer>
    <PageIntro
      badge="LEADERBOARD"
      title="Season rankings & badge wall"
      description="Points system coming soon. Stay tuned for updates!"
      actions={
        <Link
          href="/"
          className="rounded-full border border-white/10 px-5 py-2 text-sm text-white/70 transition hover:border-orange-400/60 hover:text-white"
        >
          ← Back home
        </Link>
      }
    />

    <div className="mt-10 text-center py-12">
      <p className="text-white/60 text-lg">Leaderboard feature coming soon!</p>
    </div>
  </PageContainer>
);

export default LeaderboardPage;
