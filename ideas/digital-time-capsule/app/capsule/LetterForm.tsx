"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

type DeliveryOption = "5y" | "10y" | "custom";
type Status = "idle" | "saving" | "error";

const SEAL_CONFIRMATION_MS = 1600;

/**
 * Real network calls only happen inside `handleSubmit`, never during
 * render. This form posts to `/api/letters` (a Route Handler using the
 * server Supabase client), rather than calling `createClient()` directly
 * from the browser, so delivery-date validation stays in one place.
 */
export function LetterForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>("5y");
  const [customDate, setCustomDate] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [showSealedConfirmation, setShowSealedConfirmation] = useState(false);

  // Auto-dismiss the sealing ceremony overlay a beat after it appears.
  useEffect(() => {
    if (!showSealedConfirmation) return;
    const timer = window.setTimeout(() => setShowSealedConfirmation(false), SEAL_CONFIRMATION_MS);
    return () => window.clearTimeout(timer);
  }, [showSealedConfirmation]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setErrorMessage("");

    const res = await fetch("/api/letters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        body,
        deliveryOption,
        customDate: deliveryOption === "custom" ? customDate : undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setStatus("error");
      setErrorMessage(data.error || "Something went wrong. Try again.");
      return;
    }

    setStatus("idle");
    setTitle("");
    setBody("");
    setCustomDate("");
    setShowSealedConfirmation(true);
    // Re-fetch the Server Component above (the letter list) so the new
    // letter shows up without a full page reload.
    router.refresh();
  }

  const minCustomDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label htmlFor="title">Title (optional)</label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Dear future me..."
            maxLength={200}
          />
        </div>

        <div>
          <label htmlFor="body">Your letter</label>
          <textarea
            id="body"
            required
            rows={8}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write whatever you want your future self to read."
            maxLength={20000}
          />
        </div>

        <div>
          <label htmlFor="delivery">Deliver in</label>
          <select
            id="delivery"
            value={deliveryOption}
            onChange={(e) => setDeliveryOption(e.target.value as DeliveryOption)}
          >
            <option value="5y">5 years</option>
            <option value="10y">10 years</option>
            <option value="custom">A custom date</option>
          </select>
        </div>

        {deliveryOption === "custom" && (
          <div>
            <label htmlFor="customDate">Delivery date</label>
            <input
              id="customDate"
              type="date"
              required
              min={minCustomDate}
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
            />
          </div>
        )}

        {status === "error" && (
          <p className="text-sm text-danger">{errorMessage}</p>
        )}

        <Button type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Sealing letter…" : "Seal and schedule"}
        </Button>
      </form>

      {/* Sealing ceremony: a brief confirmation moment when a capsule is
          sealed, purely presentational — the letter was already saved by
          the fetch above by the time this renders. */}
      <AnimatePresence>
        {showSealedConfirmation && (
          <motion.div
            key="sealed-confirmation-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-bg/70 backdrop-blur-sm"
            role="status"
            aria-live="polite"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
              className="glass glow-accent flex flex-col items-center gap-3 rounded-xl2 px-8 py-10 text-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.15, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-accent"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <motion.path
                    d="M5 13l4 4L19 7"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
                  />
                </svg>
              </motion.div>
              <p className="text-title text-fg">Sealed</p>
              <p className="max-w-xs text-sm text-muted">
                Your letter is locked away until its delivery date. Nobody
                — not even you — can read it before then.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
