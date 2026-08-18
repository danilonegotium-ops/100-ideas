"use client";

import { useTransition } from "react";
import { Button } from "@/components/Button";
import { signOut } from "@/app/dashboard/actions";

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button variant="secondary" disabled={isPending} onClick={() => startTransition(() => signOut())}>
      {isPending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
