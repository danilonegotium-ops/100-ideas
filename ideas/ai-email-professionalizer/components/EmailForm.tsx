"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { EmptyState } from "@/components/motion/EmptyState";
import { MAX_EMAIL_LENGTH, RewriteResult } from "@/lib/prompt";

interface ApiResponse {
  rewrite?: RewriteResult | null;
  raw?: string | null;
  error?: string;
}

export function EmailForm() {
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rewrite, setRewrite] = useState<RewriteResult | null>(null);
  const [raw, setRaw] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRewrite(null);
    setRaw(null);
    setCopied(false);

    try {
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft }),
      });
      const data: ApiResponse = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      if (data.rewrite) {
        setRewrite(data.rewrite);
      } else if (data.raw) {
        setRaw(data.raw);
      } else {
        setError("The AI didn't return a rewrite. Please try again.");
      }
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function onCopy() {
    if (!rewrite) return;
    try {
      await navigator.clipboard.writeText(rewrite.rewritten);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail (permissions, insecure context) — non-fatal,
      // the text is still fully visible and selectable on the page.
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="draft">Your email draft</label>
          <textarea
            id="draft"
            required
            rows={8}
            maxLength={MAX_EMAIL_LENGTH}
            placeholder="Paste your angry/emotional/casual email draft here..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <p className="mt-1 text-xs text-muted">
            {draft.length}/{MAX_EMAIL_LENGTH}
          </p>
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Rewriting..." : "Make it professional"}
        </Button>
      </form>

      {error && (
        <Card className="mt-6 border-danger">
          <p className="text-sm text-danger">{error}</p>
        </Card>
      )}

      {rewrite && (
        <AnimatedCard className="mt-6" hoverLift={false}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Professional version</h2>
            <Button variant="secondary" onClick={onCopy} type="button">
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
          <p className="mb-4 whitespace-pre-wrap text-sm leading-relaxed">
            {rewrite.rewritten}
          </p>
          {rewrite.notes && (
            <p className="text-xs text-muted">{rewrite.notes}</p>
          )}
        </AnimatedCard>
      )}

      {raw && (
        <AnimatedCard className="mt-6" hoverLift={false}>
          <p className="mb-2 text-xs text-muted">
            The AI responded, but not in the expected format. Here&apos;s the raw
            response:
          </p>
          <pre className="whitespace-pre-wrap font-mono text-sm">{raw}</pre>
        </AnimatedCard>
      )}

      {!loading && !error && !rewrite && !raw && (
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          }
          title="Your professional rewrite will appear here"
          description="Paste a draft above and submit it — the polished version shows up right in this spot."
        />
      )}
    </>
  );
}
