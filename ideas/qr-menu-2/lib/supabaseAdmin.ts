import { createClient } from "@supabase/supabase-js";

/**
 * Privileged Supabase client for server-only code (Route Handlers) that
 * must write/read across restaurants regardless of RLS — e.g. recording an
 * order placed by an anonymous customer, or confirming a Stripe payment.
 * `orders`/`order_items` intentionally have no public RLS write policy (see
 * schema.sql); every write to them goes through this client instead.
 *
 * Never import this from a Client Component or anything that runs in the
 * browser — `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security
 * entirely. Only call `getAdminClient()` inside Route Handlers (files under
 * `app/api/`), which never execute during `next build` (only at request
 * time), so this stays safe with empty/placeholder env vars at build time.
 */
export function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
