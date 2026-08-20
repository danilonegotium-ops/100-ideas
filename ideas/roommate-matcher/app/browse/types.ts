// Shared shape between the Server Component (app/browse/page.tsx, which owns
// all Supabase querying) and the Client Component swipe deck below it. Pure
// presentation types — no change to what's actually fetched from Supabase.

export type SleepSchedule = "early_bird" | "night_owl" | "flexible";
export type Cleanliness = "very_clean" | "average" | "messy";
export type SocialStyle = "quiet" | "social" | "mixed";

export interface DeckCandidate {
  user_id: string;
  display_name: string;
  city: string;
  area: string | null;
  university: string | null;
  budget_min: number;
  budget_max: number;
  sleep_schedule: SleepSchedule;
  cleanliness: Cleanliness;
  social_style: SocialStyle;
  smoker: boolean;
  pets_ok: boolean;
  bio: string | null;
  score: number;
  /** True if this candidate already expressed interest in the current user
   * (from the `incoming` interests query) — swiping right on a candidate
   * with this set to true is what makes the click an instant mutual match. */
  alreadyInterestedInMe: boolean;
}

export const TAG_LABELS: Record<string, string> = {
  early_bird: "Early bird",
  night_owl: "Night owl",
  flexible: "Flexible schedule",
  very_clean: "Very clean",
  average: "Average tidiness",
  messy: "Messy",
  quiet: "Quiet",
  social: "Social",
  mixed: "Mixed social style",
};
