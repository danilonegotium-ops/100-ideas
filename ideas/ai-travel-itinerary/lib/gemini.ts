/**
 * Thin wrapper around Google's Generative Language API via raw REST `fetch`
 * (no SDK dependency, per the sprint's Wave 4 convention). Server-side only
 * — never import this from a Client Component, and never expose
 * GOOGLE_AI_API_KEY to the browser.
 *
 * Model name comes from `GOOGLE_AI_MODEL` (default below); the actual
 * current Gemini model list should be double-checked at
 * https://ai.google.dev/gemini-api/docs/models once a real API key exists —
 * this default is a reasonable placeholder, not a verified-live value.
 */

export const DEFAULT_MODEL = "gemini-2.0-flash";

export class GeminiNotConfiguredError extends Error {
  constructor() {
    super("GOOGLE_AI_API_KEY is not set.");
    this.name = "GeminiNotConfiguredError";
  }
}

export class GeminiRequestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "GeminiRequestError";
    this.status = status;
  }
}

interface GeminiCandidate {
  content?: { parts?: Array<{ text?: string }> };
  finishReason?: string;
}

export interface GeminiRawResponse {
  candidates?: GeminiCandidate[];
  promptFeedback?: { blockReason?: string };
}

/**
 * Calls the `generateContent` endpoint and returns the raw parsed JSON
 * response. Callers extract text themselves via `extractText()` below so
 * the parsing logic stays pure and unit-testable independent of the network
 * call (see lib/prompt.ts).
 */
export async function callGemini(
  prompt: string,
  options?: {
    temperature?: number;
    responseMimeType?: "text/plain" | "application/json";
  },
): Promise<GeminiRawResponse> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new GeminiNotConfiguredError();
  }

  const model = process.env.GOOGLE_AI_MODEL || DEFAULT_MODEL;

  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: options?.temperature ?? 0.9,
            responseMimeType: options?.responseMimeType ?? "application/json",
          },
        }),
        signal: AbortSignal.timeout(30000),
      },
    );
  } catch {
    throw new GeminiRequestError("Couldn't reach the AI service.", 502);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error(`Gemini API error ${res.status}:`, detail.slice(0, 500));
    throw new GeminiRequestError("The AI service returned an error.", 502);
  }

  return (await res.json()) as GeminiRawResponse;
}

/**
 * Pulls the plain text out of a `generateContent` response, or null if the
 * shape doesn't match what's expected (e.g. the prompt was blocked by
 * safety filters, in which case `candidates` is empty/missing).
 */
export function extractText(response: GeminiRawResponse): string | null {
  const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
  return typeof text === "string" && text.length > 0 ? text : null;
}

/**
 * `responseMimeType: "application/json"` should return clean JSON, but
 * models occasionally still wrap it in a ```json fence — strip that
 * defensively before parsing rather than trusting the mime type alone.
 */
export function parseJsonFromText(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  return JSON.parse(candidate.trim());
}
