import { NextResponse } from "next/server";
import { callGemini, isConfigured } from "@/lib/gemini";
import { buildPrompt, MAX_EMAIL_LENGTH, parseRewrite } from "@/lib/prompt";

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

  const draft =
    typeof (body as { draft?: unknown })?.draft === "string"
      ? (body as { draft: string }).draft.trim()
      : "";

  if (!draft) {
    return NextResponse.json(
      { error: "Please paste your email draft." },
      { status: 400 },
    );
  }
  if (draft.length > MAX_EMAIL_LENGTH) {
    return NextResponse.json(
      { error: `Email draft must be under ${MAX_EMAIL_LENGTH} characters.` },
      { status: 400 },
    );
  }

  const prompt = buildPrompt(draft);
  const result = await callGemini(prompt);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  const rewrite = parseRewrite(result.text);
  if (!rewrite) {
    return NextResponse.json({ rewrite: null, raw: result.text });
  }

  return NextResponse.json({ rewrite, raw: null });
}
