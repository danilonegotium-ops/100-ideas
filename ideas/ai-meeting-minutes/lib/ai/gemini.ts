/**
 * Minimal wrapper around Google's Generative Language API (Gemini), called
 * via raw REST `fetch` — no SDK dependency, per the shared template's
 * README ("Adding an AI API route"). Server-side only — never import this
 * from a Client Component, and never let `GOOGLE_AI_API_KEY` reach the
 * browser.
 *
 * Request/response shape reflects the public `v1beta` REST API as of this
 * template's authoring. NOT live-verified — no GOOGLE_AI_API_KEY exists yet
 * in this sprint (see MASTER_TRACKER.md notes for this idea). Re-check
 * against a real key once one exists, especially the default model name.
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
  temperature?: number;
  maxOutputTokens?: number;
}

export class GeminiError extends Error {}

/** Calls `generateContent` and returns the raw response parts. */
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
      signal: AbortSignal.timeout(45000),
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

/** Strips ```json fences a model sometimes wraps structured output in, then JSON.parses. */
export function parseJsonResponse<T>(text: string): T {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "");
  return JSON.parse(cleaned) as T;
}
