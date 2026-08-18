# Website Carbon Footprint — SPEC

**MVP:** User pastes a URL, `api/carbon.js` (Vercel Node serverless function) fetches it
server-side (avoids browser CORS), measures the transferred size of the main HTML response
(prefers the `Content-Length` response header when present, falls back to the decoded body's
byte length), and estimates grams of CO2 per pageview using the **Sustainable Web Design (SWD)
model v4** — the open-source, peer-reviewed methodology published by The Green Web Foundation —
via the real `@tgwf/co2` npm package (`co2.perVisit(bytes, green)`, not a hand-derived formula).
Hosting is conservatively assumed non-green (`green: false`) since this pass doesn't verify the
hosting provider. The result includes the SWD model's own A+-to-F sustainability rating
(`co2.js`'s `ratingScale`) and a plain-language comparison to seconds/minutes of video
streaming, using a citable reference point: IEA's 2020 corrected estimate of ~36g CO2 per hour
of video streaming (George Kamiya, "The carbon footprint of streaming video: fact-checking the
headlines," https://www.iea.org/commentaries/the-carbon-footprint-of-streaming-video-fact-checking-the-headlines)
— chosen over the earlier, widely-debunked Shift Project figures specifically because it's the
corrected, credible number.

**Explicit simplification (surfaced in both the API response and the UI):** page weight is
measured from a **single server-side fetch of the HTML document only** — not a full
resource-waterfall measurement of every CSS/JS/image/font/XHR request a real browser would make
when rendering the page. This under-counts total page weight for most real sites. A true
waterfall measurement needs a headless browser (Puppeteer/Playwright) recording the network
panel, which doesn't fit a zero-server-cost static + serverless-function deploy — noted as
out of scope for this pass, both in the API's `pageWeight.note` field and in the UI's
"Methodology" caveat box.

**Out of scope for this pass:** verifying green/renewable hosting via a live green-hosting
directory lookup (would require an extra external API call to The Green Web Foundation's
Green Web Check API — skipped to keep this pass simple and dependency-light; hosting is always
assumed non-green, which is the conservative/worse-case assumption), historical tracking of a
site's footprint over time, comparing against other sites' scores, resource-level breakdown
(images vs. scripts vs. fonts).

**Data/dependency:** `@tgwf/co2` (npm, `^0.19.0`, Apache-2.0 licensed) is a real dependency
installed via `package.json` — Vercel's zero-config Node function build installs it
automatically from `package-lock.json` before deploying `api/carbon.js`. Verified its actual
current API (not guessed) by reading the installed package's `dist/cjs/co2.js` and
`dist/cjs/sustainable-web-design-v4.js` source directly: `new co2({ model: "swd", version: 4,
rating: true })` then `.perVisit(bytes, green)` returns `{ total, rating }` when
`rating: true`, where `total` is grams CO2e (confirmed by the library's own JSDoc: "@param
{number} co2e - The CO2 emissions of the website in grams").
