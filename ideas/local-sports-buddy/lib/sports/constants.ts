/**
 * A curated, fixed tag list rather than free text — keeps browse-page
 * filtering an exact match instead of a fuzzy "football" vs "Football" vs
 * "soccer" guessing game. Covers the sports named in the brief
 * (basketball/football/tennis) plus a few other common pickup sports.
 */
export const SPORTS = [
  "Basketball",
  "Football",
  "Tennis",
  "Volleyball",
  "Table Tennis",
  "Badminton",
  "Running",
  "Padel",
] as const;

export type Sport = (typeof SPORTS)[number];
