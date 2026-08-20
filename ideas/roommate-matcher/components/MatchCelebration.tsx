"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/Button";

// react-three-fiber touches window/WebGL at module init, so the 3D piece is
// loaded on-demand and only for the moment the celebration is actually on
// screen — the rest of /browse (including this overlay's own chrome) stays
// server-renderable. See DESIGN_SYSTEM.md "Applying this to an existing app".
const MatchOrbs = dynamic(() => import("@/components/three/MatchOrbs").then((m) => m.MatchOrbs), {
  ssr: false,
  loading: () => null,
});

export interface MatchCelebrationProps {
  open: boolean;
  matchName: string | null;
  onClose: () => void;
  onKeepBrowsing: () => void;
}

/**
 * The Tier 3 flagship payoff moment: fires the instant a swipe-right turns
 * out to already have a reciprocal interest recorded (a genuine mutual
 * match), instead of a toast notification. Two `MatchOrbs` glow spheres
 * merge behind the "It's a match!" copy while it's open.
 */
export function MatchCelebration({ open, matchName, onClose, onKeepBrowsing }: MatchCelebrationProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 px-5 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="dialog"
          aria-modal="true"
          aria-label="Mutual match"
          onClick={onClose}
        >
          <motion.div
            className="glass glow-accent relative w-full max-w-sm overflow-hidden rounded-xl2 p-6 text-center"
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="pointer-events-none absolute inset-0 -z-10 opacity-90">
              <MatchOrbs className="h-full w-full" />
            </div>

            <p className="text-caption uppercase tracking-wide text-accent">Mutual match</p>
            <h2 className="mt-1 text-headline text-fg">It&apos;s a match!</h2>
            <p className="mt-2 text-sm text-muted">
              {matchName ? (
                <>
                  You and <span className="text-fg">{matchName}</span> are both
                  interested — you can see each other&apos;s full profile now.
                </>
              ) : (
                "You're both interested — you can see each other's full profile now."
              )}
            </p>

            <Button className="mt-6 w-full" onClick={onKeepBrowsing}>
              Keep browsing
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
