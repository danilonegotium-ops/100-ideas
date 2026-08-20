"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { createClient } from "@/lib/supabase/client";

type Question = {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
};

type Badge = "bronze" | "silver" | "gold";

function badgeFor(percentage: number): Badge {
  if (percentage === 100) return "gold";
  if (percentage >= 80) return "silver";
  return "bronze";
}

/**
 * Small burst of animated squares radiating out from center, used as the
 * "milestone" reward when a learner earns the top (gold) badge. Purely
 * decorative (`aria-hidden`), skipped entirely under prefers-reduced-motion.
 */
function ConfettiBurst({ count = 22 }: { count?: number }) {
  const prefersReducedMotion = useReducedMotion();
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
        const distance = 50 + Math.random() * 70;
        return {
          id: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          rotate: Math.round(Math.random() * 360),
          accent2: i % 2 === 0,
          delay: Math.random() * 0.15,
        };
      }),
    [count],
  );

  if (prefersReducedMotion) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      aria-hidden
    >
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute h-2 w-2 rounded-sm"
          style={{
            backgroundColor: p.accent2
              ? "rgba(var(--accent-2-rgb), 0.9)"
              : "rgba(var(--accent-rgb), 0.9)",
          }}
          initial={{ opacity: 1, x: 0, y: 0, scale: 0.5, rotate: 0 }}
          animate={{ opacity: 0, x: p.x, y: p.y, scale: 1, rotate: p.rotate }}
          transition={{ duration: 0.9, delay: p.delay, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </div>
  );
}

export function QuizClient({
  lessonId,
  questions,
  pointsAvailable,
}: {
  lessonId: string;
  questions: Question[];
  pointsAvailable: number;
}) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<"idle" | "saving" | "error" | "done">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<{
    score: number;
    total: number;
    points: number;
    badge: Badge;
  } | null>(null);

  const allAnswered = questions.every((q) => answers[q.id] !== undefined);
  const answeredCount = Object.keys(answers).length;
  const progressPct =
    questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  function selectAnswer(questionId: string, optionIndex: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  }

  async function handleSubmit() {
    setStatus("saving");
    setErrorMessage("");

    const total = questions.length;
    const score = questions.filter(
      (q) => answers[q.id] === q.correct_index,
    ).length;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    const points = Math.round((percentage / 100) * pointsAvailable);
    const badge = badgeFor(percentage);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setStatus("error");
      setErrorMessage("Your session expired — please log in again.");
      return;
    }

    const { error } = await supabase
      .from("financial_literacy_teens_progress")
      .upsert(
        {
          user_id: user.id,
          lesson_id: lessonId,
          score,
          total_questions: total,
          points_earned: points,
          badge,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,lesson_id" },
      );

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setResult({ score, total, points, badge });
    setStatus("done");
    router.refresh();
  }

  if (status === "done" && result) {
    const badgeEmoji = { bronze: "🥉", silver: "🥈", gold: "🥇" }[result.badge];
    return (
      <div className="relative">
        {result.badge === "gold" && <ConfettiBurst />}
        <Card>
          <motion.div
            initial={prefersReducedMotion ? undefined : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
          >
            <h2 className="mb-1 text-lg font-semibold text-fg">
              {badgeEmoji} {result.badge[0].toUpperCase() + result.badge.slice(1)} badge
            </h2>
          </motion.div>
          <p className="text-sm text-muted">
            {result.score} / {result.total} correct · {result.points} points earned
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="mb-1 flex items-center justify-between">
          <p className="text-xs text-muted">
            {answeredCount} / {questions.length} answered
          </p>
          <p className="text-xs font-semibold text-accent">{progressPct}%</p>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
          <motion.div
            className="h-full rounded-full bg-accent"
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      {questions.map((q, i) => (
        <Card key={q.id}>
          <p className="mb-2 text-sm font-medium text-fg">
            {i + 1}. {q.question}
          </p>
          <div className="flex flex-col gap-2">
            {q.options.map((option, optionIndex) => (
              <label
                key={optionIndex}
                className="flex cursor-pointer items-center gap-2 text-sm text-muted"
              >
                <input
                  type="radio"
                  name={q.id}
                  checked={answers[q.id] === optionIndex}
                  onChange={() => selectAnswer(q.id, optionIndex)}
                  className="w-auto"
                />
                {option}
              </label>
            ))}
          </div>
        </Card>
      ))}

      {status === "error" && <p className="text-sm text-danger">{errorMessage}</p>}

      <Button
        onClick={handleSubmit}
        disabled={!allAnswered || status === "saving"}
      >
        {status === "saving" ? "Submitting…" : "Submit quiz"}
      </Button>
    </div>
  );
}
