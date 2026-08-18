"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/Button";
import { checkInMember } from "@/app/dashboard/actions";
import { membershipState, type Member } from "@/lib/types";

export function CheckInPanel({
  members,
  checkedInTodayIds,
}: {
  members: Member[];
  checkedInTodayIds: string[];
}) {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const checkedInSet = useMemo(() => new Set(checkedInTodayIds), [checkedInTodayIds]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return members
      .filter((member) => membershipState(member) !== "cancelled")
      .filter((member) => member.full_name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [members, query]);

  function handleCheckIn(memberId: string) {
    setError(null);
    setBusyId(memberId);
    startTransition(async () => {
      const result = await checkInMember(memberId);
      if (!result.ok) setError(result.error);
      setBusyId(null);
    });
  }

  return (
    <div>
      <label htmlFor="member_search">Search member by name</label>
      <input
        id="member_search"
        type="text"
        placeholder="Start typing a name…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      {query.trim() && (
        <ul className="mt-3 flex flex-col gap-2">
          {results.length === 0 && <li className="text-sm text-muted">No matching members.</li>}
          {results.map((member) => {
            const alreadyCheckedIn = checkedInSet.has(member.id);
            return (
              <li
                key={member.id}
                className="flex items-center justify-between gap-3 rounded-brand border border-border px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{member.full_name}</p>
                  <p className="text-xs text-muted">{member.plan_name}</p>
                </div>
                <Button
                  variant={alreadyCheckedIn ? "secondary" : "primary"}
                  disabled={isPending && busyId === member.id}
                  onClick={() => handleCheckIn(member.id)}
                >
                  {busyId === member.id
                    ? "Checking in…"
                    : alreadyCheckedIn
                      ? "Check in again"
                      : "Check in"}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
