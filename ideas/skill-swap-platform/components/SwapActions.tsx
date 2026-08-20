"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/Button";
import { createClient } from "@/lib/supabase/client";

type Status = "pending" | "accepted" | "declined" | "cancelled";

/**
 * Accept/decline (or cancel) controls for a pending swap. Tier 2 design
 * pass: accepting now shows an immediate "Matched!" micro-interaction
 * (spring scale-in) instead of just going quiet while `router.refresh()`
 * catches up with the server — `justMatched` is local optimistic state,
 * not a new source of truth (the row's actual status still comes from the
 * server via the `status` prop after refresh).
 */
export function SwapActions({
  swapId,
  role,
  status,
}: {
  swapId: string;
  role: "requester" | "target";
  status: Status;
}) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [busy, setBusy] = useState(false);
  const [justMatched, setJustMatched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(next: Status) {
    setBusy(true);
    setError(null);
    if (next === "accepted") {
      setJustMatched(true);
    }
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("skill_swap_platform_swaps")
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq("id", swapId);
    if (updateError) {
      // Roll back the optimistic "Matched!" state — the row's status never
      // actually changed server-side, so the UI shouldn't claim it did.
      setJustMatched(false);
      setError("Couldn't update this swap. Try again.");
    }
    setBusy(false);
    router.refresh();
  }

  if (status !== "pending" && !justMatched) {
    return null;
  }

  return (
    <>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      <AnimatePresence mode="wait" initial={false}>
        {justMatched ? (
          <motion.p
            key="matched"
            initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            className="mt-2 text-sm font-semibold text-accent-strong"
          >
            🤝 Matched! You can coordinate the details outside the app.
          </motion.p>
        ) : role === "target" ? (
          <motion.div
            key="target-actions"
            initial={prefersReducedMotion ? undefined : { opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 flex gap-2"
          >
            <Button
              variant="primary"
              disabled={busy}
              onClick={() => setStatus("accepted")}
            >
              Accept
            </Button>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => setStatus("declined")}
            >
              Decline
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="requester-actions"
            initial={prefersReducedMotion ? undefined : { opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2"
          >
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => setStatus("cancelled")}
            >
              Cancel request
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
