"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/Button";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
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

const easeOutExpo = [0.16, 1, 0.3, 1] as const;

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
      <div className="flex flex-col gap-10">
        {categories.map((category) => {
          const categoryItems = items.filter((item) => item.category_id === category.id);
          if (categoryItems.length === 0) return null;
          return (
            <div key={category.id} id={`category-${category.id}`} className="scroll-mt-6">
              <h2 className="mb-3 text-title text-fg">{category.name}</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {categoryItems.map((item, i) => {
                  const quantity = cart[item.id] ?? 0;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.4), ease: easeOutExpo }}
                    >
                      <SpotlightCard className="relative flex h-full items-start justify-between gap-4">
                        <AnimatePresence>
                          {quantity > 0 && (
                            <motion.span
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.5 }}
                              transition={{ type: "spring", stiffness: 400, damping: 24 }}
                              className="absolute right-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-[#062b1c]"
                            >
                              ×{quantity}
                            </motion.span>
                          )}
                        </AnimatePresence>

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
                            <motion.button
                              type="button"
                              aria-label={`Remove one ${item.name}`}
                              onClick={() => setQuantity(item.id, quantity - 1)}
                              disabled={quantity === 0}
                              whileTap={quantity > 0 ? { scale: 0.85 } : undefined}
                              className="h-8 w-8 rounded-brand border border-border text-fg disabled:opacity-40"
                            >
                              −
                            </motion.button>
                            <span className="inline-flex w-5 justify-center overflow-hidden text-sm tabular-nums">
                              <AnimatePresence mode="popLayout" initial={false}>
                                <motion.span
                                  key={quantity}
                                  initial={{ opacity: 0, y: -8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 8 }}
                                  transition={{ duration: 0.15 }}
                                  className="inline-block"
                                >
                                  {quantity}
                                </motion.span>
                              </AnimatePresence>
                            </span>
                            <motion.button
                              type="button"
                              aria-label={`Add one ${item.name}`}
                              onClick={() => setQuantity(item.id, quantity + 1)}
                              whileTap={{ scale: 0.85 }}
                              className="h-8 w-8 rounded-brand border border-border text-fg hover:border-accent"
                            >
                              +
                            </motion.button>
                          </div>
                        )}
                      </SpotlightCard>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {itemCount > 0 && !cartOpen && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.3, ease: easeOutExpo }}
            className="glass fixed inset-x-0 bottom-0 z-10 border-t border-border px-5 py-4"
          >
            <div className="mx-auto flex w-full max-w-site items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="text-left text-sm no-underline text-fg"
              >
                <span className="font-semibold">
                  {itemCount} item{itemCount === 1 ? "" : "s"}
                </span>{" "}
                <span className="text-muted">
                  ·{" "}
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={totalCents}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.2 }}
                      className="inline-block"
                    >
                      {formatCents(totalCents)}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </button>
              <Button onClick={() => setCartOpen(true)}>View cart</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cartOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-20 flex items-end justify-center bg-black/50 sm:items-center"
            onClick={() => setCartOpen(false)}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: "100%", opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(event) => event.stopPropagation()}
              className="glass max-h-[85vh] w-full max-w-site overflow-y-auto rounded-t-brand border border-border p-5 sm:rounded-brand"
            >
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
                  <AnimatePresence initial={false}>
                    {cartLines.map((line) => (
                      <motion.div
                        key={line.item.id}
                        layout
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8, transition: { duration: 0.15 } }}
                        transition={{ duration: 0.25, ease: easeOutExpo }}
                        className="flex items-center justify-between gap-3"
                      >
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
                      </motion.div>
                    ))}
                  </AnimatePresence>

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
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={totalCents}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.2 }}
                        className="inline-block"
                      >
                        {formatCents(totalCents)}
                      </motion.span>
                    </AnimatePresence>
                  </div>

                  {error && <p className="text-sm text-danger">{error}</p>}

                  <Button onClick={handleCheckout} disabled={placing}>
                    {placing ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#062b1c]/30 border-t-[#062b1c]" />
                        Placing order…
                      </span>
                    ) : (
                      "Checkout"
                    )}
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
