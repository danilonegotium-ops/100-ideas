"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { deleteOnboarding } from "@/app/dashboard/actions";
import { formatDate, type Onboarding, type OnboardingTask } from "@/lib/types";

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <div className="h-2 w-full overflow-hidden rounded-brand bg-bg">
      <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
    </div>
  );
}

function OnboardingRow({ onboarding, tasks }: { onboarding: Onboarding; tasks: OnboardingTask[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const completed = tasks.filter((task) => task.completed).length;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1">
          <p className="font-medium">{onboarding.hire_name}</p>
          <p className="text-xs text-muted">
            {onboarding.hire_email} &middot; started {formatDate(onboarding.started_at)}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="w-40">
              <ProgressBar completed={completed} total={tasks.length} />
            </div>
            <span className="text-xs text-muted">
              {completed}/{tasks.length} tasks
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setExpanded((value) => !value)}>
            {expanded ? "Hide tasks" : "View tasks"}
          </Button>
          <Button
            variant="danger"
            disabled={isPending}
            onClick={() => {
              if (window.confirm(`Remove ${onboarding.hire_name}'s onboarding? This can't be undone.`)) {
                setError(null);
                startTransition(async () => {
                  const result = await deleteOnboarding(onboarding.id);
                  if (!result.ok) setError(result.error);
                });
              }
            }}
          >
            {isPending ? "Removing…" : "Remove"}
          </Button>
        </div>
      </div>

      {expanded && (
        <ul className="mt-3 flex flex-col gap-1 border-t border-border pt-3 text-sm">
          {tasks.map((task) => (
            <li key={task.id} className={task.completed ? "text-muted line-through" : "text-fg"}>
              {task.completed ? "☑" : "☐"} {task.title}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </Card>
  );
}

export function OnboardingProgressList({
  onboardings,
  tasksByOnboarding,
}: {
  onboardings: Onboarding[];
  tasksByOnboarding: Record<string, OnboardingTask[]>;
}) {
  return (
    <div className="flex flex-col gap-3">
      {onboardings.map((onboarding) => (
        <OnboardingRow key={onboarding.id} onboarding={onboarding} tasks={tasksByOnboarding[onboarding.id] ?? []} />
      ))}
    </div>
  );
}
