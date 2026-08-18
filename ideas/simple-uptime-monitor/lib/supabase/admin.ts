import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — bypasses Row Level Security entirely.
 * Only ever call this from `app/api/cron/check/route.ts` (a Route Handler,
 * never executed during `next build`, only at real request time). Never
 * call this from a Client Component or expose `SUPABASE_SERVICE_ROLE_KEY`
 * to the browser.
 *
 * The cron sweep needs this because it has no logged-in user/session (it's
 * triggered by Vercel Cron, not a browser) but must read and update every
 * user's monitors, and — via `auth.admin.getUserById` — look up each
 * monitor owner's email address to send the alert to.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "createAdminClient() requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to be set.",
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
