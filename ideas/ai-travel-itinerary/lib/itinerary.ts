import { extractText, parseJsonFromText, type GeminiRawResponse } from "@/lib/gemini";

export const MAX_CITY_LENGTH = 100;
export const MIN_DAYS = 1;
export const MAX_DAYS = 14;

export interface ItineraryInput {
  city: string;
  days: number;
}

export interface ItineraryActivity {
  title: string;
  description: string;
}

export interface ItineraryDay {
  day: number;
  theme: string | null;
  morning: ItineraryActivity;
  afternoon: ItineraryActivity;
  evening: ItineraryActivity;
  hiddenGem: ItineraryActivity;
}

export interface ItineraryResult {
  city: string;
  days: number;
  summary: string;
  itinerary: ItineraryDay[];
}

type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string };

/** Pure — validates/sanitizes the raw request body before it touches the AI call. */
export function validateItineraryInput(body: unknown): ValidationResult<ItineraryInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, message: "Request body must be an object." };
  }
  const raw = body as Record<string, unknown>;

  if (typeof raw.city !== "string" || raw.city.trim().length === 0) {
    return { ok: false, message: "Enter a city." };
  }
  const city = raw.city.trim().slice(0, MAX_CITY_LENGTH);

  const daysNumber = Number(raw.days);
  if (!Number.isFinite(daysNumber)) {
    return { ok: false, message: "Enter a number of days." };
  }
  const days = Math.min(MAX_DAYS, Math.max(MIN_DAYS, Math.round(daysNumber)));

  return { ok: true, value: { city, days } };
}

/** Pure — builds the model prompt from validated input. */
export function buildItineraryPrompt(input: ItineraryInput): string {
  return `You are a knowledgeable local travel guide. Build a ${input.days}-day travel itinerary for ${input.city}.

For each day, suggest a morning, afternoon, and evening activity, PLUS one separate "hidden gem" — a lesser-known spot a typical tourist blog wouldn't list (not a famous landmark, not the most obvious highly-rated restaurant/attraction; think a neighborhood the traveler wouldn't otherwise wander into, a small local business, a viewpoint locals use, etc). Vary the hidden gems across days — don't repeat the same category (e.g. don't make every hidden gem a cafe).

Keep every description to 1-2 concise sentences, plain language, no markdown formatting, no emojis.

Respond with ONLY minified JSON matching exactly this shape, no other text:
{"summary":"one short paragraph introducing the trip","itinerary":[{"day":1,"theme":"short theme name for the day or null","morning":{"title":"...","description":"..."},"afternoon":{"title":"...","description":"..."},"evening":{"title":"...","description":"..."},"hiddenGem":{"title":"...","description":"..."}}]}

The "itinerary" array must have exactly ${input.days} entries, "day" numbered 1 through ${input.days}.`;
}

function asActivity(value: unknown): ItineraryActivity | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  if (typeof v.title !== "string" || typeof v.description !== "string") return null;
  if (v.title.trim().length === 0 || v.description.trim().length === 0) return null;
  return { title: v.title.trim(), description: v.description.trim() };
}

/** Pure — validates the parsed JSON shape coming back from the model. */
export function parseItineraryPayload(payload: unknown): ValidationResult<ItineraryResult> {
  if (typeof payload !== "object" || payload === null) {
    return { ok: false, message: "Unexpected response shape from the AI." };
  }
  const raw = payload as Record<string, unknown>;

  if (typeof raw.summary !== "string" || !Array.isArray(raw.itinerary)) {
    return { ok: false, message: "Unexpected response shape from the AI." };
  }

  const days: ItineraryDay[] = [];
  for (const entry of raw.itinerary) {
    if (typeof entry !== "object" || entry === null) continue;
    const e = entry as Record<string, unknown>;
    const morning = asActivity(e.morning);
    const afternoon = asActivity(e.afternoon);
    const evening = asActivity(e.evening);
    const hiddenGem = asActivity(e.hiddenGem);
    const dayNumber = Number(e.day);
    if (!morning || !afternoon || !evening || !hiddenGem || !Number.isFinite(dayNumber)) continue;
    days.push({
      day: dayNumber,
      theme: typeof e.theme === "string" && e.theme.trim().length > 0 ? e.theme.trim() : null,
      morning,
      afternoon,
      evening,
      hiddenGem,
    });
  }

  if (days.length === 0) {
    return { ok: false, message: "The AI response didn't contain any usable itinerary days." };
  }

  days.sort((a, b) => a.day - b.day);

  return {
    ok: true,
    value: { city: "", days: days.length, summary: raw.summary.trim(), itinerary: days },
  };
}

/**
 * Pure end-to-end response parser: raw Gemini response -> validated result.
 * Split from `parseItineraryPayload` so tests can feed either a realistic
 * mocked Gemini response (this function) or a bare parsed-JSON payload
 * (the function above) without needing a network call either way.
 */
export function parseItineraryResponse(
  response: GeminiRawResponse,
): ValidationResult<ItineraryResult> {
  const text = extractText(response);
  if (!text) {
    return { ok: false, message: "The AI didn't return a usable response." };
  }
  let payload: unknown;
  try {
    payload = parseJsonFromText(text);
  } catch {
    return { ok: false, message: "Couldn't parse the AI's response as JSON." };
  }
  return parseItineraryPayload(payload);
}
