/**
 * Thin server-only wrapper around Google's Generative Language API
 * (Gemini), called via raw `fetch()` REST instead of an npm SDK. This is
 * deliberate: no live GOOGLE_AI_API_KEY exists yet in this sprint, so an
 * SDK's exact current method signature can't be verified either. A raw
 * REST call is more robust to SDK version drift and matches the pattern
 * another Wave 3 agent used for Stripe.
 *
 * IMPORTANT: only import this from a Route Handler (app/api/**\/route.ts).
 * Never import it from a Client Component — GOOGLE_AI_API_KEY must never
 * reach the browser.
 *
 * UNVERIFIED: the request/response shape below is best-effort, based on
 * Google's documented Generative Language API conventions as of this
 * agent's training data, NOT verified against a live call (no API key
 * exists yet). Re-check `extractText()`'s parsing against a real response
 * once GOOGLE_AI_API_KEY is configured, and update DEFAULT_MODEL below if
 * "gemini-2.0-flash" is no longer current.
 */

const DEFAULT_MODEL = "gemini-2.0-flash";

export function getModel(): string {
  return process.env.GOOGLE_AI_MODEL?.trim() || DEFAULT_MODEL;
}

export function isConfigured(): boolean {
  return Boolean(process.env.GOOGLE_AI_API_KEY?.trim());
}

export type GeminiResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

/**
 * Pulls the first candidate's text out of a Gemini `generateContent` JSON
 * response. Pure function (no fetch) so it can be sanity-checked against a
 * hand-built mock response shape without a live API key.
 */
export function extractText(data: unknown): string | null {
  if (typeof data !== "object" || data === null) return null;
  const candidates = (data as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return null;

  const first = candidates[0] as {
    content?: { parts?: { text?: unknown }[] };
  };
  const parts = first?.content?.parts;
  if (!Array.isArray(parts)) return null;

  const text = parts
    .map((p) => (typeof p?.text === "string" ? p.text : ""))
    .join("")
    .trim();

  return text.length > 0 ? text : null;
}

export async function callGemini(prompt: string): Promise<GeminiResult> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: "AI isn't configured yet — no GOOGLE_AI_API_KEY is set.",
    };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${getModel()}:generateContent?key=${apiKey}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    return {
      ok: false,
      error: "Couldn't reach the AI service. Please try again.",
    };
  }

  if (!res.ok) {
    return {
      ok: false,
      error: `AI service returned an error (status ${res.status}).`,
    };
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return { ok: false, error: "AI service returned an unreadable response." };
  }

  const text = extractText(data);
  if (!text) {
    return { ok: false, error: "AI service returned an empty response." };
  }

  return { ok: true, text };
}
