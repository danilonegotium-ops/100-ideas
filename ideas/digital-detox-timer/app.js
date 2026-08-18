// Digital Detox Timer
//
// This is a web app, not a browser extension (see MASTER_TRACKER.md scope
// note — extension store publishing needs a $5 one-time fee, out of scope
// this sprint). It can't actually block other tabs/sites; the "blocklist"
// is an honor-system reminder shown during a focus session. What it does
// for real: a full-viewport focus-mode countdown, a tab-title countdown,
// and session history/stats persisted in localStorage.
//
// All the date/time math below is written as plain functions of plain
// values (ISO strings, Date objects, arrays of plain session records) so it
// can be sanity-checked from Node without a DOM. DOM wiring is isolated to
// the `if (typeof document !== "undefined")` block at the bottom.

const LS_BLOCKLIST_KEY = "digital-detox-timer:blocklist";
const LS_SESSIONS_KEY = "digital-detox-timer:sessions";

/** Pure: clamp a number into [min, max]. */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/** Pure: format whole seconds as MM:SS. */
function formatClock(totalSeconds) {
  const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Pure: format a minute count as "1h 5m" / "45m" / "0m". */
function formatDurationMinutes(totalMinutes) {
  const safe = Math.max(0, Math.round(Number(totalMinutes) || 0));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Pure: local YYYY-MM-DD key for a Date, used to compare "same day". */
function toDayKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Pure: local midnight of the Monday that starts the week containing `date`. */
function getWeekStart(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0=Sunday..6=Saturday
  const diffToMonday = (day + 6) % 7; // Monday=0, Sunday=6
  d.setDate(d.getDate() - diffToMonday);
  return d;
}

/** Pure: minutes elapsed between two ISO timestamps, rounded, never negative. */
function computeActualMinutes(startedAtISO, endedAtISO) {
  const ms = new Date(endedAtISO).getTime() - new Date(startedAtISO).getTime();
  return Math.max(0, Math.round(ms / 60000));
}

/** Pure: build a fresh in-progress session record. */
function createSession(id, startedAtISO, plannedMinutes) {
  return {
    id,
    startedAt: startedAtISO,
    plannedMinutes: Math.max(1, Math.round(Number(plannedMinutes) || 1)),
    endedAt: null,
    actualMinutes: null,
    completed: null,
  };
}

/** Pure: return a new, finished copy of a session (never mutates the input). */
function finishSession(session, endedAtISO, completed) {
  return {
    ...session,
    endedAt: endedAtISO,
    completed: !!completed,
    actualMinutes: computeActualMinutes(session.startedAt, endedAtISO),
  };
}

/** Pure: total focus minutes (completed or abandoned — any time actually spent) since `sinceDate`. */
function sumFocusMinutesSince(sessions, sinceDate) {
  const sinceMs = sinceDate.getTime();
  return sessions.reduce((total, s) => {
    if (!s.endedAt) return total;
    if (new Date(s.startedAt).getTime() < sinceMs) return total;
    return total + (s.actualMinutes || 0);
  }, 0);
}

/**
 * Pure: current streak in whole days, counting consecutive days (walking
 * backward from today) that have at least one COMPLETED session. Today not
 * having a completed session yet does not break the streak — it just means
 * we start counting from yesterday, same as most habit trackers.
 */
function computeStreak(sessions, now) {
  const completedDays = new Set(
    sessions.filter((s) => s.completed && s.endedAt).map((s) => toDayKey(new Date(s.startedAt)))
  );
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!completedDays.has(toDayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (completedDays.has(toDayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Pure: trim/validate a new blocklist entry; returns null if empty or a case-insensitive duplicate. */
function validateSiteLabel(raw, existingList) {
  const trimmed = String(raw || "").trim().slice(0, 60);
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if ((existingList || []).some((s) => s.toLowerCase() === lower)) return null;
  return trimmed;
}

/** Pure: given "now" and a minute count, the timestamp the timer ends at (or null if invalid). */
function computeTimerEndTimestamp(nowMs, minutes) {
  const m = Number(minutes);
  if (!Number.isFinite(m) || m <= 0) return null;
  return nowMs + m * 60 * 1000;
}

/** Pure: seconds remaining until endMs, clamped at 0. */
function computeRemainingSeconds(nowMs, endMs) {
  if (endMs === null || endMs === undefined) return 0;
  return Math.max(0, Math.ceil((endMs - nowMs) / 1000));
}

/** Pure: minimal HTML-escaping for text interpolated into template strings. */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

/* ---------------- DOM wiring ---------------- */

if (typeof document !== "undefined") {
  (function () {
    function loadJSON(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (err) {
        return fallback;
      }
    }
    function saveJSON(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (err) {
        // localStorage can throw in private-browsing/blocked-storage contexts;
        // the session still runs for the current tab, it just won't persist.
      }
    }
    function makeId() {
      return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }

    const ORIGINAL_TITLE = document.title;

    let blocklist = loadJSON(LS_BLOCKLIST_KEY, []);
    let sessions = loadJSON(LS_SESSIONS_KEY, []);
    let currentSession = null; // in-progress session record (not yet in `sessions`)
    let timerEndMs = null;
    let tickIntervalId = null;

    const siteInput = document.getElementById("site-input");
    const addSiteBtn = document.getElementById("add-site-btn");
    const siteListEl = document.getElementById("site-list");
    const sessionLengthInput = document.getElementById("session-length");
    const startSessionBtn = document.getElementById("start-session-btn");
    const lastOutcomeEl = document.getElementById("last-outcome");
    const weekTotalEl = document.getElementById("week-total");
    const streakCountEl = document.getElementById("streak-count");
    const historyListEl = document.getElementById("history-list");
    const clearHistoryBtn = document.getElementById("clear-history-btn");
    const focusOverlay = document.getElementById("focus-overlay");
    const focusClockEl = document.getElementById("focus-clock");
    const focusSubtitleEl = document.getElementById("focus-subtitle");
    const focusBlocklistEl = document.getElementById("focus-blocklist");
    const endEarlyBtn = document.getElementById("end-early-btn");

    function renderSiteList() {
      siteListEl.innerHTML = blocklist.length
        ? blocklist.map((site, i) => `
            <li>
              <span>${escapeHtml(site)}</span>
              <button type="button" data-remove="${i}" aria-label="Remove ${escapeHtml(site)}">&times;</button>
            </li>
          `).join("")
        : `<li class="ddt-empty">No sites added yet — add a few above.</li>`;
    }

    function renderHistory() {
      const recent = [...sessions].sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt)).slice(0, 15);
      historyListEl.innerHTML = recent.length
        ? recent.map((s) => {
            const started = new Date(s.startedAt);
            const dateLabel = started.toLocaleString(undefined, {
              month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
            });
            const badgeClass = s.completed ? "completed" : "abandoned";
            const badgeText = s.completed ? "Completed" : "Abandoned";
            return `
              <li>
                <span>${escapeHtml(dateLabel)} &middot; ${formatDurationMinutes(s.actualMinutes)} of ${formatDurationMinutes(s.plannedMinutes)} planned</span>
                <span class="ddt-badge ${badgeClass}">${badgeText}</span>
              </li>
            `;
          }).join("")
        : `<li class="ddt-empty">No sessions yet — finish one to see it here.</li>`;
    }

    function renderStats() {
      const now = new Date();
      weekTotalEl.textContent = formatDurationMinutes(sumFocusMinutesSince(sessions, getWeekStart(now)));
      const streak = computeStreak(sessions, now);
      streakCountEl.textContent = streak === 1 ? "1 day" : `${streak} days`;
    }

    function renderAll() {
      renderSiteList();
      renderHistory();
      renderStats();
    }

    function persistBlocklist() { saveJSON(LS_BLOCKLIST_KEY, blocklist); }
    function persistSessions() { saveJSON(LS_SESSIONS_KEY, sessions); }

    /* ---- Blocklist management ---- */

    function addSite() {
      const result = validateSiteLabel(siteInput.value, blocklist);
      if (!result) return;
      blocklist.push(result);
      persistBlocklist();
      siteInput.value = "";
      renderSiteList();
    }
    addSiteBtn.addEventListener("click", addSite);
    siteInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addSite();
    });
    siteListEl.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-remove]");
      if (!btn) return;
      const idx = Number(btn.dataset.remove);
      blocklist.splice(idx, 1);
      persistBlocklist();
      renderSiteList();
    });

    clearHistoryBtn.addEventListener("click", () => {
      if (!sessions.length) return;
      if (!confirm("Clear all session history? This can't be undone.")) return;
      sessions = [];
      persistSessions();
      renderHistory();
      renderStats();
    });

    /* ---- Focus session ---- */

    function beep() {
      try {
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtor();
        [660, 880].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = ctx.currentTime + i * 0.18;
          osc.type = "sine";
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
          gain.gain.linearRampToValueAtTime(0, start + 0.16);
          osc.connect(gain).connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.18);
        });
      } catch (err) {
        // Web Audio unavailable/blocked — silently skip the beep, the visual
        // state change is enough.
      }
    }

    function tick() {
      const remaining = computeRemainingSeconds(Date.now(), timerEndMs);
      focusClockEl.textContent = formatClock(remaining);
      document.title = `${formatClock(remaining)} · Focus`;
      if (remaining <= 0) endSession(true);
    }

    function startSession() {
      const minutes = clamp(parseInt(sessionLengthInput.value, 10) || 25, 1, 180);
      sessionLengthInput.value = minutes;
      const startedAtISO = new Date().toISOString();
      currentSession = createSession(makeId(), startedAtISO, minutes);
      timerEndMs = computeTimerEndTimestamp(Date.now(), minutes);

      focusSubtitleEl.textContent = `Focusing for ${formatDurationMinutes(minutes)}.`;
      focusBlocklistEl.innerHTML = blocklist.length
        ? blocklist.map((site) => `<span>${escapeHtml(site)}</span>`).join("")
        : `<span>Add sites above next time to see them here.</span>`;

      focusOverlay.classList.add("is-active");
      if (tickIntervalId) clearInterval(tickIntervalId);
      tickIntervalId = setInterval(tick, 500);
      tick();
    }

    function endSession(completed) {
      if (!currentSession) return;
      const finished = finishSession(currentSession, new Date().toISOString(), completed);
      sessions.push(finished);
      persistSessions();
      currentSession = null;
      timerEndMs = null;
      if (tickIntervalId) {
        clearInterval(tickIntervalId);
        tickIntervalId = null;
      }
      document.title = ORIGINAL_TITLE;
      focusOverlay.classList.remove("is-active");
      lastOutcomeEl.textContent = completed
        ? `Nice — you completed a ${formatDurationMinutes(finished.plannedMinutes)} session.`
        : `Session ended early after ${formatDurationMinutes(finished.actualMinutes)}.`;
      if (completed) beep();
      renderHistory();
      renderStats();
    }

    startSessionBtn.addEventListener("click", startSession);
    endEarlyBtn.addEventListener("click", () => endSession(false));

    // If the tab is closed/refreshed mid-session, log it as abandoned rather
    // than silently losing it. localStorage writes are synchronous, so this
    // is reliable inside beforeunload.
    window.addEventListener("beforeunload", () => {
      if (currentSession) endSession(false);
    });

    renderAll();
  })();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    clamp,
    formatClock,
    formatDurationMinutes,
    toDayKey,
    getWeekStart,
    computeActualMinutes,
    createSession,
    finishSession,
    sumFocusMinutesSince,
    computeStreak,
    validateSiteLabel,
    computeTimerEndTimestamp,
    computeRemainingSeconds,
    escapeHtml,
  };
}
