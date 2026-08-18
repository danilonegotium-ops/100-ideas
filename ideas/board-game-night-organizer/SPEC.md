# Board Game Night Organizer

Helps groups decide which game to play based on player count and how much time they have. Enter
the number of players and minutes available, and the tool ranks a curated list of 25 real,
well-known board/card/party games by how well they fit, showing the top 5.

## How it works

- `data.js` holds `GAMES`, a static array of 25 well-known games (Catan, Ticket to Ride,
  Codenames, Pandemic, Splendor, Azul, Carcassonne, 7 Wonders, Dixit, Wingspan, King of Tokyo,
  Sushi Go!, Love Letter, Coup, Bang!, Sagrada, Terraforming Mars, Scythe, Clue, Uno, Exploding
  Kittens, The Resistance: Avalon, One Night Ultimate Werewolf, Bohnanza, Forbidden Island) with
  `minPlayers`/`maxPlayers` and `minTime`/`maxTime` (minutes) taken from each game's commonly
  published box/publisher info, plus a one-line description.
- `app.js` has pure scoring functions (`computePlayerScore`, `computeTimeScore`, `rankGames`) with
  no DOM dependency, so the ranking logic is testable in plain Node:
  - Player-count score: 0 if the input player count is inside the game's supported range (with a
    small bonus the closer it is to the midpoint of that range), otherwise a penalty proportional
    to how far outside the range it is.
  - Time score: 0 if the available minutes fall inside the game's typical playtime range; a small
    penalty if there's a lot of unused time (game may feel short for the slot); a larger penalty
    if the available time is less than the game's minimum typical playtime (risk of not finishing).
  - Games are sorted by total score (ascending) and the top 5 are shown.
  - If no game perfectly fits the player count (e.g. a very large or very small group), the
    ranking still returns the *closest* matches rather than an empty list, and each result card
    shows a caveat badge (e.g. "needs at least 3 players") so the fallback is transparent instead
    of silently pretending it's a perfect fit.
- Pressing Enter in either input also triggers a search; results re-render fully client-side.

## Out of scope for this pass

- No filtering by game complexity/weight, genre, or age rating — only player count + time.
- No "owned games" list / personal collection — the dataset is a fixed curated list.
- No links to buy/rules PDFs.

## Data sourcing

Player counts and playtime ranges reflect the ranges commonly printed on each game's
box/publisher listing (e.g. BoardGameGeek / publisher product pages) as general public knowledge;
these are typical ranges, not guarantees — actual playtime varies by group experience level.
