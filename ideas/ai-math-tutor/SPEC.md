# AI Math Tutor — SPEC

**MVP:** User types a math problem (arithmetic, algebra, geometry, word problem, etc — general
level, explicitly NOT tied to any specific official curriculum per the scope note in
`MASTER_TRACKER.md`). A Route Handler (`app/api/solve/route.ts`) prompts Gemini to solve it and
explain the reasoning behind each step in plain language, aimed at a general student rather than
assuming a specific textbook/grade level. If the input isn't a solvable math problem (or is too
ambiguous, e.g. missing a variable's value), the model is instructed to say so via an
`isMathProblem: false` flag plus an explanatory note instead of guessing an answer — the UI
renders that case distinctly (no fabricated "final answer" box).

**AI call:** same raw-REST-`fetch` pattern as the rest of this batch. `temperature: 0.2` (lower
than the creative-writing ideas in this batch) since correctness matters more than variety here.

**Graceful "not configured" state:** same `503 { error: "not_configured" }` pattern as the rest
of the batch.

**Input caps:** problem text capped at 1000 characters (`MAX_PROBLEM_LENGTH`).

**Prompt-construction and response-parsing (`lib/mathtutor.ts`) are pure functions**,
sanity-checked against realistic mocked Gemini responses for three cases: a solvable problem, a
correctly-flagged not-a-math-problem case, and a malformed response missing the required
`finalAnswer` field (rejected rather than silently rendering an incomplete answer) — all passed
before this was marked built.

**Out of scope for this pass:** no image/photo input (text problems only), no step-by-step
interactive quiz/hint reveal (full solution shown at once), no accounts/history (stateless), no
graphing.

**Accuracy disclaimer (shown in the UI):** "General-purpose explanations, not tied to any
specific official curriculum — always double-check important calculations." LLMs are not
guaranteed-correct calculators; this is a study aid, not a verified answer key.

**What still needs a live `GOOGLE_AI_API_KEY` to verify:** the actual Gemini call has never run
against a real key — only request-construction and response-parsing were tested via mocked
responses. Once a key exists, spot-check a handful of known-answer problems (not just that the
JSON parses, but that the math is actually correct) before trusting this for real users.
