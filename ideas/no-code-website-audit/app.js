// No-Code Website Audit — client-side glue. All the actual checking happens
// server-side in api/audit.js (avoids CORS issues fetching arbitrary sites
// from the browser). This file just wires the form to that endpoint and
// renders the returned checklist.

const STATUS_ICON = { pass: "✓", warn: "!", fail: "✕" };

function renderChecks(data) {
  const resultsEl = document.getElementById("results");
  const urlEl = document.getElementById("result-url");
  const scoreEl = document.getElementById("score-num");
  const listEl = document.getElementById("check-list");
  const pagespeedEl = document.getElementById("pagespeed-note");

  urlEl.textContent = data.url;
  scoreEl.textContent = data.score;

  listEl.innerHTML = "";
  data.checks.forEach((check) => {
    const item = document.createElement("div");
    item.className = `check ${check.status}`;
    item.innerHTML = `
      <span class="icon">${STATUS_ICON[check.status] || "?"}</span>
      <div class="body">
        <div class="label">${escapeHtml(check.label)}</div>
        <div class="message">${escapeHtml(check.message)}</div>
      </div>
    `;
    listEl.appendChild(item);
  });

  if (data.pagespeed && data.pagespeed.available) {
    pagespeedEl.textContent = `Bonus (Google PageSpeed Insights): ${data.pagespeed.message}`;
    pagespeedEl.style.display = "block";
  } else if (data.pagespeed) {
    pagespeedEl.textContent = "Bonus performance check (Google PageSpeed Insights) is not configured for this deployment — the score above is based on the 8 core checks only.";
    pagespeedEl.style.display = "block";
  } else {
    pagespeedEl.style.display = "none";
  }

  resultsEl.style.display = "block";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

async function runAudit(url) {
  const loadingEl = document.getElementById("loading");
  const errorEl = document.getElementById("error-box");
  const submitBtn = document.getElementById("submit-btn");
  const resultsEl = document.getElementById("results");

  errorEl.style.display = "none";
  resultsEl.style.display = "none";
  loadingEl.style.display = "block";
  submitBtn.disabled = true;

  try {
    const res = await fetch(`/api/audit?url=${encodeURIComponent(url)}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Request failed (${res.status})`);
    }
    renderChecks(data);
  } catch (err) {
    errorEl.textContent = err.message || "Something went wrong running the audit.";
    errorEl.style.display = "block";
  } finally {
    loadingEl.style.display = "none";
    submitBtn.disabled = false;
  }
}

function initForm() {
  const form = document.getElementById("audit-form");
  const input = document.getElementById("url-input");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const url = input.value.trim();
    if (url) runAudit(url);
  });
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", initForm);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { escapeHtml };
}
