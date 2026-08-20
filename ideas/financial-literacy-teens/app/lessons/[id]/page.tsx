import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { GlassPanel } from "@/components/motion/GlassPanel";
import { ChooseNameForm } from "@/components/ChooseNameForm";
import { QuizClient } from "@/components/QuizClient";
import { createClient, getUser } from "@/lib/supabase/server";

export default async function LessonPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getUser();
  if (!user) {
    redirect(`/login?next=/lessons/${params.id}`);
  }

  const supabase = createClient();

  const { data: lesson } = await supabase
    .from("financial_literacy_teens_lessons")
    .select("id, title, summary, content, points_available")
    .eq("id", params.id)
    .maybeSingle();

  if (!lesson) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("financial_literacy_teens_profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: questions } = await supabase
    .from("financial_literacy_teens_quiz_questions")
    .select("id, question, options, correct_index")
    .eq("lesson_id", lesson.id)
    .order("order_index", { ascending: true });

  const { data: existingProgress } = await supabase
    .from("financial_literacy_teens_progress")
    .select("score, total_questions, points_earned, badge")
    .eq("user_id", user.id)
    .eq("lesson_id", lesson.id)
    .maybeSingle();

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <Link href="/" className="mb-4 inline-block text-sm text-accent underline">
          ← all lessons
        </Link>
        <h1 className="mb-2 text-2xl font-semibold">{lesson.title}</h1>
        <p className="mb-6 text-muted">{lesson.summary}</p>

        {!profile ? (
          <ChooseNameForm />
        ) : (
          <>
            <GlassPanel className="mb-6 whitespace-pre-line text-sm text-fg">
              {lesson.content}
            </GlassPanel>

            {existingProgress && (
              <Card className="mb-6">
                <p className="text-sm text-muted">
                  You&apos;ve already completed this lesson:{" "}
                  <span className="text-fg">
                    {existingProgress.score}/{existingProgress.total_questions}
                  </span>{" "}
                  correct, {existingProgress.points_earned} points,{" "}
                  {existingProgress.badge} badge. Retaking the quiz below
                  updates your score.
                </p>
              </Card>
            )}

            <h2 className="mb-3 text-sm font-semibold text-fg">
              Quick quiz ({questions?.length ?? 0} questions)
            </h2>
            <QuizClient
              lessonId={lesson.id}
              questions={questions ?? []}
              pointsAvailable={lesson.points_available}
            />
          </>
        )}
      </main>
    </>
  );
}
