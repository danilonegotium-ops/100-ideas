# Random Act of Kindness — SPEC

**MVP:** A single-page tool that shows one kindness prompt per day, picked deterministically
from `data.js`'s 50 curated prompts using the same day-of-year-modulo approach as the rest of
this project's date-seeded content (`(dayOfYear - 1) % promptCount`), so every visitor sees the
same prompt on the same calendar day and it changes automatically at local midnight. A "Mark as
done" button logs today's date (`YYYY-MM-DD`, local time) into `localStorage`; a "Shuffle for a
different one" button swaps to a random different prompt for today if the default doesn't fit,
persisting that choice in `localStorage` so a page refresh doesn't lose it. A streak counter
counts consecutive completed days ending today — if today isn't marked done yet, the streak is
still shown as "alive" as long as yesterday was completed (it isn't broken until a day is
skipped entirely), matching how most habit-streak apps behave. A running total-completed count
is also shown. All date/streak/shuffle logic is written as pure functions
(`getDateKey`, `getDayOfYear`, `pickPromptIndex`, `pickShuffledIndex`, `computeStreak`) so it's
testable without a browser or real system clock.

**Out of scope for this pass:** browsing past days' prompts or a calendar/history view (only
"today" is shown, consistent with the one-liner's "gives you one simple task every day"), social
sharing/proof of completion, reminder notifications (no backend, no push infra), per-prompt
history to avoid ever repeating a prompt across the year (the modulo approach can repeat a
prompt within a year once the list wraps past ~50 days — acceptable for an MVP).

**Data:** all 50 prompts in `data.js` are original writing for this tool — not sourced from an
external kindness-prompt list — chosen to be genuinely completable in a single day, ranging from
tiny (send a text) to slightly bigger (leave a review, volunteer 30 minutes of a skill), and
avoiding anything requiring money most people don't have spare, a car, or dependents, matching
the brief's "genuinely doable" bar.
