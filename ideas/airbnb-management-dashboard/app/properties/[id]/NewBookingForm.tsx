"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { computeNetProfit, formatMoney } from "@/lib/money";

export function NewBookingForm({
  propertyId,
  defaultPlatformFeePct,
  defaultCleaningFee,
}: {
  propertyId: string;
  defaultPlatformFeePct: number;
  defaultCleaningFee: number;
}) {
  const router = useRouter();
  const [guestName, setGuestName] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [grossPayout, setGrossPayout] = useState("");
  const [platformFeePct, setPlatformFeePct] = useState(String(defaultPlatformFeePct));
  const [cleaningFee, setCleaningFee] = useState(String(defaultCleaningFee));
  const [otherCosts, setOtherCosts] = useState("0");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const previewNet = useMemo(() => {
    const gross = Number(grossPayout);
    if (!Number.isFinite(gross) || grossPayout === "") return null;
    return computeNetProfit({
      gross_payout: gross,
      platform_fee_pct: Number(platformFeePct) || 0,
      cleaning_fee: Number(cleaningFee) || 0,
      other_costs: Number(otherCosts) || 0,
    });
  }, [grossPayout, platformFeePct, cleaningFee, otherCosts]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setErrorMessage("");

    const res = await fetch(`/api/properties/${propertyId}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guestName,
        checkIn,
        checkOut,
        grossPayout: Number(grossPayout),
        platformFeePct: Number(platformFeePct),
        cleaningFee: Number(cleaningFee),
        otherCosts: Number(otherCosts),
        notes,
      }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setStatus("error");
      setErrorMessage(data.error || "Something went wrong. Try again.");
      return;
    }

    setStatus("idle");
    setGuestName("");
    setCheckIn("");
    setCheckOut("");
    setGrossPayout("");
    setOtherCosts("0");
    setNotes("");
    router.refresh();
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label htmlFor="guestName">Guest name (optional)</label>
          <input
            id="guestName"
            maxLength={200}
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="checkIn">Check-in</label>
            <input
              id="checkIn"
              type="date"
              required
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label htmlFor="checkOut">Check-out</label>
            <input
              id="checkOut"
              type="date"
              required
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label htmlFor="grossPayout">Gross payout</label>
          <input
            id="grossPayout"
            type="number"
            required
            min={0}
            step="0.01"
            value={grossPayout}
            onChange={(e) => setGrossPayout(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="platformFeePct">Platform fee %</label>
            <input
              id="platformFeePct"
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={platformFeePct}
              onChange={(e) => setPlatformFeePct(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label htmlFor="cleaningFee">Cleaning fee</label>
            <input
              id="cleaningFee"
              type="number"
              min={0}
              step="0.01"
              value={cleaningFee}
              onChange={(e) => setCleaningFee(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label htmlFor="otherCosts">Other costs</label>
            <input
              id="otherCosts"
              type="number"
              min={0}
              step="0.01"
              value={otherCosts}
              onChange={(e) => setOtherCosts(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label htmlFor="notes">Notes (optional)</label>
          <input
            id="notes"
            maxLength={500}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. replaced a broken lamp"
          />
        </div>
        {previewNet !== null && (
          <p className="text-sm text-muted">
            Estimated net profit:{" "}
            <span className="font-semibold text-accent">{formatMoney(previewNet)}</span>
          </p>
        )}
        {status === "error" && <p className="text-sm text-danger">{errorMessage}</p>}
        <Button type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Saving…" : "Add booking"}
        </Button>
      </form>
    </Card>
  );
}
