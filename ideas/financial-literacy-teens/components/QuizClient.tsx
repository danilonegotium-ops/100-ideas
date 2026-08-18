"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
      <Card>
        <h2 className="mb-1 text-sm font-semibold text-fg">
          {badgeEmoji} {result.badge[0].toUpperCase() + result.badge.slice(1)} badge
        </h2>
        <p className="text-sm text-muted">
          {result.score} / {result.total} correct · {result.points} points earned
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
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
