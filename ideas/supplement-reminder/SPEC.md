# Supplement Reminder — SPEC

## What the MVP does

A personal, single-user tool (magic-link auth, no password):

- **`/`** — public landing page.
- **`/login`** — magic-link email login (template default).
- **`/dashboard`** (auth required):
  - Add a supplement: name, dose (free text — "2000 IU", "400mg",
    whatever), time of day, pills per dose, pills currently on hand, and a
    "warn below this many doses" threshold.
  - Today's list, sorted by time of day, each showing doses remaining and
    a **Taken** button. Clicking it decrements `pills_remaining` by
    `pills_per_dose` (clamped at 0) and logs the event; the button then
    reads "Taken today" and is disabled until the next calendar day (based
    on today's log entries, re-checked on every page load).
  - A low-stock badge (red text) appears once remaining doses drop below
    that supplement's own threshold.
  - Remove a supplement (with confirmation; cascades its log history).

## Scope adaptations

- **One schedule time per supplement row**, not a list of times. A
  twice-daily supplement (e.g. "Magnesium — morning" and "Magnesium —
  evening") is modeled as two separate rows. Simpler than a schedule
  sub-table, and the brief's phrasing ("schedule/time of day") reads as
  singular per item — flagged here in case a real user wants multi-dose
  scheduling on one row later.
- **No edit form** for an existing supplement (name/dose/threshold) in
  this pass — only add, mark-taken, and remove. Correcting a typo today
  means removing and re-adding. A straightforward v2 addition, not core to
  "remind me and warn when low."
- **"Taken today" is a same-day guard only** — clicking Taken again
  tomorrow is expected and intended (that's the whole point of a daily
  reminder); there's no protection against clicking Taken twice within the
  same day via two browser tabs racing each other (last write wins on
  `pills_remaining`) — an acceptable gap for a personal single-user tool.

## Schema summary (`schema.sql`)

Tables (prefix `supplement_reminder_`):

- **`supplements`** — `owner_id` (→ `auth.users`), `name`, `dose`,
  `schedule_time` (Postgres `time`), `pills_per_dose`, `pills_remaining`,
  `low_stock_threshold_doses`.
- **`logs`** — `owner_id`, `supplement_id` (→ `supplements`), `taken_at`
  (timestamp), `taken_date` (date, denormalized from `taken_at` for a
  cheap "already taken today" lookup without timezone-aware date math on
  every page load).

RLS: both tables are owner-only (`auth.uid() = owner_id`) for all
operations — this is a personal tool, no sharing.

"Doses remaining" is computed client-side as
`floor(pills_remaining / pills_per_dose)`, not stored — always derived
from the two stored counts so it can never drift out of sync.

Seed data: four demo supplements at varied stock levels — Vitamin D3
(healthy stock), Omega-3 (below its own threshold: 3 doses left, warns
below 5), Magnesium (critically low: 2 doses left), Multivitamin (healthy)
— plus two "already taken today" log rows so the dashboard shows a
realistic mixed taken/due state on first load. `owner_id` is a real FK
into `auth.users` — see the placeholder-UUID note at the top of the seed
block in `schema.sql`.

## What's genuinely untestable until Supabase is live

- RLS policies against a real Postgres instance (reasoned through, not
  executed).
- The magic-link login round trip (template-provided, not re-verified
  per-idea).
- Whether the denormalized `taken_date` column reliably matches "today" in
  the user's own timezone vs. the database's timezone (both use `now()`/
  `current_date` server-side, i.e. UTC by default on Supabase, which could
  show "already taken today" flipping over at UTC midnight rather than the
  user's local midnight) — worth checking against real usage once live;
  documented here so it isn't a silent surprise.
