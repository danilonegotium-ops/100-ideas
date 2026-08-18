/**
 * Pure prompt-construction and response-parsing functions for the resume
 * optimizer, kept separate from `lib/gemini.ts` (the actual fetch call) so
 * they can be sanity-checked with hand-built mock responses — no live API
 * key needed to test this logic.
 */

export const MAX_JOB_DESCRIPTION_LENGTH = 6000;
export const MAX_RESUME_LENGTH = 6000;

export interface MissingKeyword {
  keyword: string;
  suggestion: string;
}

export function buildPrompt(jobDescription: string, resume: string): string {
  return [
    "You are a career coach helping a job applicant tailor their resume.",
    "",
    "JOB DESCRIPTION:",
    jobDescription,
    "",
    "RESUME:",
    resume,
    "",
    "Identify important keywords, skills, and phrases from the job description",
    "that are missing (or only weakly present) in the resume. For each one,",
    "give a short, specific suggestion for where/how to naturally add it to",
    "the resume (don't suggest fabricating experience the person doesn't have —",
    "phrase suggestions as 'if you have this experience, mention it in...').",
    "Limit to the 10 most important missing keywords.",
    "",
    "Respond with ONLY a JSON array (no markdown, no commentary, no code fences), in exactly this shape:",
    '[{"keyword": "keyword or phrase", "suggestion": "short suggestion"}, ...]',
  ].join("\n");
}

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1] : trimmed;
}

/**
 * Parses the model's raw text output into a validated list of missing
 * keywords. Returns null (rather than throwing) if the shape doesn't
 * match, so the caller can fall back to showing the raw text.
 */
export function parseMissingKeywords(rawText: string): MissingKeyword[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFences(rawText));
  } catch {
    return null;
  }

  if (!Array.isArray(parsed)) return null;

  const keywords: MissingKeyword[] = [];
  for (const item of parsed) {
    if (
      typeof item === "object" &&
      item !== null &&
      typeof (item as { keyword?: unknown }).keyword === "string" &&
      typeof (item as { suggestion?: unknown }).suggestion === "string"
    ) {
      keywords.push({
        keyword: (item as { keyword: string }).keyword.trim(),
        suggestion: (item as { suggestion: string }).suggestion.trim(),
      });
    }
  }

  return keywords.length > 0 ? keywords.slice(0, 10) : null;
}
