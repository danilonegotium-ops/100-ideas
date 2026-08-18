# Remote Team Watercooler — SPEC

## What the MVP does

A logged-in "team admin" (magic-link auth, no password) manages a roster of
team members and runs a weekly random pairing:

- **`/`** — public landing page explaining the product, links to login.
- **`/login`** — magic-link email login (template default, unmodified).
- **`/dashboard`** (auth required) — add/deactivate/remove team members,
  click **"Run pairing for this week"** to generate a fresh random pairing
  of active members (pairs of 2, one group of 3 if the active count is
  odd), see the current pairing's groups, and paste/edit each group's
  meeting link.
- **`/m/[token]`** (public, no login) — each member gets a personal share
  link (shown to the admin on the dashboard as `/m/<share_token>`) where
  they can see who they're paired with this week and paste/update the
  meeting link themselves, without needing an account.

Pairing logic (`lib/watercooler/pairing.ts`) is a pure, dependency-free
function — unit-tested by hand via a scratch Node script during
development (random shuffle + retry, scored against the immediately
previous run's pairs, picks the best-of-N-attempts arrangement). Handles
0/1/2/3/even/odd member counts correctly.

## Scope adaptations

- **"Same two people aren't repeatedly paired back-to-back if avoidable"**
  is implemented as best-effort: up to 30 random shuffle attempts, scored
  by how many pairs repeat the *immediately previous* run's pairs, keeping
  the least-repetitive attempt. This reliably finds a zero-repeat
  arrangement whenever one exists for the group size; it does not look
  further back than one prior run (no "avoid the last 3 pairings" style
  history window) — that's a reasonable v2 addition, not needed for the
  spec as written.
- **Video call links are pasted, not generated** — per the brief, no
  Meet/Zoom API integration; any URL works.
- **Members never log in.** Rather than building full multi-user
  team-membership auth (invites, per-member accounts) in a weekend, each
  member gets a random, unguessable `share_token` (a UUID) baked into
  their row at creation, exposed as a personal URL. This is "unlisted
  link" security, not authentication — acceptable for an internal
  team-culture tool with no sensitive data, same tradeoff a lot of
  real scheduling tools (e.g. Calendly's booking links) make.

## Schema summary (`schema.sql`)

Tables (Supabase shared project, prefix `remote_team_watercooler_`):

- **`members`** — `owner_id` (→ `auth.users`), `name`, `email`,
  `share_token` (unique, random UUID), `active`.
- **`pairing_weeks`** — one row per "run pairing" click: `owner_id`,
  `week_start`.
- **`pairings`** — one row per group: `owner_id`, `week_id`, `member_ids`
  (`uuid[]`, 2 or 3 entries, enforced by a check constraint),
  `meeting_link`.

RLS: every table is owner-only (`auth.uid() = owner_id`) for all
operations. The `/m/[token]` flow deliberately does **not** get a public
RLS policy — a policy can't cheaply express "this anonymous visitor may
read exactly the one row matching a token they hold," so that page and its
link-update route (`app/api/m/[token]/link/route.ts`) go through a
service-role client (`lib/supabase/admin.ts`, `SUPABASE_SERVICE_ROLE_KEY`,
never sent to the browser) and do the token-match authorization in
application code instead — every query in `resolveMemberByToken()` is
narrowed to that one member and their own owner's data, never a broader
listing.

Seed data: 10 demo members ("Ana Jovanovic" ... "Filip Maric") and one past
week's pairing (5 pairs, since 10 is even) with a couple of meeting links
filled in and a couple left blank, so the "run pairing" button has real
history to avoid repeating. `owner_id` is a real FK into `auth.users`, so
the seed block uses a placeholder UUID
(`00000000-0000-0000-0000-000000000001`) — see the comment at the top of
the seed section in `schema.sql` for the one-time replace-with-a-real-demo-user
step once the shared Supabase project exists.

## What's genuinely untestable until Supabase is live

- The actual RLS policies (can't confirm `auth.uid() = owner_id` behaves
  as expected against a real Postgres instance — reasoned through
  carefully against Supabase's documented RLS semantics, but not executed).
- The magic-link login round trip end-to-end (template-provided, already
  documented as verified against real credentials once in
  `nextjs-template-decisions` memory, but not re-verified per-idea).
- The `/m/[token]` service-role flow's actual query results — logic is
  straightforward (three narrow lookups keyed by token/owner/week) but
  unexercised against a live DB.
- Whether the "avoid back-to-back" pairing algorithm's shuffle-and-score
  approach produces good results at odd team sizes beyond what was
  hand-verified with a Node scratch script (10, 9, 3, 1, 0, 2 members) —
  worth eyeballing with real usage once live.
