# Shared Wishlist — SPEC

**MVP:** A logged-in user creates a wishlist (e.g. "My Birthday 2026") and adds items (name, optional link, optional price, optional notes) from `/wishlist/[id]` (owner-only, redirects to `/login` if not authenticated, 404-equivalent message if you're not the owner). They share the wishlist's public link, `/w/[id]` (the wishlist's own UUID is the unguessable share token — no separate slug column), with friends. Friends view and claim items **without needing an account** — claiming only requires typing a name (and an optional note) — and once claimed, an item shows as taken to every other visitor so nobody buys a duplicate. The owner sees which items are claimed, but **never who claimed them.**

## Claim-privacy logic — please double-check once live (per the task's explicit ask)

This is the one subtle requirement in this batch, so here's the exact mechanism, in full:

1. **RLS is the hard backstop.** `shared_wishlist_claims_select_not_owner` (in `schema.sql`) allows `select` on a claim row for everyone **except** the owner of the wishlist that claim's item belongs to:
   ```sql
   using (
     not exists (
       select 1 from shared_wishlist_items i
       join shared_wishlist_wishlists w on w.id = i.wishlist_id
       where i.id = shared_wishlist_claims.item_id
         and w.owner_id = auth.uid()
     )
   )
   ```
   For an anonymous visitor, `auth.uid()` is `null`, and `owner_id = null` is never true in SQL, so the `exists(...)` is always false and `not exists(...)` is always true — anonymous friends can always read claims. For a logged-in non-owner, `owner_id <> auth.uid()`, same result. Only a logged-in owner querying their own wishlist's claims gets zero rows back — **even if they try to query the table directly**, e.g. via the Supabase API outside this app's own UI.

2. **The app code also never gives the owner a path to see raw claim rows**, as a second, independent layer: `app/wishlist/[id]/page.tsx` (the owner's management view) never queries `shared_wishlist_claims` at all. Instead it calls a `SECURITY DEFINER` Postgres function, `shared_wishlist_claim_statuses(p_wishlist_id)`, which returns **only** `{item_id, is_claimed boolean}` — never `claimant_name`. This function runs as the table-owning role, which is exempt from the table's own RLS (Postgres never applies RLS to a table's owner unless `FORCE ROW LEVEL SECURITY` is set, which is deliberately **not** set here), so it correctly returns `true` for a claimed item even though the same owner's *direct* table query would return nothing. This is necessary — without it, RLS blocking the owner from seeing claim rows would also make claimed items look indistinguishable from unclaimed ones on the owner's own dashboard, which is wrong (the owner should see "claimed" as a boolean).

3. **The public share page (`app/w/[id]/page.tsx`) combines both signals** for correctness regardless of who's viewing it: a raw `select` on `shared_wishlist_claims` (gives full claimant name/note to non-owners, empty to an owner per RLS) **and** the same boolean RPC (works for literally anyone). If the raw select returns a name, it's shown ("Claimed by Ana"); if the RPC says claimed but the raw select returned nothing for that item (only possible if the current visitor is the wishlist's own owner, viewing their own share link), it shows a bare "Claimed" badge with no name — correct behavior, not a bug.

4. **Claim uniqueness**: `shared_wishlist_claims.item_id` has a `unique` constraint, so a second claim attempt on an already-claimed item fails with a Postgres unique-violation (`23505`), which `components/ClaimWishlist.tsx` catches and shows as "Someone just claimed this — refresh to see the latest" rather than a generic error — handles the race condition (two friends claiming the same item within seconds of each other) correctly at the database level, not just in the UI.

**Acknowledged edge case:** if a wishlist owner claims an item on their *own* wishlist (a nonsensical flow in practice — there's no reason to hide a gift from yourself), the claim still succeeds, but the `INSERT ... RETURNING` in `ClaimWishlist.tsx` comes back empty (RLS hides even your own just-inserted row from you in that scenario), so the UI shows a bare "Claimed" badge instead of "Claimed by [your name]". This is the same RLS rule working exactly as designed, just applied to a flow nobody would realistically use.

**Scope adaptations:**
- No way to un-claim an item in this MVP (if a friend claims by mistake, the owner would need to delete and recreate the item, which cascades the claim away). Not asked for; straightforward to add later.
- Price is a plain `numeric(10,2)`, not currency-aware (no multi-currency support) — fine for a single-owner, single-currency wishlist.

**Schema (`schema.sql`):** `shared_wishlist_wishlists` (owner, title), `shared_wishlist_items` (wishlist_id, name, url, price, notes), `shared_wishlist_claims` (item_id unique, claimant_name, claimant_note), plus the `shared_wishlist_claim_statuses` security-definer function described above. RLS: wishlists/items are publicly readable (`using (true)`) since the share link itself is the access control (an unguessable UUID), write access is owner-only; claims are insertable by anyone with a non-empty name, and readable by anyone except the item's wishlist owner. Seed: one wishlist ("My Birthday 2026") with 4 items, one already claimed by "Ana" — owned by a placeholder demo-user UUID, see the "Demo user note" at the top of `schema.sql`.

**What still needs a live Supabase project to verify end-to-end:** that the RLS policy and the `SECURITY DEFINER` function behave exactly as reasoned above under a real JWT and real anonymous (anon-key, no session) requests — this is exactly the kind of logic the task called out as impossible to fully trust without live testing, so it's worth an explicit manual check once Supabase exists: log in as the demo owner and confirm `/wishlist/<id>` shows "Claimed" with no name for the Ana item, then open `/w/<id>` in a private/incognito tab (no session) and confirm it shows "Claimed by Ana". `npm run build`, `npx tsc --noEmit`, and `npm run lint` all pass clean locally with empty env vars.
