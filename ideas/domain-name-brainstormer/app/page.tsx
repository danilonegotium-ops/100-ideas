"use client";

import { FormEvent, useState } from "react";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
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
            {candidates.map((c) => (
              <Card key={c.domain} className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-sm font-medium text-fg">{c.domain}</p>
                  <p className="text-sm text-muted">{c.rationale}</p>
                </div>
                <span
                  className={`shrink-0 rounded-brand border px-2 py-1 text-xs font-semibold ${AVAILABILITY_CLASS[c.availability]}`}
                >
                  {AVAILABILITY_LABEL[c.availability]}
                </span>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
