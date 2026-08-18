/**
 * Pure prompt-construction and response-parsing functions for the recipe
 * creator, kept separate from `lib/gemini.ts` (the actual fetch call) so
 * they can be sanity-checked with hand-built mock responses — no live API
 * key needed to test this logic.
 */

export const MAX_INGREDIENTS_INPUT_LENGTH = 500;
export const MIN_INGREDIENTS = 3;

export interface Recipe {
  title: string;
  ingredients: string[];
  steps: string[];
}

/**
 * Splits the raw textarea input (comma- and/or newline-separated) into a
 * clean list of non-empty ingredient names.
 */
export function parseIngredientsInput(raw: string): string[] {
  return raw
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function buildPrompt(ingredients: string[]): string {
  return [
    "You are a creative home cook helping someone use up ingredients they have.",
    `They have these ingredients on hand: ${ingredients.join(", ")}`,
    "",
    "Create one full recipe that prominently uses these ingredients. You may add",
    "reasonable pantry staples (salt, pepper, oil, common spices, flour, water, etc.)",
    "as needed, but keep the featured ingredients central to the dish.",
    "",
    "Respond with ONLY a JSON object (no markdown, no commentary, no code fences), in exactly this shape:",
    '{"title": "Recipe name", "ingredients": ["1 cup flour", "2 eggs", ...], "steps": ["Step 1...", "Step 2...", ...]}',
    "The ingredients array should list every ingredient used (including added pantry staples) with reasonable quantities.",
  ].join("\n");
}

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1] : trimmed;
}

/**
 * Parses the model's raw text output into a validated recipe. Returns null
 * (rather than throwing) if the shape doesn't match, so the caller can
 * fall back to showing the raw text.
 */
export function parseRecipe(rawText: string): Recipe | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFences(rawText));
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) return null;

  const title = (parsed as { title?: unknown }).title;
  const ingredients = (parsed as { ingredients?: unknown }).ingredients;
  const steps = (parsed as { steps?: unknown }).steps;

  if (typeof title !== "string" || title.trim().length === 0) return null;
  if (!Array.isArray(ingredients) || ingredients.length === 0) return null;
  if (!Array.isArray(steps) || steps.length === 0) return null;

  const cleanIngredients = ingredients.filter(
    (i): i is string => typeof i === "string" && i.trim().length > 0,
  );
  const cleanSteps = steps.filter(
    (s): s is string => typeof s === "string" && s.trim().length > 0,
  );

  if (cleanIngredients.length === 0 || cleanSteps.length === 0) return null;

  return {
    title: title.trim(),
    ingredients: cleanIngredients.map((i) => i.trim()),
    steps: cleanSteps.map((s) => s.trim()),
  };
}
