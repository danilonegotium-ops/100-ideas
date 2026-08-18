export type DeliveryOption = "5y" | "10y" | "custom";

/**
 * Adds `years` to `from`. JS Date normalizes an out-of-range day (e.g. Feb
 * 29 landing on a non-leap target year rolls to Mar 1) — standard, expected
 * behavior for a "N years from now" feature, not treated as an error.
 */
export function addYears(from: Date, years: number): Date {
  const d = new Date(from.getTime());
  d.setFullYear(d.getFullYear() + years);
  return d;
}

/**
 * Computes the `deliver_at` timestamp for a new letter from the option the
 * writer picked. Pure function (no I/O) so it's easy to reason about /
 * exercise without a live Supabase project. Throws a plain `Error` with a
 * user-facing message on invalid input — callers (the API route) catch it
 * and turn it into a 400 response.
 */
export function computeDeliverAt(
  option: DeliveryOption | undefined,
  customDateInput: string | undefined,
  now: Date = new Date(),
): Date {
  if (option === "5y") return addYears(now, 5);
  if (option === "10y") return addYears(now, 10);
  if (option === "custom") {
    if (!customDateInput) {
      throw new Error("Pick a delivery date.");
    }
    const parsed = new Date(customDateInput);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error("That delivery date isn't valid.");
    }
    if (parsed.getTime() <= now.getTime()) {
      throw new Error("The delivery date must be in the future.");
    }
    return parsed;
  }
  throw new Error("Pick a delivery option (5 years, 10 years, or a custom date).");
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
