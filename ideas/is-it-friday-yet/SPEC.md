# Is It Friday Yet — SPEC

**MVP:** A one-page site that answers, in large dramatic type, whether today is Friday. The check is pure client-side day-of-week math off `new Date().getDay()` (0=Sunday..6=Saturday) — no server, no timezone handling beyond the visitor's own local clock. When it is Friday, the page shows a big green "YES" with celebratory copy. Any other day shows a red "NO" plus a message and border-color mood that escalates the closer/further the visitor is from Friday (tomorrow-is-Friday gets excited copy, Saturday — having just missed it — gets the most deflated copy, mid-week gets a plain countdown). The page re-evaluates once a minute so a tab left open across midnight updates itself.

**Out of scope for this pass:** ad monetization (the original one-liner mentions "monetized by ads" — no ad network account exists yet, this is a hosting/business decision for a later pass, not a product feature); multi-timezone support (uses the visitor's local system clock only, which is the expected behavior for this kind of novelty page); persistence/history of past visits.

**Data/content:** none curated — the copy variants for each mood bucket are hand-written in `app.js` (`getFridayStatus`), not sourced from any external dataset.
