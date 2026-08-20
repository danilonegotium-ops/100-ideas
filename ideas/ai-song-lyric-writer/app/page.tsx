"use client";

import { FormEvent, useState } from "react";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/Button";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { GlassPanel } from "@/components/motion/GlassPanel";
import { EmptyState } from "@/components/motion/EmptyState";
import {
  GENRE_PRESETS,
  MAX_GENRE_LENGTH,
  MAX_THEME_LENGTH,
  type LyricsResult,
} from "@/lib/lyrics";

type Status = "idle" | "loading" | "done" | "error" | "not_configured";

export default function Home() {
  const [genre, setGenre] = useState<string>(GENRE_PRESETS[0]);
  const [customGenre, setCustomGenre] = useState("");
  const [theme, setTheme] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<LyricsResult | null>(null);

  const effectiveGenre = genre === "Other" ? customGenre : genre;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage("");
    setResult(null);

    try {
      const res = await fetch("/api/lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genre: effectiveGenre, theme }),
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
        <h1 className="mb-2 text-2xl font-semibold">AI Song Lyric Writer</h1>
        <p className="mb-6 text-muted">
          Pick a genre, describe a mood or theme in your own words (e.g.
          &quot;Balkan ballad about a rainy day&quot;), and get original lyrics
          with a real verse/chorus structure.
        </p>

        <GlassPanel glow>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label htmlFor="genre">Genre</label>
              <select
                id="genre"
                name="genre"
                value={genre}
                onChange={(event) => setGenre(event.target.value)}
                disabled={status === "loading"}
              >
                {GENRE_PRESETS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
                <option value="Other">Other (type your own)</option>
              </select>
            </div>

            {genre === "Other" && (
              <div>
                <label htmlFor="customGenre">Custom genre</label>
                <input
                  id="customGenre"
                  name="customGenre"
                  type="text"
                  required
                  maxLength={MAX_GENRE_LENGTH}
                  value={customGenre}
                  onChange={(event) => setCustomGenre(event.target.value)}
                  placeholder="e.g. Balkan ballad"
                  disabled={status === "loading"}
                />
              </div>
            )}

            <div>
              <label htmlFor="theme">Mood / theme</label>
              <textarea
                id="theme"
                name="theme"
                required
                rows={3}
                maxLength={MAX_THEME_LENGTH}
                value={theme}
                onChange={(event) => setTheme(event.target.value)}
                placeholder="e.g. missing someone during a rainy Belgrade autumn"
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

            <Button
              type="submit"
              disabled={status === "loading" || (genre === "Other" && customGenre.trim().length === 0)}
            >
              {status === "loading" ? "Writing lyrics…" : "Write lyrics"}
            </Button>
          </form>
        </GlassPanel>

        {result && (
          <AnimatedCard className="mt-6" hoverLift={false}>
            <h2 className="mb-4 text-lg font-semibold">{result.title}</h2>
            <div className="flex flex-col gap-4">
              {result.sections.map((section, i) => (
                <div key={i}>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                    {section.section}
                  </p>
                  <p className="whitespace-pre-line text-sm text-fg">{section.lyrics}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs text-muted">
              AI-generated and original by design, but always your own final
              read before publishing — check it doesn&apos;t accidentally echo
              an existing song&apos;s lines before you use it publicly.
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
                  d="M9 19V6l12-2v13M9 19a3 3 0 11-6 0 3 3 0 016 0zm12-2a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            }
            title="Your lyrics will appear here"
            description="Pick a genre and describe a mood or theme above to get an original verse/chorus structure."
          />
        )}
      </main>
    </>
  );
}
