// Curated riddle bank (30 — about a month before repeating) and the pure
// date-seeded selection logic. Original content, not copied from the
// separate `daily-riddle-site` static idea (only its date-seeding pattern
// was referenced, per instructions — see that idea's app.js for the
// day-of-year-modulo approach this mirrors).
//
// Every riddle has a full `displayAnswer` sentence (shown after the
// player finishes) plus `acceptedAnswers` — short, generously-varied
// strings that a typed answer is compared against after normalization.
// Grading tolerance is intentionally generous (multiple accepted
// spellings/synonyms) since this is a fun daily game, not a graded exam —
// a false "wrong" on a technically-correct answer is a worse experience
// than an occasional lucky guess.

export type Riddle = {
  question: string;
  displayAnswer: string;
  acceptedAnswers: string[];
};

export const RIDDLES: Riddle[] = [
  { question: "What has keys but opens no locks?", displayAnswer: "A piano (or a keyboard).", acceptedAnswers: ["piano", "keyboard"] },
  { question: "What can you catch but never actually throw?", displayAnswer: "A cold.", acceptedAnswers: ["cold", "acold"] },
  { question: "What has a thumb and four fingers but isn't alive?", displayAnswer: "A glove.", acceptedAnswers: ["glove"] },
  { question: "What kind of room has no doors and no windows?", displayAnswer: "A mushroom.", acceptedAnswers: ["mushroom"] },
  { question: "What building in any city has the most stories?", displayAnswer: "A library.", acceptedAnswers: ["library"] },
  { question: "What word in the dictionary is always spelled incorrectly?", displayAnswer: "\"Incorrectly.\"", acceptedAnswers: ["incorrectly"] },
  { question: "What has one eye but cannot see?", displayAnswer: "A needle.", acceptedAnswers: ["needle"] },
  { question: "What runs through cities and fields but never actually moves?", displayAnswer: "A road.", acceptedAnswers: ["road", "street", "highway"] },
  { question: "What can you break without ever touching it?", displayAnswer: "A promise.", acceptedAnswers: ["promise"] },
  { question: "What has a bed but never sleeps, and a mouth but never eats?", displayAnswer: "A river.", acceptedAnswers: ["river"] },
  { question: "What can you look right through, yet it still keeps the weather out?", displayAnswer: "A window.", acceptedAnswers: ["window", "glass"] },
  { question: "What kind of coat can only be put on when it's already wet?", displayAnswer: "A coat of paint.", acceptedAnswers: ["paint", "coatofpaint", "acoatofpaint"] },
  { question: "What has plenty of teeth but can't take a single bite?", displayAnswer: "A comb.", acceptedAnswers: ["comb"] },
  { question: "What goes all the way around a yard without ever moving?", displayAnswer: "A fence.", acceptedAnswers: ["fence"] },
  { question: "What has a neck but no head?", displayAnswer: "A bottle.", acceptedAnswers: ["bottle"] },
  { question: "What gets bigger the more you take away from it?", displayAnswer: "A hole.", acceptedAnswers: ["hole"] },
  { question: "What has four legs in the morning of its life but never actually walks?", displayAnswer: "A table (or a chair).", acceptedAnswers: ["table", "chair"] },
  { question: "What kind of tree fits comfortably in your hand?", displayAnswer: "A palm tree.", acceptedAnswers: ["palm", "palmtree", "apalm"] },
  { question: "What word starts with T, is full of T, and ends in T?", displayAnswer: "A teapot.", acceptedAnswers: ["teapot"] },
  { question: "What has to be broken before you can use it?", displayAnswer: "An egg.", acceptedAnswers: ["egg"] },
  { question: "What flies constantly but never once has wings?", displayAnswer: "Time.", acceptedAnswers: ["time"] },
  { question: "What kind of band never plays a note but still holds things together?", displayAnswer: "A rubber band.", acceptedAnswers: ["rubberband", "band"] },
  { question: "What can fill an entire room without taking up any physical space?", displayAnswer: "Light.", acceptedAnswers: ["light"] },
  { question: "What has a face and two hands but no arms or legs?", displayAnswer: "A clock.", acceptedAnswers: ["clock", "watch"] },
  { question: "What gets wetter the more it dries?", displayAnswer: "A towel.", acceptedAnswers: ["towel"] },
  { question: "The more you take from me, the bigger I get. What am I?", displayAnswer: "A hole.", acceptedAnswers: ["hole", "pit"] },
  { question: "What has cities but no houses, forests but no trees, and rivers but no water?", displayAnswer: "A map.", acceptedAnswers: ["map"] },
  { question: "What has a head and a tail but no body at all?", displayAnswer: "A coin.", acceptedAnswers: ["coin"] },
  { question: "I follow you everywhere in the sun but vanish the moment it sets. What am I?", displayAnswer: "Your shadow.", acceptedAnswers: ["shadow", "yourshadow"] },
  { question: "What always points a direction but never actually goes anywhere?", displayAnswer: "A compass.", acceptedAnswers: ["compass"] },
];

/**
 * UTC calendar date as "YYYY-MM-DD". Deliberately UTC, not the server's or
 * a player's local timezone, so "everyone in the world gets the same
 * riddle" is actually true — the riddle rotates once, globally, at
 * midnight UTC, rather than at a different wall-clock moment per
 * timezone.
 */
export function utcDateString(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** 0-indexed day-of-year for a date's UTC calendar day (Jan 1 UTC = 0). */
function dayOfYearUtc(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  const current = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
  return Math.round((current - start) / 86400000);
}

/** Deterministic index into RIDDLES for a given date (same date -> same index, always). */
export function riddleIndexForDate(date: Date, listLength: number): number {
  if (listLength <= 0) return -1;
  return dayOfYearUtc(date) % listLength;
}

export function riddleForDate(date: Date = new Date()): Riddle {
  const idx = riddleIndexForDate(date, RIDDLES.length);
  return RIDDLES[idx];
}

/** Lowercase, strip everything but letters/digits, so "A Keyboard!" and "keyboard" compare equal. */
function normalizeAnswer(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
}

export function isCorrectAnswer(submitted: string, riddle: Riddle): boolean {
  const normalizedSubmitted = normalizeAnswer(submitted);
  if (!normalizedSubmitted) return false;
  return riddle.acceptedAnswers.some(
    (accepted) => normalizeAnswer(accepted) === normalizedSubmitted,
  );
}
