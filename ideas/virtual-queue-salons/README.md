# Next.js + Supabase template — usage for agents

Shared starter for any **Wave 3+** idea (needs accounts/DB, and/or an AI API call). For pure static tools with no backend, use `_shared/static-template` instead — see `docs/PLAN.md`.

Stack: Next.js 14 (App Router) + TypeScript + Tailwind CSS + `@supabase/ssr`. Deploys to Vercel as a serverless app, same as every other idea, each as its own independent project.

## 1. Copy this template into a new idea

```
cp -R _shared/nextjs-template ideas/<slug>/
cd ideas/<slug>/
rm -rf node_modules .next   # if present — reinstall clean below
```

Then:

1. Open `package.json` and rename the `"name"` field from `"nextjs-template"` to `"<slug>"` (e.g. `"roommate-matcher"`). This is also what Vercel will use to label the project if you don't override it.
2. `npm install`
3. `cp .env.local.example .env.local` and fill in the real Supabase URL/anon key (shared project — ask for these rather than creating a new Supabase project). Leave `GOOGLE_AI_API_KEY` blank unless this idea is Wave 4/5.
4. `npm run dev` and confirm the placeholder homepage loads at `localhost:3000`.
5. Replace `app/page.tsx` (and everything else) with the real idea. Keep `components/Nav.tsx`'s "back to all tools" link and the `Button`/`Card` components / Tailwind color tokens so it stays visually consistent with the rest of the sprint — tweak, don't replace, unless the idea genuinely needs something different.
6. Write a `SPEC.md` in the idea folder — same as the static template: one paragraph on what the MVP does, what's explicitly out of scope for this pass, and any data you curated (cite sources for factual claims).
7. Keep the idea genuinely standalone — no relative imports reaching outside `ideas/<slug>/` — because each idea deploys as an independent Vercel project with its own root directory.

## 2. Supabase — shared project, namespaced tables

Every Wave 3+ idea uses the **same** Supabase project (see `docs/PLAN.md`), so table names must be namespaced to avoid collisions:

```
<slug>_<table>
```

Example: the `roommate-matcher` idea's profiles table is `roommate_matcher_profiles` (underscores, since Postgres identifiers don't take hyphens — swap `-` for `_` when going from slug to table prefix). Write migrations for your tables (plain `.sql` files under an `ideas/<slug>/supabase/` folder is fine — there's no shared migration runner set up yet) and scope RLS policies per table so one idea's data isn't readable by another's queries.

## 3. Auth — passwordless email magic link

Already wired up and working as soon as real Supabase env vars are in `.env.local`:

- `app/login/page.tsx` — email input, calls `supabase.auth.signInWithOtp()`.
- `app/auth/callback/route.ts` — exchanges the `?code=` param from Supabase's confirmation email for a session (this is the default Supabase email template's redirect target; no dashboard email-template edits needed).
- `middleware.ts` + `lib/supabase/middleware.ts` — refreshes the session cookie on every request so users don't get randomly logged out.
- `lib/supabase/client.ts` — browser client, for Client Components. Only call `createClient()` inside an event handler or `useEffect`, never at render time (see the comment in that file — it throws if env vars are missing, and calling it during render would make builds depend on live credentials).
- `lib/supabase/server.ts` — server client for Server Components / Route Handlers, plus a `getUser()` helper for the common case of "who's logged in".
- `lib/supabase/useUser.ts` — client-side `useUser()` hook (reactive, e.g. for a header that shows who's logged in) if a Server Component's `getUser()` doesn't fit.

If an idea needs a protected page, check `getUser()` (or `useUser()`) and `redirect("/login")` if there's no user — see `next/navigation`'s `redirect()`.

## 4. Adding an AI API route (Wave 4/5 only)

The Google AI Studio key must never reach the browser. Add a Route Handler:

```
app/api/<name>/route.ts
```

```ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { prompt } = await request.json();

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
      process.env.GOOGLE_AI_API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    },
  );

  if (!res.ok) {
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
```

Call this from a Client Component with `fetch("/api/<name>", { method: "POST", body: ... })`. Never call the Google AI API directly from client code, and never put `GOOGLE_AI_API_KEY` behind a `NEXT_PUBLIC_` prefix. Check the actual current Gemini API request/response shape before relying on the snippet above verbatim — model names and endpoints do change.

## 5. Design system

Same tokens as `_shared/static-template/theme.css`, value-for-value, just expressed as Tailwind theme extensions instead of raw CSS (see `tailwind.config.ts` and the CSS custom properties in `app/globals.css`):

| Tailwind utility | CSS variable | Static template equivalent |
|---|---|---|
| `bg-bg` | `--bg` | `body` background |
| `bg-surface` | `--bg-elevated` | `.card` background |
| `border-border` | `--border` | `.card` border |
| `text-fg` | `--text` | body text |
| `text-muted` | `--text-muted` | `.muted` / `p.tagline` |
| `bg-accent` / `text-accent` | `--accent` | `button` / `.btn` |
| `bg-accent-strong` | `--accent-strong` | button hover |
| `text-danger` / `bg-danger` | `--danger` | error states |
| `rounded` / `rounded-brand` | `--radius` | `.card` / `button` radius |
| `max-w-site` | `--max-width` | `.wrap` max-width |
| `font-sans` / `font-mono` | `--font-sans` / `--font-mono` | body font / `.mono` |

`components/Button.tsx`, `components/Card.tsx`, `components/Nav.tsx` already use these — build new UI with them rather than raw hex values or one-off Tailwind colors.

## 6. Build/verify before marking status in the tracker

```
npm run build
```

should pass with no Supabase/AI credentials configured — it did for the template itself. If it doesn't for your idea, you've likely called `createClient()` (or fetched an AI endpoint) at module scope or during a Server/Client Component's render instead of inside a function that only runs at request/interaction time. See the comments in `lib/supabase/client.ts` and `lib/supabase/server.ts`.
