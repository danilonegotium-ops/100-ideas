// Plant Care Guide
//
// Weather comes from Open-Meteo (https://open-meteo.com) — free, no API key,
// no account. Two calls: their geocoding endpoint turns a city name into
// lat/lon, then the forecast endpoint's `current=` parameter returns live
// temperature + relative humidity for that point. Both were verified by hand
// with curl before writing this (see SPEC.md for the exact request/response
// shape observed).
//
// All the scheduling math (interval adjustment, next-watering date, status
// label) is written as plain functions over plain strings/numbers — no
// fetch, no DOM — so it can be sanity-checked from Node. Network calls and
// DOM wiring live in the `if (typeof document !== "undefined")` block.

const LS_PLANTS_KEY = "plant-care-guide:tracked";
const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

/** Pure: clamp a number into [min, max]. */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/** Pure: local YYYY-MM-DD key for a Date. Dates are compared/stored as these keys, not timestamps, to sidestep time-of-day/timezone drift. */
function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Pure: parse a "YYYY-MM-DD" key back into a local-midnight Date. */
function parseDateKey(key) {
  const [y, m, d] = String(key).split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Pure: add (possibly negative) whole days to a date key. */
function addDays(dateKey, days) {
  const d = parseDateKey(dateKey);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

/** Pure: whole days from `fromKey` to `toKey` (positive if `toKey` is later). */
function daysBetween(fromKey, toKey) {
  const a = parseDateKey(fromKey).getTime();
  const b = parseDateKey(toKey).getTime();
  return Math.round((b - a) / 86400000);
}

/**
 * Pure: adjust a plant's base watering interval using real local humidity
 * (primary factor) and temperature (secondary nudge). Low humidity dries
 * soil faster -> water more often (shorter interval); high humidity keeps
 * soil damp longer -> water less often (longer interval). High heat adds a
 * small extra reduction on top since evaporation speeds up either way.
 */
function adjustWateringInterval(baseDays, humidityPercent, temperatureC) {
  let factor = 1;
  if (Number.isFinite(humidityPercent)) {
    if (humidityPercent < 30) factor -= 0.2;
    else if (humidityPercent > 65) factor += 0.15;
  }
  if (Number.isFinite(temperatureC) && temperatureC > 30) factor -= 0.1;
  factor = clamp(factor, 0.6, 1.3);
  return Math.max(1, Math.round(baseDays * factor));
}

/** Pure: human status for how many days until/past the next watering. */
function computeWateringStatus(daysUntil) {
  if (daysUntil < 0) {
    const n = Math.abs(daysUntil);
    return { label: `Overdue by ${n} day${n === 1 ? "" : "s"}`, className: "overdue" };
  }
  if (daysUntil === 0) return { label: "Water today", className: "due-today" };
  return { label: `Water in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`, className: "due-later" };
}

/** Pure: build a tracked-plant record from a catalogue entry + geocode + weather results. */
function createTrackedPlant(id, plant, cityResult, weather, todayDateKey) {
  const adjustedWateringDays = adjustWateringInterval(
    plant.baseWateringDays,
    weather.humidityPercent,
    weather.temperatureC
  );
  return {
    id,
    plantId: plant.id,
    plantName: plant.name,
    baseWateringDays: plant.baseWateringDays,
    city: cityResult.name,
    country: cityResult.country,
    latitude: cityResult.latitude,
    longitude: cityResult.longitude,
    humidityPercent: weather.humidityPercent,
    temperatureC: weather.temperatureC,
    adjustedWateringDays,
    lastWatered: todayDateKey,
    addedAt: new Date().toISOString(),
  };
}

/** Pure: return a new record with `lastWatered` reset to `todayDateKey`. */
function markWatered(record, todayDateKey) {
  return { ...record, lastWatered: todayDateKey };
}

/** Pure: minimal HTML-escaping for text interpolated into template strings. */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

/* ---------------- Network calls (impure) ---------------- */

/** Geocode a free-text city name. Returns null if no match, throws on network/HTTP failure. */
async function geocodeCity(city) {
  const url = `${GEOCODE_URL}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding request failed (${res.status})`);
  const data = await res.json();
  if (!data.results || !data.results.length) return null;
  const r = data.results[0];
  return { name: r.name, country: r.country || "", latitude: r.latitude, longitude: r.longitude };
}

/** Fetch current temperature + relative humidity for a lat/lon. Throws on network/HTTP/shape failure. */
async function fetchCurrentWeather(latitude, longitude) {
  const url = `${FORECAST_URL}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather request failed (${res.status})`);
  const data = await res.json();
  if (!data.current || typeof data.current.relative_humidity_2m !== "number") {
    throw new Error("Unexpected weather response shape");
  }
  return {
    temperatureC: data.current.temperature_2m,
    humidityPercent: data.current.relative_humidity_2m,
  };
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
        // the app still works for the current session, it just won't persist.
      }
    }
    function makeId() {
      return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }
    function formatDateKeyForDisplay(dateKey) {
      return parseDateKey(dateKey).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }

    let trackedPlants = loadJSON(LS_PLANTS_KEY, []);

    const plantSelect = document.getElementById("plant-select");
    const cityInput = document.getElementById("city-input");
    const addPlantBtn = document.getElementById("add-plant-btn");
    const addStatusEl = document.getElementById("add-status");
    const plantListEl = document.getElementById("plant-list");

    plantSelect.innerHTML = PLANTS.map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join("");

    function persist() { saveJSON(LS_PLANTS_KEY, trackedPlants); }

    function render() {
      if (!trackedPlants.length) {
        plantListEl.innerHTML = `<p class="pcg-empty">No plants yet — add one above to get a real, weather-adjusted watering schedule.</p>`;
        return;
      }
      const todayKey = toDateKey(new Date());
      plantListEl.innerHTML = trackedPlants.map((record) => {
        const catalogue = PLANTS.find((p) => p.id === record.plantId);
        const nextWateringKey = addDays(record.lastWatered, record.adjustedWateringDays);
        const daysUntil = daysBetween(todayKey, nextWateringKey);
        const status = computeWateringStatus(daysUntil);
        const location = record.country ? `${record.city}, ${record.country}` : record.city;
        return `
          <div class="pcg-plant-card" data-id="${escapeHtml(record.id)}">
            <h3>${escapeHtml(record.plantName)}</h3>
            <div class="pcg-meta">${escapeHtml(location)} &middot; ${catalogue ? escapeHtml(catalogue.light) : "Light needs unknown"}</div>
            <div class="pcg-meta mono">Humidity ${Math.round(record.humidityPercent)}% &middot; ${Math.round(record.temperatureC)}&deg;C</div>
            <div class="pcg-meta">Base interval ${record.baseWateringDays}d &rarr; adjusted to ${record.adjustedWateringDays}d for local conditions</div>
            <div class="pcg-status ${status.className}">${escapeHtml(status.label)}</div>
            <div class="pcg-meta">Last watered ${escapeHtml(formatDateKeyForDisplay(record.lastWatered))}</div>
            <div class="row">
              <button type="button" data-water="${escapeHtml(record.id)}">Mark as watered today</button>
              <button type="button" class="pcg-remove-btn" data-remove="${escapeHtml(record.id)}">Remove</button>
            </div>
          </div>
        `;
      }).join("");
    }

    plantListEl.addEventListener("click", (event) => {
      const waterBtn = event.target.closest("button[data-water]");
      if (waterBtn) {
        const id = waterBtn.dataset.water;
        trackedPlants = trackedPlants.map((r) => (r.id === id ? markWatered(r, toDateKey(new Date())) : r));
        persist();
        render();
        return;
      }
      const removeBtn = event.target.closest("button[data-remove]");
      if (removeBtn) {
        const id = removeBtn.dataset.remove;
        trackedPlants = trackedPlants.filter((r) => r.id !== id);
        persist();
        render();
      }
    });

    async function addPlant() {
      const plant = PLANTS.find((p) => p.id === plantSelect.value);
      const city = cityInput.value.trim();
      if (!plant || !city) {
        addStatusEl.textContent = "Pick a plant and enter a city first.";
        return;
      }
      addPlantBtn.disabled = true;
      addStatusEl.textContent = "Looking up your city…";
      try {
        const cityResult = await geocodeCity(city);
        if (!cityResult) {
          addStatusEl.textContent = `Couldn't find "${city}" — check the spelling and try again.`;
          return;
        }
        addStatusEl.textContent = `Found ${cityResult.name}${cityResult.country ? ", " + cityResult.country : ""} — checking current weather…`;
        const weather = await fetchCurrentWeather(cityResult.latitude, cityResult.longitude);
        const record = createTrackedPlant(makeId(), plant, cityResult, weather, toDateKey(new Date()));
        trackedPlants.push(record);
        persist();
        render();
        addStatusEl.textContent = `Added ${plant.name} for ${cityResult.name}.`;
        cityInput.value = "";
      } catch (err) {
        addStatusEl.textContent = "Couldn't reach the weather service — check your connection and try again.";
      } finally {
        addPlantBtn.disabled = false;
      }
    }

    addPlantBtn.addEventListener("click", addPlant);
    cityInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addPlant();
    });

    render();
  })();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    clamp,
    toDateKey,
    parseDateKey,
    addDays,
    daysBetween,
    adjustWateringInterval,
    computeWateringStatus,
    createTrackedPlant,
    markWatered,
    escapeHtml,
    geocodeCity,
    fetchCurrentWeather,
  };
}
