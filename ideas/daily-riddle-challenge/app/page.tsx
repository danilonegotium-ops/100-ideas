"use client";

import { FormEvent, useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useUser } from "@/lib/supabase/useUser";

type Phase = "loading" | "name" | "playing" | "done";

type LeaderboardEntry = {
  display_name: string;
  elapsed_ms: number;
  completed_at: string;
};

type Result = {
  correct: boolean;
  elapsedMs: number;
  displayAnswer: string;
};

function formatElapsed(ms: number): string {
  const totalSeconds = ms / 1000;
  if (totalSeconds < 60) return `${totalSeconds.toFixed(1)}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(1);
  return `${minutes}m ${seconds}s`;
}

export default function Home() {
  const { user, loading: userLoading } = useUser();
  const [phase, setPhase] = useState<Phase>("loading");
  const [riddleDate, setRiddleDate] = useState("");
  const [question, setQuestion] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedDisplay, setElapsedDisplay] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    fetch("/api/riddle/today")
      .then((res) => res.json())
      .then((data) => {
        setRiddleDate(data.riddleDate);
        setQuestion(data.question);
        setPhase("name");
      });
  }, []);

  useEffect(() => {
    if (!userLoading && user?.email && !displayName) {
      setDisplayName(user.email.split("@")[0]);
    }
  }, [userLoading, user, displayName]);

  useEffect(() => {
    if (!riddleDate) return;
    fetch(`/api/riddle/leaderboard?date=${riddleDate}`)
      .then((res) => res.json())
      .then((data) => setLeaderboard(data.entries ?? []))
      .catch(() => setLeaderboard([]));
  }, [riddleDate]);

  useEffect(() => {
    if (phase !== "playing" || startedAt === null) return;
    const interval = setInterval(() => {
      setElapsedDisplay(Date.now() - startedAt);
    }, 100);
    return () => clearInterval(interval);
  }, [phase, startedAt]);

  async function refreshLeaderboard() {
    if (!riddleDate) return;
    const res = await fetch(`/api/riddle/leaderboard?date=${riddleDate}`);
    const data = await res.json().catch(() => ({ entries: [] }));
    setLeaderboard(data.entries ?? []);
  }

  async function handleStart() {
    if (!displayName.trim()) {
      setErrorMessage("Enter a name to play.");
      return;
    }
    setStarting(true);
    setErrorMessage("");

    const res = await fetch("/api/riddle/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName }),
    });
    const data = await res.json().catch(() => ({}));
    setStarting(false);

    if (!res.ok) {
      setErrorMessage(data.error || "Couldn't start. Try again.");
      return;
    }

    setAttemptId(data.attemptId);
    const startMs = new Date(data.startedAt).getTime();
    setStartedAt(startMs);

    if (data.alreadyPlayed) {
      setResult({
        correct: data.correct,
        elapsedMs: data.elapsedMs,
        displayAnswer: data.displayAnswer,
      });
      setPhase("done");
      return;
    }

    setElapsedDisplay(Date.now() - startMs);
    setPhase("playing");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!attemptId) return;
    setSubmitting(true);
    setErrorMessage("");

    const res = await fetch("/api/riddle/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId, answer }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setErrorMessage(data.error || "Couldn't submit. Try again.");
      return;
    }

    setResult(data);
    setPhase("done");
    refreshLeaderboard();
  }

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Daily Riddle Challenge</h1>
        <p className="mb-6 text-muted">
          Same riddle, same day, everyone on Earth. Fastest correct solve
          wins the day.
        </p>

        <Card className="mb-6">
          {phase === "loading" && (
            <p className="text-sm text-muted">Loading today&apos;s riddle…</p>
          )}

          {phase !== "loading" && (
            <>
              <p className="mb-1 text-xs uppercase tracking-wide text-muted">
                Today&apos;s riddle · {riddleDate}
              </p>
              <p className="mb-4 text-lg">{question}</p>

              {phase === "name" && (
                <div className="flex flex-col gap-3">
                  <div>
                    <label htmlFor="displayName">Your name</label>
                    <input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Shown on the leaderboard"
                      maxLength={60}
                    />
                  </div>
                  {errorMessage && (
                    <p className="text-sm text-danger">{errorMessage}</p>
                  )}
                  <Button onClick={handleStart} disabled={starting}>
                    {starting ? "Starting…" : "Start the clock"}
                  </Button>
                </div>
              )}

              {phase === "playing" && (
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  <p className="font-mono text-2xl text-accent">
                    {formatElapsed(elapsedDisplay)}
                  </p>
                  <div>
                    <label htmlFor="answer">Your answer</label>
                    <input
                      id="answer"
                      required
                      autoFocus
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                    />
                  </div>
                  {errorMessage && (
                    <p className="text-sm text-danger">{errorMessage}</p>
                  )}
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Checking…" : "Submit answer"}
                  </Button>
                </form>
              )}

              {phase === "done" && result && (
                <div>
                  <p
                    className={result.correct ? "mb-2 text-accent" : "mb-2 text-danger"}
                  >
                    {result.correct
                      ? `Correct! ${formatElapsed(result.elapsedMs)}`
                      : "Not quite."}
                  </p>
                  {result.displayAnswer && (
                    <p className="text-sm text-muted">
                      Answer: {result.displayAnswer}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </Card>

        <h2 className="mb-3 text-lg font-semibold">
          Today&apos;s fastest solvers
        </h2>
        {leaderboard.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">
              No one has solved it yet today — be the first.
            </p>
          </Card>
        ) : (
          <ol className="flex flex-col gap-2">
            {leaderboard.map((entry, index) => (
              <li key={`${entry.display_name}-${entry.completed_at}`}>
                <Card className="flex items-center justify-between">
                  <span>
                    {index + 1}. {entry.display_name}
                  </span>
                  <span className="font-mono text-sm text-muted">
                    {formatElapsed(entry.elapsed_ms)}
                  </span>
                </Card>
              </li>
            ))}
          </ol>
        )}
      </main>
    </>
  );
}
