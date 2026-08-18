"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { createClient } from "@/lib/supabase/client";

export function InviteForm({ clubId }: { clubId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "sent" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setErrorMessage("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setStatus("error");
      setErrorMessage("Your session expired — please log in again.");
      return;
    }

    const { error } = await supabase.from("virtual_book_club_invites").insert({
      club_id: clubId,
      email: email.trim().toLowerCase(),
      invited_by: user.id,
    });

    if (error) {
      setStatus("error");
      setErrorMessage(
        error.code === "23505"
          ? "That email is already invited."
          : error.message,
      );
      return;
    }

    setStatus("sent");
    setEmail("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "sent") setStatus("idle");
          }}
          placeholder="friend@example.com"
        />
        <Button type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Inviting…" : "Invite"}
        </Button>
      </div>
      {status === "error" && <p className="text-sm text-danger">{errorMessage}</p>}
      {status === "sent" && <p className="text-sm text-muted">Added.</p>}
    </form>
  );
}
