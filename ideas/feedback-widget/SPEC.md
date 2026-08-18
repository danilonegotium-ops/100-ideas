# Feedback Widget — SPEC

## What the MVP does

A logged-in user (magic-link auth) creates one or more widgets, each with a
question (default "Was this helpful?"). Each widget gets a real,
standalone, embeddable `<script>` snippet that works on any external
website — not just pages built with this Next.js app.

- **`/`** — public landing page.
- **`/login`** — magic-link email login (template default).
- **`/dashboard`** (auth) — create widgets, list them, delete them.
- **`/dashboard/[id]`** (auth) — the embed snippet (computed from
  `window.location.origin`, so it's always correct for whatever domain the
  app is actually deployed to) plus stats: total yes/no counts and a
  per-day yes/no breakdown table.
- **`GET /widget.js`** — the actual embeddable script, served as plain
  `text/javascript`, no React/Next runtime involved on the embedding page.
- **`GET /api/w/[id]`** — public, returns `{ id, question }` for the
  widget's config (what the script fetches to show the real question).
- **`POST /api/w/[id]/respond`** — public, records one yes/no response
  (`{ answer: boolean, pageUrl: string }`).

### Does the embeddable script genuinely work standalone outside React?

**Yes — verified two ways, not just assumed:**

1. `npm run build` output confirms `/widget.js` compiles to a real static
   route (`○ /widget.js`) serving plain text, with zero React/Next runtime
   shipped in its response — `curl`'d the built output directly and
   confirmed `Content-Type: text/javascript; charset=utf-8` and the exact
   IIFE source, no bundler artifacts.
2. Ran the actual script body inside a plain **jsdom** DOM (not a browser,
   not React, no Next.js) via a scratch Node test harness — simulated a
   third-party host page adding `<script src=".../widget.js"
   data-widget-id="w1">`, executed the script, and confirmed:
   - It correctly reads `document.currentScript`'s `src` to derive its own
     origin (works from any domain, no hardcoded backend URL).
   - It injects a floating Yes/No widget into the host page's DOM.
   - It fetches `/api/w/[id]` and updates the displayed question text with
     the real one from the "server" (mocked `fetch` in the test).
   - Clicking "Yes" POSTs `{"answer":true,"pageUrl":"<host page's own
     URL>"}` to `/api/w/[id]/respond` and shows a thank-you message.
   - Running the script twice on the same page does not double-inject.
   - A `<script>` tag missing `data-widget-id` logs a clear console error
     and no-ops instead of throwing.

This is real evidence the script works as a standalone embed, not a
theoretical claim — the one thing this couldn't verify is a real browser's
exact `document.currentScript` timing/CORS enforcement (jsdom approximates
but isn't Chromium/Firefox); recommend a human do one real manual embed
test (a static HTML file with `<script src="https://<deployed
url>/widget.js" data-widget-id="...">`, opened directly in a browser)
once this idea is deployed, before calling it fully verified.

## Scope adaptations

- No user-facing customization of widget appearance/position for this
  pass (fixed bottom-right floating card, template's dark/light CSS
  variable colors hardcoded into the script since it can't read the host
  page's Tailwind config). A v2 could accept `data-*` attributes for
  position/theme.
- Stats are a simple total + per-day breakdown table, not a chart —
  matches "basic stats" in the brief without pulling in a charting
  library into the main app bundle.
- `page_url` sent by the widget is self-reported by the client, not
  verified against `Referer`/`Origin` server-side — acceptable for
  telemetry on an MVP, called out explicitly in `schema.sql`'s column
  comment so it's not mistaken for a security boundary later.

## Schema summary (`schema.sql`)

Tables (prefix `feedback_widget_`):

- **`widgets`** — `owner_id` (→ `auth.users`), `question`.
- **`responses`** — `widget_id` (→ `widgets`), `answer` (boolean),
  `page_url` (nullable, self-reported), `created_at`.

RLS is the interesting part here, since — unlike the other 4 ideas in this
batch — this one *needs* genuine public (non-owner) access for the widget
to function at all:

- Widget owners get full CRUD on their own widgets
  (`auth.uid() = owner_id`).
- **Anyone** (`anon` role) can `select` from `widgets` — the embed script
  running on a stranger's site has no Supabase session. This does expose
  `owner_id` at the row level (RLS is row-level, not column-level), but
  application code only ever selects `id, question`, so it's never
  actually returned to a browser.
- **Anyone** can `insert` into `responses`, gated only by a `with check`
  that the referenced `widget_id` actually exists (guards against
  spamming rows for a made-up id; does not prevent spamming a real
  widget's id — no rate limiting in this pass, acceptable for MVP).
- Only a widget's owner can `select` from `responses` (join-based policy
  checking `widgets.owner_id = auth.uid()`), so the dashboard stats are
  private per owner even though submitting a response is public.

Seed data: one demo widget ("Was this helpful?") with 11 responses spread
over the last 14 days across a few different `page_url`s, so the per-day
stats table has real-looking shape out of the box. `owner_id` is a real FK
into `auth.users` — see the placeholder-UUID note at the top of the seed
block in `schema.sql`.

## What's genuinely untestable until Supabase is live

- All RLS policies against a real Postgres instance — reasoned through
  carefully (especially the public insert/select policies, since those
  are the two most security-sensitive ones in this batch), but not
  executed.
- Ran `next start` locally with empty env vars to sanity-check runtime
  behavior beyond just `next build`: as expected, `GET /api/w/[id]`
  correctly throws inside `createClient()` (missing Supabase URL/key) and
  returns a 500 — this is expected/unavoidable without real credentials,
  not a bug, and doesn't affect the `next build` pass the verification
  standard actually requires. Confirms nothing was silently broken by an
  empty-env-var edge case beyond the expected "no DB, no data" state.
- The magic-link login round trip (template-provided, not re-verified
  per-idea).
- Real-browser CORS behavior for the cross-origin `fetch()` calls the
  embed script makes (preflight OPTIONS handling was written per spec and
  manually curl-tested locally — `OPTIONS /api/w/[id]/respond` returns the
  expected `Access-Control-Allow-*` headers — but a live cross-origin
  browser test is the real proof).
