# Static template — usage for agents

For any Wave 1 / Wave 2 idea:

1. Copy this folder to `ideas/<slug>/` (e.g. `ideas/is-it-friday-yet/`).
2. Replace `{{TITLE}}` and `{{DESCRIPTION}}` in `index.html`.
3. Build the actual feature in `app.js`, styled with the existing classes in `theme.css` (`.card`, `.btn`, `.stack`, `.row`, inputs, etc.) — add idea-specific CSS at the bottom of a local copy of `theme.css` only if truly needed, don't fight the existing tokens.
4. No build step, no `npm install`, no framework. Plain HTML/CSS/JS only. It must work by opening `index.html` directly or via any static file server.
5. Add a `vercel.json` only if the idea needs URL rewrites; otherwise Vercel auto-detects a static site with zero config.
6. Write a short `SPEC.md` in the idea folder: one paragraph on what the MVP does, what's explicitly out of scope for this pass, and any data/content you curated (cite sources for factual claims like nutrition numbers or electricity prices).
7. If the idea needs a small dataset (e.g. curated restaurants, riddles, recipes), put it in `data.js` as a plain JS array/object and `app.js` imports it with a `<script src="data.js">` tag before `app.js` — keep content and logic separate so it's easy to extend later.
8. Test by actually opening the file in a browser and using every interactive element before marking status as `built (undeployed)` in `../../MASTER_TRACKER.md`.
9. Keep it genuinely standalone — no relative imports reaching outside the idea's own folder — because each idea deploys as an independent Vercel project.
