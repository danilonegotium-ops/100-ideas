"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { MAX_BUDGET_LENGTH, MAX_INTERESTS_LENGTH, GiftIdea } from "@/lib/prompt";

interface ApiResponse {
  ideas?: GiftIdea[] | null;
  raw?: string | null;
  error?: string;
}

export function GiftForm() {
  const [interests, setInterests] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<GiftIdea[] | null>(null);
  const [raw, setRaw] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setIdeas(null);
    setRaw(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests, budget }),
      });
      const data: ApiResponse = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      if (data.ideas && data.ideas.length > 0) {
        setIdeas(data.ideas);
      } else if (data.raw) {
        setRaw(data.raw);
      } else {
        setError("The AI didn't return any ideas. Please try again.");
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
          <label htmlFor="interests">Friend&apos;s interests</label>
          <textarea
            id="interests"
            required
            rows={3}
            maxLength={MAX_INTERESTS_LENGTH}
            placeholder="e.g. hiking, sci-fi novels, cooking Italian food, board games"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
          />
          <p className="mt-1 text-xs text-muted">
            {interests.length}/{MAX_INTERESTS_LENGTH}
          </p>
        </div>

        <div>
          <label htmlFor="budget">Budget</label>
          <input
            id="budget"
            required
            type="text"
            maxLength={MAX_BUDGET_LENGTH}
            placeholder="e.g. $50 or under $30"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Thinking of gifts..." : "Generate gift ideas"}
        </Button>
      </form>

      {error && (
        <Card className="mt-6 border-danger">
          <p className="text-sm text-danger">{error}</p>
        </Card>
      )}

      {ideas && (
        <div className="mt-6 space-y-3">
          {ideas.map((idea, i) => (
            <Card key={i}>
              <h2 className="mb-1 font-semibold">{idea.name}</h2>
              <p className="text-sm text-muted">{idea.reason}</p>
            </Card>
          ))}
        </div>
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
    </>
  );
}
