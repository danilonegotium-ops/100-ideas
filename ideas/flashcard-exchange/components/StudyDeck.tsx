"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
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
 *
 * Tier 2 design pass: the flip is now a real 3D rotateY card flip (front
 * and back faces on either side of a `preserve-3d` wrapper, each with
 * `backfaceVisibility: hidden`) instead of an instant content swap, plus an
 * animated progress bar. Same state machine as before — this only changes
 * how the flip *looks*.
 */
export function StudyDeck({ cards }: { cards: StudyCard[] }) {
  const [queue, setQueue] = useState<StudyCard[]>(cards);
  const [flipped, setFlipped] = useState(false);
  const [gotItCount, setGotItCount] = useState(0);
  const totalCards = cards.length;
  const prefersReducedMotion = useReducedMotion();

  const current = queue[0];

  const progressLabel = useMemo(() => {
    if (totalCards === 0) return "";
    return `${gotItCount} / ${totalCards} learned · ${queue.length} left in the deck`;
  }, [gotItCount, totalCards, queue.length]);

  const progressPct = totalCards > 0 ? Math.round((gotItCount / totalCards) * 100) : 0;

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

  function toggleFlip() {
    setFlipped((f) => !f);
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
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-xs text-muted">{progressLabel}</p>
          <p className="text-xs font-semibold text-accent">{progressPct}%</p>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
          <motion.div
            className="h-full rounded-full bg-accent"
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      <div
        className="relative mb-3 min-h-[160px] cursor-pointer select-none"
        style={{ perspective: "1200px" }}
        onClick={toggleFlip}
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        aria-label={flipped ? "Showing answer — click to flip back" : "Click to reveal answer"}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleFlip();
          }
        }}
      >
        <motion.div
          className="relative h-full min-h-[160px] w-full"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }
          }
        >
          <Card
            className="absolute inset-0 flex min-h-[160px] items-center justify-center text-center"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-wide text-muted">
                Front — click to flip
              </p>
              <p className="text-lg text-fg">{current.front}</p>
            </div>
          </Card>
          <Card
            className="absolute inset-0 flex min-h-[160px] items-center justify-center border-accent/40 text-center"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-wide text-muted">
                Back — click to flip
              </p>
              <p className="text-lg text-fg">{current.back}</p>
            </div>
          </Card>
        </motion.div>
      </div>

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
