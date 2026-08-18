"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, type Site } from "@/lib/types";

type ReportState = "idle" | "sending" | "reported";
type SubmitStatus = "idle" | "saving" | "error";

export function Stumble({
  initialSites,
  userId,
}: {
  initialSites: Site[];
  userId: string | null;
}) {
  const [sites, setSites] = useState<Site[]>(initialSites);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [current, setCurrent] = useState<Site | null>(null);
  const [reportState, setReportState] = useState<ReportState>("idle");
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [submitError, setSubmitError] = useState("");

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);

  const pool = useMemo(
    () =>
      categoryFilter === "all"
        ? sites
        : sites.filter((s) => s.category === categoryFilter),
    [sites, categoryFilter],
  );

  function surpriseMe() {
    if (pool.length === 0) {
      setCurrent(null);
      return;
    }
    const candidates =
      pool.length > 1 && current
        ? pool.filter((s) => s.id !== current.id)
        : pool;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    setCurrent(pick);
    setReportState("idle");
  }

  async function handleReport() {
    if (!current || !userId) return;
    setReportState("sending");
    const supabase = createClient();
    const { error } = await supabase
      .from("found_this_cool_site_reports")
      .insert({ site_id: current.id, reported_by: userId });

    // A unique-violation (already reported this site before) is treated
    // the same as success — idempotent from the user's point of view.
    if (error && error.code !== "23505") {
      setReportState("idle");
      return;
    }
    setReportState("reported");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) return;
    setSubmitStatus("saving");
    setSubmitError("");

    const supabase = createClient();
    const { data, error } = await supabase
      .from("found_this_cool_site_sites")
      .insert({
        title: title.trim(),
        url: url.trim(),
        description: description.trim(),
        category,
        submitted_by: userId,
      })
      .select("id, title, url, description, category")
      .single();

    if (error || !data) {
      setSubmitStatus("error");
      setSubmitError(error?.message ?? "Could not submit this site.");
      return;
    }

    setSites((prev) => [data, ...prev]);
    setTitle("");
    setUrl("");
    setDescription("");
    setCategory(CATEGORIES[0]);
    setSubmitStatus("idle");
    setShowSubmitForm(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-auto"
        >
          <option value="all">Any category</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <Button onClick={surpriseMe} disabled={pool.length === 0}>
          Surprise me
        </Button>
      </div>

      {current ? (
        <Card>
          <p className="mb-1 inline-block rounded-full border border-border px-2 py-0.5 text-xs text-muted">
            {current.category}
          </p>
          <h2 className="mb-1 text-xl font-semibold">
            <Link
              href={current.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-fg no-underline hover:text-accent-strong"
            >
              {current.title} &rarr;
            </Link>
          </h2>
          <p className="mb-1 text-xs text-muted">{current.url}</p>
          <p className="mb-4 text-sm">{current.description}</p>
          {userId ? (
            <Button
              variant="secondary"
              onClick={handleReport}
              disabled={reportState !== "idle"}
            >
              {reportState === "reported"
                ? "Reported — thanks"
                : reportState === "sending"
                  ? "Reporting…"
                  : "Report this link"}
            </Button>
          ) : (
            <p className="text-xs text-muted">
              <Link href="/login" className="text-accent-strong">
                Log in
              </Link>{" "}
              to report a bad link.
            </p>
          )}
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-muted">
            {pool.length === 0
              ? "No sites in this category yet."
              : 'Hit "Surprise me" to land on something.'}
          </p>
        </Card>
      )}

      <div>
        {userId ? (
          <Button
            variant="secondary"
            onClick={() => setShowSubmitForm((v) => !v)}
          >
            {showSubmitForm ? "Cancel" : "Submit a site"}
          </Button>
        ) : (
          <p className="text-sm text-muted">
            <Link href="/login" className="text-accent-strong">
              Log in
            </Link>{" "}
            to submit a site to the pool.
          </p>
        )}
      </div>

      {showSubmitForm && userId && (
        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label htmlFor="title">Title</label>
              <input
                id="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. A really cool tool"
              />
            </div>
            <div>
              <label htmlFor="url">URL</label>
              <input
                id="url"
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label htmlFor="description">Short description</label>
              <textarea
                id="description"
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="category">Category</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            {submitStatus === "error" && (
              <p className="text-sm text-danger">{submitError}</p>
            )}
            <p className="text-xs text-muted">
              Submissions are auto-approved and go straight into the pool
              for this MVP — anyone can flag a bad link afterwards.
            </p>
            <Button type="submit" disabled={submitStatus === "saving"}>
              {submitStatus === "saving" ? "Submitting…" : "Add to the pool"}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
