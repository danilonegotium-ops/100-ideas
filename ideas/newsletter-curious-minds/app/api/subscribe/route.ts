import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Deliberately simple RFC-5322-ish check — good enough to catch obvious
// typos ("foo@", "foo@bar") without the false-negative risk of a stricter
// regex rejecting valid real-world addresses.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Route Handler — never executed during `next build`, only at real request
 * time, so this is safe even with no Supabase env vars configured yet (see
 * the build-safety note in lib/supabase/server.ts).
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email =
    typeof (body as { email?: unknown })?.email === "string"
      ? (body as { email: string }).email.trim().toLowerCase()
      : "";

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("newsletter_curious_minds_subscribers")
    .insert({ email });

  if (error) {
    // Postgres unique_violation — they're already on the list, which is a
    // success from the user's point of view, not an error.
    if (error.code === "23505") {
      return NextResponse.json({ status: "already_subscribed" });
    }
    return NextResponse.json({ error: "Couldn't sign you up right now." }, { status: 500 });
  }

  return NextResponse.json({ status: "subscribed" });
}
