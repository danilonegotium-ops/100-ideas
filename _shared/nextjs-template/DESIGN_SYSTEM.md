# Design system v2 — Tier 1 / Tier 2 / Tier 3

Visual-craft upgrade for the 51 Next.js ideas (Wave 3/4/5) copied from this
template. Same philosophy as the original design system in `README.md` §5
(shared tokens, don't hand-roll hex values) — this just adds real motion,
depth, and (for a handful of apps) 3D on top of it, inspired by
[21st.dev](https://21st.dev)'s component gallery.

**Nothing here was applied to any `ideas/<slug>/` app.** This is the palette
and the paint; other passes do the painting. Every existing app still builds
and runs exactly as before — everything below is additive.

## What changed in the template

- `app/globals.css` — new CSS custom properties (RGB triplets for glow/spotlight
  math, a secondary accent hue, glass-surface tokens, motion durations/easings,
  a type scale) appended after the existing `:root` block. Nothing existing was
  renamed or removed.
- `tailwind.config.ts` — new theme extensions: `accent-2` color, `fontSize`
  scale (`display`/`headline`/`title`/`caption`), glow `boxShadow`s, a
  `gradient-mesh` background image, and keyframe animations (`float`,
  `gradient-x`, `marquee`, `shimmer`, `glow-pulse`, `fade-in-up`).
- `components/motion/*` — six new components (Tier 1/2, framer-motion + CSS).
- `components/three/FloatingOrb.tsx` — one new component (Tier 3, react-three-fiber).
- `package.json` — added `framer-motion`, `@react-three/fiber`, `@react-three/drei`,
  `three` (+ `@types/three` as a dev dependency).

Template still passes `npm run build && npx tsc --noEmit && npm run lint`
clean with all of the above present and unused on the placeholder page — see
"Validation" below.

## Why 21st.dev, concretely

Browsed [21st.dev](https://21st.dev)'s live category pages, not just general
knowledge of the space. What most directly shaped the three tiers:

- **[Bento Grid](https://21st.dev/community/components/s/bento-grid)** (11+ components) —
  asymmetric card grids where tile size communicates importance. Maps directly
  onto dashboard apps (`airbnb-management-dashboard`, `micro-saas-gyms`) that
  currently render every stat in an identical box.
- **[Glassmorphism](https://21st.dev/community/components/s/glassmorphism)** (18+ components) —
  translucent, blurred panels over a colored/animated backdrop → `GlassPanel`
  + `.glass` utility class below.
- **[Border](https://21st.dev/community/components/s/border)** (38+ components) — named
  patterns worth knowing even where we didn't lift the exact implementation:
  **Border Beam** (a light that travels around a card's edge), **Shine
  Border** (shimmer sweep), **Hover Border Gradient**, **Glow Effects**. Our
  `SpotlightCard`'s pointer-tracked glow and the `shimmer`/`glow-pulse`
  keyframes are the same family of effect, built without the extra
  dependency.
- **Backgrounds** (365+, aurora/mesh-gradient/particle/noise/grid patterns) →
  `GradientMesh`.
- **Galleries & 3D** and **Animated heroes** — this is where 21st.dev
  surfaces Aceternity UI (87 components) and Magic UI (62 components), the
  two libraries most associated with the "spotlight," "bento," "3D card,"
  and "aurora background" patterns the user explicitly referenced. We didn't
  vendor their code (keeps the dependency footprint small and license-clean —
  everything here is hand-written against `framer-motion`/`three` directly)
  but their category taxonomy is exactly what maps onto Tier 2/3 below:
  spotlight/glow hover, animated gradient borders, bento grids, and — for a
  literal 3D presence rather than a CSS trick — react-three-fiber scenes.

Concrete takeaway used in the components: keep the *effect* vocabulary
(spotlight, glass, mesh, glow, bento, orbiting/floating 3D) but implement it
directly against this project's existing token system (`--accent`,
`--accent-rgb`, `--radius`, etc.) rather than importing a component library
whose own theme would fight the shared design tokens every other idea reads.

## Tier 1 — Modern SaaS (35 apps)

Straightforward CRUD/dashboard apps. Polished and professional, not flashy:
page-load and interaction animation, glassmorphic panels *where* there's
something worth seeing through (hero/nav, not every table row), animated
stat tiles, better empty states, subtle hover depth.

**Packages:** `framer-motion` only.

**Components to reach for:**
- `components/motion/AnimatedCard.tsx` — drop-in `Card` replacement with a
  staggered fade/slide-in on mount and a hover lift. Pass `index={i}` inside
  a `.map()` so a list cascades in.
- `components/motion/StatTile.tsx` — dashboard number that counts up via a
  spring the first time it scrolls into view. Takes `value`/`prefix`/`suffix`/
  `decimals`/`trend`.
- `components/motion/GlassPanel.tsx` — frosted panel for hero/nav/modal
  surfaces (server-renderable, no hooks).
- `components/motion/EmptyState.tsx` — replaces every ad-hoc
  `<p className="text-muted">Nothing yet.</p>` with an icon + fade-in +
  optional CTA slot.
- `components/motion/Marquee.tsx` — infinite-scroll strip, useful for e.g. a
  row of recent activity chips or category pills.

**Slugs (35):** `digitalni-upravnik`, `vrtic-management-tool`,
`serbian-for-expats`, `zakazi-termin`, `simple-client-portal`,
`automated-invoice-chaser`, `micro-saas-gyms`, `testimonial-collector`,
`sponsorship-manager`, `employee-onboarding-checklist`,
`subscription-tracker-teams`, `link-in-bio-artists`,
`cafe-inventory-tracker`, `remote-team-watercooler`, `feedback-widget`,
`supplement-reminder`, `pet-health-records`, `local-sports-buddy`,
`newsletter-curious-minds`, `virtual-book-club`, `code-snippet-vault`,
`simple-uptime-monitor`, `found-this-cool-site`, `shared-wishlist`,
`concert-buddy`, `home-maintenance-log`, `ai-gift-idea-generator`,
`ai-resume-optimizer`, `ai-recipe-creator`, `ai-dream-interpreter`,
`ai-email-professionalizer`, `ai-travel-itinerary`, `ai-song-lyric-writer`,
`ai-math-tutor`, `cold-outreach-personalizer`.

Reasoning: every one of these is fundamentally a form → list/table → detail
loop (or, for the stateless Wave 4 AI tools, a form → single AI response
loop) with no second interaction mode. They get real craft, not a reduced
version of it — the point of Tier 1 is that "simple" apps look and feel this
good *by default*, not that they're deprioritized.

## Tier 2 — Rich Interactive (10 apps)

Everything in Tier 1, plus: swipe-gesture animations, animated map/live-data
interactions, spotlight/glow hover, gradient-mesh backdrops, more elaborate
state transitions. These apps have a genuine second interaction mode beyond
CRUD — a swipe deck, a live map, a countdown/timer loop, an audio/vision
pipeline, a realtime queue position — and the design should make that loop
the centerpiece.

**Packages:** `framer-motion` (same as Tier 1 — the swipe/drag interactions
use `motion.div`'s built-in `drag`/`dragConstraints`/`useAnimation`, no extra
gesture library needed).

**Components to reach for:** everything in Tier 1, plus:
- `components/motion/SpotlightCard.tsx` — pointer-tracked radial glow, for
  the actual match/menu/item cards in the core loop.
- `components/motion/GradientMesh.tsx` — absolute-positioned blurred
  multi-hue backdrop behind a hero or the core-loop screen.

**Slugs (10) and what "rich" means for each:**
- `pet-playdate-finder` — swipe-deck matching UI (`motion.div drag`, exit
  animation on swipe left/right, `SpotlightCard` for the profile card).
- `daily-riddle-challenge` — countdown ring/timer animation, leaderboard
  entrance stagger.
- `mood-journal-ai` — mood-color-mapped entry animations, a small
  `GradientMesh` tinted by the day's dominant mood.
- `ai-meeting-minutes` — live waveform/listening-state animation while
  `SpeechRecognition` is active.
- `ai-logo-critic` — image drop-zone with a spotlight/glow hover state,
  animated reveal of the critique.
- `virtual-queue-salons` — the live position number should visibly animate
  down (not just re-render) as `queue_position` changes over Realtime.
- `domain-name-brainstormer` — per-suggestion availability check should
  animate a pending → available/taken state, not pop in.
- `flashcard-exchange` — 3D-feeling flip-card animation (`rotateY` via
  framer-motion, no react-three-fiber needed for a single flip).
- `financial-literacy-teens` — gamified progress bar/level-up animation,
  confetti-scale micro-interaction on milestone.
- `skill-swap-platform` — `SpotlightCard` on browse listings + animated
  match/interest state change.

## Tier 3 — Flagship/Showcase (6 apps)

Real standout treatment: `@react-three/fiber` where it genuinely serves the
concept (never gratuitous), a full hero moment, an orchestrated page-load
sequence (staggered reveal of hero → stat row → content, not everything
fading in at once).

**Packages:** everything in Tier 1/2, plus `@react-three/fiber`,
`@react-three/drei`, `three`.

**Components to reach for:** everything in Tier 1/2, plus
`components/three/FloatingOrb.tsx` as a *starting template* — it's
deliberately abstract (a distorting glass sphere), and each flagship app
should fork/extend it into something specific to its own concept rather than
reusing the literal orb everywhere.

**Picks and reasoning:**

| Slug | Why it's Tier 3 |
|---|---|
| `qr-menu-2` | Real end-to-end commerce flow (QR → menu → cart → Stripe checkout) with a public-facing diner UI that's effectively a mini storefront — deserves a genuine hero moment on the table-facing menu page, animated cart/checkout transitions, category bento grid. |
| `rent-price-map` | Built around a live Leaflet map already — the one app where "3D" is better spent as animated map interactions (marker cluster reveal, popup transitions, a `GradientMesh` hero above the fold) than a literal `<Canvas>`; still flagship-tier because the map *is* the product. |
| `roommate-matcher` | Swipe-matching core loop (chosen over `pet-playdate-finder`, which gets the same swipe mechanic at Tier 2) — a mutual-match moment is exactly the kind of "this deserves a payoff" event a `FloatingOrb`-derived glow burst or 3D card flip rewards. Broader mainstream use case than the pet variant, so it gets the fuller treatment. |
| `digital-time-capsule` | The concept is literally an object sealed until a future date — `FloatingOrb` forked into a "sealed capsule" (distort → 0, slow rotation, opens/cracks-open animation on delivery day) is about as direct a 3D-serves-the-concept case as this sprint has. |
| `ai-interior-decorator` | Concept is spatial (a room) — a 3D room/furniture preview (even a simplified placeholder-box version built from `FloatingOrb`'s `<Canvas>` scaffolding) communicates "decorate a room" in a way a 2D before/after image pair doesn't. |
| `airbnb-management-dashboard` | The one dashboard-shaped flagship pick, not a consumer/swipe app — real financial data (bookings, revenue, occupancy) deserves a genuine bento-grid analytics hero with animated `StatTile`s and a `GradientMesh` header rather than another list of numbers; rounds out the six so Tier 3 isn't six variations on "consumer swipe app." |

`pet-playdate-finder` was the one genuine toss-up against `roommate-matcher`
(identical swipe mechanic) — it stays at Tier 2 because giving both the full
3D/hero treatment would read as repetitive rather than as two distinct
flagships, and roommate-matching is the more broadly-relatable use case of
the two.

## Applying this to an existing app without breaking Supabase/RLS/data flow

This is a **presentation-layer-only** upgrade. The rule that matters most:

> If a file doesn't render JSX, don't touch it.

Concretely:

1. **Never touch** `lib/supabase/*`, `middleware.ts`, `app/auth/callback/*`,
   any `route.ts` Route Handler's data/query logic, or any `.sql` file. Those
   are correctness- and security-critical (RLS policies, service-role usage,
   idempotency guards) and have nothing to do with visual design.
2. **Server Components stay Server Components.** `AnimatedCard`, `StatTile`,
   `SpotlightCard`, `EmptyState` are all `"use client"` themselves, so a
   Server Component page can import and render them directly — you do *not*
   need to convert the whole page to a Client Component just because it now
   renders an `AnimatedCard`. Only convert a page/section to `"use client"`
   if it needs its own local state/handlers beyond what the new components
   already encapsulate.
3. **`FloatingOrb` (and any bespoke `<Canvas>` scene) is the one exception** —
   react-three-fiber touches `window`/WebGL at module init, so it must be
   loaded with `next/dynamic(() => import(...), { ssr: false })` from
   whatever page renders it, even if that page is otherwise a Server
   Component. Keep the dynamic import as narrowly scoped as possible (just
   the 3D piece, not the whole page) so the rest of the page still
   server-renders normally.
4. **Swap presentation, keep the data shape.** E.g. replacing
   `<p className="text-2xl">{count}</p>` with
   `<StatTile label="Active members" value={count} />` changes zero
   behavior — `count` still comes from the same `await supabase.from(...)`
   call. Don't restructure queries, RLS-dependent conditionals, or
   `redirect()` auth checks while doing a visual pass; if a design change
   seems to require touching fetch logic, that's a sign to stop and flag it
   rather than silently expanding scope.
5. **Verify per-app the same way the template was verified**: after
   applying the system to `ideas/<slug>/`, that app's own
   `npm run build && npx tsc --noEmit && npm run lint` must still pass clean
   with no live Supabase/AI credentials configured — same bar as the
   original README already sets, unchanged by this upgrade.
6. **Respect existing tokens.** Every new class/component here builds on the
   *existing* `--bg`/`--text`/`--accent`/etc. variables (or the new additive
   ones in this same file) — never hard-code a hex value or introduce a
   competing color system in an individual app.
7. **Tier fit is a starting point, not a mandate.** An app assigned Tier 1
   that turns out to have one genuinely rich interaction (or vice versa) can
   borrow one component from the tier above/below — the tiers describe
   *effort budget*, not a hard component allowlist.

## Validation

Run from `_shared/nextjs-template/`:

```
npm run build && npx tsc --noEmit && npm run lint
```

All three pass clean as of this change, with `framer-motion`,
`@react-three/fiber`, `@react-three/drei`, `three` installed and every
`components/motion/*` + `components/three/FloatingOrb.tsx` file present but
**unused** by `app/page.tsx` (the placeholder page was intentionally left
untouched — this is a template upgrade, not an applied redesign).

Note on `@react-three/fiber`: pin to `^8` (with `@react-three/drei@^9`), not
the current `^9` line — v9 requires React 19 as a peer, and this project is
on React 18 throughout. `npm install @react-three/fiber` without a version
pin will fail to resolve; use the versions already in `package.json`.
