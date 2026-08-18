import { extractText, parseJsonFromText, type GeminiRawResponse } from "@/lib/gemini";

export const MAX_GENRE_LENGTH = 60;
export const MAX_THEME_LENGTH = 300;

export const GENRE_PRESETS = [
  "Pop",
  "Rock",
  "Hip-Hop",
  "Folk",
  "Country",
  "R&B",
  "Electronic",
  "Acoustic",
  "Balkan Ballad",
  "Punk",
] as const;

export interface LyricsInput {
  genre: string;
  theme: string;
}

export interface LyricSection {
  section: string;
  lyrics: string;
}

export interface LyricsResult {
  title: string;
  sections: LyricSection[];
}

type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string };

/** Pure — validates/sanitizes the raw request body before it touches the AI call. */
export function validateLyricsInput(body: unknown): ValidationResult<LyricsInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, message: "Request body must be an object." };
  }
  const raw = body as Record<string, unknown>;

  if (typeof raw.genre !== "string" || raw.genre.trim().length === 0) {
    return { ok: false, message: "Pick or enter a genre." };
  }
  if (typeof raw.theme !== "string" || raw.theme.trim().length === 0) {
    return { ok: false, message: "Describe a mood or theme." };
  }

  return {
    ok: true,
    value: {
      genre: raw.genre.trim().slice(0, MAX_GENRE_LENGTH),
      theme: raw.theme.trim().slice(0, MAX_THEME_LENGTH),
    },
  };
}

/** Pure — builds the model prompt from validated input. */
export function buildLyricsPrompt(input: LyricsInput): string {
  return `You are a skilled songwriter. Write ORIGINAL song lyrics in the "${input.genre}" genre/style, built around this mood or theme: "${input.theme}".

Use a real verse/chorus song structure (e.g. Verse 1, Chorus, Verse 2, Chorus, Bridge, Chorus/Outro — adapt section count and order to what best fits the genre, but include at least one verse and a repeated chorus). Each section's lyrics should be several short lines separated by newlines, written like real song lyrics (rhyme where it fits the genre, don't force it if the genre doesn't call for rhyme, e.g. spoken-word/rap). Make it emotionally specific to the theme, not generic. Do not reference any real existing song, artist, or copyrighted lyric.

Respond with ONLY minified JSON matching exactly this shape, no other text:
{"title":"a short original song title","sections":[{"section":"Verse 1","lyrics":"line one\\nline two\\nline three"},{"section":"Chorus","lyrics":"..."}]}`;
}

function asSection(value: unknown): LyricSection | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  if (typeof v.section !== "string" || typeof v.lyrics !== "string") return null;
  if (v.section.trim().length === 0 || v.lyrics.trim().length === 0) return null;
  return { section: v.section.trim(), lyrics: v.lyrics.trim() };
}

/** Pure — validates the parsed JSON shape coming back from the model. */
export function parseLyricsPayload(payload: unknown): ValidationResult<LyricsResult> {
  if (typeof payload !== "object" || payload === null) {
    return { ok: false, message: "Unexpected response shape from the AI." };
  }
  const raw = payload as Record<string, unknown>;

  if (typeof raw.title !== "string" || !Array.isArray(raw.sections)) {
    return { ok: false, message: "Unexpected response shape from the AI." };
  }

  const sections: LyricSection[] = [];
  for (const entry of raw.sections) {
    const section = asSection(entry);
    if (section) sections.push(section);
  }

  if (sections.length === 0) {
    return { ok: false, message: "The AI response didn't contain any usable lyrics." };
  }

  return { ok: true, value: { title: raw.title.trim(), sections } };
}

/** Pure end-to-end response parser: raw Gemini response -> validated result. */
export function parseLyricsResponse(response: GeminiRawResponse): ValidationResult<LyricsResult> {
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
  return parseLyricsPayload(payload);
}
