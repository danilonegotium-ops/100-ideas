"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { GlassPanel } from "@/components/motion/GlassPanel";
import { GradientMesh } from "@/components/motion/GradientMesh";

// react-three-fiber touches window/WebGL at module init, so the actual 3D
// scene is only ever loaded client-side. Scoped to just this component, not
// the whole (still-a-Server-Component) capsule page — see DESIGN_SYSTEM.md
// "Applying this to an existing app...".
const SealedCapsule = dynamic(
  () => import("@/components/three/SealedCapsule").then((mod) => mod.SealedCapsule),
  { ssr: false },
);

export type HeroLetter = {
  id: string;
  title: string | null;
  deliver_at: string;
  delivered: boolean;
  delivered_at: string | null;
};

/**
 * Picks which letter the hero visual represents. Doesn't invent any new
 * unlock-date logic — `delivered` is the same flag already written by the
 * daily cron job (`app/api/cron/deliver/route.ts`) and already read by the
 * letter list below it on the page; this just decides which single letter
 * is most relevant to show up front. A freshly delivered letter takes
 * priority over an upcoming one so the crack-open animation actually gets
 * seen; if nothing has arrived yet, the soonest-arriving sealed letter
 * (index 0 of the already-ascending-by-deliver_at list) is shown instead.
 */
function pickHeroLetter(letters: HeroLetter[]): { letter: HeroLetter | null; isOpen: boolean } {
  if (letters.length === 0) return { letter: null, isOpen: false };

  const delivered = letters.filter((letter) => letter.delivered);
  if (delivered.length > 0) {
    const mostRecent = delivered.reduce((a, b) => {
      const aTime = new Date(a.delivered_at ?? a.deliver_at).getTime();
      const bTime = new Date(b.delivered_at ?? b.deliver_at).getTime();
      return bTime > aTime ? b : a;
    });
    return { letter: mostRecent, isOpen: true };
  }

  return { letter: letters[0], isOpen: false };
}

export function CapsuleHero({ letters }: { letters: HeroLetter[] }) {
  const { letter, isOpen } = pickHeroLetter(letters);

  const dateLabel = letter
    ? new Date(letter.delivered_at ?? letter.deliver_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative mb-8 overflow-hidden rounded-xl2"
    >
      <GradientMesh />
      <GlassPanel glow className="flex flex-col items-center gap-2 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <div className="order-2 sm:order-1">
          {!letter ? (
            <>
              <p className="text-title text-fg">Nothing sealed yet</p>
              <p className="mt-1 max-w-sm text-sm text-muted">
                Write a letter below and it locks the moment you save it.
              </p>
            </>
          ) : isOpen ? (
            <>
              <p className="text-title text-fg">
                {letter.title || "Untitled letter"} has arrived
              </p>
              <p className="mt-1 max-w-sm text-sm text-muted">
                Delivered {dateLabel} — check your email for the full letter.
              </p>
            </>
          ) : (
            <>
              <p className="text-title text-fg">Sealed until {dateLabel}</p>
              <p className="mt-1 max-w-sm text-sm text-muted">
                {letter.title || "Untitled letter"} is locked away — nobody can read it before then.
              </p>
            </>
          )}
        </div>
        <div className="order-1 h-40 w-40 shrink-0 sm:order-2 sm:h-48 sm:w-48">
          <SealedCapsule isOpen={isOpen} className="h-full w-full" />
        </div>
      </GlassPanel>
    </motion.div>
  );
}
