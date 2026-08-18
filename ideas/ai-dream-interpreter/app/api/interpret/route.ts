import { NextResponse } from "next/server";
import { callGemini, isConfigured } from "@/lib/gemini";
import { buildPrompt, MAX_DREAM_LENGTH, parseInterpretation } from "@/lib/prompt";

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

  const dream =
    typeof (body as { dream?: unknown })?.dream === "string"
      ? (body as { dream: string }).dream.trim()
      : "";

  if (!dream) {
    return NextResponse.json(
      { error: "Please describe your dream." },
      { status: 400 },
    );
  }
  if (dream.length > MAX_DREAM_LENGTH) {
    return NextResponse.json(
      { error: `Dream description must be under ${MAX_DREAM_LENGTH} characters.` },
      { status: 400 },
    );
  }

  const prompt = buildPrompt(dream);
  const result = await callGemini(prompt);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  const interpretation = parseInterpretation(result.text);
  if (!interpretation) {
    return NextResponse.json({ interpretation: null, raw: result.text });
  }

  return NextResponse.json({ interpretation, raw: null });
}
