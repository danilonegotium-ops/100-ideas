"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/motion/EmptyState";
import { MatchCelebration } from "@/components/MatchCelebration";
import { TAG_LABELS, type DeckCandidate } from "./types";

const SWIPE_THRESHOLD = 120;
const VELOCITY_THRESHOLD = 500;

/**
 * Tier 3 flagship core loop: a real Tinder-style swipe deck (`motion.div`
 * `drag="x"` + exit animation), plus the payoff moment — swiping right on a
 * candidate who already expressed interest in the current user (computed
 * server-side, unchanged data logic) triggers `MatchCelebration` instead of
 * a toast. The actual "I'm interested" write still goes through the
 * existing `POST /api/interests` route, untouched.
 */
export function SwipeDeck({ candidates }: { candidates: DeckCandidate[] }) {
  const router = useRouter();
  const [deck, setDeck] = useState(candidates);
  const [error, setError] = useState<string | null>(null);
  // Drives the top card's exit animation when triggered from the Pass/
  // Interested buttons, so button-initiated swipes play the identical
  // fly-off animation as a drag gesture instead of vanishing instantly.
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);
  const [celebration, setCelebration] = useState<{ open: boolean; matchName: string | null }>({
    open: false,
    matchName: null,
  });

  async function recordInterest(candidate: DeckCandidate) {
    setError(null);
    try {
      const res = await fetch("/api/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: candidate.user_id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Couldn't record your interest. Try again.");
        return;
      }
      router.refresh();
      if (candidate.alreadyInterestedInMe) {
        setCelebration({ open: true, matchName: candidate.display_name });
      }
    } catch {
      setError("Network error — try again.");
    }
  }

  function handleSwiped(candidate: DeckCandidate, direction: "left" | "right") {
    setDeck((current) => current.filter((c) => c.user_id !== candidate.user_id));
    setExitDirection(null);
    if (direction === "right") {
      void recordInterest(candidate);
    }
  }

  function triggerExit(direction: "left" | "right") {
    // Guard against a double-fire from a fast double-click: only start an
    // exit if one isn't already in flight.
    setExitDirection((current) => current ?? direction);
  }

  const visible = deck.slice(0, 3);
  const top = visible[0];

  return (
    <div>
      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      <div className="relative mx-auto h-[500px] w-full max-w-sm">
        {visible.length === 0 ? (
          <EmptyState
            title="You've seen everyone"
            description="Check back later, or widen your filters above — new profiles show up as more students join."
          />
        ) : (
          visible.map((candidate, index) => (
            <SwipeCard
              key={candidate.user_id}
              candidate={candidate}
              stackIndex={index}
              active={index === 0}
              exitDirection={index === 0 ? exitDirection : null}
              onSwiped={(direction) => handleSwiped(candidate, direction)}
            />
          ))
        )}
      </div>

      {top && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <Button variant="secondary" disabled={!!exitDirection} onClick={() => triggerExit("left")}>
            Pass
          </Button>
          <Button disabled={!!exitDirection} onClick={() => triggerExit("right")}>I&apos;m interested</Button>
        </div>
      )}

      <MatchCelebration
        open={celebration.open}
        matchName={celebration.matchName}
        onClose={() => setCelebration({ open: false, matchName: null })}
        onKeepBrowsing={() => setCelebration({ open: false, matchName: null })}
      />
    </div>
  );
}

function SwipeCard({
  candidate,
  stackIndex,
  active,
  exitDirection,
  onSwiped,
}: {
  candidate: DeckCandidate;
  stackIndex: number;
  active: boolean;
  exitDirection: "left" | "right" | null;
  onSwiped: (direction: "left" | "right") => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-14, 14]);
  const likeOpacity = useTransform(x, [30, 140], [0, 1]);
  const passOpacity = useTransform(x, [-140, -30], [1, 0]);
  const [dragExit, setDragExit] = useState<"left" | "right" | null>(null);
  // A button click (parent-driven `exitDirection`) and a drag gesture
  // (locally-tracked `dragExit`) both resolve to the same `exiting` value,
  // so both paths animate and resolve identically below.
  const exiting = exitDirection ?? dragExit;

  function handleDragEnd(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (info.offset.x > SWIPE_THRESHOLD || info.velocity.x > VELOCITY_THRESHOLD) {
      setDragExit("right");
    } else if (info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -VELOCITY_THRESHOLD) {
      setDragExit("left");
    }
  }

  return (
    <motion.div
      className="absolute inset-0 flex flex-col overflow-hidden rounded-xl2 border border-border bg-surface shadow-depth"
      style={{ x, rotate, zIndex: 10 - stackIndex }}
      drag={active && !exiting ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={1}
      onDragEnd={handleDragEnd}
      animate={
        exiting
          ? { x: exiting === "right" ? 520 : -520, rotate: exiting === "right" ? 24 : -24, opacity: 0 }
          : { scale: 1 - stackIndex * 0.04, y: stackIndex * 12, opacity: 1 }
      }
      transition={exiting ? { duration: 0.35, ease: [0.16, 1, 0.3, 1] } : { duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      onAnimationComplete={() => {
        if (exiting) onSwiped(exiting);
      }}
    >
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-title text-fg">{candidate.display_name}</p>
            <p className="text-sm text-muted">{candidate.area || candidate.city}</p>
          </div>
          <p className="shrink-0 text-lg font-semibold text-accent">{candidate.score}%</p>
        </div>

        <p className="mt-2 text-sm text-muted">
          {candidate.university && `${candidate.university} · `}
          {candidate.budget_min}–{candidate.budget_max} EUR/mo
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {[
            TAG_LABELS[candidate.sleep_schedule],
            TAG_LABELS[candidate.cleanliness],
            TAG_LABELS[candidate.social_style],
            candidate.smoker ? "Smoker" : "Non-smoker",
            candidate.pets_ok ? "OK with pets" : null,
          ]
            .filter(Boolean)
            .map((tag) => (
              <span
                key={tag}
                className="rounded-brand border border-border px-2 py-0.5 text-caption text-muted"
              >
                {tag}
              </span>
            ))}
        </div>

        {candidate.bio && <p className="mt-4 flex-1 text-sm">{candidate.bio}</p>}

        {candidate.alreadyInterestedInMe && (
          <p className="mt-4 text-caption text-accent">Already interested in you</p>
        )}
      </div>

      {active && (
        <>
          <motion.div
            style={{ opacity: likeOpacity }}
            className="pointer-events-none absolute right-4 top-4 rounded-brand border-2 border-accent px-3 py-1 text-sm font-bold uppercase tracking-wide text-accent"
          >
            Interested
          </motion.div>
          <motion.div
            style={{ opacity: passOpacity }}
            className="pointer-events-none absolute left-4 top-4 rounded-brand border-2 border-danger px-3 py-1 text-sm font-bold uppercase tracking-wide text-danger"
          >
            Pass
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
