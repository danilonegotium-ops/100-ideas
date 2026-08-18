// Daily Riddle Site — pure date-seeded selection logic first (testable from
// Node via the module.exports guard at the bottom), DOM wiring after.

/** 0-indexed day-of-year for a local Date (Jan 1 = 0), using local calendar days. */
function dayOfYear(date) {
  var start = new Date(date.getFullYear(), 0, 1);
  var current = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  var diffMs = current.getTime() - start.getTime();
  return Math.round(diffMs / 86400000);
}

/** Deterministic index into a riddle list for a given date. */
function riddleIndexForDate(date, listLength) {
  if (listLength <= 0) return -1;
  return dayOfYear(date) % listLength;
}

/** The riddle object a given date deterministically maps to. */
function riddleForDate(date, riddles) {
  var idx = riddleIndexForDate(date, riddles.length);
  return idx >= 0 ? riddles[idx] : null;
}

/** Parse a "YYYY-MM-DD" <input type="date"> value into a local Date (avoids UTC-parse off-by-one). */
function parseDateInputValue(value) {
  var parts = String(value).split("-").map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

/** "YYYY-MM-DD" for a local Date, matching <input type="date"> format. */
function formatDateInputValue(date) {
  var y = date.getFullYear();
  var m = String(date.getMonth() + 1).padStart(2, "0");
  var d = String(date.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + d;
}

/** Friendly display format, e.g. "Sunday, August 16, 2026". */
function formatDisplayDate(date) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// DOM wiring
// ---------------------------------------------------------------------------

function initApp() {
  var dateEl = document.getElementById("dr-date");
  var riddleTextEl = document.getElementById("dr-riddle-text");
  var revealBtn = document.getElementById("dr-reveal");
  var answerEl = document.getElementById("dr-answer");

  var archiveDateInput = document.getElementById("dr-archive-date");
  var archiveViewBtn = document.getElementById("dr-archive-view");
  var archiveResult = document.getElementById("dr-archive-result");
  var archiveDateLabel = document.getElementById("dr-archive-date-label");
  var archiveText = document.getElementById("dr-archive-text");
  var archiveReveal = document.getElementById("dr-archive-reveal");
  var archiveAnswer = document.getElementById("dr-archive-answer");

  var today = new Date();
  var todaysRiddle = riddleForDate(today, RIDDLES);

  dateEl.textContent = formatDisplayDate(today);
  riddleTextEl.textContent = todaysRiddle.q;
  answerEl.textContent = todaysRiddle.a;

  revealBtn.addEventListener("click", function () {
    var willShow = answerEl.hidden;
    answerEl.hidden = !willShow;
    revealBtn.textContent = willShow ? "Hide answer" : "Reveal answer";
  });

  archiveDateInput.max = formatDateInputValue(today);
  archiveDateInput.value = formatDateInputValue(today);

  archiveViewBtn.addEventListener("click", function () {
    if (!archiveDateInput.value) return;
    var picked = parseDateInputValue(archiveDateInput.value);
    var riddle = riddleForDate(picked, RIDDLES);

    archiveDateLabel.textContent = formatDisplayDate(picked);
    archiveText.textContent = riddle.q;
    archiveAnswer.textContent = riddle.a;
    archiveAnswer.hidden = true;
    archiveReveal.textContent = "Reveal answer";
    archiveResult.hidden = false;
  });

  archiveReveal.addEventListener("click", function () {
    var willShow = archiveAnswer.hidden;
    archiveAnswer.hidden = !willShow;
    archiveReveal.textContent = willShow ? "Hide answer" : "Reveal answer";
  });
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", initApp);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    dayOfYear,
    riddleIndexForDate,
    riddleForDate,
    parseDateInputValue,
    formatDateInputValue,
    formatDisplayDate,
  };
}
