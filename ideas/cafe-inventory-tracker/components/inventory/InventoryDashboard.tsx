"use client";

import { FormEvent, useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { createClient } from "@/lib/supabase/client";
import {
  daysOfStockLeft,
  isBelowReorderThreshold,
  needsReorderSoon,
  type InventoryItemRow,
} from "@/lib/inventory";

const emptyForm = {
  name: "",
  unit: "",
  currentStock: "",
  reorderThreshold: "",
  dailyUsageRate: "",
  category: "",
};

function formatDays(days: number | null) {
  if (days === null) return "no usage data";
  if (days <= 0) return "out of stock";
  if (days < 1) return "< 1 day left";
  return `${Math.floor(days)} day${Math.floor(days) === 1 ? "" : "s"} left`;
}

export function InventoryDashboard({ initialItems }: { initialItems: InventoryItemRow[] }) {
  const [items, setItems] = useState(initialItems);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restockOnly, setRestockOnly] = useState(false);

  const reorderCount = useMemo(() => items.filter((item) => needsReorderSoon(item)).length, [items]);
  const outOfStockCount = useMemo(
    () => items.filter((item) => item.current_stock <= 0).length,
    [items],
  );

  const visible = restockOnly ? items.filter((item) => needsReorderSoon(item)) : items;
  const sorted = [...visible].sort((a, b) => {
    const daysA = daysOfStockLeft(a);
    const daysB = daysOfStockLeft(b);
    if (daysA === null && daysB === null) return 0;
    if (daysA === null) return 1;
    if (daysB === null) return -1;
    return daysA - daysB;
  });

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentStock = Number(form.currentStock);
    const reorderThreshold = Number(form.reorderThreshold);
    const dailyUsageRate = Number(form.dailyUsageRate || 0);

    if (
      !form.name.trim() ||
      !form.unit.trim() ||
      !Number.isFinite(currentStock) ||
      currentStock < 0 ||
      !Number.isFinite(reorderThreshold) ||
      reorderThreshold < 0
    ) {
      setError("Enter a name, unit, current stock, and reorder threshold.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("cafe_inventory_tracker_items")
      .insert({
        name: form.name.trim(),
        unit: form.unit.trim(),
        current_stock: currentStock,
        reorder_threshold: reorderThreshold,
        daily_usage_rate: dailyUsageRate,
        category: form.category.trim() || null,
      })
      .select("id, name, unit, current_stock, reorder_threshold, daily_usage_rate, category, notes")
      .single();

    setSubmitting(false);

    if (insertError || !data) {
      setError(insertError?.message ?? "Failed to add item.");
      return;
    }

    setItems((prev) => [...prev, data]);
    setForm(emptyForm);
  }

  async function adjustStock(item: InventoryItemRow, delta: number) {
    const nextStock = Math.max(0, item.current_stock + delta);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("cafe_inventory_tracker_items")
      .update({ current_stock: nextStock, updated_at: new Date().toISOString() })
      .eq("id", item.id);
    if (!updateError) {
      setItems((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, current_stock: nextStock } : row)),
      );
    }
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("cafe_inventory_tracker_items")
      .delete()
      .eq("id", id);
    if (!deleteError) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card className={reorderCount > 0 ? "border-danger" : undefined}>
          <p className="text-xs text-muted">Needs reorder soon</p>
          <p className="text-xl font-semibold">{reorderCount}</p>
        </Card>
        <Card className={outOfStockCount > 0 ? "border-danger" : undefined}>
          <p className="text-xs text-muted">Out of stock</p>
          <p className="text-xl font-semibold">{outOfStockCount}</p>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-semibold">Add an item</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="item-name">Name</label>
            <input
              id="item-name"
              required
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Whole Milk"
            />
          </div>
          <div>
            <label htmlFor="item-unit">Unit</label>
            <input
              id="item-unit"
              required
              value={form.unit}
              onChange={(event) => setForm((prev) => ({ ...prev, unit: event.target.value }))}
              placeholder="L, kg, bags…"
            />
          </div>
          <div>
            <label htmlFor="current-stock">Current stock</label>
            <input
              id="current-stock"
              type="number"
              min="0"
              step="0.1"
              required
              value={form.currentStock}
              onChange={(event) => setForm((prev) => ({ ...prev, currentStock: event.target.value }))}
              placeholder="8"
            />
          </div>
          <div>
            <label htmlFor="reorder-threshold">Reorder threshold</label>
            <input
              id="reorder-threshold"
              type="number"
              min="0"
              step="0.1"
              required
              value={form.reorderThreshold}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, reorderThreshold: event.target.value }))
              }
              placeholder="10"
            />
          </div>
          <div>
            <label htmlFor="usage-rate">Typical daily usage</label>
            <input
              id="usage-rate"
              type="number"
              min="0"
              step="0.1"
              value={form.dailyUsageRate}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, dailyUsageRate: event.target.value }))
              }
              placeholder="6"
            />
          </div>
          <div>
            <label htmlFor="category">Category (optional)</label>
            <input
              id="category"
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              placeholder="Dairy"
            />
          </div>
          {error && <p className="text-sm text-danger sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Adding…" : "Add item"}
            </Button>
          </div>
        </form>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">
          {sorted.length} item{sorted.length === 1 ? "" : "s"}
        </h2>
        <label className="flex items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={restockOnly}
            onChange={(event) => setRestockOnly(event.target.checked)}
            className="w-auto"
          />
          Needs reorder only
        </label>
      </div>

      <div className="flex flex-col gap-2">
        {sorted.map((item) => {
          const days = daysOfStockLeft(item);
          const flagged = needsReorderSoon(item);
          const belowThreshold = isBelowReorderThreshold(item);
          return (
            <Card key={item.id} className={flagged ? "border-danger" : undefined}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">
                    {item.name}{" "}
                    {belowThreshold && <span className="text-xs text-danger">below threshold</span>}
                  </p>
                  <p className="text-xs text-muted">
                    {item.category ? `${item.category} · ` : ""}
                    {item.current_stock} {item.unit} on hand · reorder at {item.reorder_threshold}{" "}
                    {item.unit} · {item.daily_usage_rate}/day
                  </p>
                </div>
                <p className={`whitespace-nowrap text-sm ${flagged ? "text-danger" : "text-muted"}`}>
                  {formatDays(days)}
                </p>
              </div>
              <div className="mt-3 flex items-center gap-3 border-t border-border pt-3 text-xs">
                <button type="button" onClick={() => adjustStock(item, -1)} className="text-fg">
                  −1 {item.unit}
                </button>
                <button type="button" onClick={() => adjustStock(item, 1)} className="text-fg">
                  +1 {item.unit}
                </button>
                <button type="button" onClick={() => handleDelete(item.id)} className="ml-auto text-danger">
                  Delete
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
