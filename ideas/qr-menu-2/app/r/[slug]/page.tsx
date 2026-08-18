import { notFound } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { formatCents } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

/**
 * Read-only menu — what you'd land on if you visit a restaurant's menu URL
 * without a table context. Real ordering happens from `/r/[slug]/t/[tableId]`
 * (the URL encoded into each table's QR code), linked below per table.
 */
export default async function RestaurantMenuPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();

  const { data: restaurant } = await supabase
    .from("qr_menu_2_restaurants")
    .select("id, slug, name")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!restaurant) notFound();

  const [{ data: categories }, { data: items }, { data: tables }] = await Promise.all([
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
    supabase
      .from("qr_menu_2_tables")
      .select("id, label")
      .eq("restaurant_id", restaurant.id)
      .order("label", { ascending: true }),
  ]);

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-1 text-2xl font-semibold">{restaurant.name}</h1>
        <p className="mb-6 text-sm text-muted">
          Scan the QR code at your table to order. Browsing without a table?
          Pick one below.
        </p>

        {tables && tables.length > 0 && (
          <Card className="mb-6">
            <p className="mb-3 text-sm font-semibold">Order from a table</p>
            <div className="flex flex-wrap gap-2">
              {tables.map((table) => (
                <Link
                  key={table.id}
                  href={`/r/${restaurant.slug}/t/${table.id}`}
                  className="rounded-brand border border-border px-3 py-1.5 text-sm no-underline text-fg hover:border-accent"
                >
                  {table.label}
                </Link>
              ))}
            </div>
          </Card>
        )}

        <div className="flex flex-col gap-6">
          {(categories ?? []).map((category) => {
            const categoryItems = (items ?? []).filter(
              (item) => item.category_id === category.id,
            );
            if (categoryItems.length === 0) return null;
            return (
              <div key={category.id}>
                <h2 className="mb-2 text-lg font-semibold">{category.name}</h2>
                <div className="flex flex-col gap-2">
                  {categoryItems.map((item) => (
                    <Card key={item.id} className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">
                          {item.name}
                          {!item.is_available && (
                            <span className="ml-2 text-xs text-danger">Sold out</span>
                          )}
                        </p>
                        {item.description && (
                          <p className="text-sm text-muted">{item.description}</p>
                        )}
                      </div>
                      <p className="whitespace-nowrap font-mono text-sm">
                        {formatCents(item.price_cents)}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
