import { extractText, parseJsonFromText, type GeminiRawResponse } from "@/lib/gemini";

export const MAX_BIO_LENGTH = 4000;
export const MAX_CONTEXT_LENGTH = 300;

export const TONE_OPTIONS = ["Professional", "Friendly", "Casual"] as const;
export type Tone = (typeof TONE_OPTIONS)[number];

export interface OutreachInput {
  bio: string;
  senderContext: string;
  tone: Tone;
}

export interface OpeningLine {
  text: string;
  angle: string;
}

export interface OutreachResult {
  openingLines: OpeningLine[];
}

type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string };

/** Pure — validates/sanitizes the raw request body before it touches the AI call. */
export function validateOutreachInput(body: unknown): ValidationResult<OutreachInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, message: "Request body must be an object." };
  }
  const raw = body as Record<string, unknown>;

  if (typeof raw.bio !== "string" || raw.bio.trim().length === 0) {
    return { ok: false, message: "Paste the person's profile bio/summary text." };
  }

  const tone: Tone = TONE_OPTIONS.includes(raw.tone as Tone) ? (raw.tone as Tone) : "Professional";

  const senderContext =
    typeof raw.senderContext === "string" ? raw.senderContext.trim().slice(0, MAX_CONTEXT_LENGTH) : "";

  return {
    ok: true,
    value: { bio: raw.bio.trim().slice(0, MAX_BIO_LENGTH), senderContext, tone },
  };
}

/** Pure — builds the model prompt from validated input. */
export function buildOutreachPrompt(input: OutreachInput): string {
  const contextLine = input.senderContext
    ? `The sender is reaching out about: "${input.senderContext}".`
    : "The sender didn't specify what they're offering — write lines that work as a general first-touch, still fully personalized to the bio.";

  return `You write the FIRST LINE of cold outreach emails. Below is a bio/profile summary the sender pasted in themselves (they did not scrape this — it's text they already had access to). Write 3 different opening lines for a cold email to this person, in a ${input.tone.toLowerCase()} tone.

Bio/profile text:
"""
${input.bio}
"""

${contextLine}

Rules:
- Each opening line must reference something SPECIFIC from the bio (a role, company, project, achievement, or stated interest) — never a generic greeting like "I hope this finds you well" or "I came across your profile".
- Keep each line to 1-2 sentences, natural, not overly flattering or salesy.
- Do not write the rest of the email, only the opening line.
- Vary the angle across the 3 lines (e.g. one about their current role, one about a specific achievement/project, one about a shared interest or industry observation) so the sender has real options.

Respond with ONLY minified JSON matching exactly this shape, no other text:
{"openingLines":[{"text":"the opening line itself","angle":"short label describing what detail this line uses, e.g. 'their recent product launch'"}]}`;
}

function asOpeningLine(value: unknown): OpeningLine | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  if (typeof v.text !== "string" || v.text.trim().length === 0) return null;
  return {
    text: v.text.trim(),
    angle: typeof v.angle === "string" && v.angle.trim().length > 0 ? v.angle.trim() : "",
  };
}

/** Pure — validates the parsed JSON shape coming back from the model. */
export function parseOutreachPayload(payload: unknown): ValidationResult<OutreachResult> {
  if (typeof payload !== "object" || payload === null) {
    return { ok: false, message: "Unexpected response shape from the AI." };
  }
  const raw = payload as Record<string, unknown>;

  if (!Array.isArray(raw.openingLines)) {
    return { ok: false, message: "Unexpected response shape from the AI." };
  }

  const openingLines: OpeningLine[] = [];
  for (const entry of raw.openingLines) {
    const line = asOpeningLine(entry);
    if (line) openingLines.push(line);
  }

  if (openingLines.length === 0) {
    return { ok: false, message: "The AI response didn't contain any usable opening lines." };
  }

  return { ok: true, value: { openingLines } };
}

/** Pure end-to-end response parser: raw Gemini response -> validated result. */
export function parseOutreachResponse(response: GeminiRawResponse): ValidationResult<OutreachResult> {
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
  return parseOutreachPayload(payload);
}
