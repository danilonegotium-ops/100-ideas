"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";

type StudyCard = {
  id: string;
  front: string;
  back: string;
};

/**
 * Pure client-side flip-card study mode. "Got it" removes a card from the
 * remaining queue; "study again" sends it to the back of the queue so it
 * comes back around. No persistence between sessions — this is client
 * React state only, reset on reload, per the MVP scope in SPEC.md.
 */
export function StudyDeck({ cards }: { cards: StudyCard[] }) {
  const [queue, setQueue] = useState<StudyCard[]>(cards);
  const [flipped, setFlipped] = useState(false);
  const [gotItCount, setGotItCount] = useState(0);
  const totalCards = cards.length;

  const current = queue[0];

  const progressLabel = useMemo(() => {
    if (totalCards === 0) return "";
    return `${gotItCount} / ${totalCards} learned · ${queue.length} left in the deck`;
  }, [gotItCount, totalCards, queue.length]);

  function handleGotIt() {
    setQueue((q) => q.slice(1));
    setGotItCount((n) => n + 1);
    setFlipped(false);
  }

  function handleStudyAgain() {
    setQueue((q) => [...q.slice(1), q[0]]);
    setFlipped(false);
  }

  function handleRestart() {
    setQueue(cards);
    setGotItCount(0);
    setFlipped(false);
  }

  if (totalCards === 0) {
    return (
      <Card>
        <p className="text-sm text-muted">This deck has no cards yet.</p>
      </Card>
    );
  }

  if (!current) {
    return (
      <Card>
        <p className="mb-3 text-sm text-fg">
          Done — you marked all {totalCards} cards &quot;got it&quot;.
        </p>
        <Button variant="secondary" onClick={handleRestart}>
          Study again from the top
        </Button>
      </Card>
    );
  }

  return (
    <div>
      <p className="mb-2 text-xs text-muted">{progressLabel}</p>
      <Card
        className="mb-3 flex min-h-[160px] cursor-pointer select-none items-center justify-center text-center"
        onClick={() => setFlipped((f) => !f)}
      >
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-wide text-muted">
            {flipped ? "Back — click to flip" : "Front — click to flip"}
          </p>
          <p className="text-lg text-fg">{flipped ? current.back : current.front}</p>
        </div>
      </Card>

      {flipped ? (
        <div className="flex gap-3">
          <Button variant="primary" onClick={handleGotIt}>
            Got it
          </Button>
          <Button variant="secondary" onClick={handleStudyAgain}>
            Study again
          </Button>
        </div>
      ) : (
        <Button variant="secondary" onClick={() => setFlipped(true)}>
          Show answer
        </Button>
      )}
    </div>
  );
}
