"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/Button";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { deleteDeal, setDealStage, updateDealDetails } from "@/app/dashboard/actions";
import { formatCurrency, formatDate, nextStage, previousStage, type Deal } from "@/lib/types";

export function DealCard({ deal, index = 0 }: { deal: Deal; index?: number }) {
  const [isPending, startTransition] = useTransition();
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(deal.notes ?? "");
  const [nextAction, setNextAction] = useState(deal.next_action ?? "");
  const [nextActionDate, setNextActionDate] = useState(deal.next_action_date ?? "");
  const [dealValue, setDealValue] = useState(deal.deal_value?.toString() ?? "");

  const forward = nextStage(deal.stage);
  const backward = previousStage(deal.stage);

  function run(action: string, task: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setError(null);
    setBusyAction(action);
    startTransition(async () => {
      const result = await task();
      if (!result.ok) setError(result.error);
      else if (action === "save") setEditing(false);
      setBusyAction(null);
    });
  }

  return (
    <AnimatedCard index={index} className="mb-3">
      <p className="font-medium">{deal.sponsor_name}</p>
      {(deal.contact_name || deal.contact_email) && (
        <p className="text-xs text-muted">
          {deal.contact_name}
          {deal.contact_name && deal.contact_email ? " · " : ""}
          {deal.contact_email}
        </p>
      )}
      <p className="mt-1 text-sm font-medium">{formatCurrency(deal.deal_value, deal.currency)}</p>

      {!editing ? (
        <>
          {deal.next_action && (
            <p className="mt-1 text-xs text-muted">
              Next: {deal.next_action}
              {deal.next_action_date ? ` (${formatDate(deal.next_action_date)})` : ""}
            </p>
          )}
          {deal.notes && <p className="mt-1 text-xs text-muted">{deal.notes}</p>}
        </>
      ) : (
        <div className="mt-2 flex flex-col gap-2">
          <div>
            <label htmlFor={`deal_value_${deal.id}`}>Deal value</label>
            <input
              id={`deal_value_${deal.id}`}
              type="number"
              step="0.01"
              min="0"
              value={dealValue}
              onChange={(event) => setDealValue(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor={`next_action_${deal.id}`}>Next action</label>
            <input
              id={`next_action_${deal.id}`}
              type="text"
              value={nextAction}
              onChange={(event) => setNextAction(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor={`next_action_date_${deal.id}`}>Next action date</label>
            <input
              id={`next_action_date_${deal.id}`}
              type="date"
              value={nextActionDate}
              onChange={(event) => setNextActionDate(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor={`notes_${deal.id}`}>Notes</label>
            <input
              id={`notes_${deal.id}`}
              type="text"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-xs text-danger">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {!editing ? (
          <Button variant="secondary" disabled={isPending} onClick={() => setEditing(true)}>
            Edit
          </Button>
        ) : (
          <>
            <Button
              disabled={isPending}
              onClick={() =>
                run("save", () =>
                  updateDealDetails(deal.id, {
                    notes,
                    next_action: nextAction,
                    next_action_date: nextActionDate,
                    deal_value: dealValue,
                  }),
                )
              }
            >
              {busyAction === "save" ? "Saving…" : "Save"}
            </Button>
            <Button variant="secondary" disabled={isPending} onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </>
        )}

        {backward && (
          <Button
            variant="secondary"
            disabled={isPending}
            onClick={() => run("back", () => setDealStage(deal.id, backward))}
          >
            {busyAction === "back" ? "Moving…" : `← ${backward}`}
          </Button>
        )}
        {forward && (
          <Button
            variant="secondary"
            disabled={isPending}
            onClick={() => run("forward", () => setDealStage(deal.id, forward))}
          >
            {busyAction === "forward" ? "Moving…" : `${forward} →`}
          </Button>
        )}
        {deal.stage !== "declined" && (
          <Button
            variant="secondary"
            disabled={isPending}
            onClick={() => run("decline", () => setDealStage(deal.id, "declined"))}
          >
            {busyAction === "decline" ? "Saving…" : "Decline"}
          </Button>
        )}
        <Button
          variant="danger"
          disabled={isPending}
          onClick={() => {
            if (window.confirm(`Delete the deal with ${deal.sponsor_name}? This can't be undone.`)) {
              run("delete", () => deleteDeal(deal.id));
            }
          }}
        >
          {busyAction === "delete" ? "Deleting…" : "Delete"}
        </Button>
      </div>
    </AnimatedCard>
  );
}
