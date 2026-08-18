// Balkan Recipe API — docs page "try it live" widget.
// This page's real product is /api/recipes.js; this file is just a small
// progressive-enhancement demo that calls the live endpoint from the
// browser. It will 404 when this folder is served by a plain static file
// server (e.g. `python3 -m http.server`) since there's no /api route
// without Vercel — that's expected, and the widget shows a clear error
// instead of failing silently.

/**
 * Build the query string for a request from raw name/tag input values.
 * Pure function, easy to sanity-check without the DOM.
 */
function buildQueryString(name, tag) {
  const params = new URLSearchParams();
  if (name && name.trim()) params.set("name", name.trim());
  if (tag && tag.trim()) params.set("tag", tag.trim());
  const qs = params.toString();
  return qs ? `/api/recipes?${qs}` : "/api/recipes";
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { buildQueryString };
}

(function initTryItWidget() {
  if (typeof document === "undefined") return;

  const nameInput = document.getElementById("try-name");
  const tagInput = document.getElementById("try-tag");
  const btn = document.getElementById("try-btn");
  const resultBox = document.getElementById("try-result");

  btn.addEventListener("click", async () => {
    const url = buildQueryString(nameInput.value, tagInput.value);
    resultBox.style.display = "block";
    resultBox.textContent = `GET ${url} …`;
    try {
      const res = await fetch(url);
      const text = await res.text();
      let pretty = text;
      try {
        pretty = JSON.stringify(JSON.parse(text), null, 2);
      } catch (e) {
        /* not JSON — show raw text (e.g. a 404 HTML page from a static server) */
      }
      resultBox.textContent = `GET ${url} -> ${res.status}\n\n${pretty}`;
    } catch (err) {
      resultBox.textContent =
        `GET ${url} failed: ${err.message}\n\n` +
        "This is expected if you're viewing this via a plain static file server " +
        "(no /api route). Deploy to Vercel to see this work live.";
    }
  });
})();
