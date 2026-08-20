/* Music Theory Trainer — two practice modes built on real music theory math:
   1. Ear training: Web Audio oscillators play an interval or a chord at the
      correct frequencies (equal temperament, A4 = 440Hz); the user picks the
      interval/chord name from multiple choice.
   2. Note reading: an SVG treble-clef staff renders a note at its correct
      line/space (with ledger lines when needed); the user names the note.
   Both track a running score, with three difficulty levels (naturals only
   at level 1, sharps added at level 2, 7th chords at level 3 — see
   data.js).
   All pitch/staff-position/scoring math is pure and DOM-free so it can be
   sanity checked from Node; only rendering and Web Audio playback touch the
   browser. Note: this pass only uses sharps for accidentals (never flats)
   to avoid enharmonic-spelling ambiguity in multiple choice — see SPEC.md. */

/* ---------- pure logic: notes & frequency ---------- */

const NOTE_LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const NOTE_SEMITONES = {
  C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5,
  "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11,
};
const SEMITONE_TO_KEY = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const LETTER_OFFSET = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

/** Parse "C4", "F#5", etc. into { key: "F#", letter: "F", accidental: "#", octave: 5 }. */
function parseNote(note) {
  const m = /^([A-Ga-g])(#?)(\d)$/.exec((note || "").trim());
  if (!m) throw new Error("Invalid note name: " + note);
  const letter = m[1].toUpperCase();
  const accidental = m[2];
  const key = letter + accidental;
  const octave = parseInt(m[3], 10);
  if (!(key in NOTE_SEMITONES)) throw new Error("Invalid note name: " + note);
  return { key, letter, accidental, octave };
}

/** Absolute semitone number, C0 = 0 (for range comparisons / sorting). */
function absoluteSemitone(note) {
  const { key, octave } = parseNote(note);
  return octave * 12 + NOTE_SEMITONES[key];
}

/** Frequency in Hz for a note name, equal temperament, A4 = 440Hz. */
function noteToFrequency(note) {
  const { key, octave } = parseNote(note);
  const semitonesFromA4 = (octave - 4) * 12 + (NOTE_SEMITONES[key] - NOTE_SEMITONES.A);
  return 440 * Math.pow(2, semitonesFromA4 / 12);
}

/** Inverse of noteToFrequency — nearest note name for a frequency (sharps only). */
function frequencyToNote(freq) {
  const semitonesFromA4 = Math.round(12 * Math.log2(freq / 440));
  const absFromC0 = 4 * 12 + 9 + semitonesFromA4; // A4 = 57 semitones above C0
  const octave = Math.floor(absFromC0 / 12);
  const keyIndex = ((absFromC0 % 12) + 12) % 12;
  return `${SEMITONE_TO_KEY[keyIndex]}${octave}`;
}

/* ---------- pure logic: staff position (treble clef) ---------- */

function diatonicIndex(letter, octave) {
  return octave * 7 + LETTER_OFFSET[letter];
}

/** Staff position: 0 = bottom line (E4), +1 per line/space going up. */
function staffPosition(note) {
  const { letter, octave } = parseNote(note);
  return diatonicIndex(letter, octave) - diatonicIndex("E", 4);
}

/** Even-position ledger lines needed above the staff (top line = position 8). */
function ledgerLinesAbove(position) {
  if (position <= 8) return [];
  const top = position % 2 === 0 ? position : position - 1;
  const lines = [];
  for (let l = 10; l <= top; l += 2) lines.push(l);
  return lines;
}

/** Even-position ledger lines needed below the staff (bottom line = position 0). */
function ledgerLinesBelow(position) {
  if (position >= 0) return [];
  const bottom = position % 2 === 0 ? position : position + 1;
  const lines = [];
  for (let l = -2; l >= bottom; l -= 2) lines.push(l);
  return lines;
}

/* ---------- pure logic: RNG helpers (injectable for deterministic tests) ---------- */

function pickRandom(arr, rng) {
  const r = rng ? rng() : Math.random();
  return arr[Math.floor(r * arr.length)];
}

function shuffle(arr, rng) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const r = rng ? rng() : Math.random();
    const j = Math.floor(r * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function sampleUnique(arr, n, rng) {
  return shuffle(arr, rng).slice(0, Math.max(0, Math.min(n, arr.length)));
}

/** All note names (sharps only, no flats) within [low, high] inclusive. */
function noteRangeList(low, high, includeAccidentals) {
  const lowVal = absoluteSemitone(low);
  const highVal = absoluteSemitone(high);
  const lowOctave = parseNote(low).octave;
  const highOctave = parseNote(high).octave;
  const list = [];
  for (let octave = lowOctave; octave <= highOctave; octave++) {
    for (const letter of NOTE_LETTERS) {
      const keys = includeAccidentals ? [letter, letter + "#"] : [letter];
      for (const key of keys) {
        if (!(key in NOTE_SEMITONES)) continue; // e.g. E#, B# aren't valid spellings here
        const name = `${key}${octave}`;
        const val = absoluteSemitone(name);
        if (val >= lowVal && val <= highVal) list.push(name);
      }
    }
  }
  return list.sort((a, b) => absoluteSemitone(a) - absoluteSemitone(b));
}

/* ---------- pure logic: question generation ---------- */

function generateNoteReadingQuestion(levelConfig, rng) {
  const pool = noteRangeList(levelConfig.noteRange.low, levelConfig.noteRange.high, levelConfig.accidentals);
  const correct = pickRandom(pool, rng);
  const distractors = sampleUnique(pool.filter((n) => n !== correct), 3, rng);
  const choices = shuffle([correct, ...distractors], rng);
  return { note: correct, position: staffPosition(correct), choices, correctAnswer: correct };
}

function generateIntervalQuestion(levelConfig, intervalsData, rng) {
  const rootPool = noteRangeList(levelConfig.noteRange.low, levelConfig.noteRange.high, levelConfig.accidentals);
  const root = pickRandom(rootPool, rng);
  const allowed = intervalsData.filter((iv) => levelConfig.intervalSemitones.includes(iv.semitones));
  const interval = pickRandom(allowed, rng);
  const rootFreq = noteToFrequency(root);
  const secondFreq = rootFreq * Math.pow(2, interval.semitones / 12);
  const distractors = sampleUnique(allowed.filter((iv) => iv.name !== interval.name), 3, rng);
  const choices = shuffle([interval.name, ...distractors.map((d) => d.name)], rng);
  return {
    rootNote: root,
    rootFreq,
    secondFreq,
    semitones: interval.semitones,
    correctAnswer: interval.name,
    choices,
  };
}

function generateChordQuestion(levelConfig, chordTypesData, rng) {
  const rootPool = noteRangeList(levelConfig.noteRange.low, levelConfig.noteRange.high, levelConfig.accidentals);
  const root = pickRandom(rootPool, rng);
  const allowed = chordTypesData.filter((ct) => levelConfig.chordTypeNames.includes(ct.name));
  const chordType = pickRandom(allowed, rng);
  const rootFreq = noteToFrequency(root);
  const freqs = chordType.intervals.map((semi) => rootFreq * Math.pow(2, semi / 12));
  const distractors = sampleUnique(allowed.filter((ct) => ct.name !== chordType.name), 3, rng);
  const choices = shuffle([chordType.name, ...distractors.map((d) => d.name)], rng);
  return { rootNote: root, freqs, correctAnswer: chordType.name, choices };
}

/* ---------- pure logic: scoring ---------- */

function updateStats(stats, isCorrect) {
  const s = {
    totalCorrect: stats.totalCorrect || 0,
    totalAnswered: (stats.totalAnswered || 0) + 1,
    currentStreak: stats.currentStreak || 0,
    bestStreak: stats.bestStreak || 0,
  };
  if (isCorrect) {
    s.totalCorrect += 1;
    s.currentStreak += 1;
    s.bestStreak = Math.max(s.bestStreak, s.currentStreak);
  } else {
    s.currentStreak = 0;
  }
  return s;
}

/* ---------- staff SVG rendering (pure string builder, safe to call w/o DOM) ---------- */

function buildStaffSVG(note) {
  const position = staffPosition(note);
  const { accidental } = parseNote(note);
  const width = 220;
  const height = 150;
  const staffLeft = 60;
  const staffRight = 200;
  const baselineY = 100; // y for position 0 (E4, bottom line)
  const unit = 6; // px per staff position step
  const noteX = 150;
  const noteY = baselineY - position * unit;

  const lines = [0, 2, 4, 6, 8]
    .map((p) => baselineY - p * unit)
    .map((y) => `<line x1="${staffLeft}" y1="${y}" x2="${staffRight}" y2="${y}" stroke="currentColor" stroke-width="1.5" />`)
    .join("");

  const ledgerPositions = [...ledgerLinesAbove(position), ...ledgerLinesBelow(position)];
  const ledgerLines = ledgerPositions
    .map((p) => baselineY - p * unit)
    .map(
      (y) =>
        `<line x1="${noteX - 12}" y1="${y}" x2="${noteX + 12}" y2="${y}" stroke="currentColor" stroke-width="1.5" />`
    )
    .join("");

  const stemUp = position < 4;
  const stemX = stemUp ? noteX + 6.5 : noteX - 6.5;
  const stemY2 = stemUp ? noteY - 32 : noteY + 32;
  const stem = `<line x1="${stemX}" y1="${noteY}" x2="${stemX}" y2="${stemY2}" stroke="currentColor" stroke-width="1.5" />`;

  const accidentalGlyph =
    accidental === "#"
      ? `<text x="${noteX - 22}" y="${noteY + 5}" font-size="16" fill="currentColor">&#9839;</text>`
      : "";

  const clef = `<text x="${staffLeft + 6}" y="${baselineY + 10}" font-size="34" fill="currentColor">&#119070;</text>`;

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="150" role="img" aria-label="Treble clef staff showing a note">
      ${clef}
      ${lines}
      ${ledgerLines}
      ${accidentalGlyph}
      ${stem}
      <ellipse cx="${noteX}" cy="${noteY}" rx="7" ry="5.5" fill="currentColor" />
    </svg>
  `;
}

/* ---------- Web Audio playback (browser only) ---------- */

let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    audioCtx = new Ctor();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playTone(ctx, freq, startAt, duration) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(0.2, startAt + 0.02);
  gain.gain.linearRampToValueAtTime(0.2, startAt + duration - 0.08);
  gain.gain.linearRampToValueAtTime(0, startAt + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}

function playSequential(freqs, noteDuration = 0.75, gap = 0.15) {
  const ctx = getAudioContext();
  const now = ctx.currentTime + 0.05;
  freqs.forEach((f, i) => playTone(ctx, f, now + i * (noteDuration + gap), noteDuration));
}

function playSimultaneous(freqs, duration = 1.2) {
  const ctx = getAudioContext();
  const now = ctx.currentTime + 0.05;
  freqs.forEach((f) => playTone(ctx, f, now, duration));
}

/* ---------- DOM wiring (skipped when running under Node) ---------- */

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    const card = document.querySelector(".card");
    const LEVELS_DATA = typeof LEVELS !== "undefined" ? LEVELS : [];
    const INTERVALS_DATA = typeof INTERVALS !== "undefined" ? INTERVALS : [];
    const CHORD_TYPES_DATA = typeof CHORD_TYPES !== "undefined" ? CHORD_TYPES : [];

    const audioSupported = !!(window.AudioContext || window.webkitAudioContext);

    const STATS_KEY = "music_theory_trainer_stats_v1";
    function loadStats() {
      try {
        const raw = localStorage.getItem(STATS_KEY);
        return raw ? JSON.parse(raw) : { totalCorrect: 0, totalAnswered: 0, currentStreak: 0, bestStreak: 0 };
      } catch (e) {
        return { totalCorrect: 0, totalAnswered: 0, currentStreak: 0, bestStreak: 0 };
      }
    }
    function saveStats(s) {
      localStorage.setItem(STATS_KEY, JSON.stringify(s));
    }

    let stats = loadStats();
    let mode = "ear"; // "ear" | "reading"
    let earType = "interval"; // "interval" | "chord"
    let levelIndex = 0;
    let currentQuestion = null;
    let answered = false;

    card.innerHTML = `
      ${!audioSupported ? `<p style="color: var(--danger);">Web Audio isn't available in this browser — ear training playback is disabled, but note reading still works.</p>` : ""}
      <div class="row">
        <label style="margin:0;">Mode:
          <select id="mode-select" style="width:auto; display:inline-block; margin-left:0.4rem;">
            <option value="ear">Ear Training</option>
            <option value="reading">Note Reading</option>
          </select>
        </label>
        <label id="ear-type-wrap" style="margin:0;">Type:
          <select id="ear-type-select" style="width:auto; display:inline-block; margin-left:0.4rem;">
            <option value="interval">Interval</option>
            <option value="chord">Chord</option>
          </select>
        </label>
        <label style="margin:0;">Level:
          <select id="level-select" style="width:auto; display:inline-block; margin-left:0.4rem;"></select>
        </label>
      </div>

      <div class="card" data-spotlight data-tilt style="margin-top:1rem; text-align:center;">
        <div id="staff-area"></div>
        <button id="play-btn" style="margin-top:0.5rem;">&#9654; Play</button>
      </div>

      <div id="choices" class="row" style="margin-top:1rem;"></div>
      <p id="feedback" style="min-height:1.4rem;"></p>

      <p class="muted" id="score-line" style="margin-top:1rem;"></p>
    `;

    // tier2.js's autoInit() already ran on DOMContentLoaded (it loads before
    // this script), before the markup above existed — re-run it so the new
    // [data-spotlight]/[data-tilt] elements actually get wired up.
    if (typeof window !== "undefined" && window.Tier2) window.Tier2.autoInit();

    const modeSelect = card.querySelector("#mode-select");
    const earTypeWrap = card.querySelector("#ear-type-wrap");
    const earTypeSelect = card.querySelector("#ear-type-select");
    const levelSelect = card.querySelector("#level-select");
    const staffArea = card.querySelector("#staff-area");
    const playBtn = card.querySelector("#play-btn");
    const choicesEl = card.querySelector("#choices");
    const feedbackEl = card.querySelector("#feedback");
    const scoreLine = card.querySelector("#score-line");

    LEVELS_DATA.forEach((lvl, i) => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = lvl.label;
      levelSelect.appendChild(opt);
    });

    function updateScoreLine() {
      scoreLine.textContent = `Score: ${stats.totalCorrect} / ${stats.totalAnswered} correct — streak ${stats.currentStreak} (best ${stats.bestStreak})`;
    }

    function levelConfig() {
      return LEVELS_DATA[levelIndex];
    }

    function newQuestion() {
      answered = false;
      feedbackEl.textContent = "";
      feedbackEl.style.color = "";
      const lvl = levelConfig();
      if (mode === "reading") {
        currentQuestion = generateNoteReadingQuestion(lvl);
        staffArea.innerHTML = buildStaffSVG(currentQuestion.note);
        playBtn.style.display = "none";
      } else if (earType === "interval") {
        currentQuestion = generateIntervalQuestion(lvl, INTERVALS_DATA);
        staffArea.innerHTML = `<p class="muted">Listen, then choose the interval.</p>`;
        playBtn.style.display = audioSupported ? "inline-block" : "none";
      } else {
        currentQuestion = generateChordQuestion(lvl, CHORD_TYPES_DATA);
        staffArea.innerHTML = `<p class="muted">Listen, then choose the chord type.</p>`;
        playBtn.style.display = audioSupported ? "inline-block" : "none";
      }
      renderChoices();
      if (mode === "ear" && audioSupported) playCurrentQuestion();
    }

    function playCurrentQuestion() {
      if (!audioSupported) return;
      if (mode !== "ear") return;
      if (earType === "interval") {
        playSequential([currentQuestion.rootFreq, currentQuestion.secondFreq]);
      } else {
        playSimultaneous(currentQuestion.freqs);
      }
    }

    function renderChoices() {
      choicesEl.innerHTML = "";
      currentQuestion.choices.forEach((choice) => {
        const btn = document.createElement("button");
        btn.textContent = choice;
        btn.addEventListener("click", () => handleAnswer(choice, btn));
        choicesEl.appendChild(btn);
      });
    }

    function handleAnswer(choice, btn) {
      if (answered) return;
      answered = true;
      const correct = choice === currentQuestion.correctAnswer;
      stats = updateStats(stats, correct);
      saveStats(stats);
      updateScoreLine();
      feedbackEl.textContent = correct
        ? "Correct!"
        : `Not quite — that was ${currentQuestion.correctAnswer}.`;
      feedbackEl.style.color = correct ? "var(--accent-strong)" : "var(--danger)";
      Array.from(choicesEl.children).forEach((b) => (b.disabled = true));
      const nextBtn = document.createElement("button");
      nextBtn.textContent = "Next question →";
      nextBtn.style.marginTop = "0.6rem";
      nextBtn.addEventListener("click", newQuestion);
      choicesEl.appendChild(nextBtn);
    }

    modeSelect.addEventListener("change", () => {
      mode = modeSelect.value;
      earTypeWrap.style.display = mode === "ear" ? "inline-block" : "none";
      newQuestion();
    });
    earTypeSelect.addEventListener("change", () => {
      earType = earTypeSelect.value;
      newQuestion();
    });
    levelSelect.addEventListener("change", () => {
      levelIndex = parseInt(levelSelect.value, 10);
      newQuestion();
    });
    playBtn.addEventListener("click", playCurrentQuestion);

    updateScoreLine();
    newQuestion();
  });
}

/* ---------- exports for Node-based sanity checks ---------- */

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    parseNote,
    absoluteSemitone,
    noteToFrequency,
    frequencyToNote,
    staffPosition,
    ledgerLinesAbove,
    ledgerLinesBelow,
    noteRangeList,
    generateNoteReadingQuestion,
    generateIntervalQuestion,
    generateChordQuestion,
    updateStats,
    buildStaffSVG,
    shuffle,
    sampleUnique,
  };
}
