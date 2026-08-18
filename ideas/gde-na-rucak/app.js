// Gde Na Rucak — app logic.
// Depends on CITIES, BUDGET_TIERS, RESTAURANTS from data.js (loaded first).

/**
 * Pure filter helper: return every restaurant matching a city + budget tier.
 * Kept standalone (no DOM) so it can be sanity-checked with a plain node
 * script.
 * @param {Array} list
 * @param {string} city
 * @param {string} budget
 */
function filterRestaurants(list, city, budget) {
  return list.filter((r) => r.city === city && r.budget === budget);
}

/**
 * Pure "spin" helper: pick a random restaurant matching the filters.
 * Accepts an injectable `rng` (defaults to Math.random) so it's deterministic
 * in tests. If `excludeName` is given and there's more than one match, avoids
 * repeating the same restaurant back-to-back where possible.
 * @param {Array} list
 * @param {string} city
 * @param {string} budget
 * @param {() => number} rng
 * @param {string|null} excludeName
 * @returns {object|null}
 */
function pickRestaurant(list, city, budget, rng, excludeName) {
  rng = rng || Math.random;
  let matches = filterRestaurants(list, city, budget);
  if (matches.length === 0) return null;
  if (excludeName && matches.length > 1) {
    const filtered = matches.filter((r) => r.name !== excludeName);
    if (filtered.length > 0) matches = filtered;
  }
  const index = Math.floor(rng() * matches.length);
  return matches[Math.min(index, matches.length - 1)];
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { filterRestaurants, pickRestaurant };
}

(function initGdeNaRucak() {
  if (typeof document === "undefined") return;

  const citySelect = document.getElementById("city-select");
  const budgetSelect = document.getElementById("budget-select");
  const findBtn = document.getElementById("find-btn");
  const spinBtn = document.getElementById("spin-btn");
  const resultCard = document.getElementById("result-card");
  const resultEmpty = document.getElementById("result-empty");

  // Populate selects from data.js.
  CITIES.forEach((city) => {
    const opt = document.createElement("option");
    opt.value = city;
    opt.textContent = city;
    citySelect.appendChild(opt);
  });
  BUDGET_TIERS.forEach((tier) => {
    const opt = document.createElement("option");
    opt.value = tier;
    opt.textContent = tier;
    budgetSelect.appendChild(opt);
  });

  let lastPick = null;

  function renderResult(restaurant) {
    if (!restaurant) {
      resultCard.hidden = true;
      resultEmpty.hidden = false;
      const city = citySelect.value;
      const budget = budgetSelect.value;
      resultEmpty.textContent = `No matches yet for ${city} at ${budget}. Try another budget tier — the seed list doesn't cover every combination.`;
      spinBtn.disabled = true;
      return;
    }
    resultEmpty.hidden = true;
    resultCard.hidden = false;
    document.getElementById("r-name").textContent = restaurant.name;
    document.getElementById("r-cuisine").textContent = restaurant.cuisine;
    document.getElementById("r-neighborhood").textContent = restaurant.neighborhood;
    document.getElementById("r-budget").textContent = restaurant.budget;
    spinBtn.disabled = false;
  }

  function doPick() {
    const city = citySelect.value;
    const budget = budgetSelect.value;
    const pick = pickRestaurant(RESTAURANTS, city, budget, Math.random, lastPick ? lastPick.name : null);
    lastPick = pick;
    renderResult(pick);
  }

  findBtn.addEventListener("click", doPick);
  spinBtn.addEventListener("click", doPick);
  citySelect.addEventListener("change", () => {
    lastPick = null;
    resultCard.hidden = true;
    resultEmpty.hidden = true;
  });
  budgetSelect.addEventListener("change", () => {
    lastPick = null;
    resultCard.hidden = true;
    resultEmpty.hidden = true;
  });
})();
