# Virtual Book Club

## What the MVP does

- **Your clubs** (`/`) — requires login. Lists clubs you're a member of,
  plus a separate "Invitations" section for clubs someone has invited you
  to (by email) that you haven't joined yet.
- **Create a club** (`/clubs/new`) — requires login. Names the club and
  auto-adds you as the first member.
- **Club dashboard** (`/clubs/[id]`) — requires login and either
  membership or a pending invite (enforced by RLS, not just the UI — see
  below). Members can: see and edit the "currently reading" book and the
  next meeting (date/time + optional video-call link), propose books,
  vote on proposals (toggle upvote — one vote per member per proposal),
  promote a proposal straight to "currently reading", see the member
  list, and invite new people by email.
- **Accepting an invite**: if you're invited but not yet a member,
  visiting the club page shows an "Accept invite" button instead of the
  full dashboard.

## Scope adaptations

- **"Invite by email" reuses the template's existing magic-link auth
  instead of a separate invite-token system.** Adding someone's email to
  a club just inserts an `invites` row; when *that exact email* logs in
  through the app's normal (app-wide, not club-specific) magic-link flow
  and visits the club's URL, an RLS policy lets them see the club and
  add themselves as a member — matched via `auth.jwt() ->> 'email'`,
  compared lowercased on both sides.
- **No actual invite email gets sent in this pass** — same
  `RESEND_API_KEY` gap as `newsletter-curious-minds` (see `docs/PLAN.md`).
  The *acceptance* mechanism above is fully real and testable once
  there's a live Supabase project; only the "here's a link, click it"
  notification email is a follow-up once Resend is wired up. Until then,
  the invited person needs to be told the club's URL out-of-band (or the
  homepage's "Invitations" list surfaces it automatically once they log
  in with the invited email).
- **No separate "organizer" role.** Any current member can edit the
  current book/meeting fields, promote a proposal, or invite others —
  simpler RLS, and the one-liner doesn't call for a permissions
  hierarchy. Noted here in case that's a real requirement later.
- **No per-club display names / profiles table.** Since `auth.users`
  isn't queryable by the app's anon/authenticated role and this idea
  doesn't otherwise need a profiles table, member/proposer/voter "labels"
  shown in the UI are captured at write-time from the user's own
  `supabase.auth.getUser().email` (self-supplied, never looked up for
  someone else) and stored in a plain `*_label` text column alongside the
  real uuid. RLS always keys off the uuid column; the label is cosmetic
  only. Seed/demo rows use a fixed label instead ("Demo Organizer",
  "Demo Member A", ...) since there's no real user behind them.

## Schema summary

See `schema.sql`. Five tables: `clubs`, `members`, `invites`,
`proposals`, `votes`. RLS throughout keys off club membership (a
subquery against `members`) or, for the invite-acceptance case, the
current user's JWT email matched against `invites.email`. Full detail on
the nullable-FK-plus-label seeding pattern is in the comment block at the
top of `schema.sql`.

Seed data: one demo club ("The Late Night Chapter Club", currently
reading *Klara and the Sun*, a scheduled next meeting ~12 days out with a
placeholder video link), 4 demo members, 2 book proposals with 3 and 1
votes respectively.

## What needs a live Supabase project to actually verify

- Every page under `/clubs/*` and the homepage's data queries are Server
  Components using `lib/supabase/server.ts` — excluded from static
  generation at build time (safe with empty env vars) but genuinely
  untested against a real database.
- The whole invite → accept flow depends on `auth.jwt() ->> 'email'`
  being populated and matching what's stored in `auth.users.email` for a
  magic-link session — reasoned through against Supabase's documented RLS
  patterns but not verified live. Test end-to-end once live: invite a
  second real email to the demo club, log in as that email, confirm the
  homepage shows the invitation and accepting adds a real membership row.
- `app/clubs/[id]/page.tsx` deliberately avoids calling `.in(...)` with
  an empty array (falls back to an impossible UUID instead) because
  PostgREST's handling of `col=in.()` has been a known rough edge across
  versions — worth confirming current behavior once live and simplifying
  if it turns out unnecessary.
- The RLS policies' subqueries (checking `members`/`invites` membership)
  are reasoned through but unverified against a real Postgres instance —
  in particular, double-check the `virtual_book_club_clubs_update_member`
  policy doesn't unexpectedly restrict anything once real multi-member
  data exists.
