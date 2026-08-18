"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/Button";

/**
 * Lets a member (no login — identified purely by the token in the URL)
 * paste/update the meeting link for their current pairing. Posts to
 * `/api/m/[token]/link`, which re-resolves "this token's current pairing"
 * server-side rather than trusting a client-supplied pairing id.
 */
export function LinkEditor({
  token,
  initialLink,
}: {
  token: string;
  initialLink: string;
}) {
  const [link, setLink] = useState(initialLink);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setErrorMessage("");

    const res = await fetch(`/api/m/${token}/link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ link }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus("error");
      setErrorMessage(body.error ?? "Failed to save link.");
      return;
    }

    setStatus("saved");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <input
        type="url"
        placeholder="Paste a meeting link (Google Meet, Zoom…)"
        value={link}
        onChange={(event) => {
          setLink(event.target.value);
          setStatus("idle");
        }}
      />
      <Button type="submit" disabled={status === "saving"}>
        {status === "saving"
          ? "Saving…"
          : status === "saved"
            ? "Saved"
            : "Save link"}
      </Button>
      {status === "error" && (
        <p className="text-sm text-danger">{errorMessage}</p>
      )}
    </form>
  );
}
