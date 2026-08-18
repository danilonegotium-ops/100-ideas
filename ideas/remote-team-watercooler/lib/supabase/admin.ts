import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — BYPASSES Row Level Security entirely.
 *
 * Only ever import this inside a Route Handler (`app/api/**\/route.ts`) or
 * a Server Component, and only for the narrow case this app needs it for:
 * the member's token-based pairing view (`/m/[token]`), which has no
 * Supabase auth session at all (the member never logs in — they just hold
 * a share link). Since there's no `auth.uid()` for RLS to key off of, the
 * route/page that uses this client MUST do its own authorization check in
 * application code — i.e. only ever look up rows by matching the random
 * `share_token` the visitor supplied, and only return/update the minimum
 * data tied to that one member. Never use this client to serve a
 * general-purpose "list everything" query.
 *
 * Never import this from a Client Component ("use client") file or
 * anything that ends up in browser JS — `SUPABASE_SERVICE_ROLE_KEY` must
 * stay server-only. Route Handlers/Server Components are never bundled
 * into client JS, so this is safe there.
 *
 * Like the other `createClient()` helpers in this template, this throws if
 * env vars are missing, so only ever call it inside a function body (never
 * at module scope) — Route Handlers already satisfy that automatically
 * since they're never executed during `next build`.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
