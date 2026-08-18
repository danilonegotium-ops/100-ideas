"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { createClient } from "@/lib/supabase/client";

export function NewClubForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setErrorMessage("");

    if (!name.trim()) {
      setStatus("error");
      setErrorMessage("Give your club a name.");
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

    const { data: club, error: clubError } = await supabase
      .from("virtual_book_club_clubs")
      .insert({ name: name.trim(), created_by: user.id })
      .select("id")
      .single();

    if (clubError || !club) {
      setStatus("error");
      setErrorMessage(clubError?.message ?? "Couldn't create the club.");
      return;
    }

    const { error: memberError } = await supabase
      .from("virtual_book_club_members")
      .insert({ club_id: club.id, user_id: user.id, member_label: user.email });

    if (memberError) {
      setStatus("error");
      setErrorMessage(memberError.message);
      return;
    }

    router.push(`/clubs/${club.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="name">Club name</label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. The Late Night Chapter Club"
          required
        />
      </div>
      {status === "error" && <p className="text-sm text-danger">{errorMessage}</p>}
      <Button type="submit" disabled={status === "saving"}>
        {status === "saving" ? "Creating…" : "Create club"}
      </Button>
    </form>
  );
}
