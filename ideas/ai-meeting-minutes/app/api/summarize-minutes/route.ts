import { NextResponse } from "next/server";
import {
  generateText,
  getTextModel,
  isAiConfigured,
  parseJsonResponse,
} from "@/lib/ai/gemini";

// Route Handler — never executed during `next build`, only at real request
// time, so referencing GOOGLE_AI_API_KEY here doesn't break builds when
// it's unset.

const MAX_TRANSCRIPT_LENGTH = 20000;

interface MinutesResult {
  summary: string;
  decisions: string[];
  action_items: string[];
}

export async function POST(request: Request) {
  let body: { transcript?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const transcript =
    typeof body.transcript === "string" ? body.transcript.trim() : "";
  if (!transcript) {
    return NextResponse.json({ error: "transcript is required" }, { status: 400 });
  }
  if (transcript.length > MAX_TRANSCRIPT_LENGTH) {
    return NextResponse.json(
      { error: `Transcript is too long (max ${MAX_TRANSCRIPT_LENGTH} characters)` },
      { status: 400 },
    );
  }

  if (!isAiConfigured()) {
    return NextResponse.json({ configured: false });
  }

  const prompt = `You are an assistant that turns a raw, possibly messy speech-to-text meeting transcript into clear meeting minutes. The transcript may contain filler words or minor transcription errors — do your best to infer intent. Respond with ONLY a JSON object (no markdown fences, no extra commentary) with exactly these fields:
- "summary": 2-4 sentences summarizing what the meeting covered.
- "decisions": an array of short strings, each one a concrete decision that was made. Empty array if none were made.
- "action_items": an array of short strings, each one a concrete follow-up task. Include the responsible person's name if it's clear from the transcript who owns it (e.g. "Maria to send the proposal by Friday"). Empty array if none were identified.

Transcript:
"""
${transcript}
"""`;

  try {
    const text = await generateText({
      model: getTextModel(),
      parts: [{ text: prompt }],
      responseMimeType: "application/json",
      temperature: 0.3,
      maxOutputTokens: 800,
    });

    const parsed = parseJsonResponse<Partial<MinutesResult>>(text);
    const ok =
      typeof parsed.summary === "string" &&
      Array.isArray(parsed.decisions) &&
      Array.isArray(parsed.action_items);

    if (!ok) {
      return NextResponse.json(
        { configured: true, error: "AI response was not in the expected format" },
        { status: 502 },
      );
    }

    return NextResponse.json({
      configured: true,
      summary: parsed.summary,
      decisions: (parsed.decisions as unknown[]).filter(
        (d): d is string => typeof d === "string",
      ),
      actionItems: (parsed.action_items as unknown[]).filter(
        (a): a is string => typeof a === "string",
      ),
    });
  } catch (err) {
    console.error("summarize-minutes failed", err);
    return NextResponse.json(
      {
        configured: true,
        error: err instanceof Error ? err.message : "AI request failed",
      },
      { status: 502 },
    );
  }
}
