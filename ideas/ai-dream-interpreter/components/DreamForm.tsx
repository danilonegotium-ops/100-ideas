"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { EmptyState } from "@/components/motion/EmptyState";
import { DreamInterpretation, MAX_DREAM_LENGTH } from "@/lib/prompt";

interface ApiResponse {
  interpretation?: DreamInterpretation | null;
  raw?: string | null;
  error?: string;
}

export function DreamForm() {
  const [dream, setDream] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interpretation, setInterpretation] =
    useState<DreamInterpretation | null>(null);
  const [raw, setRaw] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInterpretation(null);
    setRaw(null);

    try {
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dream }),
      });
      const data: ApiResponse = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      if (data.interpretation) {
        setInterpretation(data.interpretation);
      } else if (data.raw) {
        setRaw(data.raw);
      } else {
        setError("The AI didn't return an interpretation. Please try again.");
      }
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="dream">Describe your dream</label>
          <textarea
            id="dream"
            required
            rows={6}
            maxLength={MAX_DREAM_LENGTH}
            placeholder="I was walking through a forest and..."
            value={dream}
            onChange={(e) => setDream(e.target.value)}
          />
          <p className="mt-1 text-xs text-muted">
            {dream.length}/{MAX_DREAM_LENGTH}
          </p>
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Interpreting..." : "Interpret my dream"}
        </Button>
      </form>

      {error && (
        <Card className="mt-6 border-danger">
          <p className="text-sm text-danger">{error}</p>
        </Card>
      )}

      {interpretation && (
        <AnimatedCard className="mt-6" hoverLift={false}>
          <p className="mb-4 whitespace-pre-wrap text-sm leading-relaxed">
            {interpretation.interpretation}
          </p>
          {interpretation.themes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {interpretation.themes.map((theme, i) => (
                <span
                  key={i}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted"
                >
                  {theme}
                </span>
              ))}
            </div>
          )}
        </AnimatedCard>
      )}

      {raw && (
        <Card className="mt-6">
          <p className="mb-2 text-xs text-muted">
            The AI responded, but not in the expected format. Here&apos;s the raw
            response:
          </p>
          <pre className="whitespace-pre-wrap font-mono text-sm">{raw}</pre>
        </Card>
      )}

      {!loading && !error && !interpretation && !raw && (
        <div className="mt-6">
          <EmptyState
            title="No interpretation yet"
            description="Describe a dream above and interpret it to see the reading appear here."
          />
        </div>
      )}
    </>
  );
}
