export interface InventoryItemRow {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  reorder_threshold: number;
  daily_usage_rate: number;
  category: string | null;
  notes: string | null;
}

/**
 * Days of stock left at the current usage rate: current stock ÷ usage
 * rate, per the assignment's formula. `null` means "no usage data yet"
 * (daily_usage_rate is 0) rather than dividing by zero — the dashboard
 * shows that as "no usage data" instead of an infinite/NaN number.
 */
export function daysOfStockLeft(item: Pick<InventoryItemRow, "current_stock" | "daily_usage_rate">) {
  if (item.daily_usage_rate <= 0) return null;
  return item.current_stock / item.daily_usage_rate;
}

/** Separate from the days-left runway: has stock already dropped to (or below) the reorder par level? */
export function isBelowReorderThreshold(
  item: Pick<InventoryItemRow, "current_stock" | "reorder_threshold">,
) {
  return item.current_stock <= item.reorder_threshold;
}

export function needsReorderSoon(
  item: Pick<InventoryItemRow, "current_stock" | "reorder_threshold" | "daily_usage_rate">,
) {
  if (isBelowReorderThreshold(item)) return true;
  const days = daysOfStockLeft(item);
  return days !== null && days <= 7;
}
