// Is It Friday Yet — all logic is pure and driven off a Date so it's easy to
// unit-test without a browser (see the day-of-week math in getFridayStatus).

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Given a JS Date, return everything the UI needs: whether it's Friday,
 * how many days until the next Friday, a mood bucket, and dramatic copy.
 * Pure function of `date` — no DOM, no globals — so it's trivially testable.
 */
function getFridayStatus(date) {
  const day = date.getDay(); // 0 = Sunday .. 6 = Saturday
  const isFriday = day === 5;
  // Days remaining until the next Friday (0 when today IS Friday).
  const daysUntil = (5 - day + 7) % 7;

  let mood;
  let message;

  if (isFriday) {
    mood = "yes";
    message = "IT'S FRIDAY. GO LIVE YOUR LIFE.";
  } else if (day === 6) {
    // Saturday — just missed it, furthest point in the week from Friday.
    mood = "far";
    message = "Nope. You literally just missed it. 6 more days.";
  } else if (daysUntil === 1) {
    mood = "close";
    message = "Not yet, but TOMORROW. Hang in there.";
  } else if (daysUntil === 2) {
    mood = "close";
    message = `Still no. But it's only ${daysUntil} days away — you can smell it.`;
  } else if (daysUntil <= 4) {
    mood = "mid";
    message = `No. ${daysUntil} days left. The week is far from over.`;
  } else {
    mood = "far";
    message = `Absolutely not. ${daysUntil} days to go. It's basically Monday forever.`;
  }

  return {
    isFriday,
    dayOfWeek: day,
    dayName: DAY_NAMES[day],
    daysUntil,
    mood,
    message,
  };
}

function formatToday(date) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function render(date) {
  const status = getFridayStatus(date);
  const answerEl = document.getElementById("answer");
  const messageEl = document.getElementById("message");
  const dateEl = document.getElementById("today-date");
  const cardEl = document.querySelector(".iifw-card");

  answerEl.textContent = status.isFriday ? "YES" : "NO";
  answerEl.classList.toggle("is-yes", status.isFriday);
  answerEl.classList.toggle("is-no", !status.isFriday);

  messageEl.textContent = status.message;
  dateEl.textContent = `Today is ${status.dayName}. ${formatToday(date)}.`;

  cardEl.classList.remove("mood-close", "mood-far");
  if (status.mood === "close") cardEl.classList.add("mood-close");
  if (status.mood === "far") cardEl.classList.add("mood-far");
}

// Only run DOM code in a real browser/document context, so this file can
// still be `require`d / syntax-checked from Node for the pure functions.
if (typeof document !== "undefined") {
  render(new Date());
  // Re-check at local midnight-ish cadence so a tab left open flips over.
  setInterval(() => render(new Date()), 60 * 1000);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { getFridayStatus, formatToday };
}
