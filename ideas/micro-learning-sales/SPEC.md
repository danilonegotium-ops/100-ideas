# Micro-Learning for Sales

## What the MVP does

Shows one curated sales tip per day, chosen deterministically from a 30-tip
library using the day-of-year modulo the tip count (same approach as the
daily-riddle-style tools in this project — no server, no randomness, so
everyone sees the same tip on the same calendar day and it repeats after ~30
days). A "Browse all tips" view lists the full archive with a checkmark next
to any tip the user has ever marked read. A "Mark as read" button records
today's date in `localStorage` and drives a day-streak counter (consecutive
days marked read, ending today or — if today isn't marked yet — showing the
streak in progress through yesterday).

## Scope adaptation

The original idea description says "2-minute daily videos." This ships as
short daily **text** tips instead — no video production pipeline exists for
this sprint. The "one bite-sized lesson per day" framing is kept intact.

## Out of scope for this pass

- No accounts/sync — streak and read history are local to the browser
  (`localStorage`), not shared across devices.
- No push notifications/reminders to come back daily.
- No spaced-repetition or quiz mechanic — read-and-move-on only.

## Curated content

30 original sales tips written for this project, covering five categories
(pitching, objection handling, closing, follow-up, listening), 6 tips each.
Not sourced from a specific book/course — general, widely-accepted sales
practice phrased as short, standalone tips (2-3 sentences each).

## Implementation notes

Pure logic (`formatDateISO`, `dayOfYear`, `getTipForDate`, `computeStreak`)
lives at the top of `app.js` with no DOM dependency and is exported via a
guarded `module.exports` so it can be sanity-checked from Node directly. DOM
wiring only runs when `document` exists.
