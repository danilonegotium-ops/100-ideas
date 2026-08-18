import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Building,
  FundTransaction,
  Notice,
  Unit,
  UnitContact,
  Vote,
  VoteOption,
  VoteResponse,
} from "./types";

/**
 * Small, isolated Supabase read functions. Each one takes an already-created
 * client (Server Component / Route Handler / Server Action calls
 * `createClient()` from `lib/supabase/server.ts` once and passes it in) so
 * these stay easy to unit test and easy to review independently of Next.js
 * request plumbing.
 */

export async function getManagerBuildings(
  supabase: SupabaseClient,
  managerId: string,
): Promise<Building[]> {
  const { data, error } = await supabase
    .from("digitalni_upravnik_buildings")
    .select("*")
    .eq("manager_id", managerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getBuildingById(
  supabase: SupabaseClient,
  buildingId: string,
): Promise<Building | null> {
  const { data, error } = await supabase
    .from("digitalni_upravnik_buildings")
    .select("*")
    .eq("id", buildingId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getUnits(
  supabase: SupabaseClient,
  buildingId: string,
): Promise<Unit[]> {
  const { data, error } = await supabase
    .from("digitalni_upravnik_units")
    .select("*")
    .eq("building_id", buildingId)
    .order("label", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getUnitContactsByUnitIds(
  supabase: SupabaseClient,
  unitIds: string[],
): Promise<Map<string, UnitContact>> {
  if (unitIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("digitalni_upravnik_unit_contacts")
    .select("*")
    .in("unit_id", unitIds);

  if (error) throw error;
  return new Map((data ?? []).map((c) => [c.unit_id as string, c as UnitContact]));
}

export async function getFundTransactions(
  supabase: SupabaseClient,
  buildingId: string,
): Promise<FundTransaction[]> {
  const { data, error } = await supabase
    .from("digitalni_upravnik_fund_transactions")
    .select("*")
    .eq("building_id", buildingId)
    .order("occurred_on", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/** Pure function — balance is the running sum of signed transaction amounts. */
export function calculateFundBalance(transactions: FundTransaction[]): number {
  return transactions.reduce((total, tx) => total + Number(tx.amount), 0);
}

export async function getNotices(
  supabase: SupabaseClient,
  buildingId: string,
): Promise<Notice[]> {
  const { data, error } = await supabase
    .from("digitalni_upravnik_notices")
    .select("*")
    .eq("building_id", buildingId)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export type VoteTally = {
  vote: Vote;
  options: (VoteOption & { count: number })[];
  totalResponses: number;
  isOpen: boolean;
};

/** Pure function — combines raw rows into a per-option tally, no I/O. */
export function tallyVotes(
  votes: Vote[],
  options: VoteOption[],
  responses: VoteResponse[],
): VoteTally[] {
  const now = Date.now();
  return votes.map((vote) => {
    const voteOptions = options
      .filter((o) => o.vote_id === vote.id)
      .sort((a, b) => a.position - b.position);
    const voteResponses = responses.filter((r) => r.vote_id === vote.id);

    const tallied = voteOptions.map((option) => ({
      ...option,
      count: voteResponses.filter((r) => r.option_id === option.id).length,
    }));

    return {
      vote,
      options: tallied,
      totalResponses: voteResponses.length,
      isOpen: new Date(vote.closes_at).getTime() > now,
    };
  });
}

export async function getVoteTalliesForBuilding(
  supabase: SupabaseClient,
  buildingId: string,
): Promise<VoteTally[]> {
  const { data: votes, error: votesError } = await supabase
    .from("digitalni_upravnik_votes")
    .select("*")
    .eq("building_id", buildingId)
    .order("created_at", { ascending: false });
  if (votesError) throw votesError;
  if (!votes || votes.length === 0) return [];

  const voteIds = votes.map((v) => v.id);

  const { data: options, error: optionsError } = await supabase
    .from("digitalni_upravnik_vote_options")
    .select("*")
    .in("vote_id", voteIds);
  if (optionsError) throw optionsError;

  const { data: responses, error: responsesError } = await supabase
    .from("digitalni_upravnik_vote_responses")
    .select("*")
    .in("vote_id", voteIds);
  if (responsesError) throw responsesError;

  return tallyVotes(votes, options ?? [], responses ?? []);
}
