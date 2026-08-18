import { NextResponse } from "next/server";
import { callGemini, isConfigured } from "@/lib/gemini";
import {
  buildPrompt,
  MAX_JOB_DESCRIPTION_LENGTH,
  MAX_RESUME_LENGTH,
  parseMissingKeywords,
} from "@/lib/prompt";

export async function POST(request: Request) {
  if (!isConfigured()) {
    return NextResponse.json(
      {
        error:
          "AI isn't configured yet. Ask the site owner to set GOOGLE_AI_API_KEY.",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const jobDescription =
    typeof (body as { jobDescription?: unknown })?.jobDescription === "string"
      ? (body as { jobDescription: string }).jobDescription.trim()
      : "";
  const resume =
    typeof (body as { resume?: unknown })?.resume === "string"
      ? (body as { resume: string }).resume.trim()
      : "";

  if (!jobDescription) {
    return NextResponse.json(
      { error: "Please paste the job description." },
      { status: 400 },
    );
  }
  if (!resume) {
    return NextResponse.json(
      { error: "Please paste your resume text." },
      { status: 400 },
    );
  }
  if (jobDescription.length > MAX_JOB_DESCRIPTION_LENGTH) {
    return NextResponse.json(
      {
        error: `Job description must be under ${MAX_JOB_DESCRIPTION_LENGTH} characters.`,
      },
      { status: 400 },
    );
  }
  if (resume.length > MAX_RESUME_LENGTH) {
    return NextResponse.json(
      { error: `Resume must be under ${MAX_RESUME_LENGTH} characters.` },
      { status: 400 },
    );
  }

  const prompt = buildPrompt(jobDescription, resume);
  const result = await callGemini(prompt);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  const keywords = parseMissingKeywords(result.text);
  if (!keywords) {
    return NextResponse.json({ keywords: null, raw: result.text });
  }

  return NextResponse.json({ keywords, raw: null });
}
