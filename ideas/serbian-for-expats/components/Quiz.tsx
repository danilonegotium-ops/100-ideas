"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { gradeQuiz } from "@/lib/quiz";
import type { QuizQuestion } from "@/lib/types";
import type { SaveProgressResult } from "@/lib/actions";

type Props = {
  lessonSlug: string;
  questions: QuizQuestion[];
  isLoggedIn: boolean;
  saveProgressAction: (
    lessonSlug: string,
    score: number,
    total: number,
  ) => Promise<SaveProgressResult>;
};

export function Quiz({ lessonSlug, questions, isLoggedIn, saveProgressAction }: Props) {
  const [answers, setAnswers] = useState<(number | undefined)[]>(
    () => new Array(questions.length).fill(undefined),
  );
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "not_saved">("idle");
  const [isPending, startTransition] = useTransition();

  const allAnswered = answers.every((a) => a !== undefined);

  function selectAnswer(questionIndex: number, optionIndex: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[questionIndex] = optionIndex;
      return next;
    });
  }

  function handleSubmit() {
    const graded = gradeQuiz(questions, answers);
    setResult(graded);

    if (!isLoggedIn) {
      setSaveState("not_saved");
      return;
    }

    startTransition(async () => {
      const outcome = await saveProgressAction(lessonSlug, graded.score, graded.total);
      setSaveState(outcome.saved ? "saved" : "not_saved");
    });
  }

  function handleRetry() {
    setAnswers(new Array(questions.length).fill(undefined));
    setResult(null);
    setSaveState("idle");
  }

  if (result) {
    return (
      <Card>
        <h3 className="mb-2 font-semibold">
          Rezultat: {result.score} / {result.total}
        </h3>
        {isLoggedIn ? (
          <p className="text-sm text-muted">
            {isPending
              ? "Čuvanje napretka…"
              : saveState === "saved"
                ? "Napredak je sačuvan."
                : "Nije uspelo čuvanje napretka — pokušajte ponovo kasnije."}
          </p>
        ) : (
          <p className="text-sm text-muted">
            Rezultat nije sačuvan jer niste prijavljeni. Prijavite se da bi se vaš napredak čuvao.
          </p>
        )}
        <div className="mt-3">
          <Button variant="secondary" onClick={handleRetry}>
            Pokušaj ponovo
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="mb-4 font-semibold">Kviz</h3>
      <div className="flex flex-col gap-5">
        {questions.map((question, qIndex) => (
          <fieldset key={qIndex}>
            <legend className="mb-2 text-sm font-medium text-fg">
              {qIndex + 1}. {question.question}
            </legend>
            <div className="flex flex-col gap-1">
              {question.options.map((option, oIndex) => (
                <label key={oIndex} className="flex items-center gap-2 text-sm text-fg">
                  <input
                    type="radio"
                    name={`q-${qIndex}`}
                    className="w-auto"
                    checked={answers[qIndex] === oIndex}
                    onChange={() => selectAnswer(qIndex, oIndex)}
                  />
                  {option}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      <div className="mt-5">
        <Button onClick={handleSubmit} disabled={!allAnswered}>
          Pošalji odgovore
        </Button>
      </div>
    </Card>
  );
}
