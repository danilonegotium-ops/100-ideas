"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { createClient } from "@/lib/supabase/client";

type Status = "pending" | "accepted" | "declined" | "cancelled";

export function SwapActions({
  swapId,
  role,
  status,
}: {
  swapId: string;
  role: "requester" | "target";
  status: Status;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setStatus(next: Status) {
    setBusy(true);
    const supabase = createClient();
    await supabase
      .from("skill_swap_platform_swaps")
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq("id", swapId);
    setBusy(false);
    router.refresh();
  }

  if (status !== "pending") {
    return null;
  }

  if (role === "target") {
    return (
      <div className="mt-2 flex gap-2">
        <Button
          variant="primary"
          disabled={busy}
          onClick={() => setStatus("accepted")}
        >
          Accept
        </Button>
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => setStatus("declined")}
        >
          Decline
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <Button
        variant="secondary"
        disabled={busy}
        onClick={() => setStatus("cancelled")}
      >
        Cancel request
      </Button>
    </div>
  );
}
