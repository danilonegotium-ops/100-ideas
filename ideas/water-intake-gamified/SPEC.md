# Water Intake Gamified

A simple app where you grow a digital tree every time you drink a glass of water. Set a daily
goal (glasses), tap "I drank a glass" each time you drink, and watch an SVG tree grow through
defined stages as you approach and hit your goal. Resets each day based on the real calendar date
(not just the browser session), and tracks a streak of consecutive days hitting the goal. All
state is persisted in `localStorage`.

## How it works

- `app.js` keeps all date/streak/state-transition logic as pure functions with no DOM or
  `localStorage` access (`rolloverIfNewDay`, `applyDrink`, `applyUndo`, `resetToday`, `setGoal`,
  `getStageIndex`, `buildTreeSVG`), so the logic is testable in plain Node.
- **Daily reset**: state stores a `today` date key (`YYYY-MM-DD` from `new Date()`, local time).
  On every load and on every state-changing action, `rolloverIfNewDay` compares the stored date to
  today's real date and resets `countToday` to 0 if the calendar day has changed — this works even
  if the user hasn't opened the tab in days (not a session timer).
- **Streak logic**: a `lastCompletedDate` field records the last calendar day the goal was hit.
  When a drink brings `countToday` up to the goal for the first time that day, the app checks
  whether `lastCompletedDate` was exactly yesterday (`isConsecutiveDay`) — if so the streak
  increments, otherwise it resets to 1. This correctly handles gaps (a missed day breaks the
  streak) without needing to iterate over every day in between. Drinking further past the goal on
  an already-completed day does not double-count.
- **Tree stages**: 6 defined stages (seed → sprout → sapling → young tree → full tree → blooming)
  based on percent of goal reached (0%, <25%, <50%, <75%, <100%, ≥100%). `buildTreeSVG` renders
  each stage as a procedurally-built SVG (trunk height/width and canopy size scale with stage;
  the blooming stage adds flower accents) — no images, pure inline SVG.
- **Undo / Reset today**: "Undo last" decrements today's count (floored at 0) without touching the
  streak, since a single accidental extra tap after already completing the day's goal shouldn't
  cost the user their streak. "Reset today" is an explicit, confirmed action that zeroes today's
  count *and* revokes today's streak credit if it had been earned, since the user is intentionally
  clearing the day.
- Goal is stored in glasses (~250ml each, noted in the UI label) rather than raw ml, matching the
  idea's "grow a tree every time you drink a glass of water" framing; a user wanting ml-based
  tracking can set glasses to represent their own portion size.

## Out of scope for this pass

- No reminders/notifications to drink water.
- No historical calendar view of past days (only the running streak count is shown, not a full log).
- No multi-device sync — state is local to the browser via `localStorage`.
