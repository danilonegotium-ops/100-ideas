"use client";

import { useState } from "react";
import { MenuManager, type CategoryRow, type MenuItemRow } from "./MenuManager";
import { TablesManager, type TableRow } from "./TablesManager";
import { OrdersManager, type OrderRow } from "./OrdersManager";

type Tab = "menu" | "tables" | "orders";

export function AdminDashboard({
  restaurantId,
  restaurantSlug,
  restaurantName,
  categories,
  items,
  tables,
  orders,
}: {
  restaurantId: string;
  restaurantSlug: string;
  restaurantName: string;
  categories: CategoryRow[];
  items: MenuItemRow[];
  tables: TableRow[];
  orders: OrderRow[];
}) {
  const [tab, setTab] = useState<Tab>("orders");
  const tableLabelsById = Object.fromEntries(tables.map((table) => [table.id, table.label]));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">{restaurantName}</h1>
      <p className="mb-6 text-sm text-muted">/r/{restaurantSlug}</p>

      <div className="mb-6 flex gap-2 border-b border-border">
        {(
          [
            ["orders", "Orders"],
            ["menu", "Menu"],
            ["tables", "Tables & QR codes"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`px-3 py-2 text-sm ${
              tab === value ? "border-b-2 border-accent font-semibold" : "text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "orders" && (
        <OrdersManager
          restaurantId={restaurantId}
          initialOrders={orders}
          tableLabelsById={tableLabelsById}
        />
      )}
      {tab === "menu" && (
        <MenuManager restaurantId={restaurantId} initialCategories={categories} initialItems={items} />
      )}
      {tab === "tables" && (
        <TablesManager restaurantId={restaurantId} restaurantSlug={restaurantSlug} initialTables={tables} />
      )}
    </div>
  );
}
