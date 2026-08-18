import { Nav } from "@/components/Nav";
import { createClient } from "@/lib/supabase/server";
import { InventoryDashboard } from "@/components/inventory/InventoryDashboard";
import type { InventoryItemRow } from "@/lib/inventory";

export default async function Home() {
  const supabase = createClient();
  const { data: items } = await supabase
    .from("cafe_inventory_tracker_items")
    .select("id, name, unit, current_stock, reorder_threshold, daily_usage_rate, category, notes")
    .order("name", { ascending: true });

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-1 text-2xl font-semibold">Cafe Inventory Tracker</h1>
        <p className="mb-6 text-muted">
          Track milk, beans, and sugar usage and see exactly how many days
          of stock you have left before you need to restock.
        </p>
        <InventoryDashboard initialItems={(items ?? []) as InventoryItemRow[]} />
      </main>
    </>
  );
}
