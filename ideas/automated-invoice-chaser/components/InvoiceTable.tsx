"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/Button";
import { deleteInvoice, sendReminder, setInvoiceStatus } from "@/app/invoices/actions";
import { formatCurrency, formatDate, isOverdue, type Invoice, type Reminder } from "@/lib/types";

function StatusBadge({ invoice }: { invoice: Invoice }) {
  if (invoice.status === "paid") {
    return <span className="rounded-brand bg-accent px-2 py-0.5 text-xs font-medium text-[#062b1c]">Paid</span>;
  }
  if (invoice.status === "void") {
    return <span className="rounded-brand border border-border px-2 py-0.5 text-xs font-medium text-muted">Void</span>;
  }
  if (isOverdue(invoice)) {
    return <span className="rounded-brand bg-danger px-2 py-0.5 text-xs font-medium text-[#2b0606]">Overdue</span>;
  }
  return <span className="rounded-brand border border-border px-2 py-0.5 text-xs font-medium text-muted">Pending</span>;
}

function InvoiceRow({ invoice, lastReminder }: { invoice: Invoice; lastReminder?: Reminder }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  function run(action: string, task: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setError(null);
    setBusyAction(action);
    startTransition(async () => {
      const result = await task();
      if (!result.ok) setError(result.error);
      setBusyAction(null);
    });
  }

  return (
    <tr className="border-b border-border align-top last:border-b-0">
      <td className="py-3 pr-3">
        <p className="font-medium">{invoice.client_name}</p>
        <p className="text-xs text-muted">{invoice.client_email}</p>
        {invoice.notes && <p className="mt-1 text-xs text-muted">{invoice.notes}</p>}
      </td>
      <td className="py-3 pr-3 whitespace-nowrap">{formatCurrency(invoice.amount, invoice.currency)}</td>
      <td className="py-3 pr-3 whitespace-nowrap">{formatDate(invoice.due_date)}</td>
      <td className="py-3 pr-3">
        <StatusBadge invoice={invoice} />
        {lastReminder && (
          <p className="mt-1 text-xs text-muted">
            Last reminder: {formatDate(lastReminder.sent_at.slice(0, 10))} ({lastReminder.delivery_status})
          </p>
        )}
      </td>
      <td className="py-3">
        <div className="flex flex-wrap gap-2">
          {invoice.status === "pending" && (
            <Button
              variant="secondary"
              disabled={isPending}
              onClick={() => run("remind", () => sendReminder(invoice.id))}
            >
              {busyAction === "remind" ? "Sending…" : "Send reminder"}
            </Button>
          )}
          {invoice.status === "pending" && (
            <Button
              variant="secondary"
              disabled={isPending}
              onClick={() => run("paid", () => setInvoiceStatus(invoice.id, "paid"))}
            >
              {busyAction === "paid" ? "Saving…" : "Mark paid"}
            </Button>
          )}
          {invoice.status === "pending" && (
            <Button
              variant="secondary"
              disabled={isPending}
              onClick={() => run("void", () => setInvoiceStatus(invoice.id, "void"))}
            >
              {busyAction === "void" ? "Saving…" : "Void"}
            </Button>
          )}
          <Button
            variant="danger"
            disabled={isPending}
            onClick={() => {
              if (window.confirm(`Delete the invoice for ${invoice.client_name}? This can't be undone.`)) {
                run("delete", () => deleteInvoice(invoice.id));
              }
            }}
          >
            {busyAction === "delete" ? "Deleting…" : "Delete"}
          </Button>
        </div>
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </td>
    </tr>
  );
}

export function InvoiceTable({
  invoices,
  lastReminderByInvoice,
}: {
  invoices: Invoice[];
  lastReminderByInvoice: Record<string, Reminder>;
}) {
  return (
    <div className="overflow-x-auto rounded-brand border border-border">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
            <th className="px-3 py-2 font-medium">Client</th>
            <th className="px-3 py-2 font-medium">Amount</th>
            <th className="px-3 py-2 font-medium">Due</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <InvoiceRow key={invoice.id} invoice={invoice} lastReminder={lastReminderByInvoice[invoice.id]} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
