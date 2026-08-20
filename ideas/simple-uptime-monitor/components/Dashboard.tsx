"use client";

import { FormEvent, useState } from "react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { EmptyState } from "@/components/motion/EmptyState";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Monitor, CheckLogRow } from "@/lib/types";

type FormStatus = "idle" | "saving" | "error";

const statusStyles: Record<Monitor["last_status"], string> = {
  up: "bg-transparent text-accent-strong border-accent",
  down: "bg-transparent text-danger border-danger",
  unknown: "bg-transparent text-muted border-border",
};

export function Dashboard({
  initialMonitors,
  initialChecks,
}: {
  initialMonitors: Monitor[];
  initialChecks: CheckLogRow[];
}) {
  const [monitors, setMonitors] = useState<Monitor[]>(initialMonitors);
  const [checks, setChecks] = useState<CheckLogRow[]>(initialChecks);
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [formStatus, setFormStatus] = useState<FormStatus>("idle");
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [checkingNow, setCheckingNow] = useState(false);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormStatus("saving");
    setFormError("");

    const supabase = createClient();
    const { data, error } = await supabase
      .from("simple_uptime_monitor_monitors")
      .insert({ url: url.trim(), label: label.trim() || null })
      .select("id, url, label, last_status, last_checked_at, created_at")
      .single();

    if (error || !data) {
      setFormStatus("error");
      setFormError(error?.message ?? "Could not add monitor.");
      return;
    }

    setMonitors((prev) => [data, ...prev]);
    setUrl("");
    setLabel("");
    setFormStatus("idle");
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const supabase = createClient();
    const { error } = await supabase
      .from("simple_uptime_monitor_monitors")
      .delete()
      .eq("id", id);

    if (!error) {
      setMonitors((prev) => prev.filter((m) => m.id !== id));
      setChecks((prev) => prev.filter((c) => c.monitor_id !== id));
    }
    setDeletingId(null);
  }

  async function handleCheckNow() {
    setCheckingNow(true);
    try {
      const res = await fetch("/api/check-now", { method: "POST" });
      if (res.ok) {
        // Re-fetch fresh state from Supabase directly rather than trusting
        // the route's response shape for UI state — simplest way to stay
        // in sync with what actually landed in the DB.
        const supabase = createClient();
        const [{ data: freshMonitors }, { data: freshChecks }] =
          await Promise.all([
            supabase
              .from("simple_uptime_monitor_monitors")
              .select("id, url, label, last_status, last_checked_at, created_at")
              .order("created_at", { ascending: false }),
            supabase
              .from("simple_uptime_monitor_checks")
              .select(
                "id, monitor_id, status, status_code, response_ms, checked_at",
              )
              .order("checked_at", { ascending: false })
              .limit(200),
          ]);
        if (freshMonitors) setMonitors(freshMonitors);
        if (freshChecks) setChecks(freshChecks);
      }
    } finally {
      setCheckingNow(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <form
          onSubmit={handleAdd}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label htmlFor="url">URL to monitor</label>
            <input
              id="url"
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="label">Label (optional)</label>
            <input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="My homepage"
            />
          </div>
          <Button type="submit" disabled={formStatus === "saving"}>
            {formStatus === "saving" ? "Adding…" : "Add monitor"}
          </Button>
        </form>
        {formStatus === "error" && (
          <p className="mt-2 text-sm text-danger">{formError}</p>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your monitors</h2>
        <Button
          variant="secondary"
          onClick={handleCheckNow}
          disabled={checkingNow || monitors.length === 0}
        >
          {checkingNow ? "Checking…" : "Check all now"}
        </Button>
      </div>

      {monitors.length === 0 ? (
        <EmptyState
          title="No monitors yet"
          description={
            'Add a URL above. Vercel Cron checks every monitor every 5 minutes once deployed (see vercel.json); use "Check all now" to test locally in the meantime.'
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {monitors.map((m, i) => {
            const history = checks
              .filter((c) => c.monitor_id === m.id)
              .slice(0, 8);
            return (
              <AnimatedCard key={m.id} index={i}>
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{m.label || m.url}</p>
                    {m.label && (
                      <p className="text-xs text-muted">{m.url}</p>
                    )}
                    <p className="mt-1 text-xs text-muted">
                      {m.last_checked_at
                        ? `Last checked ${new Date(m.last_checked_at).toLocaleString()}`
                        : "Not checked yet"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-xs font-semibold uppercase",
                        statusStyles[m.last_status],
                      )}
                    >
                      {m.last_status}
                    </span>
                    <Button
                      variant="danger"
                      onClick={() => handleDelete(m.id)}
                      disabled={deletingId === m.id}
                    >
                      {deletingId === m.id ? "Removing…" : "Remove"}
                    </Button>
                  </div>
                </div>
                {history.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs text-muted">Recent checks</p>
                    <ul className="flex flex-col gap-1">
                      {history.map((c) => (
                        <li
                          key={c.id}
                          className="flex items-center justify-between text-xs text-muted"
                        >
                          <span
                            className={cn(
                              "font-semibold",
                              c.status === "up"
                                ? "text-accent-strong"
                                : "text-danger",
                            )}
                          >
                            {c.status.toUpperCase()}
                          </span>
                          <span>
                            {c.status_code ? `HTTP ${c.status_code}` : "no response"}
                            {c.response_ms != null ? ` · ${c.response_ms}ms` : ""}
                          </span>
                          <span>{new Date(c.checked_at).toLocaleString()}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </AnimatedCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
