import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — bypasses Row Level Security entirely.
 *
 * `daily_riddle_challenge_attempts` has RLS enabled with NO policies for
 * the `anon`/`authenticated` roles at all (see schema.sql) — every read
 * and write goes through the API routes in `app/api/riddle/**`, using
 * this client. That's a deliberate design, not a shortcut: anonymous play
 * (no `user_id`) means there's no `auth.uid()` to key a normal RLS policy
 * on, and the real authorization boundary here is "you may only act on an
 * attempt id you were just handed by /api/riddle/start", which the API
 * routes enforce in code, not something RLS can express cleanly for
 * anonymous rows.
 *
 * Never import this into a Client Component; never let
 * `SUPABASE_SERVICE_ROLE_KEY` reach the browser. Returns `null` if the
 * service role key isn't configured yet, so callers can respond
 * gracefully instead of throwing during `next build`.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
