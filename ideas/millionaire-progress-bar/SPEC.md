# Millionaire Progress Bar — SPEC

**MVP:** User types their current savings as a plain number (no currency selector — the tool is currency-agnostic by design, the number just represents "however much you have" in whatever unit you're tracking) into a single input. An animated progress bar fills toward a fixed goal of 1,000,000, with the exact percentage and remaining amount shown alongside a milestone message that changes at 10/25/50/75/100% thresholds. The value is written to `localStorage` on every save (button click or Enter key) and on page load the input and bar are restored from `localStorage` automatically — no accounts, no server round-trip. The bar also live-updates as the user types, before they explicitly save.

**Out of scope for this pass:** multi-currency conversion/display (deliberately just a raw number per the brief); multiple/named savings goals other than the fixed $1,000,000 milestone; any cross-device sync (by definition `localStorage` is per-browser/per-device).

**Data/content:** none — pure math (`computeProgress`) against a constant goal of 1,000,000, defined in `app.js`.
