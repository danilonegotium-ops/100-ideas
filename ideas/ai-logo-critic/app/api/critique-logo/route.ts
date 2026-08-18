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

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

// Base64 is ~4/3 the size of the raw bytes; cap the raw size at 4MB.
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

interface CritiqueResult {
  color_balance: string;
  readability: string;
  modern_trends: string;
  overall_score: number;
  summary: string;
}

export async function POST(request: Request) {
  let body: { imageBase64?: unknown; mimeType?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const imageBase64 =
    typeof body.imageBase64 === "string" ? body.imageBase64 : "";
  const mimeType = typeof body.mimeType === "string" ? body.mimeType : "";

  if (!imageBase64 || !mimeType) {
    return NextResponse.json(
      { error: "imageBase64 and mimeType are required" },
      { status: 400 },
    );
  }
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return NextResponse.json(
      { error: "Unsupported image type. Use PNG, JPEG, WEBP, or GIF." },
      { status: 400 },
    );
  }
  const approxBytes = Math.ceil((imageBase64.length * 3) / 4);
  if (approxBytes > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "Image is too large (max 4MB)." },
      { status: 400 },
    );
  }

  if (!isAiConfigured()) {
    return NextResponse.json({ configured: false });
  }

  const prompt = `You are a professional logo/brand designer giving direct, constructive feedback. Look at the attached logo image and respond with ONLY a JSON object (no markdown fences, no extra commentary) with exactly these fields:
- "color_balance": 1-2 sentences on the color choices, contrast, and balance.
- "readability": 1-2 sentences on legibility at small sizes and typography (if any text is present).
- "modern_trends": 1-2 sentences on how it compares to current logo/brand design trends (flat design, minimalism, adaptability, etc).
- "overall_score": an integer from 1 to 10.
- "summary": one short sentence with the single most important thing to improve.`;

  try {
    const text = await generateText({
      model: getTextModel(),
      parts: [
        { text: prompt },
        { inlineData: { mimeType, data: imageBase64 } },
      ],
      responseMimeType: "application/json",
      temperature: 0.4,
      maxOutputTokens: 500,
    });

    const parsed = parseJsonResponse<Partial<CritiqueResult>>(text);
    const ok =
      typeof parsed.color_balance === "string" &&
      typeof parsed.readability === "string" &&
      typeof parsed.modern_trends === "string" &&
      typeof parsed.summary === "string" &&
      typeof parsed.overall_score === "number";

    if (!ok) {
      return NextResponse.json(
        { configured: true, error: "AI response was not in the expected format" },
        { status: 502 },
      );
    }

    return NextResponse.json({
      configured: true,
      colorBalance: parsed.color_balance,
      readability: parsed.readability,
      modernTrends: parsed.modern_trends,
      overallScore: Math.max(1, Math.min(10, Math.round(parsed.overall_score as number))),
      summary: parsed.summary,
    });
  } catch (err) {
    console.error("critique-logo failed", err);
    return NextResponse.json(
      {
        configured: true,
        error: err instanceof Error ? err.message : "AI request failed",
      },
      { status: 502 },
    );
  }
}
