"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { dueStatus } from "@/lib/pets/types";
import type { EntryType, PetEntry } from "@/lib/pets/types";

const TODAY_ISO = () => new Date().toISOString().slice(0, 10);

export function PetDetailClient({ petId }: { petId: string }) {
  const [entries, setEntries] = useState<PetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [entryType, setEntryType] = useState<EntryType>("vaccination");
  const [description, setDescription] = useState("");
  const [entryDate, setEntryDate] = useState(TODAY_ISO());
  const [nextDueDate, setNextDueDate] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error: loadError } = await supabase
      .from("pet_health_records_entries")
      .select("*")
      .eq("pet_id", petId)
      .order("entry_date", { ascending: false });
    if (loadError) setError(loadError.message);
    setEntries(data ?? []);
    setLoading(false);
  }, [petId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!description.trim() || !entryDate) return;
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
      .from("pet_health_records_entries")
      .insert({
        owner_id: user.id,
        pet_id: petId,
        entry_type: entryType,
        description: description.trim(),
        entry_date: entryDate,
        next_due_date: nextDueDate || null,
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setDescription("");
      setEntryDate(TODAY_ISO());
      setNextDueDate("");
      await load();
    }
    setAdding(false);
  }

  async function removeEntry(entry: PetEntry) {
    if (!confirm("Remove this record?")) return;
    setError("");
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("pet_health_records_entries")
      .delete()
      .eq("id", entry.id);
    if (deleteError) setError(deleteError.message);
    else await load();
  }

  if (loading) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <div className="flex flex-col gap-8">
      {error && <p className="text-sm text-danger">{error}</p>}

      <section>
        <h2 className="mb-3 text-lg font-semibold">History</h2>
        {entries.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">No records yet — add one below.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map((entry) => {
              const status = entry.next_due_date
                ? dueStatus(entry.next_due_date)
                : null;
              return (
                <Card
                  key={entry.id}
                  className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-fg">
                      {entry.description}{" "}
                      <span className="text-xs text-muted">
                        {entry.entry_type === "vaccination"
                          ? "vaccination"
                          : "vet visit"}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {entry.entry_date}
                      {entry.next_due_date && (
                        <>
                          {" "}
                          &middot; next due {entry.next_due_date}{" "}
                          {status === "overdue" && (
                            <span className="text-danger">(overdue)</span>
                          )}
                          {status === "upcoming" && (
                            <span className="text-accent">(due soon)</span>
                          )}
                        </>
                      )}
                    </p>
                  </div>
                  <Button variant="secondary" onClick={() => removeEntry(entry)}>
                    Remove
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Add a record</h2>
        <Card>
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="entryType">Type</label>
                <select
                  id="entryType"
                  value={entryType}
                  onChange={(event) =>
                    setEntryType(event.target.value as EntryType)
                  }
                >
                  <option value="vaccination">Vaccination</option>
                  <option value="vet_visit">Vet visit</option>
                </select>
              </div>
              <div>
                <label htmlFor="entryDate">Date</label>
                <input
                  id="entryDate"
                  type="date"
                  value={entryDate}
                  onChange={(event) => setEntryDate(event.target.value)}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="description">Description</label>
                <input
                  id="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Rabies vaccination"
                  required
                />
              </div>
              <div>
                <label htmlFor="nextDueDate">Next due date (optional)</label>
                <input
                  id="nextDueDate"
                  type="date"
                  value={nextDueDate}
                  onChange={(event) => setNextDueDate(event.target.value)}
                />
              </div>
            </div>
            <Button type="submit" disabled={adding} className="self-start">
              {adding ? "Adding…" : "Add record"}
            </Button>
          </form>
        </Card>
      </section>
    </div>
  );
}
