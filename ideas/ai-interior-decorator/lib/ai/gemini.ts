/**
 * Minimal wrapper around Google's Generative Language API (Gemini), called
 * via raw REST `fetch` — no SDK dependency, per the shared template's
 * README ("Adding an AI API route"). Server-side only — never import this
 * from a Client Component, and never let `GOOGLE_AI_API_KEY` reach the
 * browser.
 *
 * Extended (vs. the plain text/vision-critique version used in
 * mood-journal-ai / ai-logo-critic) with `responseModalities` support and
 * an `extractImagePart` helper, for the image-generation attempt in
 * app/api/decorate-room/route.ts. See this idea's SPEC.md — the image
 * generation request shape here is the single highest-risk piece of code
 * in this whole sprint, genuinely unverified against a live key.
 */

const DEFAULT_TEXT_MODEL = "gemini-2.0-flash";

export function isAiConfigured(): boolean {
  return Boolean(process.env.GOOGLE_AI_API_KEY);
}

export function getTextModel(): string {
  return process.env.GOOGLE_AI_MODEL?.trim() || DEFAULT_TEXT_MODEL;
}

export interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

export interface GenerateOptions {
  model: string;
  parts: GeminiPart[];
  responseMimeType?: "application/json" | "text/plain";
  responseModalities?: Array<"TEXT" | "IMAGE">;
  temperature?: number;
  maxOutputTokens?: number;
}

export class GeminiError extends Error {}

/** Calls `generateContent` and returns the raw response parts (text and/or inlineData). */
export async function generateContentParts(
  options: GenerateOptions,
): Promise<GeminiPart[]> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new GeminiError("AI is not configured (no GOOGLE_AI_API_KEY)");
  }

  const generationConfig: Record<string, unknown> = {};
  if (options.responseMimeType) {
    generationConfig.responseMimeType = options.responseMimeType;
  }
  if (options.responseModalities) {
    generationConfig.responseModalities = options.responseModalities;
  }
  if (typeof options.temperature === "number") {
    generationConfig.temperature = options.temperature;
  }
  if (typeof options.maxOutputTokens === "number") {
    generationConfig.maxOutputTokens = options.maxOutputTokens;
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${options.model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: options.parts }],
        ...(Object.keys(generationConfig).length ? { generationConfig } : {}),
      }),
      signal: AbortSignal.timeout(60000),
    },
  );

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new GeminiError(
      `Gemini API responded ${res.status}: ${errBody.slice(0, 500)}`,
    );
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts) || parts.length === 0) {
    const blockReason = data?.promptFeedback?.blockReason;
    throw new GeminiError(
      blockReason
        ? `Gemini blocked the request (${blockReason})`
        : "Gemini API returned no candidates",
    );
  }
  return parts as GeminiPart[];
}

/** Convenience wrapper for text-only responses (joins all text parts). */
export async function generateText(options: GenerateOptions): Promise<string> {
  const parts = await generateContentParts(options);
  const text = parts
    .map((p) => p.text)
    .filter(Boolean)
    .join("\n")
    .trim();
  if (!text) throw new GeminiError("Gemini API returned an empty response");
  return text;
}

/** Finds the first inline image part in a response, if any (null if the model returned text only). */
export function extractImagePart(
  parts: GeminiPart[],
): { mimeType: string; data: string } | null {
  for (const part of parts) {
    if (part.inlineData?.data) {
      return {
        mimeType: part.inlineData.mimeType || "image/png",
        data: part.inlineData.data,
      };
    }
  }
  return null;
}

/** Joins any text parts present alongside (or instead of) an image part. */
export function extractText(parts: GeminiPart[]): string {
  return parts
    .map((p) => p.text)
    .filter(Boolean)
    .join("\n")
    .trim();
}

/** Strips ```json fences a model sometimes wraps structured output in, then JSON.parses. */
export function parseJsonResponse<T>(text: string): T {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "");
  return JSON.parse(cleaned) as T;
}
