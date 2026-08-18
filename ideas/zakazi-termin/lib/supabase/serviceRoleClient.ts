import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — bypasses Row Level Security entirely.
 * NEVER import this from a Client Component, and never let
 * `SUPABASE_SERVICE_ROLE_KEY` reach the browser. Only call this inside a
 * Server Action or Route Handler, and only for the narrow case this idea
 * actually needs it: atomically flipping a slot from 'open' to 'booked'
 * while creating the booking row, for an anonymous customer who has no
 * Supabase session at all. See the big comment in schema.sql on
 * `zakazi_termin_slots`/`zakazi_termin_bookings` for the full reasoning.
 *
 * Throws if the env vars aren't configured — safe because this is only
 * ever called from inside a function body that runs at request time
 * (Server Action / Route Handler), never at module scope or during
 * `next build`.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "createServiceRoleClient() called without NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY configured.",
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
