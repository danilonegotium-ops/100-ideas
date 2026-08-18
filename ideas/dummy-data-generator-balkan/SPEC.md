# Dummy Data Generator (Balkan)

Generates N fake user profiles (default 10, clamped to a max of 100) with realistic Serbian
first/last names, Balkan cities, Serbian mobile phone numbers in `+381 6X XXX XXXX` format, and
emails derived from the (diacritic-stripped, e.g. đ → dj) name. Results render in a table plus
"Copy as JSON" and "Copy as CSV" buttons (CSV values are comma/quote/newline-escaped per the
usual CSV convention). Generation logic (`generateProfile`, `generateProfiles`, `generatePhone`,
`generateEmail`, `profilesToCSV`, `profilesToJSON`) is pure aside from an injected `rng`
function, so it's independent of the DOM and was sanity-checked with a plain node script.

**Out of scope for this pass:** street-level addresses (only city is generated — no fake street
names/house numbers, since a wrong-looking fake street is more likely to be mistaken for a real
one than a wrong-looking fake city), avatar/photo generation, saved/exportable presets, seeding
via a URL-shareable random seed for reproducible output.

**Data:** `data.js` contains a self-authored seed list — 30 first names, 30 last names, 20
Balkan cities, and 4 common email domains — written for this tool as generic, common
Serbian/Balkan names and real (but non-specific) city names. Not scraped from any directory or
real-person database; this is synthetic test data by design.
