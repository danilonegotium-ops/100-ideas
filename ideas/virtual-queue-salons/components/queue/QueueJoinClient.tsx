"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { createClient } from "@/lib/supabase/client";

interface EntryRow {
  id: string;
  customer_name: string;
  status: string;
  joined_at: string;
}

function storageKeyFor(shopId: string) {
  return `vqs-entry-${shopId}`;
}

/**
 * Customer-facing join form + live position view. No login — a joined
 * customer's entry id is remembered in localStorage so refreshing the page
 * (or closing and reopening it) keeps showing their live position instead
 * of the join form again. Position/status updates arrive via a Supabase
 * Realtime subscription on `virtual_queue_salons_entries` filtered to this
 * shop (see schema.sql for why that table is public-read).
 */
export function QueueJoinClient({ shopId, shopName }: { shopId: string; shopName: string }) {
  const storageKey = storageKeyFor(shopId);
  const [hydrated, setHydrated] = useState(false);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [ownEntry, setOwnEntry] = useState<EntryRow | null>(null);
  const [waitingEntries, setWaitingEntries] = useState<EntryRow[]>([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEntryId(window.localStorage.getItem(storageKey));
    setHydrated(true);
  }, [storageKey]);

  const refresh = useCallback(
    async (currentEntryId: string | null) => {
      const supabase = createClient();
      const { data: waiting } = await supabase
        .from("virtual_queue_salons_entries")
        .select("id, customer_name, status, joined_at")
        .eq("shop_id", shopId)
        .eq("status", "waiting")
        .order("joined_at", { ascending: true });
      setWaitingEntries(waiting ?? []);

      if (currentEntryId) {
        const { data: own } = await supabase
          .from("virtual_queue_salons_entries")
          .select("id, customer_name, status, joined_at")
          .eq("id", currentEntryId)
          .maybeSingle();
        setOwnEntry(own ?? null);
      }
    },
    [shopId],
  );

  useEffect(() => {
    if (!hydrated) return;
    refresh(entryId);

    const supabase = createClient();
    const channel = supabase
      .channel(`vqs-join-${shopId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "virtual_queue_salons_entries",
          filter: `shop_id=eq.${shopId}`,
        },
        () => refresh(entryId),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh recreated per shopId, entryId changes are handled explicitly below
  }, [hydrated, shopId, entryId]);

  async function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    setJoining(true);
    setError(null);

    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("virtual_queue_salons_entries")
      .insert({
        shop_id: shopId,
        customer_name: name.trim(),
        customer_email: email.trim() || null,
        party_size: partySize,
      })
      .select("id, customer_name, status, joined_at")
      .single();

    setJoining(false);

    if (insertError || !data) {
      setError(insertError?.message ?? "Couldn't join the queue — try again.");
      return;
    }

    window.localStorage.setItem(storageKey, data.id);
    setEntryId(data.id);
    setOwnEntry(data);
  }

  async function handleLeave() {
    if (entryId) {
      const supabase = createClient();
      await supabase
        .from("virtual_queue_salons_entries")
        .update({ status: "cancelled" })
        .eq("id", entryId);
    }
    window.localStorage.removeItem(storageKey);
    setEntryId(null);
    setOwnEntry(null);
    setName("");
    setEmail("");
  }

  if (!hydrated) return null;

  const showJoinForm =
    !entryId || !ownEntry || ownEntry.status === "cancelled" || ownEntry.status === "served";

  if (showJoinForm) {
    return (
      <Card>
        {ownEntry?.status === "served" && (
          <p className="mb-3 text-sm text-muted">
            You were served — thanks for visiting {shopName}!
          </p>
        )}
        {ownEntry?.status === "cancelled" && (
          <p className="mb-3 text-sm text-muted">Your spot was cancelled.</p>
        )}
        <form onSubmit={handleJoin} className="flex flex-col gap-3">
          <div>
            <label htmlFor="customer-name">Your name</label>
            <input
              id="customer-name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Jane Doe"
            />
          </div>
          <div>
            <label htmlFor="customer-email">Email (optional — we&apos;ll only use it to notify you)</label>
            <input
              id="customer-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="jane@example.com"
            />
          </div>
          <div>
            <label htmlFor="party-size">Party size</label>
            <input
              id="party-size"
              type="number"
              min={1}
              value={partySize}
              onChange={(event) => setPartySize(Math.max(1, Number(event.target.value) || 1))}
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={joining}>
            {joining ? "Joining…" : "Join the queue"}
          </Button>
        </form>
      </Card>
    );
  }

  const position =
    ownEntry.status === "waiting"
      ? waitingEntries.findIndex((entry) => entry.id === ownEntry.id) + 1
      : null;

  return (
    <Card>
      {ownEntry.status === "called" ? (
        <div>
          <p className="mb-1 text-lg font-semibold text-accent">You&apos;re up!</p>
          <p className="text-sm text-muted">Head over to the front desk at {shopName}.</p>
        </div>
      ) : (
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-lg font-semibold">
            {position && position > 0 ? (
              <>
                <span>You&apos;re #</span>
                <span className="relative inline-block h-[1.3em] overflow-hidden align-middle" style={{ minWidth: "1.4ch" }}>
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={position}
                      initial={{ y: "-100%", opacity: 0 }}
                      animate={{ y: "0%", opacity: 1 }}
                      exit={{ y: "100%", opacity: 0 }}
                      transition={{ type: "spring", stiffness: 320, damping: 28 }}
                      className="inline-block tabular-nums text-accent"
                    >
                      {position}
                    </motion.span>
                  </AnimatePresence>
                </span>
                <span>in line</span>
              </>
            ) : (
              "You're in the queue"
            )}
          </p>
          <p className="text-sm text-muted">
            {waitingEntries.length} {waitingEntries.length === 1 ? "person" : "people"} waiting at{" "}
            {shopName}. This page updates live — no need to refresh.
          </p>
        </div>
      )}
      <button type="button" onClick={handleLeave} className="mt-4 text-xs text-muted underline">
        Not me / leave the queue
      </button>
    </Card>
  );
}
