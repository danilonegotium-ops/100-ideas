// Favicon Generator — the crop/resize math is a pure function so it can be
// sanity-checked from Node. The actual pixel work happens on a real
// <canvas> in the browser; nothing is uploaded to a server.

const SIZES = [
  { size: 16, filename: "favicon-16x16.png", label: "16×16" },
  { size: 32, filename: "favicon-32x32.png", label: "32×32" },
  { size: 48, filename: "favicon-48x48.png", label: "48×48" },
  { size: 180, filename: "apple-touch-icon.png", label: "180×180 (Apple touch)" },
  { size: 192, filename: "android-chrome-192x192.png", label: "192×192" },
  { size: 512, filename: "android-chrome-512x512.png", label: "512×512" },
];

/**
 * Pure: given a source image's width/height, compute the centered square
 * crop rectangle (an "object-fit: cover" style crop) to feed into
 * drawImage(img, sx, sy, sw, sh, 0, 0, targetSize, targetSize).
 */
function computeCoverCrop(srcW, srcH) {
  const side = Math.min(srcW, srcH);
  const sx = (srcW - side) / 2;
  const sy = (srcH - side) / 2;
  return { sx, sy, sw: side, sh: side };
}

/**
 * Draw `img` (any object with the shape { naturalWidth/width, naturalHeight/height }
 * that a canvas 2D context's drawImage accepts) into `canvas` at the given
 * square size, using a centered cover-crop, and return a PNG data URL.
 */
function renderFaviconDataUrl(img, canvas, size) {
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  const { sx, sy, sw, sh } = computeCoverCrop(srcW, srcH);

  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, size, size);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);

  return canvas.toDataURL("image/png");
}

function generateAllFavicons(img, canvas) {
  return SIZES.map((cfg) => ({
    ...cfg,
    dataUrl: renderFaviconDataUrl(img, canvas, cfg.size),
  }));
}

function renderResults(favicons) {
  const container = document.getElementById("results");
  const downloadAllBtn = document.getElementById("download-all-btn");
  container.innerHTML = "";

  favicons.forEach((fav) => {
    const item = document.createElement("div");
    item.className = "fg-item";

    const img = document.createElement("img");
    img.src = fav.dataUrl;
    img.width = Math.min(fav.size, 96);
    img.height = Math.min(fav.size, 96);
    img.alt = `${fav.label} preview`;

    const label = document.createElement("div");
    label.className = "fg-label";
    label.textContent = fav.label;

    const link = document.createElement("a");
    link.className = "btn";
    link.href = fav.dataUrl;
    link.download = fav.filename;
    link.textContent = "Download";

    item.appendChild(img);
    item.appendChild(label);
    item.appendChild(link);
    container.appendChild(item);
  });

  downloadAllBtn.hidden = favicons.length === 0;
  downloadAllBtn.onclick = () => {
    favicons.forEach((fav, i) => {
      setTimeout(() => {
        const a = document.createElement("a");
        a.href = fav.dataUrl;
        a.download = fav.filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }, i * 200);
    });
  };
}

if (typeof document !== "undefined") {
  const input = document.getElementById("image-input");
  const canvas = document.getElementById("work-canvas");
  const statusMsg = document.getElementById("status-msg");

  input.addEventListener("change", () => {
    const file = input.files && input.files[0];
    if (!file) return;

    statusMsg.textContent = "Generating favicons...";
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        const favicons = generateAllFavicons(img, canvas);
        renderResults(favicons);
        statusMsg.textContent = `Generated ${favicons.length} sizes from ${file.name}. Click any Download button to save.`;
      } catch (err) {
        statusMsg.textContent = "Could not process this image (it may be an unsupported format).";
      }
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
  module.exports = { SIZES, computeCoverCrop, renderFaviconDataUrl };
}
