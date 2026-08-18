// Pure compatibility-scoring logic — no I/O, easy to reason about without
// a live Supabase project. computeCompatibility(a, b) is symmetric by
// construction (every sub-score compares a/b with an operation that
// doesn't care about argument order: equality, absolute difference, or a
// symmetric overlap formula), so computeCompatibility(a, b) ===
// computeCompatibility(b, a) always holds.

export type SleepSchedule = "early_bird" | "night_owl" | "flexible";
export type Cleanliness = "very_clean" | "average" | "messy";
export type SocialStyle = "quiet" | "social" | "mixed";

export interface ScoringProfile {
  budgetMin: number;
  budgetMax: number;
  sleepSchedule: SleepSchedule;
  cleanliness: Cleanliness;
  socialStyle: SocialStyle;
  smoker: boolean;
  petsOk: boolean;
}

/** Maps a `roommate_matcher_profiles` DB row (snake_case) to the shape computeCompatibility expects. */
export function profileRowToScoring(row: {
  budget_min: number;
  budget_max: number;
  sleep_schedule: string;
  cleanliness: string;
  social_style: string;
  smoker: boolean;
  pets_ok: boolean;
}): ScoringProfile {
  return {
    budgetMin: row.budget_min,
    budgetMax: row.budget_max,
    sleepSchedule: row.sleep_schedule as SleepSchedule,
    cleanliness: row.cleanliness as Cleanliness,
    socialStyle: row.social_style as SocialStyle,
    smoker: row.smoker,
    petsOk: row.pets_ok,
  };
}

// Weights sum to 100: budget 30, sleep schedule 20, cleanliness 20,
// social style 15, smoker 10, pets 5.

function budgetScore(a: ScoringProfile, b: ScoringProfile): number {
  const overlapStart = Math.max(a.budgetMin, b.budgetMin);
  const overlapEnd = Math.min(a.budgetMax, b.budgetMax);
  const overlap = Math.max(0, overlapEnd - overlapStart);
  const widthA = a.budgetMax - a.budgetMin;
  const widthB = b.budgetMax - b.budgetMin;
  const avgWidth = (widthA + widthB) / 2;
  if (avgWidth === 0) {
    // Both picked an exact single number rather than a range.
    return a.budgetMin === b.budgetMin ? 30 : 0;
  }
  const ratio = Math.min(1, overlap / avgWidth);
  return 30 * ratio;
}

function sleepScore(a: SleepSchedule, b: SleepSchedule): number {
  if (a === b) return 20;
  if (a === "flexible" || b === "flexible") return 12;
  // Only three possible values — if neither is "flexible" and they
  // differ, they must be the direct opposite pair (early_bird/night_owl).
  return 0;
}

const CLEAN_ORDER: Record<Cleanliness, number> = { very_clean: 0, average: 1, messy: 2 };

function cleanlinessScore(a: Cleanliness, b: Cleanliness): number {
  const diff = Math.abs(CLEAN_ORDER[a] - CLEAN_ORDER[b]);
  return Math.max(0, 20 - diff * 10);
}

const SOCIAL_ORDER: Record<SocialStyle, number> = { quiet: 0, mixed: 1, social: 2 };

function socialScore(a: SocialStyle, b: SocialStyle): number {
  const diff = Math.abs(SOCIAL_ORDER[a] - SOCIAL_ORDER[b]);
  return Math.max(0, 15 - diff * 7.5);
}

/** 0-100 compatibility score between two profiles. */
export function computeCompatibility(a: ScoringProfile, b: ScoringProfile): number {
  const total =
    budgetScore(a, b) +
    sleepScore(a.sleepSchedule, b.sleepSchedule) +
    cleanlinessScore(a.cleanliness, b.cleanliness) +
    socialScore(a.socialStyle, b.socialStyle) +
    (a.smoker === b.smoker ? 10 : 0) +
    (a.petsOk === b.petsOk ? 5 : 2);
  return Math.round(Math.max(0, Math.min(100, total)));
}
