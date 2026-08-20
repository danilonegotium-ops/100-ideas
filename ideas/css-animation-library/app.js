// CSS Animation Library — app logic.
// Depends on ANIMATIONS from data.js (loaded first via <script src="data.js">).

/**
 * Pure filter helper — kept standalone so it can be sanity-checked with a
 * plain node script without touching the DOM.
 * @param {{id:string,name:string}[]} list
 * @param {string} query
 * @returns {{id:string,name:string}[]}
 */
function filterAnimations(list, query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return list.slice();
  return list.filter((a) => a.name.toLowerCase().includes(q) || a.id.includes(q));
}

// Export for the node sanity-check script; harmless in the browser.
if (typeof module !== "undefined" && module.exports) {
  module.exports = { filterAnimations };
}

(function initCssAnimationLibrary() {
  // Guard: this IIFE only runs in a browser context (has `document`).
  if (typeof document === "undefined") return;

  const grid = document.getElementById("grid");
  const search = document.getElementById("search");
  const count = document.getElementById("count");

  // 1. Inject every animation's CSS (class + @keyframes) into one live
  //    stylesheet so the demo boxes actually animate on the page. This is
  //    the exact same text the user copies, so demo and clipboard never drift.
  const styleTag = document.createElement("style");
  styleTag.id = "lib-styles";
  styleTag.textContent = ANIMATIONS.map((a) => a.css).join("\n\n");
  document.head.appendChild(styleTag);

  // 2. Render the grid.
  function render(list) {
    grid.innerHTML = "";
    list.forEach((a, index) => {
      const card = document.createElement("div");
      card.className = "anim-card";
      // Tier 2: a subtle 3D tilt on the first few visible cards only
      // (surgical per design system guidance, not on every card in the grid).
      if (index < 3) card.setAttribute("data-tilt", "");

      const stage = document.createElement("div");
      stage.className = "anim-demo-stage";
      const box = document.createElement("div");
      box.className = "anim-demo-box " + a.demoClass;
      stage.appendChild(box);

      const body = document.createElement("div");
      body.className = "anim-card-body";
      const title = document.createElement("h3");
      title.textContent = a.name;
      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "copy-btn";
      copyBtn.textContent = "Copy CSS";
      copyBtn.addEventListener("click", () => copyToClipboard(a.css, copyBtn));

      body.appendChild(title);
      body.appendChild(copyBtn);
      card.appendChild(stage);
      card.appendChild(body);
      grid.appendChild(card);
    });
    count.textContent = list.length + " / " + ANIMATIONS.length;
    // The grid is rebuilt on every search too, so re-run Tier 2's tilt
    // wiring for the freshly-created [data-tilt] cards each time
    // (autoInit only scans once on initial load).
    if (typeof window !== "undefined" && window.Tier2 && typeof window.Tier2.initTilt === "function") {
      window.Tier2.initTilt(grid);
    }
  }

  function copyToClipboard(text, btn) {
    const done = () => {
      const original = btn.textContent;
      btn.textContent = "Copied!";
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = original;
        btn.disabled = false;
      }, 1400);
    };
    const fail = () => {
      const original = btn.textContent;
      btn.textContent = "Copy failed";
      setTimeout(() => (btn.textContent = original), 1400);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, () => legacyCopy(text) ? done() : fail());
    } else {
      legacyCopy(text) ? done() : fail();
    }
  }

  function legacyCopy(text) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      return false;
    }
  }

  // 3. Search/filter.
  search.addEventListener("input", () => {
    render(filterAnimations(ANIMATIONS, search.value));
  });

  // 4. Restart every demo animation periodically so visitors see the effect
  //    on a loop without needing to hover/click, even for one-shot entrance
  //    animations (fade-in, slide-in, zoom-in, etc.).
  function restartDemos() {
    const boxes = grid.querySelectorAll(".anim-demo-box");
    boxes.forEach((box) => {
      box.style.animation = "none";
      // Force reflow so the browser "notices" the animation was removed.
      void box.offsetWidth;
      box.style.animation = "";
    });
  }
  setInterval(restartDemos, 2600);

  render(ANIMATIONS);
})();
