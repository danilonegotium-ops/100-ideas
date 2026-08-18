"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { createClient } from "@/lib/supabase/client";

export function ProposeSwapForm({
  targetProfileId,
  myTeachSkills,
  targetTeachSkills,
}: {
  targetProfileId: string;
  myTeachSkills: string[];
  targetTeachSkills: string[];
}) {
  const router = useRouter();
  const [offeredSkill, setOfferedSkill] = useState(myTeachSkills[0] ?? "");
  const [requestedSkill, setRequestedSkill] = useState(
    targetTeachSkills[0] ?? "",
  );
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "sent" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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

    const { error } = await supabase.from("skill_swap_platform_swaps").insert({
      requester_user_id: user.id,
      target_profile_id: targetProfileId,
      offered_skill: offeredSkill,
      requested_skill: requestedSkill,
      message: message.trim() || null,
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setStatus("sent");
    router.refresh();
  }

  if (status === "sent") {
    return (
      <p className="text-sm text-fg">
        Swap proposed — it&apos;ll show up as pending for both of you on{" "}
        <a href="/swaps" className="text-accent underline">
          My swaps
        </a>
        .
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label htmlFor="offeredSkill">What you&apos;ll teach them</label>
        <select
          id="offeredSkill"
          value={offeredSkill}
          onChange={(e) => setOfferedSkill(e.target.value)}
          required
        >
          {myTeachSkills.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="requestedSkill">What you want them to teach you</label>
        <select
          id="requestedSkill"
          value={requestedSkill}
          onChange={(e) => setRequestedSkill(e.target.value)}
          required
        >
          {targetTeachSkills.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="message">Note (optional)</label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
        />
      </div>

      {status === "error" && <p className="text-sm text-danger">{errorMessage}</p>}

      <Button type="submit" disabled={status === "saving"}>
        {status === "saving" ? "Sending…" : "Propose swap"}
      </Button>
    </form>
  );
}
