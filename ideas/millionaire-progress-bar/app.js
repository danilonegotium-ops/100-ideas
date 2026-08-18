// Millionaire Progress Bar — the math is a pure function of the savings
// number so it can be unit-tested without a browser.

const GOAL = 1000000;
const STORAGE_KEY = "millionaire-progress-bar:savings";

/**
 * Pure: turn a raw savings number into everything the UI needs.
 */
function computeProgress(savingsInput) {
  const savings = Number.isFinite(savingsInput) && savingsInput > 0 ? savingsInput : 0;
  const rawPercent = (savings / GOAL) * 100;
  const clampedPercent = Math.min(100, Math.max(0, rawPercent));
  const remaining = Math.max(0, GOAL - savings);
  const reached = savings >= GOAL;
  return { savings, rawPercent, clampedPercent, remaining, reached };
}

/** Pure: pick an encouragement message for the current percent. */
function milestoneMessage({ clampedPercent, reached }) {
  if (reached) return "You did it. Certified millionaire.";
  if (clampedPercent >= 75) return "Final stretch — under a quarter to go.";
  if (clampedPercent >= 50) return "Past the halfway point. Keep stacking.";
  if (clampedPercent >= 25) return "A quarter of the way there.";
  if (clampedPercent >= 10) return "Double digits. Momentum is building.";
  if (clampedPercent > 0) return "Every bit counts. You're on the board.";
  return "Enter your current savings to start tracking.";
}

/** Pure: format a plain number with thousands separators, no currency symbol. */
function formatNumber(n) {
  return Math.round(n * 100) / 100 === Math.round(n)
    ? Math.round(n).toLocaleString("en-US")
    : n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function render(savingsInput) {
  const progress = computeProgress(savingsInput);
  const fillEl = document.getElementById("bar-fill");
  const percentEl = document.getElementById("percent-label");
  const remainingEl = document.getElementById("remaining-label");
  const messageEl = document.getElementById("milestone-message");

  fillEl.style.width = `${progress.clampedPercent}%`;
  percentEl.textContent = `${progress.rawPercent.toFixed(progress.rawPercent < 1 ? 2 : 1)}%`;
  remainingEl.textContent = progress.reached
    ? `+${formatNumber(progress.savings - GOAL)} over the goal`
    : `${formatNumber(progress.remaining)} to go`;
  messageEl.textContent = milestoneMessage(progress);

  return progress;
}

if (typeof document !== "undefined") {
  const input = document.getElementById("savings");
  const saveBtn = document.getElementById("save-btn");

  function persistAndRender() {
    const value = parseFloat(input.value);
    const safeValue = Number.isFinite(value) ? value : 0;
    try {
      localStorage.setItem(STORAGE_KEY, String(safeValue));
    } catch (err) {
      // localStorage can throw in private-browsing/blocked-storage contexts;
      // the app still works for the current session, it just won't persist.
    }
    render(safeValue);
  }

  // Load any previously saved value on page load.
  let stored = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch (err) {
    stored = null;
  }
  const initial = stored !== null ? parseFloat(stored) : NaN;
  if (Number.isFinite(initial)) {
    input.value = initial;
  }
  render(Number.isFinite(initial) ? initial : 0);

  saveBtn.addEventListener("click", persistAndRender);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") persistAndRender();
  });
  // Live-update the bar as the user types, without waiting for Update.
  input.addEventListener("input", () => {
    const value = parseFloat(input.value);
    render(Number.isFinite(value) ? value : 0);
  });
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { computeProgress, milestoneMessage, formatNumber, GOAL };
}
