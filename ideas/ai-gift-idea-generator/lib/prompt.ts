/**
 * Pure prompt-construction and response-parsing functions for the gift idea
 * generator, kept separate from `lib/gemini.ts` (the actual fetch call) so
 * they can be sanity-checked with hand-built mock responses — no live API
 * key needed to test this logic.
 */

export const MAX_INTERESTS_LENGTH = 500;
export const MAX_BUDGET_LENGTH = 100;

export interface GiftIdea {
  name: string;
  reason: string;
}

export function buildPrompt(interests: string, budget: string): string {
  return [
    "You are a thoughtful gift-recommendation assistant.",
    `A friend has these interests: ${interests}`,
    `The budget is: ${budget}`,
    "",
    "Suggest exactly 5 unique, specific gift ideas that fit the interests and budget.",
    "For each idea give a short one-sentence reason it's a good fit.",
    "",
    "Respond with ONLY a JSON array (no markdown, no commentary, no code fences), in exactly this shape:",
    '[{"name": "Gift name", "reason": "Short reason"}, ...]',
  ].join("\n");
}

/**
 * Strips markdown code fences (models sometimes wrap JSON in ```json ...```
 * despite instructions not to) before parsing.
 */
function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1] : trimmed;
}

/**
 * Parses the model's raw text output into a validated list of gift ideas.
 * Returns null (rather than throwing) if the shape doesn't match, so the
 * caller can fall back to showing the raw text instead of a broken UI.
 */
export function parseGiftIdeas(rawText: string): GiftIdea[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFences(rawText));
  } catch {
    return null;
  }

  if (!Array.isArray(parsed)) return null;

  const ideas: GiftIdea[] = [];
  for (const item of parsed) {
    if (
      typeof item === "object" &&
      item !== null &&
      typeof (item as { name?: unknown }).name === "string" &&
      typeof (item as { reason?: unknown }).reason === "string"
    ) {
      ideas.push({
        name: (item as { name: string }).name.trim(),
        reason: (item as { reason: string }).reason.trim(),
      });
    }
  }

  return ideas.length > 0 ? ideas.slice(0, 5) : null;
}
