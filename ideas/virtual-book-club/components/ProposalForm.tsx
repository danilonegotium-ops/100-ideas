"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { createClient } from "@/lib/supabase/client";

export function ProposalForm({ clubId }: { clubId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setErrorMessage("");

    if (!title.trim()) {
      setStatus("error");
      setErrorMessage("Enter a book title.");
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

    const { error } = await supabase.from("virtual_book_club_proposals").insert({
      club_id: clubId,
      title: title.trim(),
      author: author.trim() || null,
      proposed_by: user.id,
      proposed_by_label: user.email,
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setTitle("");
    setAuthor("");
    setStatus("idle");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Book title"
        className="flex-1"
      />
      <input
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        placeholder="Author (optional)"
        className="flex-1"
      />
      <Button type="submit" disabled={status === "saving"}>
        {status === "saving" ? "Adding…" : "Propose"}
      </Button>
      {status === "error" && <p className="text-sm text-danger">{errorMessage}</p>}
    </form>
  );
}
