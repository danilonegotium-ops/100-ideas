// Website Carbon Footprint — client-side glue. All the fetching and CO2
// math happen server-side in api/carbon.js (avoids CORS, keeps the actual
// SWD model calculation in one place). This file wires the form to that
// endpoint and renders the result.

function renderResult(data) {
  document.getElementById("result-url").textContent = data.url;
  document.getElementById("co2-value").textContent = data.co2.gramsPerVisit;
  document.getElementById("rating-value").textContent = data.co2.rating;
  document.getElementById("weight-value").textContent = `${data.pageWeight.kb} KB`;
  document.getElementById("source-value").textContent = data.pageWeight.source;
  document.getElementById("comparison-box").textContent = `That's ${data.co2.comparison}. (${data.co2.comparisonSource})`;
  document.getElementById("weight-note").textContent = ` ${data.pageWeight.note}`;
  document.getElementById("results").style.display = "block";
}

async function runEstimate(url) {
  const loadingEl = document.getElementById("loading");
  const errorEl = document.getElementById("error-box");
  const submitBtn = document.getElementById("submit-btn");
  const resultsEl = document.getElementById("results");

  errorEl.style.display = "none";
  resultsEl.style.display = "none";
  loadingEl.style.display = "block";
  submitBtn.disabled = true;

  try {
    const res = await fetch(`/api/carbon?url=${encodeURIComponent(url)}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Request failed (${res.status})`);
    }
    renderResult(data);
  } catch (err) {
    errorEl.textContent = err.message || "Something went wrong estimating the footprint.";
    errorEl.style.display = "block";
  } finally {
    loadingEl.style.display = "none";
    submitBtn.disabled = false;
  }
}

function initForm() {
  const form = document.getElementById("carbon-form");
  const input = document.getElementById("url-input");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const url = input.value.trim();
    if (url) runEstimate(url);
  });
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", initForm);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {};
}
