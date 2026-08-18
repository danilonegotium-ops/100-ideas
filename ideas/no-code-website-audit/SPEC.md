# No-Code Website Audit — SPEC

**MVP:** User pastes a URL, `api/audit.js` (Vercel Node serverless function) fetches it
server-side — sidestepping browser CORS entirely — and runs 8 checks that require no paid
external API: title tag presence/length, meta description presence/length, viewport meta tag,
HTTPS, HTML document size in KB, image `alt` attribute coverage, favicon presence (checks for a
`<link rel="icon">` tag, falling back to a live HEAD-equivalent check of `/favicon.ico` at the
default location if no tag is found), and server response time. Each check returns
pass/warn/fail plus a plain-language explanation. Overall score out of 10 is the mean of each
check's weight (pass=1, warn=0.5, fail=0) scaled to 10, rounded to 1 decimal. HTML is parsed
with small regex-based tag/attribute extractors (no cheerio/jsdom dependency, keeps the
function fast and dependency-free) — good enough for well-formed pages; deliberately not a full
HTML parser.

**PageSpeed integration (present but untested — no key exists yet):** if
`GOOGLE_PAGESPEED_API_KEY` is set in the Vercel project's environment variables,
`api/audit.js` additionally calls `GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=<url>&key=<key>&category=PERFORMANCE&strategy=mobile`
and reads `lighthouseResult.categories.performance.score` (a 0-1 float from the v5 API,
multiplied by 100 here) per Google's documented v5 response shape, mapped to pass/warn/fail
using Lighthouse's own published thresholds (>=90 pass, 50-89 warn, <50 fail). This is
surfaced as a separate `pagespeed` bonus field in the API response and rendered as a note under
the checklist — **it is never folded into the core `/10` score**, so the tool is fully useful
with zero configuration and the score's meaning doesn't shift once a key is added later. Without
the key, `pagespeed.available` is `false` and the UI just doesn't show a bonus note.

**Out of scope for this pass:** crawling more than the single entered URL (no sitemap/multi-page
audit), robots.txt/sitemap.xml checks, structured data (schema.org) validation, broken link
checking, historical tracking of scores over time.

**Data:** no curated dataset — all logic is live, per-request analysis of whatever URL the user
enters. Scoring thresholds (e.g. title 10-60 chars, meta description 50-160 chars) are common,
widely-cited SEO guidance (matching Google's search snippet truncation behavior), not sourced
from a single specific citation.
