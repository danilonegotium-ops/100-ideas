import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { ClaimWishlist } from "@/components/ClaimWishlist";
import { createClient } from "@/lib/supabase/server";
import type { Item, PublicItemView, ClaimStatusRow } from "@/lib/types";

/**
 * Public share page — no login required to view or claim ("friends can
 * view without needing an account"). Uses TWO independent signals to
 * figure out claim status, layered for correctness no matter who's
 * looking:
 *   1. A raw select on `shared_wishlist_claims` — RLS
 *      (shared_wishlist_claims_select_not_owner in schema.sql) returns
 *      full rows (with claimant_name) to anyone EXCEPT the wishlist's
 *      owner, and returns zero rows to the owner.
 *   2. The `shared_wishlist_claim_statuses` RPC — a boolean-only signal
 *      that works for literally anyone, including the owner, since it
 *      bypasses RLS via SECURITY DEFINER but only ever returns true/false.
 * Combining them means: non-owners see full claimant details, and an
 * owner who happens to open their own share link still correctly sees
 * "claimed" (no name) instead of it looking unclaimed.
 */
export default async function PublicWishlistPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: wishlist } = await supabase
    .from("shared_wishlist_wishlists")
    .select("id, title")
    .eq("id", params.id)
    .maybeSingle();

  if (!wishlist) {
    return (
      <>
        <Nav />
        <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
          <Card>
            <p className="text-sm text-muted">
              This wishlist link doesn&apos;t exist or was removed.
            </p>
          </Card>
        </main>
      </>
    );
  }

  const { data: itemsData } = await supabase
    .from("shared_wishlist_items")
    .select("id, wishlist_id, name, url, price, notes, created_at")
    .eq("wishlist_id", wishlist.id)
    .order("created_at", { ascending: true });

  const items: Item[] = itemsData ?? [];
  const itemIds = items.map((i) => i.id);

  // Sequential, not Promise.all — mixing a real Postgrest query (only run
  // conditionally) with a plain resolved-literal fallback inside a
  // Promise.all tuple confused TypeScript's inference for the RPC call's
  // result (surfaced as an implicit-`any` error under `strict`); plain
  // sequential awaits are unambiguous and this route isn't
  // performance-sensitive.
  let rawClaims: { item_id: string; claimant_name: string; claimant_note: string | null }[] = [];
  if (itemIds.length > 0) {
    const { data } = await supabase
      .from("shared_wishlist_claims")
      .select("item_id, claimant_name, claimant_note")
      .in("item_id", itemIds);
    rawClaims = data ?? [];
  }

  const { data: statuses } = await supabase.rpc(
    "shared_wishlist_claim_statuses",
    { p_wishlist_id: wishlist.id },
  );
  const statusRows = (statuses ?? []) as ClaimStatusRow[];

  const claimMap = new Map(
    rawClaims.map((c) => [
      c.item_id,
      { name: c.claimant_name, note: c.claimant_note },
    ]),
  );
  const statusMap = new Map<string, boolean>(
    statusRows.map((s) => [s.item_id, s.is_claimed]),
  );

  const publicItems: PublicItemView[] = items.map((item) => {
    const claim = claimMap.get(item.id);
    return {
      ...item,
      is_claimed: statusMap.get(item.id) ?? Boolean(claim),
      claimant_name: claim?.name ?? null,
      claimant_note: claim?.note ?? null,
    };
  });

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">{wishlist.title}</h1>
        <p className="mb-6 text-muted">
          Claim an item to let others know it&apos;s taken — the list owner
          can never see who claimed what, only that it was.
        </p>
        <ClaimWishlist initialItems={publicItems} />
      </main>
    </>
  );
}
