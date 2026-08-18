// Random Act of Kindness — all date/streak math is pure functions of plain
// inputs (dates, arrays, strings) so it's testable without a browser.
// Depends on KINDNESS_PROMPTS from data.js (loaded first via <script src="data.js">).

const STORAGE_COMPLETED_KEY = "random-act-of-kindness:completed";
const STORAGE_SHUFFLE_PREFIX = "random-act-of-kindness:shuffle:";

/** Pure: local-time date key as YYYY-MM-DD (avoids UTC day-boundary drift). */
function getDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Pure: 1-366 day-of-year for a given Date, in local time. */
function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const diffMs = date.setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0);
  return Math.floor(diffMs / 86400000) + 1;
}

/** Pure: deterministic prompt index for a date, same day-of-year-modulo approach used elsewhere in this project. */
function pickPromptIndex(date, listLength) {
  const doy = getDayOfYear(new Date(date.getTime()));
  return (doy - 1) % listLength;
}

/** Pure: pick a random index different from `currentIndex` (falls back to currentIndex if listLength is 1). */
function pickShuffledIndex(currentIndex, listLength, rng = Math.random) {
  if (listLength <= 1) return currentIndex;
  let next = currentIndex;
  while (next === currentIndex) {
    next = Math.floor(rng() * listLength);
  }
  return next;
}

/**
 * Pure: current streak of consecutive completed days ending today.
 * If today isn't marked done yet, the streak is still considered "alive"
 * as long as yesterday was completed (matches common streak-app behavior —
 * doing today's task hasn't happened yet, but the streak isn't broken until
 * a day is skipped entirely).
 */
function computeStreak(completedDates, todayKey) {
  const set = new Set(completedDates);
  const cursor = new Date(`${todayKey}T00:00:00`);
  if (!set.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (set.has(getDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function loadCompletedDates() {
  try {
    const raw = localStorage.getItem(STORAGE_COMPLETED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

function saveCompletedDates(dates) {
  try {
    localStorage.setItem(STORAGE_COMPLETED_KEY, JSON.stringify(dates));
  } catch (err) {
    // localStorage can throw in private-browsing/blocked-storage contexts — ignore, session still works.
  }
}

function loadShuffleOverride(todayKey) {
  try {
    const raw = localStorage.getItem(STORAGE_SHUFFLE_PREFIX + todayKey);
    return raw !== null ? parseInt(raw, 10) : null;
  } catch (err) {
    return null;
  }
}

function saveShuffleOverride(todayKey, index) {
  try {
    localStorage.setItem(STORAGE_SHUFFLE_PREFIX + todayKey, String(index));
  } catch (err) {
    // ignore
  }
}

function initApp() {
  const promptEl = document.getElementById("prompt-text");
  const doneBtn = document.getElementById("done-btn");
  const shuffleBtn = document.getElementById("shuffle-btn");
  const streakEl = document.getElementById("streak-count");
  const totalEl = document.getElementById("total-count");
  const statusEl = document.getElementById("done-status");

  const today = new Date();
  const todayKey = getDateKey(today);
  const defaultIndex = pickPromptIndex(today, KINDNESS_PROMPTS.length);

  let currentIndex = loadShuffleOverride(todayKey);
  if (currentIndex === null || currentIndex < 0 || currentIndex >= KINDNESS_PROMPTS.length) {
    currentIndex = defaultIndex;
  }

  let completedDates = loadCompletedDates();

  function renderPrompt() {
    promptEl.textContent = KINDNESS_PROMPTS[currentIndex].text;
  }

  function renderStatus() {
    const isDoneToday = completedDates.includes(todayKey);
    doneBtn.textContent = isDoneToday ? "Done for today ✓" : "Mark as done";
    doneBtn.classList.toggle("is-done", isDoneToday);
    statusEl.textContent = isDoneToday ? "Nice work — logged for today." : "";

    const streak = computeStreak(completedDates, todayKey);
    streakEl.textContent = streak;
    totalEl.textContent = completedDates.length;
  }

  doneBtn.addEventListener("click", () => {
    const isDoneToday = completedDates.includes(todayKey);
    if (isDoneToday) {
      completedDates = completedDates.filter((d) => d !== todayKey);
    } else {
      completedDates = [...completedDates, todayKey];
    }
    saveCompletedDates(completedDates);
    renderStatus();
  });

  shuffleBtn.addEventListener("click", () => {
    currentIndex = pickShuffledIndex(currentIndex, KINDNESS_PROMPTS.length);
    saveShuffleOverride(todayKey, currentIndex);
    renderPrompt();
  });

  renderPrompt();
  renderStatus();
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", initApp);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { getDateKey, getDayOfYear, pickPromptIndex, pickShuffledIndex, computeStreak };
}
