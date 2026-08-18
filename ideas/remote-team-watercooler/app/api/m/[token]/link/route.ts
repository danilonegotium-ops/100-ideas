import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveMemberByToken } from "@/lib/watercooler/resolveMemberByToken";

/**
 * Lets a member (identified purely by their `share_token`, no login)
 * update the meeting link on their own current pairing. Re-resolves
 * "current pairing for this token" server-side instead of trusting a
 * client-supplied pairing id, so a visitor can never edit a pairing that
 * isn't theirs — the only input that matters is the token in the URL.
 */
export async function POST(
  request: Request,
  { params }: { params: { token: string } },
) {
  const body = await request.json().catch(() => null);
  const link = typeof body?.link === "string" ? body.link : "";

  const resolved = await resolveMemberByToken(params.token);
  if (!resolved || !resolved.pairing) {
    return NextResponse.json(
      { error: "No current pairing found for this link." },
      { status: 404 },
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("remote_team_watercooler_pairings")
    .update({ meeting_link: link })
    .eq("id", resolved.pairing.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
