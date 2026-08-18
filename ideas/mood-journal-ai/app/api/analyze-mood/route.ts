import { NextResponse } from "next/server";
import {
  generateText,
  getTextModel,
  isAiConfigured,
  parseJsonResponse,
} from "@/lib/ai/gemini";

// Route Handlers are never executed during `next build` (only at real
// request time), so it's safe for this file to reference GOOGLE_AI_API_KEY
// at module scope indirectly via isAiConfigured() without breaking builds
// when the key is unset.

const MAX_CONTENT_LENGTH = 4000;

interface MoodResult {
  mood_label: string;
  mood_score: number;
}

export async function POST(request: Request) {
  let body: { content?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json(
      { error: `Entry is too long (max ${MAX_CONTENT_LENGTH} characters)` },
      { status: 400 },
    );
  }

  if (!isAiConfigured()) {
    // Graceful "not configured" state — the journal entry itself can still
    // be saved by the client without a mood tag.
    return NextResponse.json({ configured: false });
  }

  const prompt = `You are a mood-tagging assistant for a private journaling app. Read the journal entry below and respond with ONLY a JSON object (no markdown fences, no extra commentary) with exactly these two fields:
- "mood_label": one lowercase word for the dominant mood (examples: "happy", "content", "calm", "neutral", "tired", "stressed", "anxious", "sad", "frustrated", "energized").
- "mood_score": an integer from -2 to 2, where -2 is very negative, 0 is neutral, 2 is very positive.

Journal entry:
"""
${content}
"""`;

  try {
    const text = await generateText({
      model: getTextModel(),
      parts: [{ text: prompt }],
      responseMimeType: "application/json",
      temperature: 0.2,
      maxOutputTokens: 100,
    });

    const parsed = parseJsonResponse<Partial<MoodResult>>(text);
    const moodLabel =
      typeof parsed.mood_label === "string"
        ? parsed.mood_label.toLowerCase().trim().slice(0, 40)
        : null;
    const rawScore =
      typeof parsed.mood_score === "number" ? parsed.mood_score : null;
    const moodScore =
      rawScore === null ? null : Math.max(-2, Math.min(2, Math.round(rawScore)));

    if (!moodLabel || moodScore === null) {
      return NextResponse.json(
        { configured: true, error: "AI response was not in the expected format" },
        { status: 502 },
      );
    }

    return NextResponse.json({
      configured: true,
      mood_label: moodLabel,
      mood_score: moodScore,
    });
  } catch (err) {
    console.error("analyze-mood failed", err);
    return NextResponse.json(
      {
        configured: true,
        error: err instanceof Error ? err.message : "AI request failed",
      },
      { status: 502 },
    );
  }
}
