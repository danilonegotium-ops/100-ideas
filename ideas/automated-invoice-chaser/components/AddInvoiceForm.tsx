"use client";

import { FormEvent, useRef, useState, useTransition } from "react";
import { Button } from "@/components/Button";
import { addInvoice } from "@/app/invoices/actions";

export function AddInvoiceForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await addInvoice(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label htmlFor="client_name">Client name</label>
        <input id="client_name" name="client_name" type="text" required placeholder="Acme Co" />
      </div>
      <div>
        <label htmlFor="client_email">Client email</label>
        <input id="client_email" name="client_email" type="email" required placeholder="billing@acme.com" />
      </div>
      <div>
        <label htmlFor="amount">Amount (USD)</label>
        <input id="amount" name="amount" type="number" step="0.01" min="0.01" required placeholder="500.00" />
      </div>
      <div>
        <label htmlFor="due_date">Due date</label>
        <input id="due_date" name="due_date" type="date" required />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="notes">Notes (optional)</label>
        <input id="notes" name="notes" type="text" placeholder="Net-30, project deposit, etc." />
      </div>

      {error && <p className="text-sm text-danger sm:col-span-2">{error}</p>}

      <div className="sm:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Adding…" : "Add invoice"}
        </Button>
      </div>
    </form>
  );
}
