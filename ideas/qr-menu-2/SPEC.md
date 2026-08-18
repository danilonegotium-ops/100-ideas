# QR Menu 2.0 — SPEC

## What the MVP does

A restaurant admin signs in (passwordless magic link, from the shared
template), creates a restaurant, builds a menu (categories + items with
prices and availability), and adds tables — each table gets a unique URL
and a generated QR code pointing at it (`/r/<slug>/t/<tableId>`).

A customer scans that QR code (or just visits the URL), browses the menu,
adds items to a cart, and checks out. If `STRIPE_SECRET_KEY` is set, checkout
creates a real Stripe Checkout Session in **test mode** and the order is
marked `paid` once Stripe confirms payment (verified server-side against
Stripe's API, not just trusted from a redirect param). If the key isn't set,
checkout clearly shows "demo mode" and still records the order as placed —
the ordering flow works end-to-end either way, per the assignment brief.

The admin dashboard has three tabs: **Orders** (live via Supabase Realtime —
new orders and payment confirmations appear without a refresh), **Menu**
(add/edit-availability/delete categories & items), and **Tables & QR codes**
(add a table, view/download its QR code).

## Scope adaptations

- **Auth is only gated on the admin side.** The customer-facing menu/cart/
  checkout flow needs no login at all (as specified). The admin flow reuses
  the shared template's magic-link auth, with one small addition:
  `app/login/page.tsx` now forwards an optional `?next=` param through to
  `app/auth/callback/route.ts` (which already validates it's a safe
  same-origin path) so `/admin` sends a logged-out visitor to `/login` and
  back to `/admin` afterwards, instead of always landing on `/`.
- **QR code library:** added `qrcode` (npm, MIT license) + `@types/qrcode`
  (MIT) as a per-idea dependency — confirmed both licenses via `npm view
  qrcode license` / `npm view @types/qrcode license` before adding, along
  with `qrcode`'s own transitive deps (`pngjs`, `yargs`, `dijkstrajs` — all
  MIT). Used client-side only (`QRCode.toDataURL()` inside a `useEffect` in
  `components/admin/QRCodeImage.tsx`), no server route needed. This is the
  only one of the 5 assigned ideas with an added dependency.
- **Stripe: real REST API via `fetch`, not the `stripe` npm SDK.** See
  `lib/stripe.ts`. Deliberate choice — this keeps the one Stripe-dependent
  idea from needing an SDK whose exact current method signatures I can't
  verify without a live account, since the REST `checkout/sessions` shape
  (form-encoded body, `{CHECKOUT_SESSION_ID}` template var in `success_url`)
  is long-stable and well-documented. **`STRIPE_SECRET_KEY` was NOT added to
  `.env.local` or set anywhere** — no Stripe account/token exists yet, so
  this idea currently only exercises the demo-mode path. Once a Stripe test
  key exists, add `STRIPE_SECRET_KEY=sk_test_...` to `.env.local` (and to
  Vercel's env vars at deploy time) to turn on the real Checkout flow — no
  code changes needed.
- Order pricing is always re-computed server-side from
  `qr_menu_2_menu_items` in `app/api/checkout/route.ts` — the client's cart
  is only ever a list of `{menuItemId, quantity}`, never trusted for price.

## Schema summary (`schema.sql` / `seed.sql`)

Tables (all prefixed `qr_menu_2_`): `restaurants` (has `owner_id ->
auth.users`), `categories`, `menu_items`, `tables`, `orders`, `order_items`.

RLS: `restaurants`/`categories`/`menu_items`/`tables` are public-read
(customers browse without login), write-restricted to the restaurant's
owner. `orders`/`order_items` have **no public policy at all** — they're
only ever written/read via the service-role admin client
(`lib/supabaseAdmin.ts`) from `app/api/checkout/route.ts` and the success
page, plus an owner-only `select` policy for the admin dashboard. This means
a customer's own order can't be read back by ID through the public anon
key — the success page fetches it server-side with the service-role key
instead, after validating (for the Stripe path) the session against
Stripe's API.

`seed.sql` creates one demo restaurant ("Demo Bistro", slug `demo-bistro`,
`owner_id = NULL`) with 4 categories, 12 menu items (one marked
unavailable, to exercise that state), and 4 tables with fixed UUIDs so the
QR/table URLs in this SPEC and the homepage's demo link are stable.

## What still needs a live Supabase project to verify

- All actual query execution — every Supabase call here (menu fetch, order
  insert, RLS enforcement, the owner-only order `select` policy) is
  reasoned through against `@supabase/supabase-js` v2's documented
  behavior and the schema's RLS policies, but has never run against a real
  Postgres instance.
- **The seeded demo restaurant's `/admin` dashboard is not reachable as
  seeded** — `owner_id` is `NULL`, so no logged-in user's `auth.uid()` will
  match it. To test the admin flow against the seed data once Supabase is
  live: sign up via `/login`, then run
  `update qr_menu_2_restaurants set owner_id = '<your-auth-uid>' where slug = 'demo-bistro';`
  Alternatively just click "Go to restaurant admin" on `/` and create a
  fresh restaurant — that flow needs no manual SQL.
- Realtime: `components/admin/OrdersManager.tsx` subscribes to
  `postgres_changes` on `qr_menu_2_orders` filtered by `restaurant_id`.
  Supabase Realtime must have replication enabled for that table (default
  for new projects, but worth confirming in the dashboard) for this to
  actually push updates.
- The full Stripe path (session creation, redirect to Stripe's hosted
  checkout, the success-page verification call) has only been reasoned
  through against Stripe's REST API docs — untestable without a real test
  API key. The demo-mode path (no key) was verified by hand-tracing the
  code, not by hitting a live endpoint, since there's no Supabase project
  to actually insert into yet either.
