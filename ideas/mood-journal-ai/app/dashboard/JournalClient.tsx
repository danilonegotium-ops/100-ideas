"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { computeInsights, describeInsight } from "@/lib/mood/insights";
import { formatEntryDate, todayLocalISO } from "@/lib/mood/types";
import type { MoodEntry } from "@/lib/mood/types";

const MAX_CONTENT_LENGTH = 4000;

const MOOD_COLORS: Record<string, string> = {
  "-2": "text-danger",
  "-1": "text-danger",
  "0": "text-muted",
  "1": "text-accent",
  "2": "text-accent",
};

function moodColorClass(score: number | null): string {
  if (score === null) return "text-muted";
  return MOOD_COLORS[String(score)] ?? "text-muted";
}

export function JournalClient() {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const today = todayLocalISO();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("mood_journal_ai_entries")
      .select("*")
      .order("entry_date", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      const rows = (data ?? []) as MoodEntry[];
      setEntries(rows);
      const todayEntry = rows.find((e) => e.entry_date === today);
      if (todayEntry) setContent(todayEntry.content);
    }
    setLoading(false);
  }, [today]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_CONTENT_LENGTH) {
      setError(`Entry is too long (max ${MAX_CONTENT_LENGTH} characters).`);
      return;
    }

    setSaving(true);
    setError("");
    setStatusMessage("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not logged in.");
      setSaving(false);
      return;
    }

    // Ask the server-side AI route to tag the mood first. If it's not
    // configured (no live key yet) or the call fails, we still save the
    // entry itself — the journal always works, the mood tag is best-effort.
    let moodLabel: string | null = null;
    let moodScore: number | null = null;

    try {
      const res = await fetch("/api/analyze-mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      const result = await res.json();
      if (result.configured === false) {
        setStatusMessage(
          "Entry saved. Mood tagging isn't available yet — GOOGLE_AI_API_KEY isn't configured.",
        );
      } else if (result.error) {
        setStatusMessage(`Entry saved, but mood tagging failed: ${result.error}`);
      } else if (result.mood_label && typeof result.mood_score === "number") {
        moodLabel = result.mood_label;
        moodScore = result.mood_score;
        setStatusMessage(`Entry saved and tagged as "${moodLabel}".`);
      }
    } catch {
      setStatusMessage("Entry saved, but the mood-tagging request failed.");
    }

    const { error: upsertError } = await supabase
      .from("mood_journal_ai_entries")
      .upsert(
        {
          owner_id: user.id,
          entry_date: today,
          content: trimmed,
          mood_label: moodLabel,
          mood_score: moodScore,
        },
        { onConflict: "owner_id,entry_date" },
      );

    if (upsertError) {
      setError(upsertError.message);
      setStatusMessage("");
    } else {
      await load();
    }
    setSaving(false);
  }

  const insights = computeInsights(entries);
  const pastEntries = entries.filter((e) => e.entry_date !== today);

  if (loading) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <div className="flex flex-col gap-8">
      {error && <p className="text-sm text-danger">{error}</p>}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Today</h2>
        <Card>
          <form onSubmit={handleSave} className="flex flex-col gap-3">
            <div>
              <label htmlFor="content">How was your day?</label>
              <textarea
                id="content"
                rows={5}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Write about your day — what happened, how you felt…"
                maxLength={MAX_CONTENT_LENGTH}
                required
              />
              <p className="mt-1 text-xs text-muted">
                {content.length}/{MAX_CONTENT_LENGTH}
              </p>
            </div>
            <Button type="submit" disabled={saving} className="self-start">
              {saving ? "Saving…" : "Save today's entry"}
            </Button>
            {statusMessage && (
              <p className="text-sm text-muted">{statusMessage}</p>
            )}
          </form>
        </Card>
      </section>

      {insights.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Patterns</h2>
          <Card className="flex flex-col gap-2">
            {insights.map((insight) => (
              <p key={insight.theme.key} className="text-sm text-fg">
                {describeInsight(insight)}
              </p>
            ))}
            <p className="text-xs text-muted">
              Computed from your stored entries and mood tags (keyword
              matching, not a second AI call).
            </p>
          </Card>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">History</h2>
        {pastEntries.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">
              No past entries yet — come back tomorrow.
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {pastEntries.map((entry) => (
              <Card key={entry.id}>
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-sm font-medium text-fg">
                    {formatEntryDate(entry.entry_date)}
                  </p>
                  {entry.mood_label && (
                    <span
                      className={`text-xs font-semibold ${moodColorClass(entry.mood_score)}`}
                    >
                      {entry.mood_label}
                      {typeof entry.mood_score === "number" &&
                        ` (${entry.mood_score > 0 ? "+" : ""}${entry.mood_score})`}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted">{entry.content}</p>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
