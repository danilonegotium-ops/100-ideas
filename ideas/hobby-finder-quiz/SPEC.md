# Hobby Finder Quiz — SPEC

## What it does
A 6-question multiple-choice quiz covering budget, indoor/outdoor setting, solo vs
social, physical vs mental, weekly time available, and creative vs analytical style.
Answers are scored against a curated list of 20 real hobbies in `data.js`, each
tagged along those same six dimensions. Exact dimension matches score 2 points, a
"flexible/no preference" tag on either side scores 1 point. The top 3 highest-scoring
hobbies are shown with a one-line "why this fits you" explanation generated from
whichever dimensions matched exactly. "Retake quiz" resets and returns to the form.

## Out of scope for this pass
- "Local availability" from the original one-line pitch (e.g. nearby clubs/classes)
  is dropped — it would require a real local-business dataset per city, which isn't
  available without a paid API or manual per-city curation. The quiz instead scores
  on budget, setting, social preference, physicality, time, and style, which are the
  dimensions the original description itself calls out ("personality, budget").
- No accounts, no saved quiz history, no sharing results.

## Data / content
`data.js` holds `QUESTIONS` (6 questions, 3 options each) and `HOBBIES` (20 real,
common hobbies with a short blurb and a tag object matching the quiz dimensions).
Curated by hand based on general knowledge of each hobby's typical cost, setting,
and time commitment — not sourced from a specific external dataset.

## Implementation notes
Scoring logic (`scoreHobby`, `rankHobbies`, `generateWhy`, `allAnswered`) is pure and
exported via a `module.exports` guard (inert in the browser, no bundler on the page)
so it's unit-tested directly from Node rather than duplicated into a scratch script.
