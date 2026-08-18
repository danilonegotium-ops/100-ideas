import { extractText, parseJsonFromText, type GeminiRawResponse } from "@/lib/gemini";

export const MAX_KEYWORDS_LENGTH = 200;
export const CANDIDATE_COUNT = 10;

export const STYLE_OPTIONS = ["Any", "Short & brandable", "Descriptive"] as const;
export type Style = (typeof STYLE_OPTIONS)[number];

export type Tld = "com" | "rs";

export interface DomainBrainstormInput {
  keywords: string;
  style: Style;
}

export interface DomainCandidate {
  name: string;
  tld: Tld;
  rationale: string;
}

export interface DomainBrainstormResult {
  candidates: DomainCandidate[];
}

type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string };

/** Pure — validates/sanitizes the raw request body before it touches the AI call. */
export function validateBrainstormInput(body: unknown): ValidationResult<DomainBrainstormInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, message: "Request body must be an object." };
  }
  const raw = body as Record<string, unknown>;

  if (typeof raw.keywords !== "string" || raw.keywords.trim().length === 0) {
    return { ok: false, message: "Describe your project in a few keywords." };
  }

  const style: Style = STYLE_OPTIONS.includes(raw.style as Style) ? (raw.style as Style) : "Any";

  return {
    ok: true,
    value: { keywords: raw.keywords.trim().slice(0, MAX_KEYWORDS_LENGTH), style },
  };
}

/**
 * Pure — normalizes an AI-suggested domain label into a valid DNS label:
 * lowercase, ASCII letters/digits/hyphens only, no leading/trailing hyphen,
 * 1-63 characters (the DNS label length limit). Returns null if nothing
 * usable survives sanitization.
 */
export function sanitizeDomainLabel(raw: string): string | null {
  const cleaned = raw
    .toLowerCase()
    .trim()
    .replace(/\.(com|rs)$/i, "") // in case the model included the TLD in the name field
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (cleaned.length === 0 || cleaned.length > 63) return null;
  return cleaned;
}

/** Pure — builds the model prompt from validated input. */
export function buildDomainPrompt(input: DomainBrainstormInput): string {
  const styleHint =
    input.style === "Short & brandable"
      ? " Favor short, punchy, invented/brandable names (like startup names) over literal descriptions."
      : input.style === "Descriptive"
        ? " Favor names that clearly describe what the project does, even if longer."
        : " Mix short brandable names with a few more literal/descriptive ones.";

  return `You are a naming consultant. Based on these project keywords: "${input.keywords}", suggest ${CANDIDATE_COUNT} creative, available-sounding domain names.${styleHint}

Mix .com and .rs (Serbia) endings naturally across the list — some names suit a global .com, others suit a more local .rs feel. Each "name" should be ONLY the part before the dot (lowercase letters, digits, hyphens only, no spaces, no the TLD itself, 3-20 characters is a good target). Avoid names that are extremely likely to already be registered by a huge existing brand (e.g. do not suggest anything resembling "google" or "amazon").

Respond with ONLY minified JSON matching exactly this shape, no other text:
{"candidates":[{"name":"examplename","tld":"com","rationale":"one short sentence on why this fits"}]}

"tld" must be exactly "com" or "rs" for every entry.`;
}

function asCandidate(value: unknown): DomainCandidate | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  if (typeof v.name !== "string" || typeof v.rationale !== "string") return null;

  const name = sanitizeDomainLabel(v.name);
  if (!name) return null;

  const tldRaw = typeof v.tld === "string" ? v.tld.toLowerCase().replace(/^\./, "") : "";
  const tld: Tld | null = tldRaw === "com" || tldRaw === "rs" ? tldRaw : null;
  if (!tld) return null;

  return { name, tld, rationale: v.rationale.trim().slice(0, 300) };
}

/** Pure — validates the parsed JSON shape coming back from the model, dedupes by full domain. */
export function parseDomainPayload(payload: unknown): ValidationResult<DomainBrainstormResult> {
  if (typeof payload !== "object" || payload === null) {
    return { ok: false, message: "Unexpected response shape from the AI." };
  }
  const raw = payload as Record<string, unknown>;

  if (!Array.isArray(raw.candidates)) {
    return { ok: false, message: "Unexpected response shape from the AI." };
  }

  const seen = new Set<string>();
  const candidates: DomainCandidate[] = [];
  for (const entry of raw.candidates) {
    const candidate = asCandidate(entry);
    if (!candidate) continue;
    const key = `${candidate.name}.${candidate.tld}`;
    if (seen.has(key)) continue;
    seen.add(key);
    candidates.push(candidate);
  }

  if (candidates.length === 0) {
    return { ok: false, message: "The AI response didn't contain any usable domain names." };
  }

  return { ok: true, value: { candidates } };
}

/** Pure end-to-end response parser: raw Gemini response -> validated result. */
export function parseDomainResponse(response: GeminiRawResponse): ValidationResult<DomainBrainstormResult> {
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
  return parseDomainPayload(payload);
}
