"use client";

import { FormEvent, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import {
  MAX_KEYWORDS_LENGTH,
  STYLE_OPTIONS,
  type DomainCandidate,
  type Style,
} from "@/lib/domains";
import type { Availability } from "@/lib/dns-check";

type Status = "idle" | "loading" | "done" | "error" | "not_configured";

interface CheckedCandidate extends DomainCandidate {
  domain: string;
  availability: Availability;
}

const AVAILABILITY_LABEL: Record<Availability, string> = {
  "likely-available": "Likely available",
  "likely-taken": "Likely taken",
  unknown: "Couldn't check",
};

const AVAILABILITY_CLASS: Record<Availability, string> = {
  "likely-available": "border-accent text-accent-strong",
  "likely-taken": "border-danger text-danger",
  unknown: "border-border text-muted",
};

/**
 * The availability check already happened server-side (all candidates come
 * back resolved in a single response, see app/api/brainstorm/route.ts) — this
 * component is purely presentational: it holds each result behind a
 * "checking…" state for a staggered delay so the per-suggestion check reads
 * as a live pending -> resolved transition instead of the whole list
 * popping in at once.
 */
function AvailabilityBadge({
  availability,
  delayMs,
}: {
  availability: Availability;
  delayMs: number;
}) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setRevealed(false);
    const timer = setTimeout(() => setRevealed(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  return (
    <span className="relative inline-flex h-[1.9rem] w-40 shrink-0 items-center justify-center">
      <AnimatePresence mode="wait" initial={false}>
        {!revealed ? (
          <motion.span
            key="pending"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inline-flex items-center gap-1.5 rounded-brand border border-border px-2 py-1 text-xs font-semibold text-muted"
          >
            <motion.span
              className="h-1.5 w-1.5 rounded-full bg-muted"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            />
            Checking…
          </motion.span>
        ) : (
          <motion.span
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 22 }}
            className={`absolute rounded-brand border px-2 py-1 text-xs font-semibold ${AVAILABILITY_CLASS[availability]}`}
          >
            {AVAILABILITY_LABEL[availability]}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

export default function Home() {
  const [keywords, setKeywords] = useState("");
  const [style, setStyle] = useState<Style>("Any");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [candidates, setCandidates] = useState<CheckedCandidate[]>([]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage("");
    setCandidates([]);

    try {
      const res = await fetch("/api/brainstorm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords, style }),
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

      setCandidates(data.result.candidates);
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
        <h1 className="mb-2 text-2xl font-semibold">Domain Name Brainstormer</h1>
        <p className="mb-6 text-muted">
          Describe your project in a few keywords. You&apos;ll get 10 creative
          .com/.rs name ideas, each with a live DNS-based availability check.
        </p>

        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label htmlFor="keywords">Project keywords</label>
              <input
                id="keywords"
                name="keywords"
                type="text"
                required
                maxLength={MAX_KEYWORDS_LENGTH}
                value={keywords}
                onChange={(event) => setKeywords(event.target.value)}
                placeholder="e.g. handmade pottery studio, Belgrade, gift shop"
                disabled={status === "loading"}
              />
            </div>
            <div>
              <label htmlFor="style">Naming style</label>
              <select
                id="style"
                name="style"
                value={style}
                onChange={(event) => setStyle(event.target.value as Style)}
                disabled={status === "loading"}
              >
                {STYLE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
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
              {status === "loading" ? "Brainstorming + checking DNS…" : "Suggest domain names"}
            </Button>
          </form>
        </Card>

        {candidates.length > 0 && (
          <div className="mt-6 flex flex-col gap-3">
            <p className="rounded-brand border border-border bg-surface p-3 text-xs text-muted">
              <strong className="text-fg">Availability is a best-effort signal, not a real check:</strong>{" "}
              it looks at whether the domain has DNS nameservers delegated,
              not an actual WHOIS/registry lookup. A domain can be registered
              but not yet have DNS configured (would show as &quot;likely
              available&quot; here even though it&apos;s taken), or DNS records
              can persist briefly after a domain expires. Always confirm on a
              real registrar before assuming a name is free.
            </p>
            {candidates.map((c, index) => (
              <AnimatedCard key={c.domain} index={index} hoverLift={false} className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-sm font-medium text-fg">{c.domain}</p>
                  <p className="text-sm text-muted">{c.rationale}</p>
                </div>
                <AvailabilityBadge availability={c.availability} delayMs={350 + index * 220} />
              </AnimatedCard>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
