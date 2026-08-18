import { NextResponse } from "next/server";
import {
  callGemini,
  GeminiNotConfiguredError,
  GeminiRequestError,
} from "@/lib/gemini";
import {
  buildDomainPrompt,
  parseDomainResponse,
  validateBrainstormInput,
  type DomainCandidate,
} from "@/lib/domains";
import { checkDomainAvailability, type Availability } from "@/lib/dns-check";

// Route Handlers are never executed during `next build` (only at real
// request time), so this file is safe even without GOOGLE_AI_API_KEY set.
export const runtime = "nodejs";

interface CheckedCandidate extends DomainCandidate {
  domain: string;
  availability: Availability;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "bad_request", message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const validated = validateBrainstormInput(body);
  if (!validated.ok) {
    return NextResponse.json(
      { error: "bad_request", message: validated.message },
      { status: 400 },
    );
  }

  const prompt = buildDomainPrompt(validated.value);

  let raw;
  try {
    raw = await callGemini(prompt, { temperature: 1.0 });
  } catch (err) {
    if (err instanceof GeminiNotConfiguredError) {
      return NextResponse.json(
        {
          error: "not_configured",
          message:
            "AI isn't configured yet — this tool needs a GOOGLE_AI_API_KEY set on the server.",
        },
        { status: 503 },
      );
    }
    if (err instanceof GeminiRequestError) {
      return NextResponse.json(
        { error: "upstream_error", message: err.message },
        { status: err.status },
      );
    }
    return NextResponse.json(
      { error: "unknown_error", message: "Something went wrong." },
      { status: 500 },
    );
  }

  const parsed = parseDomainResponse(raw);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: "parse_error", message: parsed.message },
      { status: 502 },
    );
  }

  // Real DNS lookups, run in parallel — this is the deterministic part with
  // no AI involved. See lib/dns-check.ts for why NS-record delegation is
  // used as the availability signal, and its documented limits.
  const checked: CheckedCandidate[] = await Promise.all(
    parsed.value.candidates.map(async (candidate) => {
      const domain = `${candidate.name}.${candidate.tld}`;
      const availability = await checkDomainAvailability(domain);
      return { ...candidate, domain, availability };
    }),
  );

  return NextResponse.json({ result: { candidates: checked } });
}
