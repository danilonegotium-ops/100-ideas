import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCorrectAnswer, riddleForDate } from "@/lib/riddles";

/**
 * Grades an attempt. Elapsed time is always computed server-side from the
 * row's own `started_at` — never from anything the client sends — since
 * that's the one number the whole leaderboard's integrity depends on.
 *
 * The final UPDATE is conditioned on `completed_at IS NULL` (via `.is()`),
 * which atomically guards against the same attempt being submitted twice
 * concurrently (double-click, retried request, etc.): only one of the
 * racing requests can win the update, and the loser gets a clean 409
 * instead of silently overwriting a real result.
 */
export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const attemptId = typeof payload?.attemptId === "string" ? payload.attemptId : null;
  const answer = typeof payload?.answer === "string" ? payload.answer : "";

  if (!attemptId) {
    return NextResponse.json({ error: "Missing attemptId." }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Game backend isn't configured yet." },
      { status: 503 },
    );
  }

  const { data: attempt, error: fetchError } = await supabase
    .from("daily_riddle_challenge_attempts")
    .select("id, riddle_date, started_at, completed_at")
    .eq("id", attemptId)
    .maybeSingle();

  if (fetchError || !attempt) {
    return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
  }
  if (attempt.completed_at) {
    return NextResponse.json(
      { error: "This attempt was already submitted." },
      { status: 409 },
    );
  }

  const riddle = riddleForDate(new Date(`${attempt.riddle_date}T00:00:00Z`));
  const correct = isCorrectAnswer(answer, riddle);
  const now = new Date();
  const elapsedMs = Math.max(
    0,
    now.getTime() - new Date(attempt.started_at).getTime(),
  );

  const { data: updated, error: updateError } = await supabase
    .from("daily_riddle_challenge_attempts")
    .update({ completed_at: now.toISOString(), elapsed_ms: elapsedMs, correct })
    .eq("id", attemptId)
    .is("completed_at", null)
    .select()
    .maybeSingle();

  if (updateError) {
    return NextResponse.json(
      { error: "Couldn't submit your answer. Try again." },
      { status: 500 },
    );
  }
  if (!updated) {
    return NextResponse.json(
      { error: "This attempt was already submitted." },
      { status: 409 },
    );
  }

  return NextResponse.json({
    correct,
    elapsedMs,
    displayAnswer: riddle.displayAnswer,
  });
}
