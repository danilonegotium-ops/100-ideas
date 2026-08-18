import { NextResponse } from "next/server";
import { createClient, getUser } from "@/lib/supabase/server";

/**
 * Expresses interest in another user. If they've already expressed
 * interest in the caller too, this makes the match mutual — both
 * directions being visible via RLS (`interests_select_either_party` in
 * schema.sql) is what lets the browse page detect and show that.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Log in first." }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const toUserId = typeof payload?.toUserId === "string" ? payload.toUserId : null;
  if (!toUserId) {
    return NextResponse.json({ error: "Missing toUserId." }, { status: 400 });
  }
  if (toUserId === user.id) {
    return NextResponse.json(
      { error: "You can't express interest in yourself." },
      { status: 400 },
    );
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("roommate_matcher_interests")
    .insert({ from_user_id: user.id, to_user_id: toUserId });

  if (error) {
    // Unique (from_user_id, to_user_id) violation just means they already
    // expressed interest — safe to treat a repeat click as a success.
    if (error.code === "23505") {
      return NextResponse.json({ ok: true, alreadyInterested: true });
    }
    return NextResponse.json(
      { error: "Couldn't record your interest. Try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
