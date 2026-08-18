/* Byte the Fox's Coding Academy — 6 story-based lessons, each a small maze
   puzzle solved by clicking command blocks into an ordered queue (no
   drag-and-drop needed). Concepts: sequences, loops, conditionals,
   variables, functions (bonus), debugging (bonus).

   Maze coordinate system: x grows right, y grows down. dir is one of
   "N","E","S","W". The grid boundary itself acts as a wall (no explicit
   wall needed to box in a small puzzle), plus an optional `walls` list of
   [x,y] cells for extra maze shape.

   Each palette entry is a clickable block: { id, label, expand } where
   `expand` is the list of atomic engine commands it adds to the program
   when clicked (a "Repeat 3x" block just expands to the same atomic
   command three times — this is how loops are introduced without a full
   nested interpreter).

   mode: "build" (student assembles the queue and runs it) or
   "debug" (a broken program is shown as clickable chips the student must
   fix by cycling each chip through its `fixOptions`). */

const LESSONS = [
  {
    id: "sequences",
    order: 1,
    title: "Sequences: Find the Path",
    concept: "Sequences",
    intro:
      "Byte the Fox only understands exact instructions, one at a time, in order. Put the steps in the right sequence to guide Byte to the acorn tree.",
    mode: "build",
    grid: { width: 3, height: 2 },
    walls: [[1, 0]],
    start: { x: 0, y: 1, dir: "E" },
    goal: { x: 2, y: 0 },
    acorns: [],
    minAcorns: 0,
    palette: [
      { id: "forward", label: "Move Forward", expand: ["forward"] },
      { id: "turnLeft", label: "Turn Left", expand: ["turnLeft"] },
      { id: "turnRight", label: "Turn Right", expand: ["turnRight"] },
    ],
    maxBlocks: 6,
    runRepeatCount: 1,
    hint: "Byte starts facing right. Try moving forward twice, then turning towards the tree, then moving forward once more.",
  },
  {
    id: "loops",
    order: 2,
    title: "Loops: Repeat Yourself Less",
    concept: "Loops",
    intro:
      "The path to the acorn patch is long and perfectly straight. Instead of clicking Move Forward five separate times, use a Repeat block to say it once.",
    mode: "build",
    grid: { width: 6, height: 1 },
    walls: [],
    start: { x: 0, y: 0, dir: "E" },
    goal: { x: 5, y: 0 },
    acorns: [],
    minAcorns: 0,
    palette: [
      { id: "forward", label: "Move Forward", expand: ["forward"] },
      {
        id: "repeat5forward",
        label: "Repeat 5x: Move Forward",
        expand: ["forward", "forward", "forward", "forward", "forward"],
      },
    ],
    maxBlocks: 2,
    runRepeatCount: 1,
    hint: "You only have room for 2 blocks — one Repeat block can do the work of five Move Forward blocks.",
  },
  {
    id: "conditionals",
    order: 3,
    title: "Conditionals: Decide What To Do",
    concept: "Conditionals",
    intro:
      "This path bends around a corner. Give Byte one smart instruction: \"If there's a wall ahead, turn right — otherwise, keep walking.\" Byte checks this fresh every single step.",
    mode: "build",
    grid: { width: 3, height: 3 },
    walls: [],
    start: { x: 0, y: 2, dir: "N" },
    goal: { x: 2, y: 0 },
    acorns: [],
    minAcorns: 0,
    palette: [
      {
        id: "ifWallTurnRight",
        label: "If Wall Ahead: Turn Right, Else: Move Forward",
        expand: ["ifWallTurnRight"],
      },
      {
        id: "repeat5ifwall",
        label: "Repeat 5x: (If Wall Ahead: Turn Right, Else: Move Forward)",
        expand: [
          "ifWallTurnRight",
          "ifWallTurnRight",
          "ifWallTurnRight",
          "ifWallTurnRight",
          "ifWallTurnRight",
        ],
      },
    ],
    maxBlocks: 5,
    runRepeatCount: 1,
    hint: "The same one instruction, repeated, can walk Byte straight down the corridor and then automatically turn the corner when it hits the wall.",
  },
  {
    id: "variables",
    order: 4,
    title: "Variables: Remember Things",
    concept: "Variables",
    intro:
      "Byte needs to remember how many acorns have been collected so far — that count is a variable. Standing on an acorn doesn't collect it automatically; you have to run Collect Acorn while Byte is standing there.",
    mode: "build",
    grid: { width: 6, height: 1 },
    walls: [],
    start: { x: 0, y: 0, dir: "E" },
    goal: { x: 5, y: 0 },
    acorns: [
      [1, 0],
      [3, 0],
      [5, 0],
    ],
    minAcorns: 3,
    palette: [
      { id: "forward", label: "Move Forward", expand: ["forward"] },
      { id: "collect", label: "Collect Acorn", expand: ["collect"] },
    ],
    maxBlocks: 10,
    runRepeatCount: 1,
    hint: "Reaching the tree isn't enough this time — the acorn count variable needs to reach 3. Run Collect Acorn on each acorn cell.",
  },
  {
    id: "functions",
    order: 5,
    title: "Functions: Build It Once, Reuse It",
    concept: "Functions (bonus)",
    intro:
      "Teach Byte a short trick, then run the whole trick twice in a row without rebuilding it — that's what a function does: package steps up so you can reuse them.",
    mode: "build",
    grid: { width: 5, height: 1 },
    walls: [],
    start: { x: 0, y: 0, dir: "E" },
    goal: { x: 4, y: 0 },
    acorns: [],
    minAcorns: 0,
    palette: [
      { id: "forward", label: "Move Forward", expand: ["forward"] },
      { id: "turnLeft", label: "Turn Left", expand: ["turnLeft"] },
      { id: "turnRight", label: "Turn Right", expand: ["turnRight"] },
    ],
    maxBlocks: 2,
    runRepeatCount: 2,
    hint: "Build a tiny 2-block trick. \"Run My Trick x2\" will play your whole trick twice back to back.",
  },
  {
    id: "debugging",
    order: 6,
    title: "Debugging: Find the Bug",
    concept: "Debugging (bonus)",
    intro:
      "Byte's classmate wrote this program to reach the tree, but it's broken. Click the wrong step to cycle it to a fix, then run it to check your work.",
    mode: "debug",
    grid: { width: 3, height: 2 },
    walls: [[1, 0]],
    start: { x: 0, y: 1, dir: "E" },
    goal: { x: 2, y: 0 },
    acorns: [],
    minAcorns: 0,
    buggyProgram: [
      { cmd: "forward", label: "Move Forward", fixOptions: ["forward"] },
      { cmd: "forward", label: "Move Forward", fixOptions: ["forward"] },
      { cmd: "turnRight", label: "Turn Right", fixOptions: ["turnRight", "turnLeft"] },
      { cmd: "forward", label: "Move Forward", fixOptions: ["forward"] },
    ],
    runRepeatCount: 1,
    hint: "Byte is facing the wrong way after the turn. Click the turn step to try a different turn direction.",
  },
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { LESSONS };
}
