export const ZOMBIE_THRESHOLD_DAYS = 60;

export interface SubscriptionRow {
  id: string;
  tool_name: string;
  cost_cents: number;
  billing_cycle: "monthly" | "annual";
  owner_name: string;
  category: string | null;
  url: string | null;
  last_used_date: string | null;
  notes: string | null;
}

export function monthlyEquivalentCents(sub: Pick<SubscriptionRow, "cost_cents" | "billing_cycle">) {
  return sub.billing_cycle === "monthly" ? sub.cost_cents : Math.round(sub.cost_cents / 12);
}

export function annualEquivalentCents(sub: Pick<SubscriptionRow, "cost_cents" | "billing_cycle">) {
  return sub.billing_cycle === "annual" ? sub.cost_cents : sub.cost_cents * 12;
}

/** Days since last use, or `null` if it's never been marked used. */
export function daysSinceLastUsed(lastUsedDate: string | null, now: Date = new Date()) {
  if (!lastUsedDate) return null;
  const last = new Date(`${lastUsedDate}T00:00:00`);
  const diffMs = now.getTime() - last.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/** Never used, or unused for 60+ days. */
export function isZombie(sub: Pick<SubscriptionRow, "last_used_date">, now: Date = new Date()) {
  if (!sub.last_used_date) return true;
  const days = daysSinceLastUsed(sub.last_used_date, now);
  return days !== null && days >= ZOMBIE_THRESHOLD_DAYS;
}
