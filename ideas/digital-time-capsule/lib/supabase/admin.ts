import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — bypasses Row Level Security entirely.
 * ONLY use this inside Route Handlers that must see across every user's
 * rows (here: the daily delivery cron, which has to scan every account's
 * letters, not just whoever happens to be signed in). Never import this
 * into a Client Component, and never let `SUPABASE_SERVICE_ROLE_KEY` reach
 * the browser.
 *
 * Returns `null` if the service role key isn't configured yet (e.g. a
 * local build before a real Supabase project exists), so callers can
 * respond gracefully instead of throwing during `next build`.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
