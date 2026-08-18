"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { createClient } from "@/lib/supabase/client";

export function PromoteBookButton({
  clubId,
  title,
  author,
}: {
  clubId: string;
  title: string;
  author: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    const supabase = createClient();
    await supabase
      .from("virtual_book_club_clubs")
      .update({ current_book_title: title, current_book_author: author })
      .eq("id", clubId);
    setBusy(false);
    router.refresh();
  }

  return (
    <Button variant="secondary" disabled={busy} onClick={handleClick}>
      {busy ? "Setting…" : "Set as current book"}
    </Button>
  );
}
