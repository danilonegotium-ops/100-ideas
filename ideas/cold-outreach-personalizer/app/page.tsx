"use client";

import { FormEvent, useState } from "react";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/Button";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { GlassPanel } from "@/components/motion/GlassPanel";
import { EmptyState } from "@/components/motion/EmptyState";
import {
  MAX_BIO_LENGTH,
  MAX_CONTEXT_LENGTH,
  TONE_OPTIONS,
  type OutreachResult,
  type Tone,
} from "@/lib/outreach";

type Status = "idle" | "loading" | "done" | "error" | "not_configured";

export default function Home() {
  const [bio, setBio] = useState("");
  const [senderContext, setSenderContext] = useState("");
  const [tone, setTone] = useState<Tone>("Professional");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<OutreachResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage("");
    setResult(null);

    try {
      const res = await fetch("/api/personalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio, senderContext, tone }),
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

  async function copyLine(index: number, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex((current) => (current === index ? null : current)), 1500);
    } catch {
      // Clipboard API can fail (permissions/non-HTTPS) — not worth surfacing an error for.
    }
  }

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Cold Outreach Personalizer</h1>
        <p className="mb-2 text-muted">
          Paste a prospect&apos;s bio or profile summary — text you&apos;re
          already looking at, copied yourself. Get a specific, non-generic
          first line for a cold outreach email.
        </p>
        <p className="mb-6 text-xs text-muted">
          This tool never accesses LinkedIn or any other site directly — it
          only works with text you paste in, since scraping profiles violates
          most platforms&apos; terms of service.
        </p>

        <GlassPanel glow>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label htmlFor="bio">Their bio / profile summary</label>
              <textarea
                id="bio"
                name="bio"
                required
                rows={8}
                maxLength={MAX_BIO_LENGTH}
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder="Paste the About/Summary section, or any bio text, here…"
                disabled={status === "loading"}
              />
            </div>

            <div>
              <label htmlFor="senderContext">
                What you&apos;re reaching out about (optional)
              </label>
              <input
                id="senderContext"
                name="senderContext"
                type="text"
                maxLength={MAX_CONTEXT_LENGTH}
                value={senderContext}
                onChange={(event) => setSenderContext(event.target.value)}
                placeholder="e.g. our design agency helps SaaS teams with onboarding UX"
                disabled={status === "loading"}
              />
            </div>

            <div>
              <label htmlFor="tone">Tone</label>
              <select
                id="tone"
                name="tone"
                value={tone}
                onChange={(event) => setTone(event.target.value as Tone)}
                disabled={status === "loading"}
              >
                {TONE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {status === "error" && <p className="text-sm text-danger">{errorMessage}</p>}
            {status === "not_configured" && (
              <p className="text-sm text-danger">
                AI isn&apos;t configured yet on this deployment — the site owner
                needs to set a Google AI Studio API key. Nothing you did wrong.
              </p>
            )}

            <Button type="submit" disabled={status === "loading"}>
              {status === "loading" ? "Writing opening lines…" : "Generate opening lines"}
            </Button>
          </form>
        </GlassPanel>

        {result && (
          <div className="mt-6 flex flex-col gap-3">
            {result.openingLines.map((line, i) => (
              <AnimatedCard key={i} index={i}>
                {line.angle && (
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                    {line.angle}
                  </p>
                )}
                <p className="mb-3 text-sm text-fg">{line.text}</p>
                <Button variant="secondary" onClick={() => copyLine(i, line.text)}>
                  {copiedIndex === i ? "Copied" : "Copy"}
                </Button>
              </AnimatedCard>
            ))}
          </div>
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
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-6l-4 4v-4z"
                />
              </svg>
            }
            title="Your opening lines will appear here"
            description="Paste a prospect's bio above and submit it — specific, non-generic opening lines show up right in this spot."
          />
        )}
      </main>
    </>
  );
}
