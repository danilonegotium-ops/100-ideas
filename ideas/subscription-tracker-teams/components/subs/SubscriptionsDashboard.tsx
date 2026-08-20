"use client";

import { FormEvent, useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { StatTile } from "@/components/motion/StatTile";
import { EmptyState } from "@/components/motion/EmptyState";
import { createClient } from "@/lib/supabase/client";
import { formatCents } from "@/lib/money";
import {
  annualEquivalentCents,
  daysSinceLastUsed,
  isZombie,
  monthlyEquivalentCents,
  type SubscriptionRow,
} from "@/lib/subscriptions";

const emptyForm = {
  toolName: "",
  cost: "",
  billingCycle: "monthly" as "monthly" | "annual",
  ownerName: "",
  category: "",
  url: "",
  lastUsedDate: "",
};

export function SubscriptionsDashboard({
  initialSubscriptions,
}: {
  initialSubscriptions: SubscriptionRow[];
}) {
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showZombiesOnly, setShowZombiesOnly] = useState(false);

  const totals = useMemo(() => {
    const monthly = subscriptions.reduce((sum, sub) => sum + monthlyEquivalentCents(sub), 0);
    const annual = subscriptions.reduce((sum, sub) => sum + annualEquivalentCents(sub), 0);
    const zombieCount = subscriptions.filter((sub) => isZombie(sub)).length;
    const zombieMonthly = subscriptions
      .filter((sub) => isZombie(sub))
      .reduce((sum, sub) => sum + monthlyEquivalentCents(sub), 0);
    return { monthly, annual, zombieCount, zombieMonthly };
  }, [subscriptions]);

  const visible = showZombiesOnly ? subscriptions.filter((sub) => isZombie(sub)) : subscriptions;
  const sorted = [...visible].sort((a, b) => monthlyEquivalentCents(b) - monthlyEquivalentCents(a));

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const costCents = Math.round(Number(form.cost) * 100);
    if (!form.toolName.trim() || !form.ownerName.trim() || !Number.isFinite(costCents) || costCents < 0) {
      setError("Enter a tool name, owner, and a valid cost.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("subscription_tracker_teams_subscriptions")
      .insert({
        tool_name: form.toolName.trim(),
        cost_cents: costCents,
        billing_cycle: form.billingCycle,
        owner_name: form.ownerName.trim(),
        category: form.category.trim() || null,
        url: form.url.trim() || null,
        last_used_date: form.lastUsedDate || null,
      })
      .select("id, tool_name, cost_cents, billing_cycle, owner_name, category, url, last_used_date, notes")
      .single();

    setSubmitting(false);

    if (insertError || !data) {
      setError(insertError?.message ?? "Failed to add subscription.");
      return;
    }

    setSubscriptions((prev) => [...prev, data]);
    setForm(emptyForm);
  }

  async function markUsedToday(id: string) {
    const today = new Date().toISOString().slice(0, 10);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("subscription_tracker_teams_subscriptions")
      .update({ last_used_date: today, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (!updateError) {
      setSubscriptions((prev) =>
        prev.map((sub) => (sub.id === id ? { ...sub, last_used_date: today } : sub)),
      );
    }
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("subscription_tracker_teams_subscriptions")
      .delete()
      .eq("id", id);
    if (!deleteError) {
      setSubscriptions((prev) => prev.filter((sub) => sub.id !== id));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile label="Monthly spend" value={totals.monthly / 100} prefix="$" decimals={2} />
        <StatTile label="Annual spend" value={totals.annual / 100} prefix="$" decimals={2} />
        <StatTile
          label="Zombie subscriptions"
          value={totals.zombieCount}
          className={totals.zombieCount > 0 ? "border-danger" : undefined}
          trend={totals.zombieCount > 0 ? `${formatCents(totals.zombieMonthly)}/mo wasted` : undefined}
          trendTone="negative"
        />
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-semibold">Add a subscription</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="tool-name">Tool name</label>
            <input
              id="tool-name"
              required
              value={form.toolName}
              onChange={(event) => setForm((prev) => ({ ...prev, toolName: event.target.value }))}
              placeholder="Figma"
            />
          </div>
          <div>
            <label htmlFor="owner-name">Owner</label>
            <input
              id="owner-name"
              required
              value={form.ownerName}
              onChange={(event) => setForm((prev) => ({ ...prev, ownerName: event.target.value }))}
              placeholder="Alice Chen"
            />
          </div>
          <div>
            <label htmlFor="cost">Cost</label>
            <input
              id="cost"
              type="number"
              min="0"
              step="0.01"
              required
              value={form.cost}
              onChange={(event) => setForm((prev) => ({ ...prev, cost: event.target.value }))}
              placeholder="15.00"
            />
          </div>
          <div>
            <label htmlFor="billing-cycle">Billing cycle</label>
            <select
              id="billing-cycle"
              value={form.billingCycle}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, billingCycle: event.target.value as "monthly" | "annual" }))
              }
            >
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
            </select>
          </div>
          <div>
            <label htmlFor="category">Category (optional)</label>
            <input
              id="category"
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              placeholder="Design"
            />
          </div>
          <div>
            <label htmlFor="last-used">Last used (optional)</label>
            <input
              id="last-used"
              type="date"
              value={form.lastUsedDate}
              onChange={(event) => setForm((prev) => ({ ...prev, lastUsedDate: event.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="url">Link (optional)</label>
            <input
              id="url"
              value={form.url}
              onChange={(event) => setForm((prev) => ({ ...prev, url: event.target.value }))}
              placeholder="https://figma.com"
            />
          </div>
          {error && <p className="text-sm text-danger sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Adding…" : "Add subscription"}
            </Button>
          </div>
        </form>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">
          {sorted.length} subscription{sorted.length === 1 ? "" : "s"}
        </h2>
        <label className="flex items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={showZombiesOnly}
            onChange={(event) => setShowZombiesOnly(event.target.checked)}
            className="w-auto"
          />
          Zombies only
        </label>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          title={showZombiesOnly ? "No zombie subscriptions" : "No subscriptions yet"}
          description={
            showZombiesOnly
              ? "Nothing unused right now — nice."
              : "Add your team's first SaaS subscription above to start tracking spend."
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((sub, i) => {
            const zombie = isZombie(sub);
            const days = daysSinceLastUsed(sub.last_used_date);
            return (
              <AnimatedCard key={sub.id} index={i} className={zombie ? "border-danger" : undefined}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">
                      {sub.url ? (
                        <a href={sub.url} target="_blank" rel="noreferrer" className="text-fg">
                          {sub.tool_name}
                        </a>
                      ) : (
                        sub.tool_name
                      )}{" "}
                      {zombie && <span className="text-xs text-danger">zombie</span>}
                    </p>
                    <p className="text-xs text-muted">
                      {sub.owner_name}
                      {sub.category ? ` · ${sub.category}` : ""} ·{" "}
                      {days === null ? "never used" : `used ${days}d ago`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="font-mono text-sm">
                      {formatCents(sub.cost_cents)}/{sub.billing_cycle === "monthly" ? "mo" : "yr"}
                    </p>
                    <p className="text-xs text-muted">{formatCents(monthlyEquivalentCents(sub))}/mo</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-3 border-t border-border pt-3 text-xs">
                  <button type="button" onClick={() => markUsedToday(sub.id)} className="text-accent">
                    Mark used today
                  </button>
                  <button type="button" onClick={() => handleDelete(sub.id)} className="text-danger">
                    Delete
                  </button>
                </div>
              </AnimatedCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
