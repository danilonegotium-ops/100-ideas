"use client";

import { FormEvent, useRef, useState, useTransition } from "react";
import { Button } from "@/components/Button";
import { createCollection } from "@/app/dashboard/actions";

export function CreateCollectionForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createCollection(formData);
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
        <label htmlFor="business_name">Business name</label>
        <input id="business_name" name="business_name" type="text" required placeholder="Acme Coaching" />
      </div>
      <div>
        <label htmlFor="slug">Link slug (optional, auto-generated otherwise)</label>
        <input id="slug" name="slug" type="text" placeholder="acme-coaching" />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="prompt_text">Prompt shown to visitors (optional)</label>
        <input
          id="prompt_text"
          name="prompt_text"
          type="text"
          placeholder="We'd love to hear about your experience!"
        />
      </div>

      {error && <p className="text-sm text-danger sm:col-span-2">{error}</p>}

      <div className="sm:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating…" : "Create collection"}
        </Button>
      </div>
    </form>
  );
}
