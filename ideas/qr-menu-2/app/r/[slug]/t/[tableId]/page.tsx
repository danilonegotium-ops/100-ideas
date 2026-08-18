import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { createClient } from "@/lib/supabase/server";
import { OrderingClient } from "@/components/order/OrderingClient";

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

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-1 text-2xl font-semibold">{restaurant.name}</h1>
        <p className="mb-6 text-sm text-muted">{table.label}</p>

        {searchParams.cancelled && (
          <p className="mb-4 rounded-brand border border-border bg-surface px-4 py-2 text-sm text-muted">
            Checkout was cancelled — your cart is still here, try again whenever you&apos;re
            ready.
          </p>
        )}

        <OrderingClient
          restaurantSlug={restaurant.slug}
          tableId={table.id}
          tableLabel={table.label}
          categories={categories ?? []}
          items={items ?? []}
        />
      </main>
    </>
  );
}
