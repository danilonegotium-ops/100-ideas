import { createAdminClient } from "@/lib/supabase/admin";

export interface ResolvedMember {
  id: string;
  name: string;
  owner_id: string;
}

export interface ResolvedPairing {
  id: string;
  member_ids: string[];
  meeting_link: string;
}

export interface ResolvedMemberPairing {
  member: ResolvedMember;
  pairing: ResolvedPairing | null;
  partnerNames: string[];
}

/**
 * Server-only lookup used by the public `/m/[token]` page and its link
 * API route. Authorization here is "does this token match exactly one
 * member row" — there's no Supabase auth session for the visitor to check
 * against, so this intentionally uses the service-role client (see
 * lib/supabase/admin.ts) and narrows every query to that one member/their
 * owner's data, never a broader listing.
 */
export async function resolveMemberByToken(
  token: string,
): Promise<ResolvedMemberPairing | null> {
  const supabase = createAdminClient();

  const { data: member, error: memberError } = await supabase
    .from("remote_team_watercooler_members")
    .select("id, name, owner_id")
    .eq("share_token", token)
    .maybeSingle();

  if (memberError || !member) return null;

  const { data: latestWeek } = await supabase
    .from("remote_team_watercooler_pairing_weeks")
    .select("id")
    .eq("owner_id", member.owner_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestWeek) {
    return { member, pairing: null, partnerNames: [] };
  }

  const { data: pairings } = await supabase
    .from("remote_team_watercooler_pairings")
    .select("id, member_ids, meeting_link")
    .eq("week_id", latestWeek.id);

  const pairing =
    (pairings ?? []).find((p: ResolvedPairing) =>
      p.member_ids.includes(member.id),
    ) ?? null;

  if (!pairing) {
    return { member, pairing: null, partnerNames: [] };
  }

  const partnerIds = pairing.member_ids.filter(
    (id: string) => id !== member.id,
  );

  let partnerNames: string[] = [];
  if (partnerIds.length > 0) {
    const { data: partners } = await supabase
      .from("remote_team_watercooler_members")
      .select("id, name")
      .in("id", partnerIds);
    partnerNames = (partners ?? []).map((p: { name: string }) => p.name);
  }

  return { member, pairing, partnerNames };
}
