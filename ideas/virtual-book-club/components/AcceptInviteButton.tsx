"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { createClient } from "@/lib/supabase/client";

export function AcceptInviteButton({ clubId }: { clubId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleAccept() {
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

    const { error } = await supabase.from("virtual_book_club_members").insert({
      club_id: clubId,
      user_id: user.id,
      member_label: user.email,
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <Button onClick={handleAccept} disabled={status === "saving"}>
        {status === "saving" ? "Joining…" : "Accept invite"}
      </Button>
      {status === "error" && (
        <p className="mt-2 text-sm text-danger">{errorMessage}</p>
      )}
    </div>
  );
}
