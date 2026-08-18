import { NextResponse } from "next/server";
import {
  extractImagePart,
  extractText,
  generateContentParts,
  generateText,
  getTextModel,
  isAiConfigured,
  parseJsonResponse,
} from "@/lib/ai/gemini";
import { STYLES } from "@/lib/interior/styles";

// Route Handler — never executed during `next build`, only at real request
// time, so referencing GOOGLE_AI_API_KEY here doesn't break builds when
// it's unset.

const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
// Base64 is ~4/3 the size of the raw bytes; cap the raw size at 5MB.
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// *** HIGHEST-RISK CONSTANT IN THE WHOLE SPRINT — see SPEC.md ***
// Best guess at a real, currently-existing Gemini model id that supports
// native image output ("responseModalities: ['TEXT','IMAGE']"), based on
// Google's "Gemini 2.0 Flash" image-generation preview line. NOT verified
// against a live API call — no key exists in this sprint. Override via
// GOOGLE_AI_IMAGE_MODEL once a key exists and the real model id is known.
const DEFAULT_IMAGE_MODEL = "gemini-2.0-flash-preview-image-generation";

function getImageModel(): string {
  return process.env.GOOGLE_AI_IMAGE_MODEL?.trim() || DEFAULT_IMAGE_MODEL;
}

interface TextSuggestions {
  summary: string;
  color_palette: string;
  key_pieces: string[];
  layout_notes: string;
}

export async function POST(request: Request) {
  let body: { imageBase64?: unknown; mimeType?: unknown; style?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const imageBase64 =
    typeof body.imageBase64 === "string" ? body.imageBase64 : "";
  const mimeType = typeof body.mimeType === "string" ? body.mimeType : "";
  const style = typeof body.style === "string" ? body.style : "";

  if (!imageBase64 || !mimeType) {
    return NextResponse.json(
      { error: "imageBase64 and mimeType are required" },
      { status: 400 },
    );
  }
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return NextResponse.json(
      { error: "Unsupported image type. Use PNG, JPEG, or WEBP." },
      { status: 400 },
    );
  }
  if (!(STYLES as readonly string[]).includes(style)) {
    return NextResponse.json({ error: "Unknown style." }, { status: 400 });
  }
  const approxBytes = Math.ceil((imageBase64.length * 3) / 4);
  if (approxBytes > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "Image is too large (max 5MB)." },
      { status: 400 },
    );
  }

  if (!isAiConfigured()) {
    return NextResponse.json({ configured: false });
  }

  const imagePrompt = `Edit this photo of an empty (or mostly empty) room. Add furniture, decor, lighting, and a rug arranged in a realistic, professionally staged "${style}" interior design style. Keep the room's existing walls, windows, doors, floor, and camera perspective exactly as they are — only add furnishings, do not change the architecture. Return the edited photo.`;

  // --- Attempt 1: real image generation/editing -----------------------
  // Genuinely uncertain whether the configured model supports image output
  // at all on the free tier — see SPEC.md, this is the single highest-risk
  // code path in the whole sprint. Any failure here (network error,
  // non-2xx, model doesn't support this request shape, no image in the
  // response) falls through to the text-suggestions fallback below instead
  // of erroring out to the user.
  try {
    const parts = await generateContentParts({
      model: getImageModel(),
      parts: [
        { text: imagePrompt },
        { inlineData: { mimeType, data: imageBase64 } },
      ],
      responseModalities: ["TEXT", "IMAGE"],
      temperature: 0.6,
    });

    const image = extractImagePart(parts);
    if (image) {
      return NextResponse.json({
        configured: true,
        mode: "image",
        imageBase64: image.data,
        mimeType: image.mimeType,
        note: extractText(parts) || null,
      });
    }
    // Call succeeded but returned no image part — the model answered with
    // text only (or something unparseable as an image), meaning image
    // output isn't actually happening even though the request didn't
    // error. Fall through to the explicit text fallback below.
  } catch (err) {
    console.error("decorate-room image generation attempt failed", err);
    // Fall through to the text fallback.
  }

  // --- Attempt 2: graceful degraded mode -------------------------------
  // Real, useful text-based furniture placement suggestions, using the
  // same known-working vision-input pattern as ai-logo-critic (image +
  // text prompt, text-only structured output) — much higher confidence
  // this actually works than the image-generation attempt above.
  try {
    const suggestionPrompt = `You are an interior designer. Look at the attached photo of an empty (or mostly empty) room and suggest how to furnish it in a "${style}" style. Respond with ONLY a JSON object (no markdown fences, no extra commentary) with exactly these fields:
- "summary": one sentence overview of the concept.
- "color_palette": a short description of the wall/textile/accent color palette for this style.
- "key_pieces": an array of 4-6 short strings, each naming a specific furniture/decor piece to add (e.g. "A low walnut media console under the window").
- "layout_notes": 2-3 sentences on where to place the main pieces relative to the room's existing features (windows, doors, focal wall) visible in the photo.`;

    const text = await generateText({
      model: getTextModel(),
      parts: [
        { text: suggestionPrompt },
        { inlineData: { mimeType, data: imageBase64 } },
      ],
      responseMimeType: "application/json",
      temperature: 0.5,
      maxOutputTokens: 600,
    });

    const parsed = parseJsonResponse<Partial<TextSuggestions>>(text);
    const ok =
      typeof parsed.summary === "string" &&
      typeof parsed.color_palette === "string" &&
      typeof parsed.layout_notes === "string" &&
      Array.isArray(parsed.key_pieces);

    if (!ok) {
      return NextResponse.json(
        {
          configured: true,
          error: "AI response was not in the expected format",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      configured: true,
      mode: "text",
      fallbackReason:
        "Live image generation wasn't available for this request, so here are AI-generated furniture placement suggestions instead.",
      summary: parsed.summary,
      colorPalette: parsed.color_palette,
      keyPieces: (parsed.key_pieces as unknown[]).filter(
        (p): p is string => typeof p === "string",
      ),
      layoutNotes: parsed.layout_notes,
    });
  } catch (err) {
    console.error("decorate-room text fallback failed", err);
    return NextResponse.json(
      {
        configured: true,
        error: err instanceof Error ? err.message : "AI request failed",
      },
      { status: 502 },
    );
  }
}
