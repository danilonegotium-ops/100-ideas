# Color Palette from Image — SPEC

**MVP:** User picks an image file from their device. The image is drawn onto an off-screen `<canvas>`, downscaled to a max dimension of 100px for speed, and read back via `getImageData` — entirely client-side, the file is never sent to a server (no `<form>`, no `fetch`). Pixels are bucketed by a coarse quantization step (24 per channel) to group visually-similar colors, the true average color of each bucket is computed, and the top 6 buckets by pixel frequency become the palette. Each color renders as a clickable swatch showing its hex code; clicking copies the hex to the clipboard via the Clipboard API (with a text-selection fallback if clipboard access is blocked).

**Out of scope for this pass:** perceptually-weighted clustering (e.g. real k-means in CIELAB space) — the frequency-bucket approach is simpler and good enough for a "dominant colors" tool, not color-science-grade; palette naming (e.g. "Ocean Blue") or export formats beyond hex (no ASE/CSS-variables export); handling of animated images (only the first/static frame as decoded by `<img>`/`<canvas>` is used).

**Data/content:** none — pure pixel math, no external dataset.
