"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

type DeliveryOption = "5y" | "10y" | "custom";
type Status = "idle" | "saving" | "error";

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
    </Card>
  );
}
