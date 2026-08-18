# Domain Name Brainstormer — SPEC

**MVP:** User enters a few keywords describing their project and an optional naming style
(Any / Short & brandable / Descriptive). A Route Handler (`app/api/brainstorm/route.ts`) prompts
Gemini for 10 candidate domain names, mixing `.com` and `.rs` endings naturally (per the original
idea's "available-sounding .com/.rs mix" spec), each with a one-line rationale. The AI's response
is sanitized into valid DNS labels (`lib/domains.ts#sanitizeDomainLabel` — lowercase, ASCII
letters/digits/hyphens only, 1-63 chars, deduped) and any entry with an invalid TLD or empty name
after sanitization is dropped rather than shown broken.

**Real DNS availability check (`lib/dns-check.ts`):** for every candidate, the server does a real
`dns.promises.resolveNs()` lookup (Node's built-in `dns` module — no external paid API, no key
needed) against the candidate's full domain. **Design choice, confirmed by live testing:** this
checks for NS (nameserver) *delegation* rather than an A record, because a domain can be
registered and "parked" with no A record at all, but it still has NS records once a registrar has
delegated it — so NS presence is a meaningfully better DNS-only proxy for "is this registered"
than an A-record check would be. `ENOTFOUND`/`ENODATA` (no NS records anywhere) →
`likely-available`; NS records found → `likely-taken`; any other error (timeout, server failure)
→ `unknown` rather than guessing. A 5-second timeout wraps each lookup so one slow response can't
stall the whole request; all 10 lookups run in parallel via `Promise.all`.

**This was live-tested against real domains** (not just mocked) — `google.com`, `wikipedia.org`,
and `gov.rs` (a real .rs domain) all correctly resolved NS records and returned `likely-taken`;
randomly-generated unlikely strings under both `.com` and `.rs` correctly returned
`ENOTFOUND`/`likely-available`. No AI/API key was needed for this part since DNS resolution
requires none — this is genuinely exercised code, not just reasoned-about code.

**Disclaimer shown prominently in the UI** (not just in this doc): DNS resolution isn't a perfect
proxy for domain registration status — a domain can be registered but not yet have DNS configured
(would incorrectly show as available here), or DNS records can persist briefly after expiry. This
is a best-effort signal, not a WHOIS check, and the UI says so directly above the results.

**AI call:** same raw-REST-`fetch` pattern as the rest of this batch. `temperature: 1.0` for
naming creativity.

**Graceful "not configured" state:** same `503 { error: "not_configured" }` pattern as the rest
of the batch — note this only affects the AI-generated name suggestions; the DNS-check code path
itself needs no API key at all and was verified live as described above.

**Input caps:** keywords capped at 200 characters (`MAX_KEYWORDS_LENGTH`).

**Prompt-construction and response-parsing (`lib/domains.ts`) are pure functions**,
sanity-checked against a realistic mocked Gemini response including a duplicate entry, an invalid
TLD, and an empty name (all correctly deduped/dropped) before this was marked built.

**Out of scope for this pass:** no real WHOIS/registrar API integration (explicitly the scoped
alternative — see disclaimer above), no domain purchase flow, no accounts/history (stateless).

**What still needs a live `GOOGLE_AI_API_KEY` to verify:** only the AI-generated name-suggestion
half — the DNS-availability half needs no key and has already been verified live (see above).
