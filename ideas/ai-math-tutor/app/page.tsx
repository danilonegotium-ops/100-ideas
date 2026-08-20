"use client";

import { FormEvent, useState } from "react";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/Button";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { GlassPanel } from "@/components/motion/GlassPanel";
import { EmptyState } from "@/components/motion/EmptyState";
import { MAX_PROBLEM_LENGTH, type MathTutorResult } from "@/lib/mathtutor";

type Status = "idle" | "loading" | "done" | "error" | "not_configured";

export default function Home() {
  const [problem, setProblem] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<MathTutorResult | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage("");
    setResult(null);

    try {
      const res = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem }),
      });
      const data = await res.json();

      if (res.status === 503 && data.error === "not_configured") {
        setStatus("not_configured");
        return;
      }
      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.message || "Something went wrong.");
        return;
      }

      setResult(data.result);
      setStatus("done");
    } catch {
      setStatus("error");
      setErrorMessage("Couldn't reach the server. Check your connection and try again.");
    }
  }

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">AI Math Tutor</h1>
        <p className="mb-6 text-muted">
          Type a math problem — arithmetic, algebra, geometry, a word problem,
          whatever. You&apos;ll get the answer plus a plain-language,
          step-by-step explanation of how to get there.
        </p>

        <GlassPanel glow>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label htmlFor="problem">Math problem</label>
              <textarea
                id="problem"
                name="problem"
                required
                rows={4}
                maxLength={MAX_PROBLEM_LENGTH}
                value={problem}
                onChange={(event) => setProblem(event.target.value)}
                placeholder="e.g. Solve for x: 3x + 7 = 22, or: A train leaves at 60 mph..."
                disabled={status === "loading"}
              />
            </div>

            {status === "error" && <p className="text-sm text-danger">{errorMessage}</p>}
            {status === "not_configured" && (
              <p className="text-sm text-danger">
                AI isn&apos;t configured yet on this deployment — the site owner
                needs to set a Google AI Studio API key. Nothing you did wrong.
              </p>
            )}

            <Button type="submit" disabled={status === "loading"}>
              {status === "loading" ? "Solving…" : "Solve it"}
            </Button>
          </form>
        </GlassPanel>

        {result && (
          <AnimatedCard className="mt-6" hoverLift={false}>
            {!result.isMathProblem ? (
              <p className="text-sm text-fg">{result.note}</p>
            ) : (
              <>
                {result.restatedProblem && (
                  <p className="mb-3 text-sm text-muted">
                    Solving: <span className="text-fg">{result.restatedProblem}</span>
                  </p>
                )}
                <div className="mb-4 rounded-brand border-2 border-accent bg-bg p-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent-strong">
                    Final answer
                  </p>
                  <p className="text-sm font-medium text-fg">{result.finalAnswer}</p>
                </div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  Step by step
                </p>
                <ol className="flex flex-col gap-3">
                  {result.steps.map((step) => (
                    <li key={step.stepNumber} className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold text-muted">
                        {step.stepNumber}
                      </span>
                      <p className="text-sm text-fg">{step.explanation}</p>
                    </li>
                  ))}
                </ol>
                {result.note && <p className="mt-4 text-xs text-muted">{result.note}</p>}
              </>
            )}
            <p className="mt-5 text-xs text-muted">
              General-purpose explanations, not tied to any specific official
              curriculum — always double-check important calculations.
            </p>
          </AnimatedCard>
        )}

        {status === "idle" && !result && (
          <EmptyState
            className="mt-6"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 7h6m-6 4h6m-6 4h4M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z"
                />
              </svg>
            }
            title="Your step-by-step solution will appear here"
            description="Type a math problem above and submit it — the answer and explanation show up right in this spot."
          />
        )}
      </main>
    </>
  );
}
