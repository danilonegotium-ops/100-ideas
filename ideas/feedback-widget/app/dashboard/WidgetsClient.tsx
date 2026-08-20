"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { EmptyState } from "@/components/motion/EmptyState";
import type { Widget } from "@/lib/feedback/types";

export function WidgetsClient() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [question, setQuestion] = useState("Was this helpful?");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error: loadError } = await supabase
      .from("feedback_widget_widgets")
      .select("*")
      .order("created_at", { ascending: false });
    if (loadError) setError(loadError.message);
    setWidgets(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim()) return;
    setCreating(true);
    setError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not logged in.");
      setCreating(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("feedback_widget_widgets")
      .insert({ owner_id: user.id, question: question.trim() });

    if (insertError) {
      setError(insertError.message);
    } else {
      setQuestion("Was this helpful?");
      await load();
    }
    setCreating(false);
  }

  async function handleDelete(widget: Widget) {
    if (
      !confirm(`Delete "${widget.question}"? This removes all its responses too.`)
    )
      return;
    setError("");
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("feedback_widget_widgets")
      .delete()
      .eq("id", widget.id);
    if (deleteError) setError(deleteError.message);
    else await load();
  }

  if (loading) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <div className="flex flex-col gap-8">
      {error && <p className="text-sm text-danger">{error}</p>}

      <Card>
        <form
          onSubmit={handleCreate}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <input
            placeholder="Question, e.g. Was this helpful?"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            required
          />
          <Button type="submit" disabled={creating}>
            {creating ? "Creating…" : "Create widget"}
          </Button>
        </form>
      </Card>

      {widgets.length === 0 ? (
        <EmptyState
          title="No widgets yet"
          description="Create your first feedback widget above, then embed it on any site."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {widgets.map((widget, i) => (
            <AnimatedCard
              key={widget.id}
              index={i}
              className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium text-fg">{widget.question}</p>
                <p className="text-xs text-muted">
                  created {new Date(widget.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/dashboard/${widget.id}`}>
                  <Button variant="secondary">View / embed</Button>
                </Link>
                <Button variant="danger" onClick={() => handleDelete(widget)}>
                  Delete
                </Button>
              </div>
            </AnimatedCard>
          ))}
        </div>
      )}
    </div>
  );
}
