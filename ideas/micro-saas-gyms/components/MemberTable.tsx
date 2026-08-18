"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/Button";
import { deleteMember, renewMembership, setMemberStatus } from "@/app/dashboard/actions";
import { formatDate, membershipState, type Member, type MembershipState } from "@/lib/types";

function StateBadge({ state }: { state: MembershipState }) {
  if (state === "active") {
    return <span className="rounded-brand bg-accent px-2 py-0.5 text-xs font-medium text-[#062b1c]">Active</span>;
  }
  if (state === "expiring") {
    return (
      <span className="rounded-brand border border-danger px-2 py-0.5 text-xs font-medium text-danger">
        Expiring soon
      </span>
    );
  }
  if (state === "expired") {
    return <span className="rounded-brand bg-danger px-2 py-0.5 text-xs font-medium text-[#2b0606]">Expired</span>;
  }
  return <span className="rounded-brand border border-border px-2 py-0.5 text-xs font-medium text-muted">Cancelled</span>;
}

function MemberRow({ member }: { member: Member }) {
  const [isPending, startTransition] = useTransition();
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [renewing, setRenewing] = useState(false);
  const [renewDate, setRenewDate] = useState("");

  const state = membershipState(member);

  function run(action: string, task: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setError(null);
    setBusyAction(action);
    startTransition(async () => {
      const result = await task();
      if (!result.ok) setError(result.error);
      else if (action === "renew") setRenewing(false);
      setBusyAction(null);
    });
  }

  return (
    <tr className="border-b border-border align-top last:border-b-0">
      <td className="py-3 pr-3">
        <p className="font-medium">{member.full_name}</p>
        {member.email && <p className="text-xs text-muted">{member.email}</p>}
        {member.phone && <p className="text-xs text-muted">{member.phone}</p>}
        {member.notes && <p className="mt-1 text-xs text-muted">{member.notes}</p>}
      </td>
      <td className="py-3 pr-3 whitespace-nowrap">{member.plan_name}</td>
      <td className="py-3 pr-3 whitespace-nowrap">{formatDate(member.subscription_end)}</td>
      <td className="py-3 pr-3">
        <StateBadge state={state} />
      </td>
      <td className="py-3">
        <div className="flex flex-wrap gap-2">
          {!renewing ? (
            <Button variant="secondary" disabled={isPending} onClick={() => setRenewing(true)}>
              Renew
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={renewDate}
                onChange={(event) => setRenewDate(event.target.value)}
                className="w-auto"
              />
              <Button
                disabled={isPending || !renewDate}
                onClick={() => run("renew", () => renewMembership(member.id, renewDate))}
              >
                {busyAction === "renew" ? "Saving…" : "Save"}
              </Button>
              <Button variant="secondary" disabled={isPending} onClick={() => setRenewing(false)}>
                Cancel
              </Button>
            </div>
          )}

          {member.status === "active" ? (
            <Button
              variant="secondary"
              disabled={isPending}
              onClick={() => run("cancel", () => setMemberStatus(member.id, "cancelled"))}
            >
              {busyAction === "cancel" ? "Saving…" : "Cancel membership"}
            </Button>
          ) : (
            <Button
              variant="secondary"
              disabled={isPending}
              onClick={() => run("reactivate", () => setMemberStatus(member.id, "active"))}
            >
              {busyAction === "reactivate" ? "Saving…" : "Reactivate"}
            </Button>
          )}

          <Button
            variant="danger"
            disabled={isPending}
            onClick={() => {
              if (window.confirm(`Remove ${member.full_name} from your member list? This can't be undone.`)) {
                run("delete", () => deleteMember(member.id));
              }
            }}
          >
            {busyAction === "delete" ? "Removing…" : "Remove"}
          </Button>
        </div>
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </td>
    </tr>
  );
}

export function MemberTable({ members }: { members: Member[] }) {
  return (
    <div className="overflow-x-auto rounded-brand border border-border">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
            <th className="px-3 py-2 font-medium">Member</th>
            <th className="px-3 py-2 font-medium">Plan</th>
            <th className="px-3 py-2 font-medium">Subscription ends</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <MemberRow key={member.id} member={member} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
