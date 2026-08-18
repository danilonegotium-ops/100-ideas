"use client";

import { FormEvent, useRef, useState, useTransition } from "react";
import { Button } from "@/components/Button";
import { addMember } from "@/app/dashboard/actions";

export function AddMemberForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await addMember(formData);
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
        <label htmlFor="full_name">Full name</label>
        <input id="full_name" name="full_name" type="text" required placeholder="Jane Doe" />
      </div>
      <div>
        <label htmlFor="email">Email (optional)</label>
        <input id="email" name="email" type="email" placeholder="jane@example.com" />
      </div>
      <div>
        <label htmlFor="phone">Phone (optional)</label>
        <input id="phone" name="phone" type="tel" placeholder="+381 60 000 0000" />
      </div>
      <div>
        <label htmlFor="plan_name">Plan</label>
        <input id="plan_name" name="plan_name" type="text" defaultValue="Standard" required />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="subscription_end">Subscription end date</label>
        <input id="subscription_end" name="subscription_end" type="date" required />
      </div>

      {error && <p className="text-sm text-danger sm:col-span-2">{error}</p>}

      <div className="sm:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Adding…" : "Add member"}
        </Button>
      </div>
    </form>
  );
}
