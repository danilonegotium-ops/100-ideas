import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { createClient, getUser } from "@/lib/supabase/server";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import type { OrderRow } from "@/components/admin/OrdersManager";

export default async function AdminRestaurantPage({
  params,
}: {
  params: { slug: string };
}) {
  const user = await getUser();
  if (!user) redirect(`/login?next=/admin/${params.slug}`);

  const supabase = createClient();

  const { data: restaurant } = await supabase
    .from("qr_menu_2_restaurants")
    .select("id, slug, name, owner_id")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!restaurant) {
    return (
      <>
        <Nav />
        <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
          <Card>
            <p className="text-sm">No restaurant found at /r/{params.slug}.</p>
          </Card>
        </main>
      </>
    );
  }

  if (restaurant.owner_id !== user.id) {
    return (
      <>
        <Nav />
        <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
          <Card>
            <p className="text-sm">
              This restaurant isn&apos;t linked to your account yet. If this is the seeded demo
              restaurant, it was created with no owner — see SPEC.md for how to claim it against a
              real Supabase user once the project is live.
            </p>
          </Card>
        </main>
      </>
    );
  }

  const [{ data: categories }, { data: items }, { data: tables }, { data: orders }] =
    await Promise.all([
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
      supabase
        .from("qr_menu_2_orders")
        .select(
          "id, status, payment_status, total_cents, customer_note, created_at, table_id, order_items:qr_menu_2_order_items(id, name_snapshot, price_cents_snapshot, quantity)",
        )
        .eq("restaurant_id", restaurant.id)
        .order("created_at", { ascending: false }),
    ]);

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <AdminDashboard
          restaurantId={restaurant.id}
          restaurantSlug={restaurant.slug}
          restaurantName={restaurant.name}
          categories={categories ?? []}
          items={items ?? []}
          tables={tables ?? []}
          orders={(orders ?? []) as unknown as OrderRow[]}
        />
      </main>
    </>
  );
}
