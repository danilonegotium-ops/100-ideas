# Pet Health Records — SPEC

## What the MVP does

A personal, single-user digital vault (magic-link auth, no password):

- **`/`** — public landing page.
- **`/login`** — magic-link email login (template default).
- **`/dashboard`** (auth): add a pet (name, species, chip number —
  optional), list your pets, each showing a red badge if it has any
  overdue or soon-due (within 30 days) vaccination, link into that pet's
  records.
- **`/dashboard/[id]`** (auth): that pet's full history (vaccinations and
  vet visits, newest first), each vaccination showing its next-due date
  with an overdue/due-soon flag; a form to log a new record (type,
  description, date, optional next-due date).

## Scope adaptations

- **`entry_type` is a fixed two-value enum** (`vaccination` /
  `vet_visit`), not a free-text category — matches the brief exactly
  ("vaccinations... and vet visits") without over-generalizing into an
  open-ended record-type system.
- **No file/photo attachments** (e.g. a scanned vet document) — text
  description only, for this pass. Supabase Storage could hold these
  later; out of scope for a weekend MVP per the brief's own framing
  ("digital vault" for *records*, not documents).
- **No edit** for an existing pet or entry — add/remove only, same
  tradeoff made in the other 4 ideas in this batch to keep scope tight.

## Schema summary (`schema.sql`)

Tables (prefix `pet_health_records_`):

- **`pets`** — `owner_id` (→ `auth.users`), `name`, `species`,
  `chip_number` (nullable).
- **`entries`** — `owner_id`, `pet_id` (→ `pets`), `entry_type`
  (`vaccination` | `vet_visit`, enforced by a check constraint),
  `description`, `entry_date`, `next_due_date` (nullable — only
  meaningful for a recurring vaccination).

RLS: both tables are owner-only (`auth.uid() = owner_id`) for all
operations — this is a personal vault, no sharing.

Overdue/upcoming logic (`lib/pets/types.ts`'s `dueStatus()`) is a pure
function: `next_due_date` in the past → "overdue"; within 30 days →
"upcoming"; further out → "ok". Computed client-side from the stored date,
not persisted, so it's always correct relative to "now" without a cron job
recalculating a stored status column. Hand-verified with a Node scratch
script against a few fixed reference dates (35 days overdue, 20 days
upcoming, 335 days out, exactly today).

Seed data: one demo pet ("Luna", a dog, with a chip number) and five
history entries spanning both types — one overdue vaccination (rabies,
next due 35 days ago), one upcoming vaccination (due in 20 days), one
vaccination that's fine for a while yet (due in 335 days), and two vet
visits with no next-due date. `owner_id` is a real FK into `auth.users` —
see the placeholder-UUID note at the top of the seed block in
`schema.sql`.

## What's genuinely untestable until Supabase is live

- RLS policies against a real Postgres instance (reasoned through, not
  executed).
- The magic-link login round trip (template-provided, not re-verified
  per-idea).
- The seed script's `current_date - interval 'N days'` expressions
  assigned into `date` columns — Postgres's date-minus-interval operator
  returns a `timestamp`, which relies on Postgres's built-in assignment
  cast from `timestamp` to `date` (truncating the time component) to land
  correctly in an `entry_date`/`next_due_date` column. This is standard,
  well-documented Postgres behavior, not a guess, but wasn't executed
  against a real instance — worth a quick eyeball on first seed run.
