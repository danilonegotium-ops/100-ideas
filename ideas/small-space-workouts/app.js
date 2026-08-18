// Small Space Workouts — app logic.
// Depends on EXERCISES from data.js (loaded first via <script>).

const DIFFICULTY_ORDER = ["beginner", "intermediate", "advanced"];

const DURATION_PRESETS = {
  quick: { label: "Quick (~5 min)", workSeconds: 40, restSeconds: 15 },
  standard: { label: "Standard (~8 min)", workSeconds: 70, restSeconds: 20 },
  extended: { label: "Extended (~12 min)", workSeconds: 110, restSeconds: 25 },
};

/** Deterministic Fisher-Yates shuffle. Returns a new array, never mutates input. */
function shuffleArray(list, rng) {
  rng = rng || Math.random;
  const arr = list.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

/**
 * Build a routine of `count` exercises for a target difficulty. Exercises
 * matching the exact difficulty are preferred (and shuffled among
 * themselves); if there aren't enough, the pool is backfilled with the
 * next-closest difficulty levels so a full routine is always returned even
 * for the smaller "advanced" pool.
 */
function generateRoutine(exercises, difficulty, count, rng) {
  rng = rng || Math.random;
  count = count || 5;
  const selectedRank = DIFFICULTY_ORDER.indexOf(difficulty);

  const buckets = {};
  exercises.forEach((ex) => {
    const rank = DIFFICULTY_ORDER.indexOf(ex.difficulty);
    const dist = selectedRank === -1 ? 0 : Math.abs(rank - selectedRank);
    buckets[dist] = buckets[dist] || [];
    buckets[dist].push(ex);
  });

  const orderedDistances = Object.keys(buckets)
    .map(Number)
    .sort((a, b) => a - b);

  let pool = [];
  orderedDistances.forEach((dist) => {
    pool = pool.concat(shuffleArray(buckets[dist], rng));
  });

  return pool.slice(0, Math.min(count, pool.length));
}

/**
 * Turn a list of exercises into a work/rest phase timeline. No rest phase
 * after the final exercise.
 */
function buildTimeline(routine, workSeconds, restSeconds) {
  const phases = [];
  routine.forEach((ex, i) => {
    phases.push({ type: "work", exercise: ex, seconds: workSeconds });
    if (i < routine.length - 1) {
      phases.push({ type: "rest", seconds: restSeconds, next: routine[i + 1] });
    }
  });
  return phases;
}

/** mm:ss formatting for a countdown display. */
function formatTime(totalSeconds) {
  const safe = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    DIFFICULTY_ORDER,
    DURATION_PRESETS,
    shuffleArray,
    generateRoutine,
    buildTimeline,
    formatTime,
  };
}

(function initSmallSpaceWorkouts() {
  if (typeof document === "undefined") return;

  const setupView = document.getElementById("setup-view");
  const previewView = document.getElementById("preview-view");
  const timerView = document.getElementById("timer-view");
  const doneView = document.getElementById("done-view");

  const difficultySelect = document.getElementById("difficulty-select");
  const durationSelect = document.getElementById("duration-select");
  const generateBtn = document.getElementById("generate-btn");

  const previewList = document.getElementById("preview-list");
  const startBtn = document.getElementById("start-btn");
  const regenerateBtn = document.getElementById("regenerate-btn");

  const phaseLabel = document.getElementById("phase-label");
  const phaseCountdown = document.getElementById("phase-countdown");
  const phaseExerciseName = document.getElementById("phase-exercise-name");
  const phaseExerciseMeta = document.getElementById("phase-exercise-meta");
  const phaseInstructions = document.getElementById("phase-instructions");
  const progressLabel = document.getElementById("timer-progress-label");
  const pauseBtn = document.getElementById("pause-btn");
  const skipBtn = document.getElementById("skip-btn");

  const doneSummary = document.getElementById("done-summary");
  const newWorkoutBtn = document.getElementById("new-workout-btn");

  let currentRoutine = [];
  let timeline = [];
  let phaseIndex = 0;
  let secondsLeft = 0;
  let tickHandle = null;
  let paused = false;

  function showOnly(view) {
    [setupView, previewView, timerView, doneView].forEach((v) => (v.hidden = v !== view));
  }

  function renderPreview() {
    previewList.innerHTML = "";
    currentRoutine.forEach((ex, i) => {
      const item = document.createElement("div");
      item.className = "exercise-preview-row";
      item.innerHTML = `
        <span class="ex-num mono">${i + 1}</span>
        <div>
          <strong>${ex.name}</strong>
          <div class="muted" style="font-size: 0.85rem;">${ex.muscleGroup} &middot; ${ex.difficulty} &middot; ${ex.type === "hold" ? ex.defaultSeconds + "s hold (default)" : ex.defaultReps + " reps (default)"}</div>
        </div>
      `;
      previewList.appendChild(item);
    });
  }

  function generate() {
    const difficulty = difficultySelect.value;
    currentRoutine = generateRoutine(EXERCISES, difficulty, 5, Math.random);
    renderPreview();
    showOnly(previewView);
  }

  function stopTimer() {
    if (tickHandle) {
      clearInterval(tickHandle);
      tickHandle = null;
    }
  }

  function renderPhase() {
    const phase = timeline[phaseIndex];
    progressLabel.textContent = `Exercise ${Math.ceil((phaseIndex + 1) / 2)} of ${currentRoutine.length}`;
    phaseCountdown.textContent = formatTime(secondsLeft);

    if (phase.type === "work") {
      phaseLabel.textContent = "WORK";
      phaseLabel.className = "phase-label phase-work";
      phaseExerciseName.textContent = phase.exercise.name;
      phaseExerciseMeta.textContent = `${phase.exercise.muscleGroup} • ${phase.exercise.quietNote}`;
      phaseInstructions.textContent = phase.exercise.instructions;
    } else {
      phaseLabel.textContent = "REST";
      phaseLabel.className = "phase-label phase-rest";
      phaseExerciseName.textContent = phase.next ? `Up next: ${phase.next.name}` : "Almost done";
      phaseExerciseMeta.textContent = phase.next ? phase.next.muscleGroup : "";
      phaseInstructions.textContent = "Catch your breath. Shake it out.";
    }
  }

  function goToPhase(index) {
    stopTimer();
    if (index >= timeline.length) {
      finishWorkout();
      return;
    }
    phaseIndex = index;
    secondsLeft = timeline[phaseIndex].seconds;
    renderPhase();
    startTicking();
  }

  function startTicking() {
    stopTimer();
    paused = false;
    pauseBtn.textContent = "Pause";
    tickHandle = setInterval(() => {
      secondsLeft--;
      if (secondsLeft <= 0) {
        goToPhase(phaseIndex + 1);
        return;
      }
      phaseCountdown.textContent = formatTime(secondsLeft);
    }, 1000);
  }

  function togglePause() {
    if (paused) {
      paused = false;
      pauseBtn.textContent = "Pause";
      startTicking();
      // startTicking resets to a fresh interval tick boundary; that's an
      // acceptable minor timing nudge for a v1 timer.
    } else {
      paused = true;
      pauseBtn.textContent = "Resume";
      stopTimer();
    }
  }

  function finishWorkout() {
    stopTimer();
    showOnly(doneView);
    doneSummary.innerHTML = "";
    currentRoutine.forEach((ex) => {
      const li = document.createElement("li");
      li.textContent = ex.name;
      doneSummary.appendChild(li);
    });
  }

  function startWorkout() {
    const preset = DURATION_PRESETS[durationSelect.value];
    timeline = buildTimeline(currentRoutine, preset.workSeconds, preset.restSeconds);
    showOnly(timerView);
    goToPhase(0);
  }

  generateBtn.addEventListener("click", generate);
  regenerateBtn.addEventListener("click", generate);
  startBtn.addEventListener("click", startWorkout);
  pauseBtn.addEventListener("click", togglePause);
  skipBtn.addEventListener("click", () => goToPhase(phaseIndex + 1));
  newWorkoutBtn.addEventListener("click", () => {
    stopTimer();
    showOnly(setupView);
  });

  showOnly(setupView);
})();
