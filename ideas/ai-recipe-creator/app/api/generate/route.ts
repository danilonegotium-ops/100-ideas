import { NextResponse } from "next/server";
import { callGemini, isConfigured } from "@/lib/gemini";
import {
  buildPrompt,
  MAX_INGREDIENTS_INPUT_LENGTH,
  MIN_INGREDIENTS,
  parseIngredientsInput,
  parseRecipe,
} from "@/lib/prompt";

export async function POST(request: Request) {
  if (!isConfigured()) {
    return NextResponse.json(
      {
        error:
          "AI isn't configured yet. Ask the site owner to set GOOGLE_AI_API_KEY.",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const rawIngredients =
    typeof (body as { ingredients?: unknown })?.ingredients === "string"
      ? (body as { ingredients: string }).ingredients.trim()
      : "";

  if (!rawIngredients) {
    return NextResponse.json(
      { error: "Please list at least 3 ingredients." },
      { status: 400 },
    );
  }
  if (rawIngredients.length > MAX_INGREDIENTS_INPUT_LENGTH) {
    return NextResponse.json(
      {
        error: `Ingredients list must be under ${MAX_INGREDIENTS_INPUT_LENGTH} characters.`,
      },
      { status: 400 },
    );
  }

  const ingredients = parseIngredientsInput(rawIngredients);
  if (ingredients.length < MIN_INGREDIENTS) {
    return NextResponse.json(
      { error: `Please list at least ${MIN_INGREDIENTS} ingredients.` },
      { status: 400 },
    );
  }

  const prompt = buildPrompt(ingredients);
  const result = await callGemini(prompt);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  const recipe = parseRecipe(result.text);
  if (!recipe) {
    return NextResponse.json({ recipe: null, raw: result.text });
  }

  return NextResponse.json({ recipe, raw: null });
}
