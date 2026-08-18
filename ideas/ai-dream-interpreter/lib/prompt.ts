/**
 * Pure prompt-construction and response-parsing functions for the dream
 * interpreter, kept separate from `lib/gemini.ts` (the actual fetch call)
 * so they can be sanity-checked with hand-built mock responses — no live
 * API key needed to test this logic.
 */

export const MAX_DREAM_LENGTH = 4000;

export interface DreamInterpretation {
  interpretation: string;
  themes: string[];
}

export function buildPrompt(dream: string): string {
  return [
    "You are a fun, imaginative dream interpreter for an entertainment website.",
    "This is explicitly for entertainment purposes only — NOT professional",
    "psychological, medical, or mental health advice. Keep the tone playful,",
    "warm, and light, like a fun horoscope, not clinical. Do not offer",
    "diagnoses, do not tell the reader they have a disorder, and if the dream",
    "content is very dark, respond gently and suggest that a real, difficult",
    "dream is worth discussing with a real professional or trusted person,",
    "then still give a short fun symbolic take.",
    "",
    "DREAM:",
    dream,
    "",
    "Give a fun symbolic interpretation (2-4 short paragraphs) and a list of",
    "3-6 key symbolic themes you noticed in the dream (single words or short",
    "phrases, e.g. 'falling', 'losing teeth', 'being chased').",
    "",
    "Respond with ONLY a JSON object (no markdown, no commentary, no code fences), in exactly this shape:",
    '{"interpretation": "the fun interpretation text", "themes": ["theme1", "theme2", ...]}',
  ].join("\n");
}

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1] : trimmed;
}

/**
 * Parses the model's raw text output into a validated interpretation.
 * Returns null (rather than throwing) if the shape doesn't match, so the
 * caller can fall back to showing the raw text.
 */
export function parseInterpretation(rawText: string): DreamInterpretation | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFences(rawText));
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) return null;

  const interpretation = (parsed as { interpretation?: unknown }).interpretation;
  const themes = (parsed as { themes?: unknown }).themes;

  if (typeof interpretation !== "string" || interpretation.trim().length === 0) {
    return null;
  }

  const cleanThemes = Array.isArray(themes)
    ? themes.filter(
        (t): t is string => typeof t === "string" && t.trim().length > 0,
      ).map((t) => t.trim())
    : [];

  return {
    interpretation: interpretation.trim(),
    themes: cleanThemes,
  };
}
