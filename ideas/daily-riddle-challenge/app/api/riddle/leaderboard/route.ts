import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { utcDateString } from "@/lib/riddles";

export const dynamic = "force-dynamic";

/** Public leaderboard for a given riddle date (defaults to today, UTC). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || utcDateString();

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ riddleDate: date, entries: [] });
  }

  const { data, error } = await supabase
    .from("daily_riddle_challenge_attempts")
    .select("display_name, elapsed_ms, completed_at")
    .eq("riddle_date", date)
    .eq("correct", true)
    .order("elapsed_ms", { ascending: true })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: "Couldn't load the leaderboard." }, { status: 500 });
  }

  return NextResponse.json({ riddleDate: date, entries: data ?? [] });
}
