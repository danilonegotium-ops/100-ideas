"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/Button";

type Status = "idle" | "sending" | "subscribed" | "already" | "error";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error ?? "Something went wrong.");
        return;
      }

      setStatus(data.status === "already_subscribed" ? "already" : "subscribed");
    } catch {
      setStatus("error");
      setErrorMessage("Couldn't reach the server — try again.");
    }
  }

  if (status === "subscribed") {
    return <p className="text-sm text-fg">You&apos;re in — welcome aboard.</p>;
  }
  if (status === "already") {
    return <p className="text-sm text-fg">You&apos;re already subscribed with that email.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="flex-1">
        <label htmlFor="email" className="sr-only">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={status === "sending"}
        />
        {status === "error" && (
          <p className="mt-1 text-sm text-danger">{errorMessage}</p>
        )}
      </div>
      <Button type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Signing up…" : "Subscribe"}
      </Button>
    </form>
  );
}
