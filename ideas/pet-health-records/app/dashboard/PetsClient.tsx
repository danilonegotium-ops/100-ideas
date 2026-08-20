"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { StatTile } from "@/components/motion/StatTile";
import { EmptyState } from "@/components/motion/EmptyState";
import { dueStatus } from "@/lib/pets/types";
import type { Pet, PetEntry } from "@/lib/pets/types";

interface PetBadge {
  overdue: number;
  upcoming: number;
}

export function PetsClient() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [badges, setBadges] = useState<Record<string, PetBadge>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [chipNumber, setChipNumber] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const supabase = createClient();

    const [petsResult, entriesResult] = await Promise.all([
      supabase.from("pet_health_records_pets").select("*").order("name"),
      supabase
        .from("pet_health_records_entries")
        .select("pet_id, next_due_date")
        .not("next_due_date", "is", null),
    ]);

    if (petsResult.error) setError(petsResult.error.message);
    if (entriesResult.error) setError(entriesResult.error.message);

    setPets(petsResult.data ?? []);

    const nextBadges: Record<string, PetBadge> = {};
    const today = new Date();
    for (const row of (entriesResult.data ?? []) as Pick<
      PetEntry,
      "pet_id" | "next_due_date"
    >[]) {
      if (!row.next_due_date) continue;
      const status = dueStatus(row.next_due_date, today);
      if (status === "ok") continue;
      const badge = nextBadges[row.pet_id] ?? { overdue: 0, upcoming: 0 };
      if (status === "overdue") badge.overdue += 1;
      else badge.upcoming += 1;
      nextBadges[row.pet_id] = badge;
    }
    setBadges(nextBadges);

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !species.trim()) return;
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
      .from("pet_health_records_pets")
      .insert({
        owner_id: user.id,
        name: name.trim(),
        species: species.trim(),
        chip_number: chipNumber.trim() || null,
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setName("");
      setSpecies("");
      setChipNumber("");
      await load();
    }
    setAdding(false);
  }

  async function removePet(pet: Pet) {
    if (!confirm(`Remove ${pet.name}? This also removes their history.`))
      return;
    setError("");
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("pet_health_records_pets")
      .delete()
      .eq("id", pet.id);
    if (deleteError) setError(deleteError.message);
    else await load();
  }

  if (loading) return <p className="text-sm text-muted">Loading…</p>;

  const overdueCount = Object.values(badges).reduce(
    (sum, badge) => sum + badge.overdue,
    0,
  );
  const upcomingCount = Object.values(badges).reduce(
    (sum, badge) => sum + badge.upcoming,
    0,
  );

  return (
    <div className="flex flex-col gap-8">
      {error && <p className="text-sm text-danger">{error}</p>}

      {pets.length > 0 && (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile label="Pets" value={pets.length} />
          <StatTile
            label="Overdue vaccinations"
            value={overdueCount}
            trend={overdueCount > 0 ? "Needs attention" : "All caught up"}
            trendTone={overdueCount > 0 ? "negative" : "positive"}
          />
          <StatTile
            label="Due within 30 days"
            value={upcomingCount}
            trendTone="neutral"
          />
        </section>
      )}

      <div className="flex flex-col gap-3">
        {pets.map((pet, index) => {
          const badge = badges[pet.id];
          return (
            <AnimatedCard
              key={pet.id}
              index={index}
              className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium text-fg">
                  {pet.name}{" "}
                  <span className="text-xs text-muted">{pet.species}</span>
                </p>
                {pet.chip_number && (
                  <p className="mt-1 text-xs text-muted">
                    Chip: {pet.chip_number}
                  </p>
                )}
                {badge && (
                  <p className="mt-1 text-xs text-danger">
                    {badge.overdue > 0 &&
                      `${badge.overdue} vaccination${badge.overdue === 1 ? "" : "s"} overdue`}
                    {badge.overdue > 0 && badge.upcoming > 0 && " · "}
                    {badge.upcoming > 0 &&
                      `${badge.upcoming} due within 30 days`}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Link href={`/dashboard/${pet.id}`}>
                  <Button variant="secondary">View records</Button>
                </Link>
                <Button variant="danger" onClick={() => removePet(pet)}>
                  Remove
                </Button>
              </div>
            </AnimatedCard>
          );
        })}
        {pets.length === 0 && (
          <EmptyState
            title="No pets yet"
            description="Add one below to start tracking their health records."
          />
        )}
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Add a pet</h2>
        <Card>
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="petName">Name</label>
                <input
                  id="petName"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Luna"
                  required
                />
              </div>
              <div>
                <label htmlFor="species">Species</label>
                <input
                  id="species"
                  value={species}
                  onChange={(event) => setSpecies(event.target.value)}
                  placeholder="Dog"
                  required
                />
              </div>
              <div>
                <label htmlFor="chipNumber">Chip number (optional)</label>
                <input
                  id="chipNumber"
                  value={chipNumber}
                  onChange={(event) => setChipNumber(event.target.value)}
                  placeholder="RS-985141000123456"
                />
              </div>
            </div>
            <Button type="submit" disabled={adding} className="self-start">
              {adding ? "Adding…" : "Add pet"}
            </Button>
          </form>
        </Card>
      </section>
    </div>
  );
}
