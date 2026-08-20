"use client";

import { useState, useTransition } from "react";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { toggleOnboardingTask } from "@/app/my-onboarding/actions";
import { formatDate, type Onboarding, type OnboardingTask } from "@/lib/types";

export function OnboardingChecklist({
  onboarding,
  tasks,
  index = 0,
}: {
  onboarding: Onboarding;
  tasks: OnboardingTask[];
  index?: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const completed = tasks.filter((task) => task.completed).length;

  function handleToggle(task: OnboardingTask) {
    setError(null);
    startTransition(async () => {
      const result = await toggleOnboardingTask(task.id, !task.completed);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <AnimatedCard index={index} className="mb-6">
      <p className="mb-1 text-sm text-muted">
        Started {formatDate(onboarding.started_at)} &middot; {completed}/{tasks.length} complete
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {tasks.map((task) => (
          <li key={task.id}>
            <label className="flex cursor-pointer items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={task.completed}
                disabled={isPending}
                onChange={() => handleToggle(task)}
                className="mt-0.5 w-auto"
              />
              <span className={task.completed ? "text-muted line-through" : "text-fg"}>{task.title}</span>
            </label>
          </li>
        ))}
      </ul>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </AnimatedCard>
  );
}
