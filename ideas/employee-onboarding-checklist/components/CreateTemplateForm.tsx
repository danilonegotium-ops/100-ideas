"use client";

import { FormEvent, useRef, useState, useTransition } from "react";
import { Button } from "@/components/Button";
import { createTemplate } from "@/app/dashboard/actions";

export function CreateTemplateForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createTemplate(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label htmlFor="name">Template name</label>
        <input id="name" name="name" type="text" required placeholder="Standard Engineering Onboarding" />
      </div>
      <div>
        <label htmlFor="tasks">Tasks (one per line)</label>
        <textarea
          id="tasks"
          name="tasks"
          rows={6}
          required
          placeholder={"Sign employment contract\nSet up work laptop\nComplete security training"}
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating…" : "Create template"}
        </Button>
      </div>
    </form>
  );
}
