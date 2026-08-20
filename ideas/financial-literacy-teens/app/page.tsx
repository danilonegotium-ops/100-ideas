import Link from "next/link";
import { Nav } from "@/components/Nav";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { StatTile } from "@/components/motion/StatTile";
import { EmptyState } from "@/components/motion/EmptyState";
import { GradientMesh } from "@/components/motion/GradientMesh";
import { createClient, getUser } from "@/lib/supabase/server";

type Lesson = {
  id: string;
  title: string;
  summary: string;
  points_available: number;
};

type LeaderboardRow = {
  user_id: string;
  display_name: string;
  total_points: number;
  lessons_completed: number;
};

export default async function Home() {
  const supabase = createClient();
  const user = await getUser();

  const { data: lessons } = await supabase
    .from("financial_literacy_teens_lessons")
    .select("id, title, summary, points_available")
    .order("order_index", { ascending: true });

  const { data: leaderboard } = await supabase
    .from("financial_literacy_teens_leaderboard")
    .select("user_id, display_name, total_points, lessons_completed")
    .order("total_points", { ascending: false })
    .limit(5);

  let myProgress: { lesson_id: string; badge: string; points_earned: number }[] = [];
  if (user) {
    const { data } = await supabase
      .from("financial_literacy_teens_progress")
      .select("lesson_id, badge, points_earned")
      .eq("user_id", user.id);
    myProgress = data ?? [];
  }
  const myTotalPoints = myProgress.reduce((sum, p) => sum + p.points_earned, 0);
  const totalLessons = lessons?.length ?? 6;
  const progressPct =
    totalLessons > 0 ? Math.round((myProgress.length / totalLessons) * 100) : 0;

  return (
    <>
      <Nav />
      <main className="relative mx-auto w-full max-w-site flex-1 px-5 py-8">
        <GradientMesh animate />
        <h1 className="mb-2 text-2xl font-semibold">
          Financial Literacy for Teens
        </h1>
        <p className="mb-6 text-muted">
          Six short lessons on saving, budgeting, compound interest,
          investing, credit, and taxes — each with a quick quiz. Earn
          points and a badge for every lesson you finish.
        </p>

        {user && myProgress.length > 0 && (
          <div className="mb-6">
            <div className="mb-3 grid grid-cols-2 gap-3">
              <StatTile label="Lessons completed" value={myProgress.length} suffix={` / ${totalLessons}`} />
              <StatTile label="Points earned" value={myTotalPoints} />
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        <div className="mb-8 flex flex-col gap-3">
          {(lessons as Lesson[] | null)?.map((lesson, i) => {
            const done = myProgress.find((p) => p.lesson_id === lesson.id);
            return (
              <Link key={lesson.id} href={`/lessons/${lesson.id}`} className="no-underline">
                <AnimatedCard index={i} className="transition-colors hover:border-accent">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <h2 className="text-base font-semibold text-fg">
                      {lesson.title}
                    </h2>
                    {done && (
                      <span className="whitespace-nowrap rounded-brand border border-border px-2 py-0.5 text-xs capitalize text-muted">
                        {done.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted">{lesson.summary}</p>
                </AnimatedCard>
              </Link>
            );
          })}
        </div>

        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Leaderboard</h2>
          <Link href="/leaderboard" className="text-sm text-accent underline">
            View full leaderboard →
          </Link>
        </div>
        {leaderboard && leaderboard.length > 0 ? (
          <div className="flex flex-col gap-2">
            {(leaderboard as LeaderboardRow[]).map((row, i) => (
              <AnimatedCard key={row.user_id} index={i} hoverLift={false} className="flex items-center justify-between">
                <span className="text-sm text-fg">
                  {i + 1}. {row.display_name}
                </span>
                <span className="text-sm text-muted">{row.total_points} pts</span>
              </AnimatedCard>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No learners yet"
            description="Be the first to complete a lesson and claim the top spot."
          />
        )}
      </main>
    </>
  );
}
