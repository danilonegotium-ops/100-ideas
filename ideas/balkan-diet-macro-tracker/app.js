// Balkan Diet Macro Tracker — app logic.
// Depends on BALKAN_FOODS from data.js (loaded first via <script>).
//
// All macro numbers shown are planning-purpose ESTIMATES, not medical advice
// — see the disclaimer baked into the UI and data.js header comment.

const DEFAULT_GOALS = { calories: 2000, proteinG: 100, carbsG: 250, fatG: 65 };
const GOALS_KEY = "macro-tracker-goals-v1";
const LOG_KEY_PREFIX = "macro-tracker-log-v1-"; // + YYYY-MM-DD

/** Local (not UTC) date key so "today" matches the visitor's own calendar day. */
function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Scale one food's macros by a portion multiplier. Pure, rounds to whole units. */
function scaleFood(food, multiplier) {
  const m = Number(multiplier) || 0;
  return {
    calories: Math.round(food.calories * m),
    proteinG: Math.round(food.proteinG * m * 10) / 10,
    carbsG: Math.round(food.carbsG * m * 10) / 10,
    fatG: Math.round(food.fatG * m * 10) / 10,
  };
}

/**
 * Sum every log entry's scaled macros into a daily total.
 * @param {{foodId:string, multiplier:number}[]} entries
 * @param {Record<string,object>} foodsById
 */
function computeTotals(entries, foodsById) {
  const totals = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };
  entries.forEach((entry) => {
    const food = foodsById[entry.foodId];
    if (!food) return; // stale/unknown id — skip rather than crash
    const scaled = scaleFood(food, entry.multiplier);
    totals.calories += scaled.calories;
    totals.proteinG += scaled.proteinG;
    totals.carbsG += scaled.carbsG;
    totals.fatG += scaled.fatG;
  });
  // Round the accumulated totals to avoid floating point noise (e.g. 39.999999).
  totals.proteinG = Math.round(totals.proteinG * 10) / 10;
  totals.carbsG = Math.round(totals.carbsG * 10) / 10;
  totals.fatG = Math.round(totals.fatG * 10) / 10;
  return totals;
}

/** Remaining = goal - total for each macro (can be negative if over budget). */
function computeRemaining(totals, goals) {
  return {
    calories: goals.calories - totals.calories,
    proteinG: Math.round((goals.proteinG - totals.proteinG) * 10) / 10,
    carbsG: Math.round((goals.carbsG - totals.carbsG) * 10) / 10,
    fatG: Math.round((goals.fatG - totals.fatG) * 10) / 10,
  };
}

function foodsById(foods) {
  const map = {};
  foods.forEach((f) => (map[f.id] = f));
  return map;
}

// ---- localStorage-backed persistence (guarded so it's node-safe to import) ----

function loadGoals() {
  if (typeof localStorage === "undefined") return { ...DEFAULT_GOALS };
  try {
    const raw = localStorage.getItem(GOALS_KEY);
    return raw ? { ...DEFAULT_GOALS, ...JSON.parse(raw) } : { ...DEFAULT_GOALS };
  } catch (e) {
    return { ...DEFAULT_GOALS };
  }
}

function saveGoals(goals) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  } catch (e) {
    /* storage unavailable/full — non-critical, fail silently */
  }
}

function loadLog(dateKey) {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOG_KEY_PREFIX + dateKey);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLog(dateKey, entries) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(LOG_KEY_PREFIX + dateKey, JSON.stringify(entries));
  } catch (e) {
    /* storage unavailable/full — non-critical, fail silently */
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    DEFAULT_GOALS,
    formatDateKey,
    scaleFood,
    computeTotals,
    computeRemaining,
    foodsById,
    loadGoals,
    saveGoals,
    loadLog,
    saveLog,
  };
}

(function initMacroTracker() {
  if (typeof document === "undefined") return;

  const FOODS_BY_ID = foodsById(BALKAN_FOODS);

  const dateInput = document.getElementById("date-input");
  const goalCalories = document.getElementById("goal-calories");
  const goalProtein = document.getElementById("goal-protein");
  const goalCarbs = document.getElementById("goal-carbs");
  const goalFat = document.getElementById("goal-fat");
  const saveGoalsBtn = document.getElementById("save-goals-btn");
  const goalsSavedNote = document.getElementById("goals-saved-note");

  const foodSelect = document.getElementById("food-select");
  const portionInput = document.getElementById("portion-input");
  const addBtn = document.getElementById("add-entry-btn");

  const logList = document.getElementById("log-list");
  const logEmpty = document.getElementById("log-empty");
  const clearDayBtn = document.getElementById("clear-day-btn");

  const sumCalories = document.getElementById("sum-calories");
  const sumProtein = document.getElementById("sum-protein");
  const sumCarbs = document.getElementById("sum-carbs");
  const sumFat = document.getElementById("sum-fat");

  let currentDateKey = formatDateKey(new Date());
  let currentEntries = [];
  let entrySeq = 0;

  // Populate food select, alphabetically.
  BALKAN_FOODS.slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((food) => {
      const opt = document.createElement("option");
      opt.value = food.id;
      opt.textContent = `${food.name} (${food.serving})`;
      foodSelect.appendChild(opt);
    });

  function loadGoalsIntoForm() {
    const goals = loadGoals();
    goalCalories.value = goals.calories;
    goalProtein.value = goals.proteinG;
    goalCarbs.value = goals.carbsG;
    goalFat.value = goals.fatG;
  }

  function readGoalsFromForm() {
    return {
      calories: Number(goalCalories.value) || 0,
      proteinG: Number(goalProtein.value) || 0,
      carbsG: Number(goalCarbs.value) || 0,
      fatG: Number(goalFat.value) || 0,
    };
  }

  function renderProgress(label, valueEl, total, goal, unit) {
    const remaining = goal - total;
    const pct = goal > 0 ? Math.min(100, Math.round((total / goal) * 100)) : 0;
    valueEl.querySelector(".macro-numbers").textContent = `${total}${unit} / ${goal}${unit}`;
    valueEl.querySelector(".macro-remaining").textContent =
      remaining >= 0 ? `${remaining}${unit} left` : `${Math.abs(remaining)}${unit} over`;
    valueEl.querySelector(".macro-remaining").classList.toggle("over-budget", remaining < 0);
    const bar = valueEl.querySelector(".macro-bar-fill");
    bar.style.width = pct + "%";
    bar.classList.toggle("over-budget", remaining < 0);
  }

  function renderLog() {
    const entries = currentEntries;
    logList.innerHTML = "";
    logEmpty.hidden = entries.length > 0;

    entries.forEach((entry) => {
      const food = FOODS_BY_ID[entry.foodId];
      if (!food) return;
      const scaled = scaleFood(food, entry.multiplier);
      const row = document.createElement("div");
      row.className = "log-row";
      row.innerHTML = `
        <div class="log-row-main">
          <strong>${food.name}</strong>
          <span class="muted">&times; ${entry.multiplier} (${food.serving})</span>
        </div>
        <div class="log-row-macros muted mono">${scaled.calories} kcal &middot; P${scaled.proteinG} C${scaled.carbsG} F${scaled.fatG}</div>
      `;
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "btn-secondary log-remove";
      removeBtn.textContent = "Remove";
      removeBtn.addEventListener("click", () => {
        currentEntries = currentEntries.filter((e) => e.uid !== entry.uid);
        persistAndRender();
      });
      row.appendChild(removeBtn);
      logList.appendChild(row);
    });

    const goals = readGoalsFromForm();
    const totals = computeTotals(entries, FOODS_BY_ID);
    renderProgress("calories", sumCalories, totals.calories, goals.calories, "");
    renderProgress("protein", sumProtein, totals.proteinG, goals.proteinG, "g");
    renderProgress("carbs", sumCarbs, totals.carbsG, goals.carbsG, "g");
    renderProgress("fat", sumFat, totals.fatG, goals.fatG, "g");
  }

  function persistAndRender() {
    saveLog(currentDateKey, currentEntries);
    renderLog();
  }

  function loadDay(dateKey) {
    currentDateKey = dateKey;
    currentEntries = loadLog(dateKey);
    renderLog();
  }

  dateInput.value = currentDateKey;
  dateInput.addEventListener("change", () => {
    loadDay(dateInput.value || formatDateKey(new Date()));
  });

  saveGoalsBtn.addEventListener("click", () => {
    saveGoals(readGoalsFromForm());
    goalsSavedNote.hidden = false;
    setTimeout(() => (goalsSavedNote.hidden = true), 1800);
    renderLog();
  });

  addBtn.addEventListener("click", () => {
    const foodId = foodSelect.value;
    const multiplier = Math.max(0.25, Number(portionInput.value) || 1);
    if (!foodId) return;
    entrySeq++;
    currentEntries = currentEntries.concat([{ uid: `${currentDateKey}-${entrySeq}-${Date.now()}`, foodId, multiplier }]);
    persistAndRender();
  });

  clearDayBtn.addEventListener("click", () => {
    if (currentEntries.length === 0) return;
    currentEntries = [];
    persistAndRender();
  });

  loadGoalsIntoForm();
  loadDay(currentDateKey);
})();
