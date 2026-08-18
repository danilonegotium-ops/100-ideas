"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { createClient } from "@/lib/supabase/client";

export function VoteButton({
  proposalId,
  hasVoted,
  voteCount,
}: {
  proposalId: string;
  hasVoted: boolean;
  voteCount: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggleVote() {
    setBusy(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setBusy(false);
      return;
    }

    if (hasVoted) {
      await supabase
        .from("virtual_book_club_votes")
        .delete()
        .eq("proposal_id", proposalId)
        .eq("user_id", user.id);
    } else {
      await supabase.from("virtual_book_club_votes").insert({
        proposal_id: proposalId,
        user_id: user.id,
        voter_label: user.email,
      });
    }

    setBusy(false);
    router.refresh();
  }

  return (
    <Button
      variant={hasVoted ? "primary" : "secondary"}
      disabled={busy}
      onClick={toggleVote}
    >
      {hasVoted ? "Voted" : "Vote"} ({voteCount})
    </Button>
  );
}
