"use client";

import { useTransition } from "react";
import { Button } from "@/components/Button";

export function SignOutButton({ action }: { action: () => Promise<void> }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button variant="secondary" disabled={isPending} onClick={() => startTransition(() => action())}>
      {isPending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
