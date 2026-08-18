"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { formatCents } from "@/lib/money";
import { createClient } from "@/lib/supabase/client";

export interface OrderItemRow {
  id: string;
  name_snapshot: string;
  price_cents_snapshot: number;
  quantity: number;
}

export interface OrderRow {
  id: string;
  status: string;
  payment_status: string;
  total_cents: number;
  customer_note: string | null;
  created_at: string;
  table_id: string | null;
  order_items: OrderItemRow[];
}

const STATUS_FLOW: Record<string, string> = {
  placed: "preparing",
  preparing: "completed",
};

export function OrdersManager({
  restaurantId,
  initialOrders,
  tableLabelsById,
}: {
  restaurantId: string;
  initialOrders: OrderRow[];
  tableLabelsById: Record<string, string>;
}) {
  const [orders, setOrders] = useState(initialOrders);

  // Live-refresh: when a new order comes in (or an existing one changes,
  // e.g. Stripe payment confirmation on the success page), re-fetch the
  // full order list. Fetching the full row again (rather than trusting the
  // realtime payload) keeps this simple and correct even though it's an
  // extra round trip.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`qr-menu-2-orders-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "qr_menu_2_orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        async () => {
          const { data } = await supabase
            .from("qr_menu_2_orders")
            .select(
              "id, status, payment_status, total_cents, customer_note, created_at, table_id, order_items:qr_menu_2_order_items(id, name_snapshot, price_cents_snapshot, quantity)",
            )
            .eq("restaurant_id", restaurantId)
            .order("created_at", { ascending: false });
          if (data) setOrders(data as unknown as OrderRow[]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  async function advanceStatus(order: OrderRow) {
    const nextStatus = STATUS_FLOW[order.status];
    if (!nextStatus) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("qr_menu_2_orders")
      .update({ status: nextStatus })
      .eq("id", order.id);
    if (!error) {
      setOrders((prev) =>
        prev.map((row) => (row.id === order.id ? { ...row, status: nextStatus } : row)),
      );
    }
  }

  if (orders.length === 0) {
    return <p className="text-sm text-muted">No orders yet — they&apos;ll show up here live.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {orders.map((order) => (
        <Card key={order.id}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">
                #{order.id.slice(0, 8)} ·{" "}
                {order.table_id ? tableLabelsById[order.table_id] ?? "Unknown table" : "No table"}
              </p>
              <p className="text-xs text-muted">{new Date(order.created_at).toLocaleString()}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs uppercase text-muted">{order.status}</span>
              <span
                className={`text-xs ${order.payment_status === "unpaid" ? "text-danger" : "text-muted"}`}
              >
                {order.payment_status}
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-1 border-t border-border pt-3">
            {order.order_items.map((line) => (
              <div key={line.id} className="flex justify-between text-sm">
                <span>
                  {line.quantity} × {line.name_snapshot}
                </span>
                <span className="font-mono">
                  {formatCents(line.price_cents_snapshot * line.quantity)}
                </span>
              </div>
            ))}
          </div>

          {order.customer_note && (
            <p className="mt-2 text-sm text-muted">Note: {order.customer_note}</p>
          )}

          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <span className="text-sm font-semibold">{formatCents(order.total_cents)}</span>
            {STATUS_FLOW[order.status] && (
              <button
                type="button"
                onClick={() => advanceStatus(order)}
                className="text-sm text-accent"
              >
                Mark {STATUS_FLOW[order.status]}
              </button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
