// History Through Maps
//
// Renders a simplified, illustrative SCHEMATIC (not real cartography) of
// which power held each of 10 fixed regions across 6 curated eras. See the
// long comment at the top of data.js for why this is hand-built rather than
// sourced from a real boundary dataset (licensing), and SPEC.md for the
// full writeup.
//
// The grid-layout math and text-wrapping logic are pure functions (no DOM,
// no SVG APIs) so they can be sanity-checked from Node. The actual SVG
// markup is built as a template string and assigned via `.innerHTML` on the
// <svg> element (supported in all modern browsers, same pattern already
// used by the logo-maker idea in this project) — DOM wiring for that lives
// in the `if (typeof document !== "undefined")` block.

const GRID_COLS = 4;
const GRID_ROWS = 3;
const CELL_W = 220;
const CELL_H = 170;
const GAP = 20;
const MARGIN_X = 40;
const MARGIN_Y = 40;

const VIEWBOX_WIDTH = MARGIN_X * 2 + GRID_COLS * CELL_W + (GRID_COLS - 1) * GAP;
const VIEWBOX_HEIGHT = MARGIN_Y * 2 + GRID_ROWS * CELL_H + (GRID_ROWS - 1) * GAP;

/** Pure: fixed schematic rect (x, y, width, height) for a region's grid cell. */
function computeRegionRect(region) {
  return {
    x: MARGIN_X + region.col * (CELL_W + GAP),
    y: MARGIN_Y + region.row * (CELL_H + GAP),
    width: CELL_W,
    height: CELL_H,
  };
}

/** Pure: clamp an era index into the valid range for a given eras array. */
function clampEraIndex(index, erasLength) {
  const i = Math.round(Number(index));
  if (!Number.isFinite(i)) return 0;
  return Math.min(erasLength - 1, Math.max(0, i));
}

/** Pure: merge each region with its ruler name for a given era. */
function buildRegionDisplay(regions, era) {
  return regions.map((region) => ({
    ...region,
    ruler: (era.rulers && era.rulers[region.id]) || "Unknown",
  }));
}

/**
 * Pure: greedy word-wrap a string into at most `maxLines` lines of at most
 * ~`maxCharsPerLine` characters each. Character-count based (not
 * pixel-measured) — good enough for a schematic label, not typeset text.
 * If content doesn't fit in maxLines, the last line gets an ellipsis.
 */
function wrapTextToLines(text, maxCharsPerLine, maxLines) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines = [];
  let current = "";
  let consumedWords = 0;
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      consumedWords += current.split(/\s+/).length;
      current = word;
      if (lines.length === maxLines) break;
    } else {
      current = candidate;
    }
  }
  if (lines.length < maxLines && current) {
    lines.push(current);
    consumedWords += current.split(/\s+/).length;
  }
  if (lines.length === maxLines && consumedWords < words.length) {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/[.,;]+$/, "") + "…";
  }
  return lines;
}

/** Pure: minimal XML/HTML-escaping for text interpolated into SVG/HTML template strings. */
function escapeXml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

/** Pure: build the <g> markup for one region cell (rect + slot label + wrapped ruler name). */
function buildRegionMarkup(region, rulerName) {
  const rect = computeRegionRect(region);
  const cx = rect.x + rect.width / 2;
  const lines = wrapTextToLines(rulerName, 22, 4);
  const rulerStartY = rect.y + 52;
  const tspans = lines
    .map((line, i) => `<tspan x="${cx}" dy="${i === 0 ? 0 : 16}">${escapeXml(line)}</tspan>`)
    .join("");
  return `<g>
    <rect class="htm-region-rect" x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" rx="10" fill="${region.color}" />
    <text class="htm-region-slot" x="${cx}" y="${rect.y + 24}" text-anchor="middle">${escapeXml(region.label)}</text>
    <text class="htm-region-ruler" x="${cx}" y="${rulerStartY}" text-anchor="middle">${tspans}</text>
  </g>`;
}

/** Pure: build the full inner SVG markup (all region groups) for one era. */
function buildMapSVGMarkup(regions, era) {
  return buildRegionDisplay(regions, era).map((r) => buildRegionMarkup(r, r.ruler)).join("");
}

/* ---------------- DOM wiring ---------------- */

if (typeof document !== "undefined") {
  (function () {
    const slider = document.getElementById("era-slider");
    const ticksEl = document.getElementById("era-ticks");
    const titleEl = document.getElementById("era-title");
    const blurbEl = document.getElementById("era-blurb");
    const mapEl = document.getElementById("era-map");
    const legendEl = document.getElementById("era-legend");
    const playBtn = document.getElementById("play-btn");

    slider.max = String(ERAS.length - 1);

    ticksEl.innerHTML = ERAS.map((era, i) => `<span data-index="${i}">${escapeXml(era.yearLabel)}</span>`).join("");

    let playIntervalId = null;

    function render(rawIndex) {
      const index = clampEraIndex(rawIndex, ERAS.length);
      const era = ERAS[index];
      slider.value = String(index);
      titleEl.textContent = `Europe around ${era.yearLabel} — ${era.title}`;
      blurbEl.textContent = era.blurb;
      mapEl.innerHTML = buildMapSVGMarkup(REGIONS, era);
      legendEl.innerHTML = buildRegionDisplay(REGIONS, era)
        .map((r) => `<div><dt>${escapeXml(r.label)}</dt><dd>${escapeXml(r.ruler)}</dd></div>`)
        .join("");
      Array.from(ticksEl.querySelectorAll("span")).forEach((span, i) => {
        span.classList.toggle("is-active", i === index);
      });
    }

    slider.addEventListener("input", () => render(slider.value));
    ticksEl.addEventListener("click", (e) => {
      const span = e.target.closest("span[data-index]");
      if (!span) return;
      render(Number(span.dataset.index));
    });

    function stopPlaying() {
      if (playIntervalId) {
        clearInterval(playIntervalId);
        playIntervalId = null;
      }
      playBtn.textContent = "Play through eras";
    }

    function startPlaying() {
      playBtn.textContent = "Pause";
      playIntervalId = setInterval(() => {
        const next = (clampEraIndex(slider.value, ERAS.length) + 1) % ERAS.length;
        render(next);
        if (next === ERAS.length - 1) {
          // Let the last era sit on screen for one interval, then stop.
          setTimeout(stopPlaying, 2200);
        }
      }, 2200);
    }

    playBtn.addEventListener("click", () => {
      if (playIntervalId) stopPlaying();
      else startPlaying();
    });

    render(0);
  })();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    GRID_COLS,
    GRID_ROWS,
    CELL_W,
    CELL_H,
    GAP,
    MARGIN_X,
    MARGIN_Y,
    VIEWBOX_WIDTH,
    VIEWBOX_HEIGHT,
    computeRegionRect,
    clampEraIndex,
    buildRegionDisplay,
    wrapTextToLines,
    escapeXml,
    buildRegionMarkup,
    buildMapSVGMarkup,
  };
}
