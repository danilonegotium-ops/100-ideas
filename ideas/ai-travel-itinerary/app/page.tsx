"use client";

import { FormEvent, useState } from "react";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { MAX_CITY_LENGTH, MAX_DAYS, MIN_DAYS, type ItineraryResult } from "@/lib/itinerary";

type Status = "idle" | "loading" | "done" | "error" | "not_configured";

export default function Home() {
  const [city, setCity] = useState("");
  const [days, setDays] = useState(3);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<ItineraryResult | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage("");
    setResult(null);

    try {
      const res = await fetch("/api/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, days }),
      });
      const data = await res.json();

      if (res.status === 503 && data.error === "not_configured") {
        setStatus("not_configured");
        return;
      }
      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.message || "Something went wrong.");
        return;
      }

      setResult(data.result);
      setStatus("done");
    } catch {
      setStatus("error");
      setErrorMessage("Couldn't reach the server. Check your connection and try again.");
    }
  }

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">AI Travel Itinerary</h1>
        <p className="mb-6 text-muted">
          Enter a city and how many days you&apos;ll be there. You&apos;ll get a
          day-by-day plan that mixes well-known spots with hidden gems most
          tourist guides skip.
        </p>

        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label htmlFor="city">City</label>
              <input
                id="city"
                name="city"
                type="text"
                required
                maxLength={MAX_CITY_LENGTH}
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="e.g. Belgrade, Lisbon, Tokyo"
                disabled={status === "loading"}
              />
            </div>
            <div>
              <label htmlFor="days">Trip length (days)</label>
              <input
                id="days"
                name="days"
                type="number"
                min={MIN_DAYS}
                max={MAX_DAYS}
                required
                value={days}
                onChange={(event) => setDays(Number(event.target.value))}
                disabled={status === "loading"}
              />
            </div>

            {status === "error" && <p className="text-sm text-danger">{errorMessage}</p>}
            {status === "not_configured" && (
              <p className="text-sm text-danger">
                AI isn&apos;t configured yet on this deployment — the site owner
                needs to set a Google AI Studio API key. Nothing you did wrong.
              </p>
            )}

            <Button type="submit" disabled={status === "loading"}>
              {status === "loading" ? "Planning your trip…" : "Generate itinerary"}
            </Button>
          </form>
        </Card>

        {result && (
          <div className="mt-6 flex flex-col gap-4">
            <Card>
              <h2 className="mb-2 text-lg font-semibold">
                {result.days}-day trip to {result.city}
              </h2>
              <p className="text-sm text-muted">{result.summary}</p>
            </Card>

            {result.itinerary.map((day) => (
              <Card key={day.day}>
                <h3 className="mb-3 text-base font-semibold">
                  Day {day.day}
                  {day.theme ? ` — ${day.theme}` : ""}
                </h3>
                <div className="flex flex-col gap-3">
                  <Section label="Morning" activity={day.morning} />
                  <Section label="Afternoon" activity={day.afternoon} />
                  <Section label="Evening" activity={day.evening} />
                  <div className="rounded-brand border-2 border-accent bg-bg p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent-strong">
                      Hidden gem
                    </p>
                    <p className="text-sm font-medium text-fg">{day.hiddenGem.title}</p>
                    <p className="text-sm text-muted">{day.hiddenGem.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function Section({
  label,
  activity,
}: {
  label: string;
  activity: { title: string; description: string };
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="text-sm font-medium text-fg">{activity.title}</p>
      <p className="text-sm text-muted">{activity.description}</p>
    </div>
  );
}
