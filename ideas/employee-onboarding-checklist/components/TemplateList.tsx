"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { deleteTemplate } from "@/app/dashboard/actions";
import { formatDate, type Template } from "@/lib/types";

export function TemplateList({
  templates,
  taskCountByTemplate,
}: {
  templates: Template[];
  taskCountByTemplate: Record<string, number>;
}) {
  return (
    <div className="flex flex-col gap-3">
      {templates.map((template) => (
        <TemplateRow key={template.id} template={template} taskCount={taskCountByTemplate[template.id] ?? 0} />
      ))}
    </div>
  );
}

function TemplateRow({ template, taskCount }: { template: Template; taskCount: number }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">{template.name}</p>
          <p className="text-xs text-muted">
            {taskCount} task{taskCount === 1 ? "" : "s"} &middot; created {formatDate(template.created_at)}
          </p>
        </div>
        <Button
          variant="danger"
          disabled={isPending}
          onClick={() => {
            if (window.confirm(`Delete "${template.name}"? Existing hires already assigned this template keep their checklist.`)) {
              setError(null);
              startTransition(async () => {
                const result = await deleteTemplate(template.id);
                if (!result.ok) setError(result.error);
              });
            }
          }}
        >
          {isPending ? "Deleting…" : "Delete"}
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </Card>
  );
}
