"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { formatCents } from "@/lib/money";

export interface MenuItemRow {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price_cents: number;
  is_available: boolean;
  sort_order: number;
}

export interface CategoryRow {
  id: string;
  name: string;
  sort_order: number;
}

interface CheckoutSuccessResponse {
  demo?: true;
  checkoutUrl?: string;
  orderId: string;
}

interface CheckoutErrorResponse {
  error: string;
}

export function OrderingClient({
  restaurantSlug,
  tableId,
  tableLabel,
  categories,
  items,
}: {
  restaurantSlug: string;
  tableId: string;
  tableLabel: string;
  categories: CategoryRow[];
  items: MenuItemRow[];
}) {
  const router = useRouter();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const itemsById = useMemo(() => {
    const map = new Map<string, MenuItemRow>();
    items.forEach((item) => map.set(item.id, item));
    return map;
  }, [items]);

  const cartLines = Object.entries(cart)
    .filter(([, quantity]) => quantity > 0)
    .map(([menuItemId, quantity]) => ({ item: itemsById.get(menuItemId), quantity }))
    .filter((line): line is { item: MenuItemRow; quantity: number } => Boolean(line.item));

  const totalCents = cartLines.reduce(
    (sum, line) => sum + line.item.price_cents * line.quantity,
    0,
  );
  const itemCount = cartLines.reduce((sum, line) => sum + line.quantity, 0);

  function setQuantity(itemId: string, quantity: number) {
    setCart((prev) => ({ ...prev, [itemId]: Math.max(0, quantity) }));
  }

  async function handleCheckout() {
    if (cartLines.length === 0) return;
    setPlacing(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantSlug,
          tableId,
          note: note.trim() || undefined,
          items: cartLines.map((line) => ({
            menuItemId: line.item.id,
            quantity: line.quantity,
          })),
        }),
      });

      const data: CheckoutSuccessResponse | CheckoutErrorResponse = await res.json();

      if (!res.ok || "error" in data) {
        setError("error" in data ? data.error : "Something went wrong placing your order.");
        setPlacing(false);
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      router.push(`/r/${restaurantSlug}/t/${tableId}/success?order_id=${data.orderId}`);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setPlacing(false);
    }
  }

  return (
    <div className="pb-28">
      <div className="flex flex-col gap-6">
        {categories.map((category) => {
          const categoryItems = items.filter((item) => item.category_id === category.id);
          if (categoryItems.length === 0) return null;
          return (
            <div key={category.id}>
              <h2 className="mb-2 text-lg font-semibold">{category.name}</h2>
              <div className="flex flex-col gap-2">
                {categoryItems.map((item) => {
                  const quantity = cart[item.id] ?? 0;
                  return (
                    <Card key={item.id} className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium">
                          {item.name}
                          {!item.is_available && (
                            <span className="ml-2 text-xs text-danger">Sold out</span>
                          )}
                        </p>
                        {item.description && (
                          <p className="text-sm text-muted">{item.description}</p>
                        )}
                        <p className="mt-1 font-mono text-sm">{formatCents(item.price_cents)}</p>
                      </div>

                      {item.is_available && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label={`Remove one ${item.name}`}
                            onClick={() => setQuantity(item.id, quantity - 1)}
                            disabled={quantity === 0}
                            className="h-8 w-8 rounded-brand border border-border text-fg disabled:opacity-40"
                          >
                            −
                          </button>
                          <span className="w-5 text-center text-sm">{quantity}</span>
                          <button
                            type="button"
                            aria-label={`Add one ${item.name}`}
                            onClick={() => setQuantity(item.id, quantity + 1)}
                            className="h-8 w-8 rounded-brand border border-border text-fg hover:border-accent"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {itemCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 border-t border-border bg-surface px-5 py-4">
          <div className="mx-auto flex w-full max-w-site items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="text-left text-sm no-underline text-fg"
            >
              <span className="font-semibold">{itemCount} item{itemCount === 1 ? "" : "s"}</span>{" "}
              <span className="text-muted">· {formatCents(totalCents)}</span>
            </button>
            <Button onClick={() => setCartOpen(true)}>View cart</Button>
          </div>
        </div>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-10 flex items-end justify-center bg-black/50 sm:items-center">
          <div className="max-h-[85vh] w-full max-w-site overflow-y-auto rounded-t-brand border border-border bg-surface p-5 sm:rounded-brand">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Your order — {tableLabel}</h2>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="text-sm text-muted hover:text-fg"
              >
                Close
              </button>
            </div>

            {cartLines.length === 0 ? (
              <p className="text-sm text-muted">Your cart is empty.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {cartLines.map((line) => (
                  <div key={line.item.id} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{line.item.name}</p>
                      <p className="text-xs text-muted">
                        {line.quantity} × {formatCents(line.item.price_cents)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm">
                        {formatCents(line.item.price_cents * line.quantity)}
                      </p>
                      <button
                        type="button"
                        onClick={() => setQuantity(line.item.id, 0)}
                        className="text-xs text-danger"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                <div>
                  <label htmlFor="order-note">Note for the kitchen (optional)</label>
                  <textarea
                    id="order-note"
                    rows={2}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="e.g. no onions"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-border pt-3 text-sm font-semibold">
                  <span>Total</span>
                  <span>{formatCents(totalCents)}</span>
                </div>

                {error && <p className="text-sm text-danger">{error}</p>}

                <Button onClick={handleCheckout} disabled={placing}>
                  {placing ? "Placing order…" : "Checkout"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
