/**
 * Pure prompt-construction and response-parsing functions for the email
 * professionalizer, kept separate from `lib/gemini.ts` (the actual fetch
 * call) so they can be sanity-checked with hand-built mock responses — no
 * live API key needed to test this logic.
 */

export const MAX_EMAIL_LENGTH = 4000;

export interface RewriteResult {
  rewritten: string;
  notes: string;
}

export function buildPrompt(draft: string): string {
  return [
    "You are a professional communications editor.",
    "Rewrite the following email draft to be polite, calm, and professional,",
    "while preserving the sender's core message and intent — don't remove",
    "legitimate requests, concerns, or facts, just soften the tone, fix any",
    "unprofessional language, and improve clarity and structure.",
    "",
    "DRAFT EMAIL:",
    draft,
    "",
    "Also give a very short (one sentence) note summarizing what tone changes",
    "you made.",
    "",
    "Respond with ONLY a JSON object (no markdown, no commentary, no code fences), in exactly this shape:",
    '{"rewritten": "the full rewritten email text", "notes": "one sentence summary of changes"}',
  ].join("\n");
}

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1] : trimmed;
}

/**
 * Parses the model's raw text output into a validated rewrite result.
 * Returns null (rather than throwing) if the shape doesn't match, so the
 * caller can fall back to showing the raw text. `notes` is optional —
 * missing/invalid notes degrade to an empty string rather than failing
 * the whole parse, since `rewritten` is the important part.
 */
export function parseRewrite(rawText: string): RewriteResult | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFences(rawText));
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) return null;

  const rewritten = (parsed as { rewritten?: unknown }).rewritten;
  const notes = (parsed as { notes?: unknown }).notes;

  if (typeof rewritten !== "string" || rewritten.trim().length === 0) {
    return null;
  }

  return {
    rewritten: rewritten.trim(),
    notes: typeof notes === "string" ? notes.trim() : "",
  };
}
