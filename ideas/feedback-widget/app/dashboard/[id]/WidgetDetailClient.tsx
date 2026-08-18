"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/Card";
import type { WidgetResponse } from "@/lib/feedback/types";

interface DayCount {
  date: string;
  yes: number;
  no: number;
}

export function WidgetDetailClient({ widgetId }: { widgetId: string }) {
  const [responses, setResponses] = useState<WidgetResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [origin, setOrigin] = useState("");

  // window.location isn't available during server rendering, and reading
  // it here (inside useEffect) rather than at render time keeps this
  // component safe to prerender.
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error: loadError } = await supabase
      .from("feedback_widget_responses")
      .select("*")
      .eq("widget_id", widgetId)
      .order("created_at", { ascending: false })
      .limit(500);
    if (loadError) setError(loadError.message);
    setResponses(data ?? []);
    setLoading(false);
  }, [widgetId]);

  useEffect(() => {
    load();
  }, [load]);

  const snippet = `<script src="${origin}/widget.js" data-widget-id="${widgetId}" async></script>`;

  const yesCount = responses.filter((r) => r.answer).length;
  const noCount = responses.length - yesCount;

  const byDay = new Map<string, DayCount>();
  for (const r of responses) {
    const date = r.created_at.slice(0, 10);
    const existing = byDay.get(date) ?? { date, yes: 0, no: 0 };
    if (r.answer) existing.yes += 1;
    else existing.no += 1;
    byDay.set(date, existing);
  }
  const days = Array.from(byDay.values()).sort((a, b) =>
    a.date < b.date ? 1 : -1,
  );

  return (
    <div className="flex flex-col gap-8">
      {error && <p className="text-sm text-danger">{error}</p>}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Embed snippet</h2>
        <Card>
          <p className="mb-2 text-sm text-muted">
            Paste this one line anywhere on any site (before{" "}
            <code className="font-mono">&lt;/body&gt;</code> is a safe bet):
          </p>
          <pre className="overflow-x-auto rounded bg-bg p-3 text-xs text-fg">
            <code>{snippet || "loading…"}</code>
          </pre>
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Stats</h2>
        {loading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : (
          <>
            <Card className="mb-4">
              <p className="text-sm text-fg">
                <strong>{yesCount}</strong> yes &middot;{" "}
                <strong>{noCount}</strong> no &middot; {responses.length}{" "}
                total
              </p>
            </Card>
            {days.length === 0 ? (
              <p className="text-sm text-muted">No responses yet.</p>
            ) : (
              <Card>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs text-muted">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Yes</th>
                      <th className="pb-2">No</th>
                    </tr>
                  </thead>
                  <tbody>
                    {days.map((day) => (
                      <tr key={day.date} className="border-t border-border">
                        <td className="py-1 text-fg">{day.date}</td>
                        <td className="py-1 text-fg">{day.yes}</td>
                        <td className="py-1 text-fg">{day.no}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </>
        )}
      </section>
    </div>
  );
}
