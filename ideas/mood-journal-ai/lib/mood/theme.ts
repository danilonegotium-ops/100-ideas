/**
 * Maps a mood_score (-2..2, or null for "no tag yet") to an RGB triplet pair
 * used to tint mood-aware UI — the GradientMesh hero backdrop and each
 * journal entry's accent border. Same RGB-triplet convention as
 * `--accent-rgb`/`--accent-2-rgb` in globals.css (no "rgb()"/"#" wrapper) so
 * callers can drop these straight into `rgba(${accentRgb}, alpha)` or a CSS
 * custom-property override.
 */
export interface MoodTint {
  accentRgb: string;
  accent2Rgb: string;
}

const MOOD_TINTS: Record<string, MoodTint> = {
  // Very low — warm red, same family as --danger (#f87171).
  "-2": { accentRgb: "248, 113, 113", accent2Rgb: "251, 191, 36" },
  // Low — amber.
  "-1": { accentRgb: "251, 191, 36", accent2Rgb: "248, 113, 113" },
  // Neutral — muted blue-gray, no strong hue either direction.
  "0": { accentRgb: "148, 163, 184", accent2Rgb: "167, 139, 250" },
  // Good — the app's default accent green.
  "1": { accentRgb: "110, 231, 183", accent2Rgb: "167, 139, 250" },
  // Great — brighter teal/cyan paired with the violet secondary hue.
  "2": { accentRgb: "94, 234, 212", accent2Rgb: "167, 139, 250" },
};

const NEUTRAL_TINT: MoodTint = MOOD_TINTS["0"];

export function moodTint(score: number | null | undefined): MoodTint {
  if (score === null || score === undefined) return NEUTRAL_TINT;
  const clamped = Math.max(-2, Math.min(2, Math.round(score)));
  return MOOD_TINTS[String(clamped)] ?? NEUTRAL_TINT;
}
