"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

type Status = "idle" | "saving" | "error";

export function NewListingForm() {
  const router = useRouter();
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [city, setCity] = useState("");
  const [note, setNote] = useState("");
  const [contactHint, setContactHint] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setErrorMessage("");

    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventName, eventDate, city, note, contactHint }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setStatus("error");
      setErrorMessage(data.error || "Something went wrong. Try again.");
      return;
    }

    router.push(`/listings/${data.listing.id}`);
  }

  const todayValue = new Date().toISOString().slice(0, 10);

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label htmlFor="eventName">Event name</label>
          <input
            id="eventName"
            required
            maxLength={200}
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="e.g. EXIT Festival"
          />
        </div>

        <div>
          <label htmlFor="eventDate">Event date</label>
          <input
            id="eventDate"
            type="date"
            required
            min={todayValue}
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="city">City</label>
          <input
            id="city"
            required
            maxLength={100}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Novi Sad"
          />
        </div>

        <div>
          <label htmlFor="note">Note (optional)</label>
          <textarea
            id="note"
            rows={3}
            maxLength={1000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything a potential buddy should know — which day, what you're into, vibe, etc."
          />
        </div>

        <div>
          <label htmlFor="contactHint">How should people reach you? (optional)</label>
          <input
            id="contactHint"
            maxLength={300}
            value={contactHint}
            onChange={(e) => setContactHint(e.target.value)}
            placeholder="e.g. Instagram @handle — otherwise they'll just see your account email"
          />
        </div>

        {status === "error" && <p className="text-sm text-danger">{errorMessage}</p>}

        <Button type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Posting…" : "Post listing"}
        </Button>
      </form>
    </Card>
  );
}
