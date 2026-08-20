# Design system — static/vanilla ideas (Wave 1 + Wave 2)

Covers the 39 zero-build `ideas/<slug>/` tools (plain HTML/CSS/JS, no framework,
no bundler — see `README.md` in this folder for the hard constraints). Applies
real visual craft on top of that constraint, inspired by
[21st.dev](https://21st.dev)'s component gallery: spotlight-follows-cursor
cards, mesh-gradient/shader backgrounds, glassmorphic panels, animated
gradient borders, bento grids, 3D tilt cards, marquees. Everything below is
plain CSS + vanilla JS — no npm packages, no CDN dependency, works offline by
opening `index.html` directly.

## The two tiers

**Tier 1 — Refined Minimal** (`theme.css`, the default). For the ~25
simplest/most utilitarian tools: calculators, trackers, converters,
single-purpose forms. Upgraded typography (fluid clamp() type scale), a real
spacing/radius/motion token system, a very subtle mesh-gradient + noise-grain
body background, and 2–3 tasteful CSS-only micro-interactions (button
lift+glow on hover, card hover elevation, a staggered fade-in-up entrance).
No JS required. Fast, restrained, still clearly more crafted than the
original flat dark theme.

**Tier 2 — Expressive** (`theme.css` + `tier2.css` + `tier2.js`). For the ~14
tools that are inherently visual/interactive: image/color/font tools, audio
tools, quizzes/games, showcase/generator tools. Adds glassmorphic panels,
spotlight-follows-cursor glow, animated gradient borders, 3D tilt cards,
bento grids, marquees, a canvas-based animated mesh background, and a
scroll/load reveal system — plus a per-app accent color so each tool gets its
own personality instead of one identical green everywhere.

Tier 2 is strictly additive: `tier2.css` only adds new classes/selectors, it
never overrides `theme.css`'s existing ones, so a Tier 1 app never needs to
change if it's later promoted to Tier 2, and a Tier 2 app degrades gracefully
to Tier 1 styling if `tier2.js` fails to load for any reason.

## How to apply Tier 1 to an idea (default — do this for all 39 unless promoting to Tier 2)

1. Copy the updated `_shared/static-template/theme.css` over the idea's own
   `ideas/<slug>/theme.css`, **but first check the bottom of the idea's
   existing theme.css for idea-specific rules** (added per README step 3) —
   re-append those below the new token block so nothing the app depends on
   breaks. Search for a comment marker or just diff the old file against the
   original `_shared/static-template/theme.css` in git history / the
   original delivered version to isolate what's idea-specific.
2. Do not rename or remove any existing selector the idea's `index.html`
   uses (`.card`, `.btn`, `.stack`, `.row`, `input/textarea/select`,
   `label`, `header.site`, `footer.site`). All of those still exist with the
   same meaning, just better-styled.
3. Optionally nudge `--accent` / `--accent-strong` / `--accent-rgb` in the
   idea's own copy if a different accent helps that tool feel distinct — the
   rest of the token system (spacing, radius, motion, shadows) should stay
   as-is so the 25 Tier 1 tools still read as one family.
4. Add `.fade-in` to a handful of top-level elements (e.g. the main `.card`)
   if you want the built-in entrance animation — it's opt-in, not automatic,
   so it never fights content that renders dynamically after user input.
5. Open the file directly in a browser and click through every interactive
   element exactly like the original README step 8 already requires. Nothing
   about this pass changes that testing bar.

## How to apply Tier 2 to an idea

1. Do everything in the Tier 1 steps above first — Tier 2 sits on top of Tier
   1, it doesn't replace it.
2. Copy `tier2.css` and `tier2.js` into the idea folder alongside `theme.css`.
3. In `index.html`, add after the `theme.css` link and before `app.js`:
   ```html
   <link rel="stylesheet" href="theme.css" />
   <link rel="stylesheet" href="tier2.css" />
   ...
   <script src="tier2.js" defer></script>
   <script src="app.js" defer></script>
   ```
   (`tier2.js` must load and run before `app.js` if `app.js` calls any
   `Tier2.*` function directly; if you only use `data-*` attributes,
   `tier2.js`'s own `autoInit()` handles everything and order vs `app.js`
   doesn't matter.)
4. Pick ONE accent for the app and put it on `<html data-accent="violet">`
   (options: `violet`, `blue`, `amber`, `rose`, `cyan`, `lime`, `coral` — see
   `tier2.css` section 1). Skip this to keep the shared green.
5. Add effects surgically, not everywhere. A good Tier 2 pass usually means:
   *one* hero element with `.glass` or `.gradient-border`, *one*
   `[data-spotlight]` result/upload card, `[data-tilt]` on 2-3 cards at most,
   a `.bento` grid only if there are genuinely 3+ things to show at once, and
   a `canvas.mesh-bg-canvas[data-mesh-bg]` behind the hero only if the tool
   has enough visual "air" for it not to fight the content.
6. Gotchas found while building/testing this system (fixed in `tier2.css`,
   but worth knowing when authoring markup):
   - `.gradient-border`'s direct child gets a forced opaque background so
     the rotating conic-gradient only shows as a thin ring, not a solid
     fill. Don't put `.card` and `.gradient-border` on the *same* element —
     nest instead: `<div class="gradient-border"><div class="card">...`.
   - A `[data-reveal]` element that also has `data-reveal-group` is treated
     as a layout container (it stays visible; its children animate). Only
     use plain `[data-reveal]` (no `data-reveal-group`) on a leaf element you
     want to individually fade up.
   - `.marquee__track` needs its content duplicated once in the HTML (two
     identical groups back to back) for the loop to look seamless.
7. Test with the same open-in-browser pass as Tier 1, and additionally move
   the mouse over any `[data-spotlight]` / `[data-tilt]` elements and scroll
   past any `[data-reveal]` ones to confirm the effect fires with no jank.

## Accessibility & performance notes (both tiers)

- Everything respects `prefers-reduced-motion: reduce` — Tier 1's global
  media query collapses all animations/transitions to ~instant; Tier 2's
  JS checks the same media query and skips cursor-tracking/canvas-looping
  work entirely (draws one static frame instead of animating).
- No external requests: no Google Fonts, no CDN, no icon fonts. Everything
  is inline CSS/SVG-data-URI/Canvas. Apps keep working fully offline.
- `tier2.js` is one small vanilla file (~200 lines), no dependencies. It
  no-ops safely on any page that doesn't have matching `data-*` attributes,
  so it's safe to include even in an app that only wants one effect.
- Canvas mesh background and 3D tilt use `requestAnimationFrame` +
  pointer-move listeners guarded by an in-flight flag, so they don't spam
  layout/paint on fast mouse movement.

## Tier 1 vs Tier 2 — the 39-slug split

Categorization call: genuinely single-purpose utilities (a form, a
calculator, a converter, a tracker, a reference/API-style page) → **Tier 1**.
Tools whose whole point is a visual/interactive/generative experience
(image/color/font manipulation, audio synthesis, quizzes/games, showcase
generators) → **Tier 2**, each with its own accent for personality.

### Tier 1 — Refined Minimal (25)

| Slug | Why Tier 1 |
|---|---|
| `is-it-friday-yet` | one-pager, single fact display |
| `millionaire-progress-bar` | one input + a progress bar |
| `recipe-scaler` | pure math form |
| `json-to-serbian-cyrillic` | text-in/text-out converter |
| `dummy-data-generator-balkan` | text-out generator, dev-utility tone |
| `markdown-to-pdf-resume` | form + document export utility |
| `board-game-night-organizer` | picker-logic form |
| `solar-panel-roi-calculator` | calculator form |
| `minimalist-fasting-tracker` | timer + localStorage tracker, deliberately minimal by name |
| `ergonomics-reminder` | background reminder utility, no visual centerpiece |
| `daily-riddle-site` | single riddle + input per day |
| `gde-na-rucak` | list/filter over seed data |
| `balkan-recipe-api` | dev-facing JSON API docs page |
| `balkan-diet-macro-tracker` | numeric tracker/table |
| `small-space-workouts` | content library, list-based |
| `digital-detox-timer` | timer utility |
| `plant-care-guide` | reference/lookup content |
| `coding-challenges-serbian` | MCQ/fill-blank problem list |
| `language-shadowing-tool` | audio playback + text utility |
| `micro-learning-sales` | daily text-tip reader |
| `kids-coding-academy` | story-based static lesson list |
| `serbian-zip-api` | dev-facing API docs/lookup page |
| `no-code-website-audit` | form + report list from an external API |
| `website-carbon-footprint` | calculator + result |
| `random-act-of-kindness` | single daily task display |

### Tier 2 — Expressive (14)

| Slug | Why Tier 2 | Suggested accent |
|---|---|---|
| `color-palette-from-image` | canvas image processing, inherently color-visual | `rose` (echoes extracted swatches) |
| `favicon-generator` | canvas/image generation, visual output-first | `blue` |
| `css-animation-library` | a motion showcase should itself demonstrate motion | `violet` |
| `social-media-mockup-tool` | visual frame/mockup preview tool | `coral` |
| `logo-maker` | visual generator, output is the whole point | `amber` |
| `font-matcher` | side-by-side visual typography comparison | `cyan` |
| `speed-reading-trainer` | RSVP reader is a rhythmic, motion-driven UI | `lime` |
| `hobby-finder-quiz` | branching interactive quiz | `coral` |
| `ex-yu-rock-trivia` | game/quiz with a leaderboard | `amber` |
| `sleep-sound-generator` | Web Audio soundscapes pair naturally with a canvas mesh/visualizer | `blue` |
| `music-theory-trainer` | Web Audio, interactive/game-like practice tool | `violet` |
| `public-speaking-simulator` | live Web Speech feedback, real-time interactive | `rose` |
| `history-through-maps` | illustrative visual maps/schematics | `amber` |
| `water-intake-gamified` | gamified visual growth (a tree) rewards richer motion | `cyan` |

39/39 accounted for (25 Tier 1 + 14 Tier 2), matching Wave 1 (20) + Wave 2
(19) in `MASTER_TRACKER.md`. This split is a starting recommendation, not a
mandate — an agent applying the system to a specific idea can move it up or
down a tier if, once inside the actual code, the fit looks wrong (e.g. an
idea that turned out simpler or richer in practice than its one-line
`MASTER_TRACKER.md` description suggested).

## Files in this folder

- `theme.css` — Tier 1 tokens + base styles. Always present.
- `tier2.css` — Tier 2 additive classes/effects. Only for promoted apps.
- `tier2.js` — Tier 2 vanilla-JS helpers (`Tier2.initSpotlight`,
  `Tier2.initTilt`, `Tier2.initReveal`, `Tier2.createMeshBackground`,
  `Tier2.autoInit`). Only for promoted apps.
- `index.html` — unchanged scaffold (still uses `{{TITLE}}`/`{{DESCRIPTION}}`
  placeholders per `README.md`).
- `README.md` — unchanged build/deploy instructions for agents.
