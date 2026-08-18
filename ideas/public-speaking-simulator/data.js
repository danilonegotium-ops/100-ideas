/* Curated filler-word list used by the analyzer.
   English is the primary set; a couple of common Serbian fillers are
   included as a bonus (matched the same way, case-insensitive). This is a
   simple keyword/phrase counter, not true disfluency detection — common
   words like "like" or "so" can be legitimate in some sentences and will
   still be counted, which is a known limitation of this heuristic (see
   SPEC.md). */

const FILLER_WORDS = [
  { phrase: "um", label: "um" },
  { phrase: "uh", label: "uh" },
  { phrase: "erm", label: "erm" },
  { phrase: "like", label: "like" },
  { phrase: "you know", label: "you know" },
  { phrase: "i mean", label: "i mean" },
  { phrase: "sort of", label: "sort of" },
  { phrase: "kind of", label: "kind of" },
  { phrase: "basically", label: "basically" },
  { phrase: "actually", label: "actually" },
  { phrase: "so yeah", label: "so yeah" },
  { phrase: "ovaj", label: "ovaj (SR)" },
  { phrase: "znači", label: "znači (SR)" },
  { phrase: "kao", label: "kao (SR)" },
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { FILLER_WORDS };
}
