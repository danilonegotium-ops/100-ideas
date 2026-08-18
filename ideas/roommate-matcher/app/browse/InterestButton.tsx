"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";

export function InterestButton({
  toUserId,
  initialInterested,
  mutual,
}: {
  toUserId: string;
  initialInterested: boolean;
  mutual: boolean;
}) {
  const router = useRouter();
  const [interested, setInterested] = useState(initialInterested);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const res = await fetch("/api/interests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId }),
    });
    setPending(false);
    if (res.ok) {
      setInterested(true);
      router.refresh();
    }
  }

  if (mutual) {
    return <span className="text-sm font-medium text-accent">Mutual match!</span>;
  }
  if (interested) {
    return <span className="text-sm text-muted">Interested ✓</span>;
  }
  return (
    <Button variant="secondary" onClick={handleClick} disabled={pending}>
      {pending ? "Sending…" : "I'm interested"}
    </Button>
  );
}
