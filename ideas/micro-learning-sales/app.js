/* Micro-Learning for Sales — one bite-sized sales tip per day, an archive of
   all tips, and a localStorage-backed "mark as read" streak tracker.
   Pure logic (date-seeded tip selection, streak math) is kept dependency-free
   so it can be sanity-checked from Node without a browser. */

/* ---------- pure logic ---------- */

function pad2(n) {
  return String(n).padStart(2, "0");
}

/** Format a Date as a local YYYY-MM-DD string (no UTC shift). */
function formatDateISO(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** 1-indexed day of the year in the date's local timezone. */
function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const diffMs = date.setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0);
  return Math.floor(diffMs / 86400000) + 1;
}

/** Deterministic "today's tip" — same day always maps to the same tip. */
function getTipForDate(tips, date) {
  if (!tips || tips.length === 0) return null;
  const doy = dayOfYear(new Date(date.getTime()));
  const idx = doy % tips.length;
  return tips[idx];
}

/**
 * Current streak of consecutive days marked read, ending today (or, if today
 * isn't marked yet, ending yesterday so the streak-in-progress still shows).
 * readDates: array of "YYYY-MM-DD" strings.
 */
function computeStreak(readDates, todayISO) {
  const set = new Set(readDates || []);
  const [y, m, d] = todayISO.split("-").map(Number);
  const cursor = new Date(y, m - 1, d);
  if (!set.has(todayISO)) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (set.has(formatDateISO(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/* ---------- storage helpers ---------- */

const STORAGE_KEY = "micro_learning_sales_v1";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { readDates: [], readTipIds: [] };
    const parsed = JSON.parse(raw);
    return {
      readDates: Array.isArray(parsed.readDates) ? parsed.readDates : [],
      readTipIds: Array.isArray(parsed.readTipIds) ? parsed.readTipIds : [],
    };
  } catch (e) {
    return { readDates: [], readTipIds: [] };
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ---------- DOM wiring (skipped when running under Node) ---------- */

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    const card = document.querySelector(".card");
    const tips = typeof SALES_TIPS !== "undefined" ? SALES_TIPS : [];
    let state = loadState();
    let view = "today"; // "today" | "archive"

    function todayISO() {
      return formatDateISO(new Date());
    }

    function render() {
      const today = new Date();
      const tip = getTipForDate(tips, today);
      const streak = computeStreak(state.readDates, todayISO());
      const isReadToday = state.readDates.includes(todayISO());

      card.innerHTML = "";

      const nav = document.createElement("div");
      nav.className = "row";
      nav.style.marginBottom = "1rem";
      const todayBtn = document.createElement("button");
      todayBtn.textContent = "Today's tip";
      todayBtn.className = view === "today" ? "" : "btn-secondary";
      todayBtn.style.opacity = view === "today" ? "1" : "0.6";
      todayBtn.addEventListener("click", () => { view = "today"; render(); });
      const archiveBtn = document.createElement("button");
      archiveBtn.textContent = "Browse all tips";
      archiveBtn.style.opacity = view === "archive" ? "1" : "0.6";
      archiveBtn.addEventListener("click", () => { view = "archive"; render(); });
      nav.append(todayBtn, archiveBtn);
      card.appendChild(nav);

      const streakLine = document.createElement("p");
      streakLine.className = "muted";
      streakLine.textContent = streak > 0
        ? `\u{1F525} ${streak} day${streak === 1 ? "" : "s"} streak`
        : "No streak yet — mark today's tip as read to start one.";
      card.appendChild(streakLine);

      if (view === "today") {
        if (!tip) {
          const empty = document.createElement("p");
          empty.textContent = "No tips available.";
          card.appendChild(empty);
          return;
        }
        const box = document.createElement("div");
        box.className = "stack";

        const cat = document.createElement("span");
        cat.className = "mono muted";
        cat.textContent = tip.category.toUpperCase();
        box.appendChild(cat);

        const h2 = document.createElement("h2");
        h2.style.margin = "0.2rem 0 0.4rem";
        h2.textContent = tip.title;
        box.appendChild(h2);

        const body = document.createElement("p");
        body.textContent = tip.body;
        box.appendChild(body);

        const markBtn = document.createElement("button");
        markBtn.textContent = isReadToday ? "✓ Read today" : "Mark as read";
        markBtn.disabled = isReadToday;
        markBtn.addEventListener("click", () => {
          const iso = todayISO();
          if (!state.readDates.includes(iso)) state.readDates.push(iso);
          if (!state.readTipIds.includes(tip.id)) state.readTipIds.push(tip.id);
          saveState(state);
          render();
        });
        box.appendChild(markBtn);
        card.appendChild(box);
      } else {
        const list = document.createElement("div");
        list.className = "stack";
        tips.forEach((t) => {
          const row = document.createElement("div");
          row.style.borderBottom = "1px solid var(--border)";
          row.style.paddingBottom = "0.7rem";
          const read = state.readTipIds.includes(t.id);
          row.innerHTML = `
            <div class="row" style="justify-content: space-between; align-items: baseline;">
              <strong>${read ? "✓ " : ""}${t.title}</strong>
              <span class="muted mono" style="font-size:0.75rem;">${t.category}</span>
            </div>
            <p class="muted" style="margin: 0.3rem 0 0;">${t.body}</p>
          `;
          list.appendChild(row);
        });
        card.appendChild(list);
      }
    }

    render();
  });
}

/* ---------- exports for Node-based sanity checks ---------- */

if (typeof module !== "undefined" && module.exports) {
  module.exports = { formatDateISO, dayOfYear, getTipForDate, computeStreak };
}
