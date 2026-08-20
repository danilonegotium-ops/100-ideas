"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { StatTile } from "@/components/motion/StatTile";
import { EmptyState } from "@/components/motion/EmptyState";
import type { Supplement } from "@/lib/supplements/types";

export function DashboardClient() {
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [takenToday, setTakenToday] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [scheduleTime, setScheduleTime] = useState("08:00");
  const [pillsPerDose, setPillsPerDose] = useState(1);
  const [pillsRemaining, setPillsRemaining] = useState(30);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [adding, setAdding] = useState(false);

  const [takingId, setTakingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const today = new Date().toISOString().slice(0, 10);

    const [suppResult, logResult] = await Promise.all([
      supabase
        .from("supplement_reminder_supplements")
        .select("*")
        .order("schedule_time", { ascending: true }),
      supabase
        .from("supplement_reminder_logs")
        .select("supplement_id")
        .eq("taken_date", today),
    ]);

    if (suppResult.error) setError(suppResult.error.message);
    if (logResult.error) setError(logResult.error.message);

    setSupplements(suppResult.data ?? []);
    setTakenToday(
      new Set(
        (logResult.data ?? []).map(
          (row: { supplement_id: string }) => row.supplement_id,
        ),
      ),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !dose.trim()) return;
    setAdding(true);
    setError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not logged in.");
      setAdding(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("supplement_reminder_supplements")
      .insert({
        owner_id: user.id,
        name: name.trim(),
        dose: dose.trim(),
        schedule_time: scheduleTime,
        pills_per_dose: pillsPerDose,
        pills_remaining: pillsRemaining,
        low_stock_threshold_doses: lowStockThreshold,
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setName("");
      setDose("");
      setScheduleTime("08:00");
      setPillsPerDose(1);
      setPillsRemaining(30);
      setLowStockThreshold(5);
      await loadData();
    }
    setAdding(false);
  }

  async function markTaken(supplement: Supplement) {
    setTakingId(supplement.id);
    setError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not logged in.");
      setTakingId(null);
      return;
    }

    const newRemaining = Math.max(
      0,
      supplement.pills_remaining - supplement.pills_per_dose,
    );

    const { error: updateError } = await supabase
      .from("supplement_reminder_supplements")
      .update({ pills_remaining: newRemaining })
      .eq("id", supplement.id);

    if (updateError) {
      setError(updateError.message);
      setTakingId(null);
      return;
    }

    const { error: logError } = await supabase
      .from("supplement_reminder_logs")
      .insert({ owner_id: user.id, supplement_id: supplement.id });

    if (logError) setError(logError.message);

    await loadData();
    setTakingId(null);
  }

  async function removeSupplement(supplement: Supplement) {
    if (!confirm(`Remove ${supplement.name}? This also removes its history.`))
      return;
    setError("");
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("supplement_reminder_supplements")
      .delete()
      .eq("id", supplement.id);
    if (deleteError) setError(deleteError.message);
    else await loadData();
  }

  if (loading) return <p className="text-sm text-muted">Loading…</p>;

  const takenCount = takenToday.size;
  const lowStockCount = supplements.filter((supplement) => {
    const dosesRemaining = Math.floor(
      supplement.pills_remaining / supplement.pills_per_dose,
    );
    return dosesRemaining < supplement.low_stock_threshold_doses;
  }).length;

  return (
    <div className="flex flex-col gap-8">
      {error && <p className="text-sm text-danger">{error}</p>}

      {supplements.length > 0 && (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile label="Supplements tracked" value={supplements.length} />
          <StatTile
            label="Taken today"
            value={takenCount}
            suffix={` / ${supplements.length}`}
          />
          <StatTile
            label="Low stock"
            value={lowStockCount}
            trend={lowStockCount > 0 ? "Reorder soon" : "All stocked up"}
            trendTone={lowStockCount > 0 ? "negative" : "positive"}
          />
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Today</h2>
        {supplements.length === 0 ? (
          <EmptyState
            title="No supplements yet"
            description="Add one below to start tracking doses and stock."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {supplements.map((supplement, index) => {
              const dosesRemaining = Math.floor(
                supplement.pills_remaining / supplement.pills_per_dose,
              );
              const lowStock =
                dosesRemaining < supplement.low_stock_threshold_doses;
              const taken = takenToday.has(supplement.id);

              return (
                <AnimatedCard
                  key={supplement.id}
                  index={index}
                  className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-fg">
                      {supplement.name}{" "}
                      <span className="text-xs text-muted">
                        {supplement.dose} &middot;{" "}
                        {supplement.schedule_time.slice(0, 5)}
                      </span>
                    </p>
                    <p
                      className={
                        lowStock
                          ? "mt-1 text-xs text-danger"
                          : "mt-1 text-xs text-muted"
                      }
                    >
                      {dosesRemaining} dose{dosesRemaining === 1 ? "" : "s"}{" "}
                      left
                      {lowStock ? " — running low, reorder soon" : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => removeSupplement(supplement)}
                    >
                      Remove
                    </Button>
                    <Button
                      onClick={() => markTaken(supplement)}
                      disabled={
                        taken ||
                        takingId === supplement.id ||
                        supplement.pills_remaining <= 0
                      }
                    >
                      {taken
                        ? "Taken today"
                        : takingId === supplement.id
                          ? "Saving…"
                          : supplement.pills_remaining <= 0
                            ? "Out of stock"
                            : "Taken"}
                    </Button>
                  </div>
                </AnimatedCard>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Add a supplement</h2>
        <Card>
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Vitamin D3"
                  required
                />
              </div>
              <div>
                <label htmlFor="dose">Dose</label>
                <input
                  id="dose"
                  value={dose}
                  onChange={(event) => setDose(event.target.value)}
                  placeholder="2000 IU"
                  required
                />
              </div>
              <div>
                <label htmlFor="scheduleTime">Time of day</label>
                <input
                  id="scheduleTime"
                  type="time"
                  value={scheduleTime}
                  onChange={(event) => setScheduleTime(event.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="pillsPerDose">Pills per dose</label>
                <input
                  id="pillsPerDose"
                  type="number"
                  min={1}
                  value={pillsPerDose}
                  onChange={(event) =>
                    setPillsPerDose(Number(event.target.value) || 1)
                  }
                  required
                />
              </div>
              <div>
                <label htmlFor="pillsRemaining">Pills currently on hand</label>
                <input
                  id="pillsRemaining"
                  type="number"
                  min={0}
                  value={pillsRemaining}
                  onChange={(event) =>
                    setPillsRemaining(Number(event.target.value) || 0)
                  }
                  required
                />
              </div>
              <div>
                <label htmlFor="lowStockThreshold">
                  Warn below this many doses
                </label>
                <input
                  id="lowStockThreshold"
                  type="number"
                  min={0}
                  value={lowStockThreshold}
                  onChange={(event) =>
                    setLowStockThreshold(Number(event.target.value) || 0)
                  }
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={adding} className="self-start">
              {adding ? "Adding…" : "Add supplement"}
            </Button>
          </form>
        </Card>
      </section>
    </div>
  );
}
