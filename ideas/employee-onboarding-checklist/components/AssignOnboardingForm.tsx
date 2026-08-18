"use client";

import { FormEvent, useRef, useState, useTransition } from "react";
import { Button } from "@/components/Button";
import { assignOnboarding } from "@/app/dashboard/actions";
import type { Template } from "@/lib/types";

export function AssignOnboardingForm({ templates }: { templates: Template[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (templates.length === 0) {
    return <p className="text-sm text-muted">Create a template above before assigning an onboarding.</p>;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await assignOnboarding(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div>
        <label htmlFor="template_id">Template</label>
        <select id="template_id" name="template_id" required defaultValue="">
          <option value="" disabled>
            Choose a template
          </option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="hire_name">New hire name</label>
        <input id="hire_name" name="hire_name" type="text" required placeholder="Jordan Ellis" />
      </div>
      <div>
        <label htmlFor="hire_email">New hire email</label>
        <input id="hire_email" name="hire_email" type="email" required placeholder="jordan.ellis@example.com" />
      </div>

      {error && <p className="text-sm text-danger sm:col-span-3">{error}</p>}

      <div className="sm:col-span-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Assigning…" : "Assign onboarding"}
        </Button>
      </div>
    </form>
  );
}
