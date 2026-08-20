"use client";

import { useEffect, useRef } from "react";
import { motion, useAnimation, type PanInfo } from "framer-motion";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { Button } from "@/components/Button";
import type { Dog } from "@/lib/types";

const FLING_DISTANCE = 320;
const SWIPE_THRESHOLD = 120;

/**
 * Tier 2 core-loop centerpiece: a single draggable profile card. Drag right
 * ("Interested") or left ("Pass") past the threshold — or tap the buttons,
 * which trigger the identical fling animation — and the card animates off
 * screen before `onSwipe` fires. The parent (`PlaydateApp`) still owns all
 * data/state; this component is purely presentational + gesture handling.
 */
export function SwipeCard({
  dog,
  onSwipe,
  disabled,
}: {
  dog: Dog;
  onSwipe: (direction: "yes" | "no") => void;
  disabled?: boolean;
}) {
  const controls = useAnimation();
  // Guards against a double-fire: `disabled` only flips true once the parent's
  // `swiping` state updates inside `onSwipe`, which doesn't happen until
  // *after* this fling's ~300ms exit animation resolves. A fast second
  // click/drag during that window would otherwise start a second concurrent
  // fling. This ref closes that gap synchronously, before any await.
  const firingRef = useRef(false);

  useEffect(() => {
    controls.start({
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      rotate: 0,
      transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
    });
    // Re-run whenever a new dog mounts into this same component instance
    // isn't possible (parent keys by dog.id), but keeping dog.id in the
    // deps documents the intent if that ever changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fling(direction: "yes" | "no") {
    if (disabled || firingRef.current) return;
    firingRef.current = true;
    await controls.start({
      x: direction === "yes" ? FLING_DISTANCE : -FLING_DISTANCE,
      rotate: direction === "yes" ? 18 : -18,
      opacity: 0,
      transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
    });
    onSwipe(direction);
  }

  function handleDragEnd(_event: unknown, info: PanInfo) {
    if (info.offset.x > SWIPE_THRESHOLD) {
      void fling("yes");
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      void fling("no");
    } else {
      controls.start({
        x: 0,
        rotate: 0,
        transition: { type: "spring", stiffness: 300, damping: 24 },
      });
    }
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      animate={controls}
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      whileDrag={{ scale: 1.02 }}
      className="cursor-grab touch-pan-y active:cursor-grabbing"
    >
      <SpotlightCard>
        <p className="text-xs text-muted">{dog.neighborhood}</p>
        <h3 className="mb-1 text-xl font-semibold">{dog.name}</h3>
        <p className="mb-2 text-sm text-muted">
          {[dog.breed, dog.size, dog.energy_level && `${dog.energy_level} energy`]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {dog.bio && <p className="mb-4 text-sm">{dog.bio}</p>}
        <p className="mb-3 text-xs text-muted">
          Drag the card left to pass, right if interested — or use the buttons.
        </p>
        <div className="flex gap-2">
          <Button onClick={() => void fling("yes")} disabled={disabled}>
            Interested
          </Button>
          <Button variant="secondary" onClick={() => void fling("no")} disabled={disabled}>
            Pass
          </Button>
        </div>
      </SpotlightCard>
    </motion.div>
  );
}
