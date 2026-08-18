# Subscription Tracker for Teams — SPEC

## What the MVP does

A single dashboard (`/`) lists every SaaS subscription a team pays for —
tool name, cost, billing cycle, owner, last-used date. Adding one is a
plain form; each row has "Mark used today" (updates `last_used_date`) and
"Delete." The dashboard header shows total monthly spend, total annual
spend, and a count (+ wasted monthly cost) of "zombie" subscriptions —
anything not marked used in 60+ days, or never marked used at all. A
"Zombies only" checkbox filters the list down to just those.

Monthly/annual figures are normalized on the fly (`lib/subscriptions.ts`):
an annual subscription's monthly-equivalent cost is `cost / 12`, and vice
versa, so the totals and the "wasted $/mo" figure are apples-to-apples
even though tools are billed on different cycles.

## Scope adaptations

- **No login / single shared workspace.** This is treated as one internal
  team tool for the MVP rather than a multi-tenant SaaS product — every
  visitor sees and can edit the same subscription list. This matches the
  assignment's scale ("seed ~12 demo subscriptions," not "seed 12 teams
  each with their own"). A real production version would add a
  `team_id`/`owner_id` column and gate `/` behind the shared template's
  magic-link login (already available, unused here) before handling a
  real company's actual billing data — see the note at the top of
  `schema.sql`.
- "Manual entry, not bank-linked" — matches `MASTER_TRACKER.md`'s existing
  note; there was never a plan to integrate real billing APIs here.

## Schema summary

One table, `subscription_tracker_teams_subscriptions`: `tool_name`,
`cost_cents`, `billing_cycle` (`monthly`/`annual`), `owner_name`,
`category` (optional), `url` (optional), `last_used_date` (nullable —
`null` means "never marked used," which counts as a zombie same as 60+
days stale), `notes`. RLS is open (`for all using (true) with check
(true))` — see the scope note above and the comment in `schema.sql`.

`seed.sql` inserts 12 realistic tools (Figma, Notion, Slack, GitHub, Zoom,
Datadog, Canva, Adobe CC, Asana, Mailchimp, HelloSign, Loom) with
`last_used_date` set as offsets from `current_date`, so the zombie flag
stays meaningful regardless of when the seed is actually run — 5 come out
as zombies (2 unused 90+/120+ days, 1 never used, 1 unused 200 days, 1
unused 75 days), the rest as active, deliberately including one
just-under-the-line case (45 days) to show the threshold isn't triggering
everything.

## What still needs a live Supabase project to verify

- All query/insert/update/delete behavior against the open RLS policy is
  reasoned through, not run live — this is the simplest of the 5 schemas
  (one table, no foreign keys, no RLS joins), so the risk here is low.
- `lib/subscriptions.ts`'s date math was checked by hand-tracing a few
  cases (null date → zombie; date exactly at day 59 vs 60) but not
  against Postgres's actual `date` column round-tripping through
  `@supabase/supabase-js` (dates come back as `"YYYY-MM-DD"` strings,
  which is what the code assumes — worth a quick live sanity check once
  Supabase exists).
