"use client";

import { FormEvent, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { SwipeCard } from "@/components/SwipeCard";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { EmptyState } from "@/components/motion/EmptyState";
import { createClient } from "@/lib/supabase/client";
import type { Dog, EnergyLevel, Size, Swipe } from "@/lib/types";

type AddDogStatus = "idle" | "saving" | "error";

const SIZES: Size[] = ["small", "medium", "large"];
const ENERGY_LEVELS: EnergyLevel[] = ["low", "medium", "high"];

export function PlaydateApp({
  ownerId,
  initialMyDogs,
  initialOtherDogs,
  initialOutgoingSwipes,
  initialIncomingSwipes,
}: {
  ownerId: string;
  initialMyDogs: Dog[];
  initialOtherDogs: Dog[];
  initialOutgoingSwipes: Swipe[];
  initialIncomingSwipes: Swipe[];
}) {
  const [myDogs, setMyDogs] = useState<Dog[]>(initialMyDogs);
  const [otherDogs] = useState<Dog[]>(initialOtherDogs);
  const [outgoing, setOutgoing] = useState<Swipe[]>(initialOutgoingSwipes);
  const [incoming] = useState<Swipe[]>(initialIncomingSwipes);
  const [selectedDogId, setSelectedDogId] = useState<string | null>(
    initialMyDogs[0]?.id ?? null,
  );
  const [sameAreaOnly, setSameAreaOnly] = useState(true);
  const [showAddDogForm, setShowAddDogForm] = useState(
    initialMyDogs.length === 0,
  );
  const [swiping, setSwiping] = useState(false);

  const selectedDog = myDogs.find((d) => d.id === selectedDogId) ?? null;

  const candidates = useMemo(() => {
    if (!selectedDog) return [];
    const alreadySwiped = new Set(
      outgoing
        .filter((s) => s.from_dog_id === selectedDog.id)
        .map((s) => s.to_dog_id),
    );
    return otherDogs.filter((dog) => {
      if (alreadySwiped.has(dog.id)) return false;
      if (
        sameAreaOnly &&
        dog.neighborhood.trim().toLowerCase() !==
          selectedDog.neighborhood.trim().toLowerCase()
      ) {
        return false;
      }
      return true;
    });
  }, [otherDogs, outgoing, selectedDog, sameAreaOnly]);

  const currentCandidate = candidates[0] ?? null;

  const matches = useMemo(() => {
    const result: { mine: Dog; other: Dog }[] = [];
    for (const mine of myDogs) {
      for (const other of otherDogs) {
        const iSaidYes = outgoing.some(
          (s) =>
            s.from_dog_id === mine.id &&
            s.to_dog_id === other.id &&
            s.direction === "yes",
        );
        const theySaidYes = incoming.some(
          (s) =>
            s.from_dog_id === other.id &&
            s.to_dog_id === mine.id &&
            s.direction === "yes",
        );
        if (iSaidYes && theySaidYes) {
          result.push({ mine, other });
        }
      }
    }
    return result;
  }, [myDogs, otherDogs, outgoing, incoming]);

  async function handleSwipe(direction: "yes" | "no") {
    if (!selectedDog || !currentCandidate || swiping) return;
    setSwiping(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("pet_playdate_finder_swipes")
      .insert({
        from_dog_id: selectedDog.id,
        to_dog_id: currentCandidate.id,
        direction,
      })
      .select("id, from_dog_id, to_dog_id, direction, created_at")
      .single();

    if (!error && data) {
      setOutgoing((prev) => [...prev, data]);
    } else {
      // Even on an unexpected error (e.g. a duplicate swipe already
      // existed), drop this candidate from the local queue rather than
      // getting stuck showing the same card forever.
      setOutgoing((prev) => [
        ...prev,
        {
          id: `local-${currentCandidate.id}`,
          from_dog_id: selectedDog.id,
          to_dog_id: currentCandidate.id,
          direction,
          created_at: new Date().toISOString(),
        },
      ]);
    }
    setSwiping(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <YourDogs
        myDogs={myDogs}
        setMyDogs={setMyDogs}
        ownerId={ownerId}
        selectedDogId={selectedDogId}
        setSelectedDogId={setSelectedDogId}
        showAddDogForm={showAddDogForm}
        setShowAddDogForm={setShowAddDogForm}
      />

      {selectedDog && (
        <>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">Browse</h2>
            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={sameAreaOnly}
                onChange={(e) => setSameAreaOnly(e.target.checked)}
                className="w-auto"
              />
              Same area as {selectedDog.name} ({selectedDog.neighborhood})
            </label>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <AnimatePresence mode="wait">
              {currentCandidate ? (
                <SwipeCard
                  key={currentCandidate.id}
                  dog={currentCandidate}
                  onSwipe={handleSwipe}
                  disabled={swiping}
                />
              ) : (
                <EmptyState
                  key="empty"
                  title="No more dogs to show right now"
                  description={
                    sameAreaOnly
                      ? "Nobody new in this area yet — check back later, or turn off the same-area filter above."
                      : "Check back later for more playdate candidates."
                  }
                />
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      <div>
        <h2 className="mb-2 text-lg font-semibold">Your matches</h2>
        {matches.length === 0 ? (
          <EmptyState
            title="No matches yet"
            description={'When you and another owner both say "interested," it\'ll show up here — coordinate the playdate outside the app.'}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {matches.map(({ mine, other }, i) => (
              <AnimatedCard key={`${mine.id}-${other.id}`} index={i}>
                <p className="font-semibold">
                  {mine.name} &amp; {other.name} matched!
                </p>
                <p className="text-sm text-muted">
                  {other.name} ({other.breed || "mixed breed"}) is in{" "}
                  {other.neighborhood}.
                </p>
              </AnimatedCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function YourDogs({
  myDogs,
  setMyDogs,
  ownerId,
  selectedDogId,
  setSelectedDogId,
  showAddDogForm,
  setShowAddDogForm,
}: {
  myDogs: Dog[];
  setMyDogs: React.Dispatch<React.SetStateAction<Dog[]>>;
  ownerId: string;
  selectedDogId: string | null;
  setSelectedDogId: (id: string) => void;
  showAddDogForm: boolean;
  setShowAddDogForm: (v: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [size, setSize] = useState<Size>("medium");
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>("medium");
  const [neighborhood, setNeighborhood] = useState("");
  const [bio, setBio] = useState("");
  const [status, setStatus] = useState<AddDogStatus>("idle");
  const [error, setError] = useState("");

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setError("");

    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("pet_playdate_finder_dogs")
      .insert({
        owner_id: ownerId,
        name: name.trim(),
        breed: breed.trim() || null,
        size,
        energy_level: energyLevel,
        neighborhood: neighborhood.trim(),
        bio: bio.trim() || null,
      })
      .select(
        "id, owner_id, name, breed, size, energy_level, neighborhood, bio, photo_url, created_at",
      )
      .single();

    if (insertError || !data) {
      setStatus("error");
      setError(insertError?.message ?? "Could not save this dog's profile.");
      return;
    }

    setMyDogs((prev) => [...prev, data]);
    setSelectedDogId(data.id);
    setName("");
    setBreed("");
    setNeighborhood("");
    setBio("");
    setStatus("idle");
    setShowAddDogForm(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Your dogs</h2>
        <Button
          variant="secondary"
          onClick={() => setShowAddDogForm(!showAddDogForm)}
        >
          {showAddDogForm ? "Cancel" : "Add a dog"}
        </Button>
      </div>

      {myDogs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {myDogs.map((dog) => (
            <button
              key={dog.id}
              type="button"
              onClick={() => setSelectedDogId(dog.id)}
              className={
                dog.id === selectedDogId
                  ? "rounded-brand border border-accent bg-transparent px-3 py-1 text-sm font-semibold text-accent-strong"
                  : "rounded-brand border border-border bg-transparent px-3 py-1 text-sm text-muted"
              }
            >
              {dog.name}
            </button>
          ))}
        </div>
      )}

      {showAddDogForm && (
        <Card>
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <div>
              <label htmlFor="dog-name">Name</label>
              <input
                id="dog-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Buddy"
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <label htmlFor="dog-breed">Breed (optional)</label>
                <input
                  id="dog-breed"
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  placeholder="Labrador Retriever"
                />
              </div>
              <div className="w-full sm:w-40">
                <label htmlFor="dog-size">Size</label>
                <select
                  id="dog-size"
                  value={size}
                  onChange={(e) => setSize(e.target.value as Size)}
                >
                  {SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full sm:w-40">
                <label htmlFor="dog-energy">Energy level</label>
                <select
                  id="dog-energy"
                  value={energyLevel}
                  onChange={(e) =>
                    setEnergyLevel(e.target.value as EnergyLevel)
                  }
                >
                  {ENERGY_LEVELS.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="dog-neighborhood">City / neighborhood</label>
              <input
                id="dog-neighborhood"
                required
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Vracar"
              />
            </div>
            <div>
              <label htmlFor="dog-bio">Bio (optional)</label>
              <textarea
                id="dog-bio"
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Loves fetch, great with other dogs."
              />
            </div>
            {status === "error" && (
              <p className="text-sm text-danger">{error}</p>
            )}
            <Button type="submit" disabled={status === "saving"}>
              {status === "saving" ? "Saving…" : "Save profile"}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
