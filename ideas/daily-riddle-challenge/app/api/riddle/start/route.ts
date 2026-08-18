import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";
import { riddleForDate, utcDateString } from "@/lib/riddles";

/**
 * Starts (or resumes) today's attempt. Logged-in users get one attempt per
 * day enforced server-side: re-calling this while an attempt is still in
 * progress returns the *original* `startedAt` rather than resetting it
 * (so reloading the page can't be used to restart the clock), and calling
 * it again after completing today's riddle returns the existing result
 * instead of letting them play again.
 *
 * Anonymous players (no `user_id`) have no stable server-side identity to
 * dedupe against — this is an honor-system limitation for anonymous play,
 * documented in SPEC.md, not a bug.
 */
export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const user = await getUser();
  const riddleDate = utcDateString();

  let displayName =
    typeof payload?.displayName === "string" ? payload.displayName.trim().slice(0, 60) : "";
  if (user?.email && !displayName) {
    displayName = user.email.split("@")[0];
  }
  if (!displayName) {
    return NextResponse.json({ error: "Enter a name to play." }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Game backend isn't configured yet." },
      { status: 503 },
    );
  }

  if (user) {
    const { data: existing } = await supabase
      .from("daily_riddle_challenge_attempts")
      .select("id, started_at, completed_at, correct, elapsed_ms")
      .eq("user_id", user.id)
      .eq("riddle_date", riddleDate)
      .maybeSingle();

    if (existing) {
      if (existing.completed_at) {
        const riddle = riddleForDate(new Date(`${riddleDate}T00:00:00Z`));
        return NextResponse.json({
          attemptId: existing.id,
          startedAt: existing.started_at,
          alreadyPlayed: true,
          correct: existing.correct,
          elapsedMs: existing.elapsed_ms,
          displayAnswer: riddle.displayAnswer,
        });
      }
      return NextResponse.json({
        attemptId: existing.id,
        startedAt: existing.started_at,
        alreadyPlayed: false,
      });
    }
  }

  const { data, error } = await supabase
    .from("daily_riddle_challenge_attempts")
    .insert({
      riddle_date: riddleDate,
      user_id: user?.id ?? null,
      display_name: displayName,
    })
    .select("id, started_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Couldn't start the riddle. Try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    attemptId: data.id,
    startedAt: data.started_at,
    alreadyPlayed: false,
  });
}
