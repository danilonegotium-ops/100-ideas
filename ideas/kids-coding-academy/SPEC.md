# Kids Coding Academy

## What the MVP does

Six story-based lessons guide "Byte the Fox" through small maze puzzles by
clicking command blocks into an ordered program — no drag-and-drop, no
typed code. Each lesson introduces one real programming concept and the
maze is specifically designed so the concept is genuinely necessary to
solve it, not just decorative:

1. **Sequences** — order 4 movement blocks correctly to reach the tree;
   wrong order runs Byte into a wall.
2. **Loops** — a "Repeat 5x: Move Forward" block does the work of 5
   individual blocks; the lesson caps the program at 2 blocks so the loop
   is the only way to finish.
3. **Conditionals** — an "If Wall Ahead: Turn Right, Else: Move Forward"
   block is evaluated fresh at every step against the actual maze state;
   repeating it 5 times walks Byte down a corridor and automatically
   turns the corner when it hits the wall (a simplified wall-following
   algorithm).
4. **Variables** — an on-screen acorn counter only increases when the
   student explicitly runs "Collect Acorn" while standing on one; reaching
   the goal cell isn't enough to complete the lesson unless the counter
   (the variable) actually reached the required value.
5. **Functions (bonus)** — the student builds a 2-block "trick," and a
   "Run My Trick x2" button replays the whole trick twice, demonstrating
   reuse instead of rebuilding the sequence by hand.
6. **Debugging (bonus)** — a broken program is shown as read-only chips;
   clicking the wrong one cycles it through a couple of fix candidates
   (e.g. Turn Right → Turn Left) until running it succeeds.

Lesson completion is tracked with a checkmark, persisted in
`localStorage`, and shown in the lesson navigation bar.

## Out of scope for this pass

- No drag-and-drop block programming (Scratch-style) — click-to-add /
  click-to-remove instead, which is both simpler to build reliably and
  more accessible.
- No nested/composable loops or user-defined named functions — loops are
  single fixed-count "repeat" blocks, and the "function" lesson simulates
  reuse by repeating the whole built program N times rather than
  supporting arbitrary function definitions.
- No sound effects or voice narration.
- Six lessons total (four core concepts + two bonus) rather than a full
  curriculum — designed to be easy to extend by adding entries to the
  `LESSONS` array in `data.js`.

## Implementation notes

The maze-runner engine (`isWall`, `runProgram`, `expandBlocks`,
`repeatCommands`) is pure, has no DOM dependency, and is exported via a
guarded `module.exports`. `runProgram` takes a maze definition and a flat
list of atomic commands (`forward`, `turnLeft`, `turnRight`,
`ifWallTurnRight`, `collect`) and returns the full step-by-step path (used
to animate the run) plus a `success` flag. Verified from Node for all 6
lessons: correct solutions succeed, deliberately wrong orderings/short
programs fail (wall bump, goal-not-reached, or acorn-variable not enough),
double-collecting an acorn doesn't double-count, and the debug lesson's
buggy program fails while the one-block fix succeeds.
