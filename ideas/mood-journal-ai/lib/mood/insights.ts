import type { MoodEntry } from "./types";

/**
 * Keyword-correlation heuristic: "you report feeling better on days you
 * mention exercise/outdoors". Pure functions, computed entirely from
 * already-stored entries + mood scores — deliberately NOT a second AI call
 * (per the brief). Verified with a standalone Node scratch script against
 * fixed fixture data before wiring into the UI.
 */

export interface KeywordTheme {
  key: string;
  label: string;
  keywords: string[];
}

export const THEMES: KeywordTheme[] = [
  {
    key: "exercise",
    label: "exercise or being outdoors",
    keywords: [
      "run",
      "running",
      "ran",
      "jog",
      "jogging",
      "walk",
      "walked",
      "walking",
      "gym",
      "exercise",
      "workout",
      "worked out",
      "hike",
      "hiked",
      "hiking",
      "outside",
      "outdoor",
      "outdoors",
      "park",
      "bike",
      "biking",
      "cycled",
      "cycling",
      "yoga",
      "swim",
      "swam",
    ],
  },
  {
    key: "sleep",
    label: "poor sleep or being tired",
    keywords: [
      "tired",
      "exhausted",
      "insomnia",
      "slept badly",
      "didn't sleep",
      "no sleep",
      "overslept",
      "restless night",
    ],
  },
  {
    key: "social",
    label: "friends, family, or socializing",
    keywords: [
      "friend",
      "friends",
      "family",
      "party",
      "dinner with",
      "hung out",
      "hangout",
      "get-together",
      "visited",
    ],
  },
  {
    key: "work_stress",
    label: "work stress or deadlines",
    keywords: [
      "deadline",
      "meeting",
      "meetings",
      "boss",
      "stressed",
      "stressful",
      "overtime",
      "overwhelmed",
      "back-to-back",
    ],
  },
];

export function mentionsTheme(content: string, theme: KeywordTheme): boolean {
  const lower = content.toLowerCase();
  return theme.keywords.some((kw) => lower.includes(kw));
}

export interface CorrelationInsight {
  theme: KeywordTheme;
  withAvg: number;
  withoutAvg: number;
  withCount: number;
  withoutCount: number;
  diff: number; // withAvg - withoutAvg, positive = mood is better on days mentioning the theme
}

// Require at least this many scored entries total before attempting any
// correlation claim, and at least this many entries on each side of the
// split, so a single outlier entry can't produce a misleading "pattern".
const MIN_TOTAL_SCORED_ENTRIES = 5;
const MIN_GROUP_SIZE = 2;
// Only surface a theme if the average mood gap is large enough to be a
// meaningful signal rather than noise, on a -2..2 scale.
const MIN_MEANINGFUL_DIFF = 0.5;
const MAX_INSIGHTS = 3;

function average(nums: number[]): number {
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

export function computeInsights(entries: MoodEntry[]): CorrelationInsight[] {
  const scored = entries.filter(
    (e): e is MoodEntry & { mood_score: number } => typeof e.mood_score === "number",
  );
  if (scored.length < MIN_TOTAL_SCORED_ENTRIES) return [];

  const insights: CorrelationInsight[] = [];

  for (const theme of THEMES) {
    const withEntries = scored.filter((e) => mentionsTheme(e.content, theme));
    const withoutEntries = scored.filter((e) => !mentionsTheme(e.content, theme));
    if (withEntries.length < MIN_GROUP_SIZE || withoutEntries.length < MIN_GROUP_SIZE) {
      continue;
    }

    const withAvg = average(withEntries.map((e) => e.mood_score));
    const withoutAvg = average(withoutEntries.map((e) => e.mood_score));
    const diff = withAvg - withoutAvg;
    if (Math.abs(diff) < MIN_MEANINGFUL_DIFF) continue;

    insights.push({
      theme,
      withAvg,
      withoutAvg,
      withCount: withEntries.length,
      withoutCount: withoutEntries.length,
      diff,
    });
  }

  insights.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  return insights.slice(0, MAX_INSIGHTS);
}

export function describeInsight(insight: CorrelationInsight): string {
  const direction = insight.diff > 0 ? "better" : "worse";
  return `You report feeling ${direction} on days you mention ${insight.theme.label} (avg mood ${insight.withAvg.toFixed(1)} vs ${insight.withoutAvg.toFixed(1)}, based on ${insight.withCount} vs ${insight.withoutCount} entries).`;
}
