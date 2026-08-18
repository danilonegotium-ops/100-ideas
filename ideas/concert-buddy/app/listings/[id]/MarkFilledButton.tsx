"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";

export function MarkFilledButton({
  listingId,
  isFilled,
}: {
  listingId: string;
  isFilled: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    await fetch(`/api/listings/${listingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_filled: !isFilled }),
    });
    setPending(false);
    router.refresh();
  }

  return (
    <Button variant="secondary" onClick={handleClick} disabled={pending}>
      {pending ? "Updating…" : isFilled ? "Mark as open again" : "Found a buddy — mark as filled"}
    </Button>
  );
}
