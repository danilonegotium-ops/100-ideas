import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { EmptyState } from "@/components/motion/EmptyState";
import { createClient } from "@/lib/supabase/server";

type LeaderboardRow = {
  user_id: string;
  display_name: string;
  total_points: number;
  lessons_completed: number;
};

export default async function LeaderboardPage() {
  const supabase = createClient();

  const { data: leaderboard, error } = await supabase
    .from("financial_literacy_teens_leaderboard")
    .select("user_id, display_name, total_points, lessons_completed")
    .order("total_points", { ascending: false })
    .limit(50);

  const rows = (leaderboard as LeaderboardRow[] | null) ?? [];

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Leaderboard</h1>
        <p className="mb-6 text-muted">
          Top point-earners across all learners. Only first names or
          initials — no other personal info is shown.
        </p>

        {error && (
          <Card className="mb-4">
            <p className="text-sm text-danger">
              Couldn&apos;t load the leaderboard right now (
              {error.message || "Supabase isn't configured yet"}
              ). This page needs a live Supabase project — see SPEC.md.
            </p>
          </Card>
        )}

        {!error && rows.length === 0 && (
          <EmptyState
            title="No learners yet"
            description="Be the first to complete a lesson."
          />
        )}

        <div className="flex flex-col gap-2">
          {rows.map((row, i) => (
            <AnimatedCard key={row.user_id} index={i} hoverLift={false} className="flex items-center justify-between">
              <span className="text-sm text-fg">
                {i + 1}. {row.display_name}
              </span>
              <span className="text-sm text-muted">
                {row.total_points} pts · {row.lessons_completed} lesson
                {row.lessons_completed === 1 ? "" : "s"}
              </span>
            </AnimatedCard>
          ))}
        </div>
      </main>
    </>
  );
}
