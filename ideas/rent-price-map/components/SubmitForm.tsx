"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { LocationPickerLoader } from "@/components/LocationPickerLoader";
import { ROOM_OPTIONS, roomLabel } from "@/lib/rooms";
import { MAX_NOTE_LENGTH } from "@/lib/validation";

type Status = "idle" | "submitting" | "error";

export function SubmitForm() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!location) {
      setErrorMessage("Click the map to mark roughly where the apartment is.");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const sizeRaw = String(formData.get("size_m2") || "").trim();
    const noteRaw = String(formData.get("note") || "").trim();

    const payload = {
      city: String(formData.get("city") || "").trim(),
      neighborhood: String(formData.get("neighborhood") || "").trim(),
      rent_eur: Number(formData.get("rent_eur")),
      rooms: String(formData.get("rooms") || ""),
      size_m2: sizeRaw ? Number(sizeRaw) : null,
      note: noteRaw || null,
      lat: location.lat,
      lng: location.lng,
    };

    setStatus("submitting");

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error || "Something went wrong. Please try again.");
        return;
      }

      router.push("/?submitted=1");
    } catch {
      setStatus("error");
      setErrorMessage("Network error — please try again.");
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label htmlFor="city">City</label>
          <input id="city" name="city" type="text" required maxLength={100} placeholder="Belgrade" />
        </div>

        <div>
          <label htmlFor="neighborhood">Neighborhood</label>
          <input
            id="neighborhood"
            name="neighborhood"
            type="text"
            required
            maxLength={100}
            placeholder="Vračar"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="rent_eur">Monthly rent (EUR)</label>
            <input
              id="rent_eur"
              name="rent_eur"
              type="number"
              required
              min={1}
              step="1"
              placeholder="450"
            />
          </div>
          <div>
            <label htmlFor="rooms">Rooms</label>
            <select id="rooms" name="rooms" required defaultValue="">
              <option value="" disabled>
                Choose
              </option>
              {ROOM_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {roomLabel(option)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="size_m2">Size in m² (optional)</label>
          <input id="size_m2" name="size_m2" type="number" min={1} step="1" placeholder="45" />
        </div>

        <div>
          <label htmlFor="note">Note (optional)</label>
          <textarea
            id="note"
            name="note"
            rows={2}
            maxLength={MAX_NOTE_LENGTH}
            placeholder="e.g. utilities included, furnished, near a tram stop"
          />
        </div>

        <div>
          <label>Location</label>
          <LocationPickerLoader onChange={(lat, lng) => setLocation({ lat, lng })} />
        </div>

        {errorMessage && <p className="text-sm text-danger">{errorMessage}</p>}

        <p className="text-xs text-muted">
          This report is completely anonymous — we don&apos;t collect your
          name, email, or IP address, and there&apos;s no way to trace it
          back to you. Once submitted, nobody using the public site (not
          even the original submitter) can edit or delete it.
        </p>

        <Button type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? "Submitting…" : "Submit report"}
        </Button>
      </form>
    </Card>
  );
}
