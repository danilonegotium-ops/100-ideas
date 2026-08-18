"use client";

import { FormEvent, useRef, useState, useTransition } from "react";
import { Button } from "@/components/Button";
import { addDeal } from "@/app/dashboard/actions";

export function AddDealForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await addDeal(formData);
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
        <label htmlFor="sponsor_name">Sponsor name</label>
        <input id="sponsor_name" name="sponsor_name" type="text" required placeholder="Acme Widgets" />
      </div>
      <div>
        <label htmlFor="deal_value">Deal value (USD, optional)</label>
        <input id="deal_value" name="deal_value" type="number" step="0.01" min="0" placeholder="2500.00" />
      </div>
      <div>
        <label htmlFor="contact_name">Contact name (optional)</label>
        <input id="contact_name" name="contact_name" type="text" placeholder="Jamie Rivera" />
      </div>
      <div>
        <label htmlFor="contact_email">Contact email (optional)</label>
        <input id="contact_email" name="contact_email" type="email" placeholder="jamie@acmewidgets.com" />
      </div>
      <div>
        <label htmlFor="next_action">Next action (optional)</label>
        <input id="next_action" name="next_action" type="text" placeholder="Send media kit" />
      </div>
      <div>
        <label htmlFor="next_action_date">Next action date (optional)</label>
        <input id="next_action_date" name="next_action_date" type="date" />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="notes">Notes (optional)</label>
        <input id="notes" name="notes" type="text" placeholder="How you connected, what they want, etc." />
      </div>

      {error && <p className="text-sm text-danger sm:col-span-2">{error}</p>}

      <div className="sm:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Adding…" : "Add deal"}
        </Button>
      </div>
    </form>
  );
}
