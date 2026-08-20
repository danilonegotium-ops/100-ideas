import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { createClient } from "@/lib/supabase/server";
import { OrderingClient } from "@/components/order/OrderingClient";
import { MenuHero } from "@/components/order/MenuHero";
import { CategoryNav } from "@/components/order/CategoryNav";
import { EmptyState } from "@/components/motion/EmptyState";

/**
 * The URL encoded into each table's QR code (see
 * components/admin/TablesManager.tsx). Fetches the menu server-side, then
 * hands cart/checkout interactivity off to a Client Component.
 */
export default async function TableOrderPage({
  params,
  searchParams,
}: {
  params: { slug: string; tableId: string };
  searchParams: { cancelled?: string };
}) {
  const supabase = createClient();

  const { data: restaurant } = await supabase
    .from("qr_menu_2_restaurants")
    .select("id, slug, name")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!restaurant) notFound();

  const { data: table } = await supabase
    .from("qr_menu_2_tables")
    .select("id, label")
    .eq("id", params.tableId)
    .eq("restaurant_id", restaurant.id)
    .maybeSingle();

  if (!table) notFound();

  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase
      .from("qr_menu_2_categories")
      .select("id, name, sort_order")
      .eq("restaurant_id", restaurant.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("qr_menu_2_menu_items")
      .select("id, category_id, name, description, price_cents, is_available, sort_order")
      .eq("restaurant_id", restaurant.id)
      .order("sort_order", { ascending: true }),
  ]);

  const categoryRows = categories ?? [];
  const itemRows = items ?? [];
  const categoryNavItems = categoryRows.map((category) => ({
    id: category.id,
    name: category.name,
    count: itemRows.filter((item) => item.category_id === category.id).length,
  }));

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <MenuHero
          restaurantName={restaurant.name}
          tableLabel={table.label}
          dishCount={itemRows.length}
          categoryCount={categoryRows.length}
          availableCount={itemRows.filter((item) => item.is_available).length}
        />

        {searchParams.cancelled && (
          <p className="mb-4 rounded-brand border border-border bg-surface px-4 py-2 text-sm text-muted">
            Checkout was cancelled — your cart is still here, try again whenever you&apos;re
            ready.
          </p>
        )}

        {itemRows.length === 0 ? (
          <EmptyState
            title="This menu is still being set up"
            description="Check back in a moment, or ask your server what's on today."
          />
        ) : (
          <>
            <CategoryNav categories={categoryNavItems} />
            <OrderingClient
              restaurantSlug={restaurant.slug}
              tableId={table.id}
              tableLabel={table.label}
              categories={categoryRows}
              items={itemRows}
            />
          </>
        )}
      </main>
    </>
  );
}
