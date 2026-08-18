"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { createClient } from "@/lib/supabase/client";

/**
 * One-time "what should we call you on the leaderboard" step, shown the
 * first time a logged-in user opens a lesson and has no
 * `financial_literacy_teens_profiles` row yet. Deliberately teen-chosen
 * (first name or initials), never derived from their email, per the
 * task's "no sensitive data" requirement for the leaderboard.
 */
export function ChooseNameForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setErrorMessage("");

    const trimmed = name.trim();
    if (!trimmed) {
      setStatus("error");
      setErrorMessage("Enter a first name or initials.");
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setStatus("error");
      setErrorMessage("Your session expired — please log in again.");
      return;
    }

    const { error } = await supabase
      .from("financial_literacy_teens_profiles")
      .upsert(
        { user_id: user.id, display_name: trimmed.slice(0, 40) },
        { onConflict: "user_id" },
      );

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    router.refresh();
  }

  return (
    <Card>
      <h2 className="mb-2 text-sm font-semibold text-fg">
        One quick thing before you start
      </h2>
      <p className="mb-3 text-sm text-muted">
        What should we show on the leaderboard? Use a first name or
        initials — not your full name or email.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Jordan, or J.K."
          maxLength={40}
        />
        <Button type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Saving…" : "Continue"}
        </Button>
      </form>
      {status === "error" && (
        <p className="mt-2 text-sm text-danger">{errorMessage}</p>
      )}
    </Card>
  );
}
