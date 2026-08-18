/* Language Shadowing Tool — the browser speaks a curated phrase via
   speechSynthesis at an adjustable speed, the user repeats it, and
   SpeechRecognition captures the attempt for a simple Levenshtein-distance
   similarity score against the original text.
   Scope note: the original idea used movie clips; this uses TTS + curated
   text instead (zero licensing issues, works offline in-browser).
   Pure text-processing/scoring logic has no DOM dependency so it can be
   sanity checked from Node. */

/* ---------- pure logic ---------- */

/** Lowercase, strip punctuation, collapse whitespace. Unicode-aware so
 *  Serbian diacritics (š, č, ć, ž, đ) are treated as letters, not stripped. */
function normalizeText(str) {
  return (str || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Classic Levenshtein edit distance between two strings. */
function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = new Array(n + 1);
  let curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1, // deletion
        curr[j - 1] + 1, // insertion
        prev[j - 1] + cost // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/** 0-100 similarity score between the target phrase and the spoken attempt. */
function similarityScore(original, spoken) {
  const a = normalizeText(original);
  const b = normalizeText(spoken);
  if (a.length === 0 && b.length === 0) return 100;
  const dist = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length) || 1;
  const score = Math.round((1 - dist / maxLen) * 100);
  return Math.max(0, Math.min(100, score));
}

function scoreFeedback(score) {
  if (score >= 90) return "Excellent! Very close match.";
  if (score >= 70) return "Good — pretty close.";
  if (score >= 50) return "Keep practicing — getting there.";
  return "Try again, listen closely and repeat.";
}

const LANG_META = {
  en: { code: "en-US", label: "English" },
  sr: { code: "sr-RS", label: "Srpski" },
};

function otherLang(lang) {
  return lang === "en" ? "sr" : "en";
}

/* ---------- DOM wiring (skipped when running under Node) ---------- */

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    const card = document.querySelector(".card");
    const pairs = typeof PHRASE_PAIRS !== "undefined" ? PHRASE_PAIRS : [];

    const synthSupported = "speechSynthesis" in window;
    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionSupported = !!SpeechRecognitionCtor;

    let targetLang = "en"; // language being practiced (spoken + recognized)
    let index = 0;
    let rate = 0.85;

    card.innerHTML = `
      <p class="muted">
        Listen to a phrase, then repeat it out loud. You'll get a rough
        similarity score comparing what you said to the original text.
      </p>
      ${
        !synthSupported
          ? `<p style="color: var(--danger);">Text-to-speech (speechSynthesis) isn't available in this browser — this tool needs it to play phrases.</p>`
          : ""
      }
      ${
        !recognitionSupported
          ? `<p style="color: var(--danger);">Speech recognition isn't available here, so recording/scoring is disabled. It works best in Chrome-based browsers (Chrome, Edge, Brave). You can still use "Play phrase" to listen.</p>`
          : ""
      }
      <div class="stack">
        <div class="row">
          <label style="margin:0;">Practice:
            <select id="lang-select" style="width:auto; display:inline-block; margin-left:0.4rem;">
              <option value="en">English</option>
              <option value="sr">Srpski</option>
            </select>
          </label>
          <label style="margin:0;">Speed: <span id="rate-value">0.85x</span>
            <input type="range" id="rate-range" min="0.5" max="1.5" step="0.1" value="0.85" style="width:auto; display:inline-block; margin-left:0.4rem; vertical-align:middle;" />
          </label>
        </div>

        <div class="card">
          <div class="muted" id="phrase-counter" style="font-size:0.8rem;"></div>
          <div id="target-text" style="font-size:1.3rem; margin:0.4rem 0;"></div>
          <div id="translation-text" class="muted"></div>
        </div>

        <div class="row">
          <button id="prev-btn">&larr; Previous</button>
          <button id="play-btn">&#9654; Play phrase</button>
          <button id="next-btn">Next &rarr;</button>
        </div>

        <div class="row">
          <button id="record-btn">&#127908; Record my attempt</button>
        </div>
        <p id="status" class="muted"></p>

        <div id="result-box" style="display:none;">
          <div class="row" style="justify-content: space-between; align-items: baseline;">
            <div>
              <div class="muted" style="font-size:0.8rem;">You said</div>
              <div id="spoken-text" class="mono"></div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:1.8rem; font-weight:700;" id="score-value"></div>
              <div class="muted" id="score-feedback" style="font-size:0.85rem;"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    const langSelect = card.querySelector("#lang-select");
    const rateRange = card.querySelector("#rate-range");
    const rateValue = card.querySelector("#rate-value");
    const phraseCounter = card.querySelector("#phrase-counter");
    const targetTextEl = card.querySelector("#target-text");
    const translationTextEl = card.querySelector("#translation-text");
    const prevBtn = card.querySelector("#prev-btn");
    const nextBtn = card.querySelector("#next-btn");
    const playBtn = card.querySelector("#play-btn");
    const recordBtn = card.querySelector("#record-btn");
    const statusEl = card.querySelector("#status");
    const resultBox = card.querySelector("#result-box");
    const spokenTextEl = card.querySelector("#spoken-text");
    const scoreValueEl = card.querySelector("#score-value");
    const scoreFeedbackEl = card.querySelector("#score-feedback");

    if (!synthSupported) playBtn.disabled = true;
    if (!recognitionSupported) recordBtn.disabled = true;

    function currentPhrase() {
      return pairs[index];
    }

    function render() {
      const pair = currentPhrase();
      phraseCounter.textContent = `Phrase ${index + 1} / ${pairs.length} — ${LANG_META[targetLang].label}`;
      targetTextEl.textContent = pair[targetLang];
      translationTextEl.textContent = pair[otherLang(targetLang)];
      resultBox.style.display = "none";
      statusEl.textContent = "";
    }

    langSelect.addEventListener("change", () => {
      targetLang = langSelect.value;
      render();
    });

    rateRange.addEventListener("input", () => {
      rate = parseFloat(rateRange.value);
      rateValue.textContent = `${rate.toFixed(2)}x`;
    });

    prevBtn.addEventListener("click", () => {
      index = (index - 1 + pairs.length) % pairs.length;
      render();
    });
    nextBtn.addEventListener("click", () => {
      index = (index + 1) % pairs.length;
      render();
    });

    playBtn.addEventListener("click", () => {
      if (!synthSupported) return;
      window.speechSynthesis.cancel();
      const pair = currentPhrase();
      const utterance = new SpeechSynthesisUtterance(pair[targetLang]);
      utterance.lang = LANG_META[targetLang].code;
      utterance.rate = rate;
      window.speechSynthesis.speak(utterance);
    });

    recordBtn.addEventListener("click", () => {
      if (!recognitionSupported) return;
      const recognition = new SpeechRecognitionCtor();
      recognition.lang = LANG_META[targetLang].code;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      statusEl.textContent = "Listening…";
      recordBtn.disabled = true;

      recognition.onresult = (event) => {
        const spoken = event.results[0][0].transcript;
        const pair = currentPhrase();
        const score = similarityScore(pair[targetLang], spoken);
        spokenTextEl.textContent = spoken;
        scoreValueEl.textContent = `${score}%`;
        scoreFeedbackEl.textContent = scoreFeedback(score);
        resultBox.style.display = "block";
        statusEl.textContent = "";
      };

      recognition.onerror = (event) => {
        if (event.error === "no-speech") {
          statusEl.textContent = "No speech detected — try again.";
        } else if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          statusEl.textContent = "Microphone access was denied.";
        } else {
          statusEl.textContent = `Recognition error: ${event.error}`;
        }
      };

      recognition.onend = () => {
        recordBtn.disabled = false;
      };

      try {
        recognition.start();
      } catch (e) {
        statusEl.textContent = "Couldn't start recognition: " + e.message;
        recordBtn.disabled = false;
      }
    });

    render();
  });
}

/* ---------- exports for Node-based sanity checks ---------- */

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    normalizeText,
    levenshtein,
    similarityScore,
    scoreFeedback,
    otherLang,
    LANG_META,
  };
}
