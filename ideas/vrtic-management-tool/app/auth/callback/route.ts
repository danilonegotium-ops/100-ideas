import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Destination for Supabase's magic-link confirmation email
 * (`emailRedirectTo` in `app/login/page.tsx` points here). Supabase's
 * hosted verify endpoint redirects back to this route with a `?code=`
 * query param; exchanging it for a session is what actually logs the user
 * in and sets the auth cookies via `lib/supabase/server.ts`.
 *
 * Route Handlers are never executed during `next build` — only at real
 * request time — so this is safe even with no Supabase env vars configured
 * yet.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next");
  // `next` comes from an unauthenticated query param, so it must be
  // constrained to a same-origin relative path before being concatenated
  // onto `origin` below. Without this check, `next=@evil.com` produces
  // `${origin}@evil.com` (e.g. `https://myapp.com@evil.com`), which
  // browsers resolve to host `evil.com` (userinfo@host syntax) — an open
  // redirect. `next=//evil.com` or `next=/\evil.com` are protocol-relative
  // variants of the same attack, hence rejecting a second leading slash or
  // backslash too.
  const next = rawNext && /^\/(?!\/|\\)/.test(rawNext) ? rawNext : "/";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
