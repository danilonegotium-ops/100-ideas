# Cold Outreach Personalizer — SPEC

**Scope adaptation (per `MASTER_TRACKER.md`):** the original idea says "scans a LinkedIn
profile" — actually scraping LinkedIn violates its Terms of Service, so this tool instead has the
user PASTE a profile bio/summary/about-section text they already have access to (their own
browser tab, a resume, an email signature, etc). The tool itself never fetches any external
profile URL; the UI copy is explicit about this so the "scan" framing doesn't mislead anyone into
thinking it scrapes on their behalf.

**MVP:** User pastes bio/profile text, optionally describes what they're reaching out about (e.g.
"our design agency helps SaaS teams with onboarding UX") and picks a tone (Professional/
Friendly/Casual). A Route Handler (`app/api/personalize/route.ts`) prompts Gemini to write 3
distinct opening lines, each required to reference a SPECIFIC detail from the pasted bio (role,
company, project, achievement, stated interest) rather than a generic greeting, with each line
labeled by its "angle" (what detail it uses) so the user can pick the one that fits best. A copy
button is provided per line.

**AI call:** same raw-REST-`fetch` pattern as the rest of this batch. `temperature: 0.8`.

**Graceful "not configured" state:** same `503 { error: "not_configured" }` pattern as the rest
of the batch.

**Input caps:** bio text capped at 4000 characters (`MAX_BIO_LENGTH` — profile bios can run
long), sender context capped at 300 characters.

**Prompt-construction and response-parsing (`lib/outreach.ts`) are pure functions**,
sanity-checked against a realistic mocked Gemini response (3 opening lines with distinct angles,
a fenced-code-block variant, a safety-block variant, and an empty-array-rejected variant) before
this was marked built.

**Out of scope for this pass:** no full email body generation (opening line only, as scoped), no
accounts/history/saved templates (stateless), no actual LinkedIn/CRM integration of any kind.

**What still needs a live `GOOGLE_AI_API_KEY` to verify:** the actual Gemini call has never run
against a real key — only request-construction and response-parsing were tested via mocked
responses.
