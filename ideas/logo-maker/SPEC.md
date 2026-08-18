# Logo Maker for Side Projects

A very simple, no-fuss logo generator for people who need something fast and clean. Type a
project/brand name, pick a style (monogram-in-shape, wordmark-with-icon, badge/emblem), a
container shape (circle, hexagon, rounded square) and a color. The tool renders a real SVG
client-side and lets you download it as an actual `.svg` file.

## How it works

- All logo generation is pure string-building of SVG markup in `app.js` (`generateLogoSVG` and
  its three style builders `buildMonogramSVG` / `buildWordmarkSVG` / `buildBadgeSVG`) — no canvas,
  no external font/image loading, no network calls.
- **Monogram**: first letter (single-word name) or first letters of the first two words
  (multi-word name), centered inside the chosen shape.
- **Wordmark**: a small icon in the chosen shape/color next to the full name rendered as bold
  text. Text width is estimated from character count and forced to fit exactly via SVG's
  `textLength`/`lengthAdjust`, so the layout is deterministic without measuring real font metrics.
- **Badge/emblem**: an outer ring + five small orbiting dots around the chosen inner shape, for a
  more "stamped" look, with initials centered.
- Text color (dark vs. light) is chosen automatically per WCAG relative-luminance so initials stay
  readable against any chosen background color.
- "Randomize" cycles style, shape, and color to a curated preset palette so users can browse
  variations quickly instead of hand-tuning every field.
- "Download SVG" builds a `Blob`/`URL.createObjectURL` link and triggers a real file download
  named after the (slugified) brand name.
- User-provided text is escaped before being embedded in the SVG so odd characters (`<`, `&`,
  quotes) can't break the markup.

## Out of scope for this pass

- No custom font upload/selection (system sans-serif only).
- No AI-assisted naming or logo suggestions — purely deterministic/geometric generation.
- No saved logo history/gallery; each session starts fresh.
- No raster export (PNG); SVG download only (users can convert externally if needed).

## Data/content

No curated dataset — the only "content" is the preset color palette (`PRESET_COLORS`) used by the
Randomize button, chosen as a set of pleasant, reasonably distinct accent colors. No external
sourcing needed.
