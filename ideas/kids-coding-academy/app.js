/* Byte the Fox's Coding Academy — a tiny maze-runner "programming language"
   engine (forward / turn / conditional wall-check / collect) plus a
   click-based block-ordering UI (no drag-and-drop). Lesson completion is
   persisted in localStorage.
   The engine itself (isWall, runProgram, expandBlocks, repeatCommands) is
   pure and DOM-free so it can be sanity checked from Node; only rendering
   and localStorage access touch the browser. */

/* ---------- pure logic: engine ---------- */

const DIRS = { N: { x: 0, y: -1 }, E: { x: 1, y: 0 }, S: { x: 0, y: 1 }, W: { x: -1, y: 0 } };
const TURN_LEFT = { N: "W", W: "S", S: "E", E: "N" };
const TURN_RIGHT = { N: "E", E: "S", S: "W", W: "N" };
const DIR_ARROW_DEG = { E: 0, S: 90, W: 180, N: 270 };

function isWall(maze, x, y) {
  if (x < 0 || y < 0 || x >= maze.grid.width || y >= maze.grid.height) return true;
  return (maze.walls || []).some((w) => w[0] === x && w[1] === y);
}

/**
 * Run a flat list of atomic commands against a maze definition starting
 * from maze.start. Commands: "forward", "turnLeft", "turnRight",
 * "ifWallTurnRight", "collect".
 */
function runProgram(maze, commands) {
  let { x, y, dir } = maze.start;
  let acorns = 0;
  const collected = new Set();
  const path = [{ x, y, dir, acorns }];
  const log = [];
  let bumped = false;

  for (const cmd of commands) {
    if (cmd === "forward") {
      const d = DIRS[dir];
      const nx = x + d.x;
      const ny = y + d.y;
      if (isWall(maze, nx, ny)) {
        bumped = true;
        log.push("Bumped into a wall!");
        break;
      }
      x = nx;
      y = ny;
    } else if (cmd === "turnLeft") {
      dir = TURN_LEFT[dir];
    } else if (cmd === "turnRight") {
      dir = TURN_RIGHT[dir];
    } else if (cmd === "ifWallTurnRight") {
      const d = DIRS[dir];
      const nx = x + d.x;
      const ny = y + d.y;
      if (isWall(maze, nx, ny)) {
        dir = TURN_RIGHT[dir];
        log.push("Wall ahead — turned right.");
      } else {
        x = nx;
        y = ny;
        log.push("Clear ahead — moved forward.");
      }
    } else if (cmd === "collect") {
      const key = `${x},${y}`;
      const onAcorn = (maze.acorns || []).some((a) => a[0] === x && a[1] === y);
      if (onAcorn && !collected.has(key)) {
        collected.add(key);
        acorns += 1;
        log.push(`Collected an acorn! Count: ${acorns}`);
      }
    }
    path.push({ x, y, dir, acorns });
    if (path.length > 300) break; // safety valve against runaway programs
  }

  const reachedGoal = x === maze.goal.x && y === maze.goal.y;
  const enoughAcorns = acorns >= (maze.minAcorns || 0);
  return {
    success: !bumped && reachedGoal && enoughAcorns,
    bumped,
    reachedGoal,
    enoughAcorns,
    finalX: x,
    finalY: y,
    finalDir: dir,
    acorns,
    path,
    log,
  };
}

/** Turn a list of palette block ids into a flat list of atomic commands. */
function expandBlocks(blockIds, palette) {
  const out = [];
  blockIds.forEach((id) => {
    const block = palette.find((p) => p.id === id);
    if (block) out.push(...block.expand);
  });
  return out;
}

/** Repeat a command list N times (used for the "function" reuse lesson). */
function repeatCommands(commands, times) {
  const out = [];
  for (let i = 0; i < times; i++) out.push(...commands);
  return out;
}

/* ---------- storage helpers ---------- */

const PROGRESS_KEY = "kids_coding_academy_progress_v1";

function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveProgress(progress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

/* ---------- DOM wiring (skipped when running under Node) ---------- */

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    const card = document.querySelector(".card");
    const lessons = typeof LESSONS !== "undefined" ? LESSONS : [];
    let progress = loadProgress();
    let lessonIndex = 0;

    // Per-lesson mutable UI state
    let queue = []; // block ids, "build" mode
    let debugChips = []; // { cmd, label, fixOptions, optionIndex }, "debug" mode
    let running = false;

    function currentLesson() {
      return lessons[lessonIndex];
    }

    function resetLessonState() {
      const lesson = currentLesson();
      queue = [];
      if (lesson.mode === "debug") {
        debugChips = lesson.buggyProgram.map((b) => ({
          ...b,
          optionIndex: 0,
        }));
      }
      running = false;
    }

    function cellEmoji(lesson, x, y, robotPos) {
      if (robotPos && robotPos.x === x && robotPos.y === y) return null; // drawn separately
      if (lesson.goal.x === x && lesson.goal.y === y) return "🌳";
      if ((lesson.walls || []).some((w) => w[0] === x && w[1] === y)) return "🪨";
      if ((lesson.acorns || []).some((a) => a[0] === x && a[1] === y)) return "🌰";
      return "";
    }

    function renderGrid(lesson, robotPos) {
      const pos = robotPos || lesson.start;
      let html = `<div style="display:inline-grid; grid-template-columns: repeat(${lesson.grid.width}, 40px); gap:2px; background:var(--border); padding:2px; border-radius:8px;">`;
      for (let y = 0; y < lesson.grid.height; y++) {
        for (let x = 0; x < lesson.grid.width; x++) {
          const isRobot = pos.x === x && pos.y === y;
          const content = isRobot
            ? `<span style="display:inline-block; transform: rotate(${DIR_ARROW_DEG[pos.dir]}deg);">🦊</span>`
            : cellEmoji(lesson, x, y, null);
          html += `<div style="width:40px; height:40px; display:flex; align-items:center; justify-content:center; background:var(--bg-elevated); font-size:1.3rem;">${content}</div>`;
        }
      }
      html += `</div>`;
      return html;
    }

    function render() {
      const lesson = currentLesson();
      resetLessonState();
      card.innerHTML = "";

      // Lesson nav
      const nav = document.createElement("div");
      nav.className = "row";
      nav.style.marginBottom = "1rem";
      lessons.forEach((l, i) => {
        const btn = document.createElement("button");
        const done = !!progress[l.id];
        btn.textContent = `${done ? "✓ " : ""}${l.order}. ${l.concept}`;
        btn.style.opacity = i === lessonIndex ? "1" : "0.6";
        btn.addEventListener("click", () => {
          lessonIndex = i;
          render();
        });
        nav.appendChild(btn);
      });
      card.appendChild(nav);

      const storyBox = document.createElement("div");
      storyBox.innerHTML = `
        <h2 style="margin-top:0;">${lesson.title}</h2>
        <p class="muted">${lesson.intro}</p>
      `;
      card.appendChild(storyBox);

      const gridWrap = document.createElement("div");
      gridWrap.id = "grid-wrap";
      gridWrap.style.margin = "1rem 0";
      gridWrap.innerHTML = renderGrid(lesson, lesson.start);
      card.appendChild(gridWrap);

      const statusEl = document.createElement("p");
      statusEl.id = "status";
      statusEl.className = "muted";
      card.appendChild(statusEl);

      const builderBox = document.createElement("div");
      builderBox.className = "stack";
      card.appendChild(builderBox);

      if (lesson.mode === "build") {
        renderBuildMode(lesson, builderBox, gridWrap, statusEl);
      } else {
        renderDebugMode(lesson, builderBox, gridWrap, statusEl);
      }

      const hintBox = document.createElement("details");
      hintBox.style.marginTop = "1rem";
      hintBox.innerHTML = `<summary class="muted" style="cursor:pointer;">Need a hint?</summary><p class="muted">${lesson.hint}</p>`;
      card.appendChild(hintBox);
    }

    function renderBuildMode(lesson, builderBox, gridWrap, statusEl) {
      const paletteRow = document.createElement("div");
      paletteRow.className = "row";
      lesson.palette.forEach((block) => {
        const btn = document.createElement("button");
        btn.textContent = block.label;
        btn.addEventListener("click", () => {
          if (running) return;
          if (queue.length >= lesson.maxBlocks) {
            statusEl.textContent = `You can use at most ${lesson.maxBlocks} block${lesson.maxBlocks === 1 ? "" : "s"} in this lesson.`;
            return;
          }
          queue.push(block.id);
          renderQueue();
        });
        paletteRow.appendChild(btn);
      });
      builderBox.appendChild(paletteRow);

      const queueLabel = document.createElement("label");
      queueLabel.textContent = `Your program (click a step to remove it) — max ${lesson.maxBlocks}`;
      builderBox.appendChild(queueLabel);

      const queueBox = document.createElement("div");
      queueBox.id = "queue-box";
      queueBox.className = "row";
      queueBox.style.minHeight = "2.2rem";
      builderBox.appendChild(queueBox);

      function renderQueue() {
        queueBox.innerHTML = "";
        queue.forEach((id, i) => {
          const block = lesson.palette.find((p) => p.id === id);
          const chip = document.createElement("button");
          chip.textContent = `${i + 1}. ${block.label}`;
          chip.style.fontSize = "0.8rem";
          chip.addEventListener("click", () => {
            if (running) return;
            queue.splice(i, 1);
            renderQueue();
          });
          queueBox.appendChild(chip);
        });
      }
      renderQueue();

      const controlsRow = document.createElement("div");
      controlsRow.className = "row";
      controlsRow.style.marginTop = "0.8rem";
      const runBtn = document.createElement("button");
      runBtn.textContent = lesson.runRepeatCount > 1 ? `Run My Trick x${lesson.runRepeatCount}` : "Run";
      const resetBtn = document.createElement("button");
      resetBtn.textContent = "Reset";
      controlsRow.append(runBtn, resetBtn);
      builderBox.appendChild(controlsRow);

      resetBtn.addEventListener("click", () => {
        if (running) return;
        queue = [];
        renderQueue();
        gridWrap.innerHTML = renderGrid(lesson, lesson.start);
        statusEl.textContent = "";
      });

      runBtn.addEventListener("click", () => {
        if (running || queue.length === 0) return;
        const baseCommands = expandBlocks(queue, lesson.palette);
        const commands = repeatCommands(baseCommands, lesson.runRepeatCount || 1);
        animateRun(lesson, commands, gridWrap, statusEl);
      });
    }

    function renderDebugMode(lesson, builderBox, gridWrap, statusEl) {
      const chipsBox = document.createElement("div");
      chipsBox.className = "row";
      builderBox.appendChild(chipsBox);

      function renderChips() {
        chipsBox.innerHTML = "";
        debugChips.forEach((chip, i) => {
          const btn = document.createElement("button");
          const currentCmd = chip.fixOptions[chip.optionIndex];
          const displayLabel = chip.fixOptions.length > 1 ? `${currentCmd} (click to change)` : chip.label;
          btn.textContent = `${i + 1}. ${displayLabel}`;
          btn.addEventListener("click", () => {
            if (running || chip.fixOptions.length <= 1) return;
            chip.optionIndex = (chip.optionIndex + 1) % chip.fixOptions.length;
            renderChips();
          });
          chipsBox.appendChild(btn);
        });
      }
      renderChips();

      const controlsRow = document.createElement("div");
      controlsRow.className = "row";
      controlsRow.style.marginTop = "0.8rem";
      const runBtn = document.createElement("button");
      runBtn.textContent = "Run";
      controlsRow.appendChild(runBtn);
      builderBox.appendChild(controlsRow);

      runBtn.addEventListener("click", () => {
        if (running) return;
        const commands = debugChips.map((c) => c.fixOptions[c.optionIndex]);
        animateRun(lesson, commands, gridWrap, statusEl);
      });
    }

    function animateRun(lesson, commands, gridWrap, statusEl) {
      const result = runProgram(lesson, commands);
      running = true;
      statusEl.textContent = "Running…";
      let step = 0;
      const timer = setInterval(() => {
        if (step >= result.path.length) {
          clearInterval(timer);
          running = false;
          if (result.success) {
            statusEl.textContent = "🎉 Success! Byte reached the tree.";
            progress[lesson.id] = true;
            saveProgress(progress);
            render();
          } else if (result.bumped) {
            statusEl.textContent = "Byte bumped into something. Try again — check the order of your steps.";
          } else if (!result.enoughAcorns) {
            statusEl.textContent = `Byte reached the spot, but only collected ${result.acorns}/${lesson.minAcorns} acorns. Try again.`;
          } else {
            statusEl.textContent = "Byte didn't quite make it to the tree. Try again.";
          }
          return;
        }
        gridWrap.innerHTML = renderGrid(lesson, result.path[step]);
        step++;
      }, 350);
    }

    render();
  });
}

/* ---------- exports for Node-based sanity checks ---------- */

if (typeof module !== "undefined" && module.exports) {
  module.exports = { isWall, runProgram, expandBlocks, repeatCommands, DIRS, TURN_LEFT, TURN_RIGHT };
}
