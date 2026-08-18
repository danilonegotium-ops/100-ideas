/* Water Intake Gamified
 * Core date/streak/state logic and tree-svg rendering are pure functions
 * (no DOM, no localStorage inside them) so they can be sanity-checked with
 * plain `node`. DOM + localStorage wiring lives in the guarded block below.
 */

var STORAGE_KEY = 'water-intake-gamified-v1';
var STAGE_META = [
  { key: 'seed', label: 'Seed planted' },
  { key: 'sprout', label: 'Sprouting' },
  { key: 'sapling', label: 'Sapling' },
  { key: 'young-tree', label: 'Young tree' },
  { key: 'full-tree', label: 'Full tree' },
  { key: 'blooming', label: 'Blooming — goal reached!' }
];

function round(n) {
  return Math.round(n * 100) / 100;
}

function pad2(n) {
  return n < 10 ? '0' + n : String(n);
}

function formatDateKey(date) {
  return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate());
}

function addDays(dateKey, days) {
  var parts = dateKey.split('-').map(Number);
  var dt = new Date(parts[0], parts[1] - 1, parts[2]);
  dt.setDate(dt.getDate() + days);
  return formatDateKey(dt);
}

function isConsecutiveDay(prevDateKey, currentDateKey) {
  if (!prevDateKey) return false;
  return addDays(prevDateKey, 1) === currentDateKey;
}

function getDefaultState(todayKey) {
  return { goal: 8, today: todayKey, countToday: 0, streak: 0, lastCompletedDate: null };
}

function rolloverIfNewDay(state, todayKey) {
  if (state.today === todayKey) return state;
  return Object.assign({}, state, { today: todayKey, countToday: 0 });
}

function applyDrink(state, todayKey) {
  var rolled = rolloverIfNewDay(state, todayKey);
  var newCount = rolled.countToday + 1;
  var newState = Object.assign({}, rolled, { countToday: newCount });
  var alreadyCompletedToday = rolled.lastCompletedDate === todayKey;
  if (newCount >= rolled.goal && !alreadyCompletedToday) {
    var continuesStreak = isConsecutiveDay(rolled.lastCompletedDate, todayKey);
    newState.streak = continuesStreak ? rolled.streak + 1 : 1;
    newState.lastCompletedDate = todayKey;
  }
  return newState;
}

function applyUndo(state, todayKey) {
  var rolled = rolloverIfNewDay(state, todayKey);
  var newCount = Math.max(0, rolled.countToday - 1);
  return Object.assign({}, rolled, { countToday: newCount });
}

function resetToday(state, todayKey) {
  var rolled = rolloverIfNewDay(state, todayKey);
  var resetState = Object.assign({}, rolled, { countToday: 0 });
  if (rolled.lastCompletedDate === todayKey) {
    resetState.lastCompletedDate = null;
    resetState.streak = Math.max(0, rolled.streak - 1);
  }
  return resetState;
}

function setGoal(state, todayKey, newGoal) {
  var rolled = rolloverIfNewDay(state, todayKey);
  return Object.assign({}, rolled, { goal: Math.max(1, Math.round(newGoal) || 1) });
}

function getPercent(state) {
  if (state.goal <= 0) return 0;
  return (state.countToday / state.goal) * 100;
}

function getStageIndex(state) {
  var percent = getPercent(state);
  if (percent <= 0) return 0;
  if (percent < 25) return 1;
  if (percent < 50) return 2;
  if (percent < 75) return 3;
  if (percent < 100) return 4;
  return 5;
}

function wrapSvg(size, parts) {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + size + ' ' + size +
    '" width="' + size + '" height="' + size + '">' + parts.join('') + '</svg>';
}

function buildTreeSVG(stageIndex) {
  var size = 240;
  var groundY = 205;
  var parts = [];
  parts.push('<rect x="0" y="' + groundY + '" width="' + size + '" height="' + (size - groundY) + '" fill="#4a3624" opacity="0.4" />');

  if (stageIndex <= 0) {
    parts.push('<ellipse cx="120" cy="' + (groundY + 2) + '" rx="16" ry="5" fill="#5b4632" />');
    parts.push('<circle cx="120" cy="' + (groundY - 3) + '" r="5" fill="#8a6d4b" />');
    return wrapSvg(size, parts);
  }

  var trunkHeight = 14 + stageIndex * 24;
  var trunkWidth = 6 + stageIndex * 2.5;
  var trunkX = 120 - trunkWidth / 2;
  var trunkY = groundY - trunkHeight;
  parts.push('<rect x="' + round(trunkX) + '" y="' + round(trunkY) + '" width="' + round(trunkWidth) +
    '" height="' + round(trunkHeight) + '" rx="3" fill="#6b4a2f" />');

  var canopyCy = trunkY - 6;
  var baseRadius = 10 + stageIndex * 11;
  var canopyOffsets = [
    { dx: 0, dy: 0, scale: 1 },
    { dx: -baseRadius * 0.6, dy: baseRadius * 0.25, scale: 0.72 },
    { dx: baseRadius * 0.6, dy: baseRadius * 0.25, scale: 0.72 },
    { dx: 0, dy: -baseRadius * 0.55, scale: 0.65 }
  ];
  var greens = ['#4ade80', '#34d399', '#22c55e', '#16a34a'];
  canopyOffsets.forEach(function (o, i) {
    if (stageIndex < 2 && i > 1) return;
    var r = baseRadius * o.scale;
    var cx = 120 + o.dx;
    var cy = canopyCy + o.dy;
    parts.push('<circle cx="' + round(cx) + '" cy="' + round(cy) + '" r="' + round(r) + '" fill="' + greens[i % greens.length] + '" />');
  });

  if (stageIndex >= 5) {
    var flowerSpots = [
      { dx: -baseRadius * 0.5, dy: -baseRadius * 0.2 },
      { dx: baseRadius * 0.45, dy: -baseRadius * 0.1 },
      { dx: 0, dy: baseRadius * 0.3 },
      { dx: -baseRadius * 0.15, dy: -baseRadius * 0.5 },
      { dx: baseRadius * 0.2, dy: baseRadius * 0.5 }
    ];
    flowerSpots.forEach(function (f) {
      var cx = 120 + f.dx;
      var cy = canopyCy + f.dy;
      parts.push('<circle cx="' + round(cx) + '" cy="' + round(cy) + '" r="4.5" fill="#f9a8d4" />');
    });
  }

  return wrapSvg(size, parts);
}

/* ---- DOM + localStorage wiring ---- */
if (typeof document !== 'undefined') {
  (function () {
    var treeStage = document.getElementById('treeStage');
    var progressText = document.getElementById('progressText');
    var streakText = document.getElementById('streakText');
    var drinkBtn = document.getElementById('drinkBtn');
    var undoBtn = document.getElementById('undoBtn');
    var resetBtn = document.getElementById('resetBtn');
    var goalGlasses = document.getElementById('goalGlasses');
    var saveGoalBtn = document.getElementById('saveGoalBtn');

    function todayKey() {
      return formatDateKey(new Date());
    }

    function loadState() {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return getDefaultState(todayKey());
        var parsed = JSON.parse(raw);
        if (!parsed || typeof parsed.goal !== 'number') return getDefaultState(todayKey());
        return parsed;
      } catch (e) {
        return getDefaultState(todayKey());
      }
    }

    function saveState(state) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        /* localStorage unavailable (private mode / disabled) — state just won't persist */
      }
    }

    var state = rolloverIfNewDay(loadState(), todayKey());
    saveState(state);

    function render() {
      var stageIndex = getStageIndex(state);
      var meta = STAGE_META[stageIndex];
      treeStage.innerHTML = buildTreeSVG(stageIndex);
      var percent = Math.min(100, Math.round(getPercent(state)));
      progressText.textContent = state.countToday + ' of ' + state.goal + ' glasses today (' + percent + '%) — ' + meta.label;
      streakText.textContent = state.streak > 0
        ? '🔥 ' + state.streak + ' day' + (state.streak === 1 ? '' : 's') + ' streak'
        : 'Hit your goal today to start a streak.';
      goalGlasses.value = state.goal;
    }

    drinkBtn.addEventListener('click', function () {
      state = applyDrink(state, todayKey());
      saveState(state);
      render();
    });

    undoBtn.addEventListener('click', function () {
      state = applyUndo(state, todayKey());
      saveState(state);
      render();
    });

    resetBtn.addEventListener('click', function () {
      if (typeof window.confirm === 'function' && !window.confirm('Reset today\'s progress?')) return;
      state = resetToday(state, todayKey());
      saveState(state);
      render();
    });

    saveGoalBtn.addEventListener('click', function () {
      var newGoal = parseInt(goalGlasses.value, 10);
      state = setGoal(state, todayKey(), newGoal);
      saveState(state);
      render();
    });

    render();
  })();
}
