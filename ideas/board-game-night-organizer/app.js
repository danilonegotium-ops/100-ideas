/* Board Game Night Organizer
 * Recommends games from the curated GAMES list (data.js) based on player
 * count and available time. The scoring/ranking functions below are pure
 * (no DOM) so they can be sanity-checked with plain `node`.
 */

function computePlayerScore(game, players) {
  if (players < game.minPlayers) return (game.minPlayers - players) * 2;
  if (players > game.maxPlayers) return (players - game.maxPlayers) * 2;
  var mid = (game.minPlayers + game.maxPlayers) / 2;
  return Math.abs(players - mid) * 0.3;
}

function computeTimeScore(game, minutes) {
  if (minutes >= game.maxTime) return (minutes - game.maxTime) * 0.15;
  if (minutes >= game.minTime) return 0;
  return (game.minTime - minutes) * 1.5;
}

function playerFitLabel(game, players) {
  if (players < game.minPlayers) return 'needs at least ' + game.minPlayers + ' players';
  if (players > game.maxPlayers) return 'best up to ' + game.maxPlayers + ' players';
  return 'fits your group size';
}

function timeFitLabel(game, minutes) {
  if (minutes >= game.maxTime) return 'comfortably fits your time';
  if (minutes >= game.minTime) return 'good time fit';
  return 'may run over your available time';
}

function rankGames(games, players, minutes, topN) {
  topN = topN || 5;
  players = Number(players);
  minutes = Number(minutes);
  var scored = games.map(function (g) {
    var playerScore = computePlayerScore(g, players);
    var timeScore = computeTimeScore(g, minutes);
    var fitsPlayers = players >= g.minPlayers && players <= g.maxPlayers;
    var fitsTime = minutes >= g.minTime;
    return Object.assign({}, g, {
      score: playerScore + timeScore,
      fitsPlayers: fitsPlayers,
      fitsTime: fitsTime,
      playerLabel: playerFitLabel(g, players),
      timeLabel: timeFitLabel(g, minutes)
    });
  });
  scored.sort(function (a, b) { return a.score - b.score; });
  return scored.slice(0, topN);
}

/* ---- DOM wiring ---- */
if (typeof document !== 'undefined') {
  (function () {
    var playerInput = document.getElementById('playerCount');
    var minutesInput = document.getElementById('minutesAvailable');
    var findBtn = document.getElementById('findBtn');
    var results = document.getElementById('results');

    function renderResults() {
      var players = Math.max(1, parseInt(playerInput.value, 10) || 1);
      var minutes = Math.max(5, parseInt(minutesInput.value, 10) || 5);
      var matches = rankGames(GAMES, players, minutes, 5);

      results.innerHTML = '';
      if (!matches.length) {
        results.innerHTML = '<p class="muted">No games in the list — try different numbers.</p>';
        return;
      }

      var heading = document.createElement('h2');
      heading.textContent = 'Top picks for ' + players + ' players, ' + minutes + ' minutes';
      results.appendChild(heading);

      matches.forEach(function (game, i) {
        var card = document.createElement('div');
        card.className = 'card game-result';
        var badgeRow = '';
        if (!game.fitsPlayers || !game.fitsTime) {
          badgeRow = '<p class="muted game-caveat">⚠ ' +
            (!game.fitsPlayers ? game.playerLabel : '') +
            (!game.fitsPlayers && !game.fitsTime ? ' &middot; ' : '') +
            (!game.fitsTime ? game.timeLabel : '') + '</p>';
        }
        card.innerHTML =
          '<h3>' + (i + 1) + '. ' + escapeHtml(game.name) + '</h3>' +
          '<p class="muted">' + game.minPlayers + '–' + game.maxPlayers + ' players &middot; ' +
          game.minTime + (game.minTime !== game.maxTime ? '–' + game.maxTime : '') + ' min</p>' +
          '<p>' + escapeHtml(game.description) + '</p>' +
          badgeRow;
        results.appendChild(card);
      });
    }

    function escapeHtml(str) {
      var div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    findBtn.addEventListener('click', renderResults);
    playerInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') renderResults(); });
    minutesInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') renderResults(); });

    renderResults();
  })();
}
