/* Music theory reference data — intervals, chord formulas (semitones above
   the root), and difficulty-level configs (naturals only at level 1, sharps
   added at level 2, 7th chords at level 3). */

const INTERVALS = [
  { semitones: 0, name: "Unison" },
  { semitones: 1, name: "Minor 2nd" },
  { semitones: 2, name: "Major 2nd" },
  { semitones: 3, name: "Minor 3rd" },
  { semitones: 4, name: "Major 3rd" },
  { semitones: 5, name: "Perfect 4th" },
  { semitones: 6, name: "Tritone" },
  { semitones: 7, name: "Perfect 5th" },
  { semitones: 8, name: "Minor 6th" },
  { semitones: 9, name: "Major 6th" },
  { semitones: 10, name: "Minor 7th" },
  { semitones: 11, name: "Major 7th" },
  { semitones: 12, name: "Octave" },
];

const CHORD_TYPES = [
  { name: "Major", intervals: [0, 4, 7] },
  { name: "Minor", intervals: [0, 3, 7] },
  { name: "Diminished", intervals: [0, 3, 6] },
  { name: "Augmented", intervals: [0, 4, 8] },
  { name: "Major 7th", intervals: [0, 4, 7, 11] },
  { name: "Minor 7th", intervals: [0, 3, 7, 10] },
  { name: "Dominant 7th", intervals: [0, 4, 7, 10] },
];

const LEVELS = [
  {
    level: 1,
    label: "Level 1 — Naturals",
    accidentals: false,
    noteRange: { low: "C4", high: "G5" },
    intervalSemitones: [0, 2, 4, 5, 7, 12],
    chordTypeNames: ["Major", "Minor"],
  },
  {
    level: 2,
    label: "Level 2 — Sharps",
    accidentals: true,
    noteRange: { low: "A3", high: "C6" },
    intervalSemitones: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    chordTypeNames: ["Major", "Minor", "Diminished", "Augmented"],
  },
  {
    level: 3,
    label: "Level 3 — 7th Chords",
    accidentals: true,
    noteRange: { low: "F3", high: "F6" },
    intervalSemitones: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    chordTypeNames: [
      "Major",
      "Minor",
      "Diminished",
      "Augmented",
      "Major 7th",
      "Minor 7th",
      "Dominant 7th",
    ],
  },
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { INTERVALS, CHORD_TYPES, LEVELS };
}
