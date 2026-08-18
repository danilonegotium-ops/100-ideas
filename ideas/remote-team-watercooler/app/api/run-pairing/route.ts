import { NextResponse } from "next/server";
import { createClient, getUser } from "@/lib/supabase/server";
import { generatePairing } from "@/lib/watercooler/pairing";

/**
 * Runs a fresh pairing for the logged-in owner's active members. Uses the
 * cookie-authenticated server client, so every read/write here is scoped
 * by RLS to `auth.uid() = owner_id` automatically — this route never needs
 * to trust a client-supplied owner id.
 */
export async function POST() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  const supabase = createClient();

  const { data: members, error: membersError } = await supabase
    .from("remote_team_watercooler_members")
    .select("id")
    .eq("active", true);

  if (membersError) {
    return NextResponse.json({ error: membersError.message }, { status: 500 });
  }

  const memberIds = (members ?? []).map((m: { id: string }) => m.id);
  if (memberIds.length < 2) {
    return NextResponse.json(
      { error: "Need at least 2 active members to run a pairing." },
      { status: 400 },
    );
  }

  // Most recent previous run (by creation time, not `week_start` — an
  // admin can click "run pairing" more than once in the same calendar
  // week, and we want to avoid repeating *that* run's pairs specifically).
  const { data: lastWeek } = await supabase
    .from("remote_team_watercooler_pairing_weeks")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let previousGroups: string[][] = [];
  if (lastWeek) {
    const { data: lastPairings } = await supabase
      .from("remote_team_watercooler_pairings")
      .select("member_ids")
      .eq("week_id", lastWeek.id);
    previousGroups = (lastPairings ?? []).map(
      (p: { member_ids: string[] }) => p.member_ids,
    );
  }

  const groups = generatePairing(memberIds, previousGroups);
  const isoDate = new Date().toISOString().slice(0, 10);

  const { data: newWeek, error: weekError } = await supabase
    .from("remote_team_watercooler_pairing_weeks")
    .insert({ owner_id: user.id, week_start: isoDate })
    .select()
    .single();

  if (weekError || !newWeek) {
    return NextResponse.json(
      { error: weekError?.message ?? "Failed to create pairing week." },
      { status: 500 },
    );
  }

  const rows = groups.map((group) => ({
    owner_id: user.id,
    week_id: newWeek.id,
    member_ids: group,
    meeting_link: "",
  }));

  const { error: insertError } = await supabase
    .from("remote_team_watercooler_pairings")
    .insert(rows);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ weekId: newWeek.id, groups: groups.length });
}
