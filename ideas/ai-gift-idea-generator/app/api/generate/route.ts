import { NextResponse } from "next/server";
import { callGemini, isConfigured } from "@/lib/gemini";
import {
  buildPrompt,
  MAX_BUDGET_LENGTH,
  MAX_INTERESTS_LENGTH,
  parseGiftIdeas,
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

  const interests =
    typeof (body as { interests?: unknown })?.interests === "string"
      ? ((body as { interests: string }).interests.trim())
      : "";
  const budget =
    typeof (body as { budget?: unknown })?.budget === "string"
      ? ((body as { budget: string }).budget.trim())
      : "";

  if (!interests) {
    return NextResponse.json(
      { error: "Please describe your friend's interests." },
      { status: 400 },
    );
  }
  if (!budget) {
    return NextResponse.json(
      { error: "Please enter a budget." },
      { status: 400 },
    );
  }
  if (interests.length > MAX_INTERESTS_LENGTH) {
    return NextResponse.json(
      { error: `Interests must be under ${MAX_INTERESTS_LENGTH} characters.` },
      { status: 400 },
    );
  }
  if (budget.length > MAX_BUDGET_LENGTH) {
    return NextResponse.json(
      { error: `Budget must be under ${MAX_BUDGET_LENGTH} characters.` },
      { status: 400 },
    );
  }

  const prompt = buildPrompt(interests, budget);
  const result = await callGemini(prompt);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  const ideas = parseGiftIdeas(result.text);
  if (!ideas) {
    // Model responded but not in the expected JSON shape — still show the
    // raw text rather than failing outright.
    return NextResponse.json({ ideas: null, raw: result.text });
  }

  return NextResponse.json({ ideas, raw: null });
}
