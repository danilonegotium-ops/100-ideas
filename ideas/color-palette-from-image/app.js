// Color Palette from Image — the quantization logic is a pure function over
// a plain array of [r,g,b] pixels, so it can be unit-tested from Node with
// synthetic pixel data (no Image/Canvas decoding needed for the math itself).
// All actual image reading happens client-side via <canvas>; nothing is
// ever uploaded to a server.

const MAX_SAMPLE_DIMENSION = 100; // downscale before sampling, for speed
const PALETTE_SIZE = 6;
const BUCKET_STEP = 24; // channel quantization step for binning similar colors

/** Pure: snap an RGB triple to a coarser grid so near-identical colors bucket together. */
function quantizeColor(r, g, b, step = BUCKET_STEP) {
  return [
    Math.round(r / step) * step,
    Math.round(g / step) * step,
    Math.round(b / step) * step,
  ];
}

/** Pure: clamp+format an RGB triple as a #rrggbb hex string. */
function rgbToHex(r, g, b) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  return "#" + [r, g, b].map((v) => clamp(v).toString(16).padStart(2, "0")).join("");
}

/**
 * Pure: given a flat array of [r, g, b] pixel triples, bucket them into
 * coarse color bins, average the true color within each bin, and return the
 * top `count` bins by pixel frequency as { r, g, b, hex, count }.
 */
function extractPalette(pixels, count = PALETTE_SIZE) {
  const buckets = new Map();
  for (const [r, g, b] of pixels) {
    const key = quantizeColor(r, g, b).join(",");
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { sum: [0, 0, 0], n: 0 };
      buckets.set(key, bucket);
    }
    bucket.sum[0] += r;
    bucket.sum[1] += g;
    bucket.sum[2] += b;
    bucket.n += 1;
  }

  const sorted = [...buckets.values()].sort((a, b) => b.n - a.n);
  return sorted.slice(0, count).map((bucket) => {
    const r = bucket.sum[0] / bucket.n;
    const g = bucket.sum[1] / bucket.n;
    const b = bucket.sum[2] / bucket.n;
    return { r: Math.round(r), g: Math.round(g), b: Math.round(b), hex: rgbToHex(r, g, b), count: bucket.n };
  });
}

/** Pure: compute a downscaled width/height that fits within maxDim, preserving aspect ratio. */
function computeSampleSize(srcW, srcH, maxDim = MAX_SAMPLE_DIMENSION) {
  if (srcW <= maxDim && srcH <= maxDim) return { width: srcW, height: srcH };
  const scale = maxDim / Math.max(srcW, srcH);
  return { width: Math.max(1, Math.round(srcW * scale)), height: Math.max(1, Math.round(srcH * scale)) };
}

/** Pure: convert a canvas ImageData-like {data, width, height} into an array of [r,g,b], skipping mostly-transparent pixels. */
function pixelsFromImageData(imageData) {
  const { data } = imageData;
  const pixels = [];
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < 128) continue;
    pixels.push([data[i], data[i + 1], data[i + 2]]);
  }
  return pixels;
}

function renderSwatches(palette) {
  const container = document.getElementById("swatches");
  container.innerHTML = "";
  palette.forEach((color) => {
    const btn = document.createElement("button");
    btn.className = "cpi-swatch";
    btn.type = "button";
    btn.title = "Click to copy hex code";

    const colorBlock = document.createElement("span");
    colorBlock.className = "cpi-swatch-color";
    colorBlock.style.background = color.hex;

    const label = document.createElement("span");
    label.className = "cpi-swatch-label";
    label.textContent = color.hex;

    btn.appendChild(colorBlock);
    btn.appendChild(label);

    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(color.hex);
      } catch (err) {
        // Clipboard API can be blocked (permissions/non-HTTPS); fall back
        // to a visible selection the user can copy manually.
        const range = document.createRange();
        range.selectNodeContents(label);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }
      const original = label.textContent;
      label.textContent = "Copied!";
      label.classList.add("copied");
      setTimeout(() => {
        label.textContent = original;
        label.classList.remove("copied");
      }, 1000);
    });

    container.appendChild(btn);
  });
}

if (typeof document !== "undefined") {
  const input = document.getElementById("image-input");
  const preview = document.getElementById("preview");
  const canvas = document.getElementById("work-canvas");
  const statusMsg = document.getElementById("status-msg");

  input.addEventListener("change", () => {
    const file = input.files && input.files[0];
    if (!file) return;

    statusMsg.textContent = "Reading image...";
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      preview.src = objectUrl;
      preview.hidden = false;

      const { width, height } = computeSampleSize(img.naturalWidth, img.naturalHeight);
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      let imageData;
      try {
        imageData = ctx.getImageData(0, 0, width, height);
      } catch (err) {
        statusMsg.textContent = "Could not read pixel data from this image (it may be cross-origin).";
        return;
      }

      const pixels = pixelsFromImageData(imageData);
      const palette = extractPalette(pixels, PALETTE_SIZE);
      renderSwatches(palette);
      statusMsg.textContent = `Extracted ${palette.length} colors from ${file.name}. Click a swatch to copy its hex code.`;

      URL.revokeObjectURL(objectUrl);
    };

    img.onerror = () => {
      statusMsg.textContent = "That file couldn't be loaded as an image.";
      URL.revokeObjectURL(objectUrl);
    };

    img.src = objectUrl;
  });
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { quantizeColor, rgbToHex, extractPalette, computeSampleSize, pixelsFromImageData };
}
