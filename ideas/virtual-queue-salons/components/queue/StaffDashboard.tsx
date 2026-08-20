"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { createClient } from "@/lib/supabase/client";
import { AnimatedCard } from "@/components/motion/AnimatedCard";

interface EntryRow {
  id: string;
  customer_name: string;
  customer_email: string | null;
  party_size: number;
  status: string;
  joined_at: string;
  called_at: string | null;
}

/**
 * Staff view — no login in this MVP (see schema.sql / SPEC.md for the
 * scope note). "Call next" calls the longest-waiting customer; the
 * customer's own tab (components/queue/QueueJoinClient.tsx) updates
 * automatically via the same Realtime subscription.
 */
export function StaffDashboard({ shopId }: { shopId: string }) {
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("virtual_queue_salons_entries")
      .select("id, customer_name, customer_email, party_size, status, joined_at, called_at")
      .eq("shop_id", shopId)
      .in("status", ["waiting", "called"])
      .order("joined_at", { ascending: true });
    setEntries(data ?? []);
    setLoading(false);
  }, [shopId]);

  useEffect(() => {
    refresh();
    const supabase = createClient();
    const channel = supabase
      .channel(`vqs-staff-${shopId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "virtual_queue_salons_entries",
          filter: `shop_id=eq.${shopId}`,
        },
        () => refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId, refresh]);

  const waiting = entries.filter((entry) => entry.status === "waiting");
  const called = entries.filter((entry) => entry.status === "called");

  async function updateStatus(id: string, status: string, extra: Record<string, unknown> = {}) {
    setBusyId(id);
    const supabase = createClient();
    await supabase
      .from("virtual_queue_salons_entries")
      .update({ status, ...extra })
      .eq("id", id);
    setBusyId(null);
  }

  async function callNext() {
    const next = waiting[0];
    if (!next) return;
    await updateStatus(next.id, "called", { called_at: new Date().toISOString() });
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading queue…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">{waiting.length} waiting</p>
            <p className="text-xs text-muted">Oldest first</p>
          </div>
          <Button onClick={callNext} disabled={waiting.length === 0}>
            Call next
          </Button>
        </div>
      </Card>

      {called.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-accent">Called — waiting at desk</h2>
          <div className="flex flex-col gap-2">
            {called.map((entry, index) => (
              <AnimatedCard
                key={entry.id}
                index={index}
                hoverLift={false}
                className="flex items-center justify-between gap-3 !border-accent/40"
              >
                <div>
                  <p className="font-medium">{entry.customer_name}</p>
                  <p className="text-xs text-muted">
                    Party of {entry.party_size}
                    {entry.customer_email ? ` · ${entry.customer_email}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busyId === entry.id}
                    onClick={() => updateStatus(entry.id, "served", { served_at: new Date().toISOString() })}
                    className="text-sm text-accent"
                  >
                    Mark served
                  </button>
                  <button
                    type="button"
                    disabled={busyId === entry.id}
                    onClick={() => updateStatus(entry.id, "waiting", { called_at: null })}
                    className="text-sm text-muted"
                  >
                    Back to waiting
                  </button>
                </div>
              </AnimatedCard>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-2 text-sm font-semibold">Waiting</h2>
        {waiting.length === 0 ? (
          <p className="text-sm text-muted">No one waiting right now.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {waiting.map((entry, index) => (
              <AnimatedCard key={entry.id} index={index} hoverLift={false} className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">
                    #{index + 1} {entry.customer_name}
                  </p>
                  <p className="text-xs text-muted">
                    Party of {entry.party_size}
                    {entry.customer_email ? ` · ${entry.customer_email}` : ""} · joined{" "}
                    {new Date(entry.joined_at).toLocaleTimeString()}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busyId === entry.id}
                  onClick={() => updateStatus(entry.id, "cancelled")}
                  className="text-sm text-danger"
                >
                  Remove
                </button>
              </AnimatedCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
