# JSON to Serbian Cyrillic

A developer utility that transliterates Serbian Latin text into Serbian Cyrillic. Two modes:
**JSON mode** (default) parses the input with `JSON.parse`, walks the resulting structure
recursively, and transliterates only string *values* by default (object keys are left alone
unless "Transliterate keys too" is checked), then re-serializes with `JSON.stringify(_, null, 2)`
— numbers, booleans, null, and the overall array/object structure are untouched. **Plain text
mode** skips JSON parsing entirely and transliterates the raw input as-is. Invalid JSON in JSON
mode shows a clear inline error (`Invalid JSON: <native SyntaxError message>`) instead of
silently failing. A collapsible reference table shows the full Latin→Cyrillic letter mapping.

The transliteration correctly handles the three Serbian digraphs (lj, nj, dž), which each map to
a single Cyrillic letter (љ, њ, џ) and are matched before single letters via a length-sorted
regex, plus all five diacritic letters (č, ć, š, ž, đ). Case is preserved, including the
Latin-digraph quirk where both "Lj" (title case) and "LJ" (all caps) collapse to the same
Cyrillic capital "Љ" (Cyrillic has no separate digraph concept). All logic is pure/testable
(`transliterateText`, `transliterateJsonValue`, `convert` in `app.js`) with the mapping table
itself as data in `data.js`.

**Out of scope for this pass:** the small set of genuine Serbian words where `lj`/`nj`/`dž`
span a morpheme boundary and should NOT be treated as a digraph (e.g. "injekcija" → "инјекција"
not "ињекција"; "nadživeti" → "надживети" not "наџивети"). Handling these correctly requires a
curated dictionary of exceptions, which real-world Serbian transliteration tools maintain — out
of scope for a weekend MVP. The common-case digraph-first approach used here is correct for the
overwhelming majority of everyday text. Also out of scope: ASCII "dj" as a stand-in for "đ"
(ambiguous without a dictionary, not requested), and q/w/x/y are passed through unchanged since
they aren't part of the standard Serbian alphabet.

**Data:** the Latin↔Cyrillic letter-pair table in `data.js` is a standard, well-known linguistic
mapping (the official Serbian Latin/Cyrillic dual-alphabet correspondence), not scraped from any
site — it's the same 30-letter correspondence taught in any Serbian orthography reference.
