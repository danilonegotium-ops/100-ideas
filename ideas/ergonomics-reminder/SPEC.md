# Ergonomics Reminder — SPEC

## Scope note
The original one-line pitch describes a "desktop app." Per `MASTER_TRACKER.md` this
ships as a web app using the browser Notification API instead — packaging a real
desktop app (Electron etc.) or a Chrome Web Store extension isn't in scope for this
sprint. The idea itself (interval-based posture/stretch reminders) is unchanged.

## What it does
Pick a reminder interval (15/30/45/60 min) and click Start. The tool requests
Notification permission and, once running, fires a real browser notification with
a randomized posture/stretch tip (no immediate repeats) at that interval for as
long as the tab stays open. An in-page countdown always shows time remaining to the
next reminder. A pulsing in-page banner with the tip text fires on every interval
regardless of notification permission — so it's both the primary UI feedback and the
visible fallback if the user denies (or the browser doesn't support) notifications.
Stop cancels all timers and re-enables the interval selector.

## Out of scope for this pass
- No background/service-worker delivery — reminders only fire while the tab is open,
  since that's the only thing the plain Notification API from a web page supports
  without a more involved PWA + service worker setup.
- No custom/arbitrary interval input beyond the four presets, and no per-user
  history of stretches taken.

## Data / content
`data.js` holds 15 curated, genuinely useful posture and stretch tips (standard,
widely-known ergonomics advice — 20-20-20 rule, shoulder rolls, wrist stretches,
screen height checks, etc.), written from general ergonomics knowledge, not copied
from a single source.

## Implementation notes
Pure timing/formatting logic (`minutesToMs`, `formatCountdown`,
`randomTipIndexAvoidingRepeat`, `permissionStatusMessage`) is exported via a
`module.exports` guard (inert in the browser — no bundler/CommonJS on the page) so
it's unit-tested directly from Node.
