"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

export function NewPropertyForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [platformFeePct, setPlatformFeePct] = useState("3");
  const [cleaningFee, setCleaningFee] = useState("0");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setErrorMessage("");

    const res = await fetch("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        address,
        defaultPlatformFeePct: Number(platformFeePct),
        defaultCleaningFee: Number(cleaningFee),
      }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setStatus("error");
      setErrorMessage(data.error || "Something went wrong. Try again.");
      return;
    }

    setStatus("idle");
    setName("");
    setAddress("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        + Add property
      </Button>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label htmlFor="name">Property name</label>
          <input
            id="name"
            required
            maxLength={200}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Vracar 2BR"
          />
        </div>
        <div>
          <label htmlFor="address">Address (optional)</label>
          <input
            id="address"
            maxLength={300}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="platformFeePct">Default platform fee %</label>
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
            <label htmlFor="cleaningFee">Default cleaning fee</label>
            <input
              id="cleaningFee"
              type="number"
              min={0}
              step="0.01"
              value={cleaningFee}
              onChange={(e) => setCleaningFee(e.target.value)}
            />
          </div>
        </div>
        {status === "error" && <p className="text-sm text-danger">{errorMessage}</p>}
        <div className="flex gap-3">
          <Button type="submit" disabled={status === "saving"}>
            {status === "saving" ? "Saving…" : "Add property"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
