import Link from "next/link";
import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { ManageWishlist } from "@/components/ManageWishlist";
import { StatTile } from "@/components/motion/StatTile";
import { createClient, getUser } from "@/lib/supabase/server";
import type { Item, OwnerItemView, ClaimStatusRow } from "@/lib/types";

/**
 * Owner-only management view. Deliberately never queries
 * `shared_wishlist_claims` directly — only the boolean-only
 * `shared_wishlist_claim_statuses` RPC (see schema.sql), so claimant
 * identity never even reaches this route's response, on top of the RLS
 * policy that would block it anyway if we tried. Belt and suspenders.
 */
export default async function ManageWishlistPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = createClient();
  const { data: wishlist } = await supabase
    .from("shared_wishlist_wishlists")
    .select("id, title, created_at, owner_id")
    .eq("id", params.id)
    .maybeSingle();

  if (!wishlist || wishlist.owner_id !== user.id) {
    return (
      <>
        <Nav />
        <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
          <Card>
            <p className="text-sm text-muted">
              This wishlist doesn&apos;t exist, or isn&apos;t yours to
              manage.
            </p>
            <Link href="/" className="mt-3 inline-block">
              <Button variant="secondary">Back to your wishlists</Button>
            </Link>
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

  const { data: statuses } = await supabase.rpc(
    "shared_wishlist_claim_statuses",
    { p_wishlist_id: wishlist.id },
  );
  const statusRows = (statuses ?? []) as ClaimStatusRow[];

  const statusMap = new Map<string, boolean>(
    statusRows.map((s) => [s.item_id, s.is_claimed]),
  );

  const ownerItems: OwnerItemView[] = items.map((item) => ({
    ...item,
    is_claimed: statusMap.get(item.id) ?? false,
  }));
  const claimedCount = ownerItems.filter((i) => i.is_claimed).length;

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">{wishlist.title}</h1>
        <p className="mb-6 text-muted">
          You&apos;ll see which items are claimed, but never who claimed
          them — that stays a surprise.
        </p>
        {ownerItems.length > 0 && (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatTile label="Items" value={ownerItems.length} />
            <StatTile label="Claimed" value={claimedCount} />
          </div>
        )}
        <ManageWishlist wishlistId={wishlist.id} initialItems={ownerItems} />
      </main>
    </>
  );
}
