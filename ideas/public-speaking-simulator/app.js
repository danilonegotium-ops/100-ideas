/* Public Speaking Simulator — records a practice speech via the browser's
   Web Speech API (SpeechRecognition), then analyzes the transcript for
   filler words and speaking pace (words per minute).
   Eye-contact analysis is explicitly out of scope for this pass (would need
   real computer vision on a webcam feed) — the UI says so up front.
   Pure analysis functions have no DOM dependency so they can be sanity
   checked from Node. */

/* ---------- pure logic ---------- */

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Split a transcript into words (whitespace-delimited, empties dropped). */
function countWords(transcript) {
  if (!transcript) return 0;
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

/** Words per minute given a word count and elapsed seconds. */
function calcWPM(wordCount, elapsedSeconds) {
  if (!elapsedSeconds || elapsedSeconds <= 0) return 0;
  return Math.round(wordCount / (elapsedSeconds / 60));
}

/**
 * Count occurrences of each filler phrase in the transcript.
 * Case-insensitive, whole-word/phrase matching via regex word boundaries.
 * Returns { byPhrase: { phrase: count }, total }.
 */
function countFillers(transcript, fillerWords) {
  const byPhrase = {};
  let total = 0;
  const text = transcript || "";
  (fillerWords || []).forEach(({ phrase, label }) => {
    const re = new RegExp(`\\b${escapeRegExp(phrase)}\\b`, "gi");
    const matches = text.match(re);
    const count = matches ? matches.length : 0;
    if (count > 0) {
      byPhrase[label || phrase] = count;
      total += count;
    }
  });
  return { byPhrase, total };
}

/** Full analysis bundle used to render the results card. */
function analyzeSpeech(transcript, elapsedSeconds, fillerWords) {
  const wordCount = countWords(transcript);
  const wpm = calcWPM(wordCount, elapsedSeconds);
  const fillers = countFillers(transcript, fillerWords);
  return {
    transcript: transcript || "",
    wordCount,
    elapsedSeconds: Math.round(elapsedSeconds || 0),
    wpm,
    fillerByPhrase: fillers.byPhrase,
    fillerTotal: fillers.total,
  };
}

function paceLabel(wpm) {
  if (wpm === 0) return "—";
  if (wpm < 110) return "a bit slow";
  if (wpm <= 160) return "a comfortable conversational pace";
  if (wpm <= 190) return "brisk — fine for confident delivery";
  return "quite fast — consider slowing down";
}

/* ---------- DOM wiring (skipped when running under Node) ---------- */

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    const card = document.querySelector(".card");
    const fillerWords = typeof FILLER_WORDS !== "undefined" ? FILLER_WORDS : [];

    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    card.innerHTML = `
      <p class="muted">
        This version focuses on speaking pace and filler words. Eye-contact
        analysis isn't included yet — that would need real computer vision
        on a webcam feed, which is out of scope for this pass.
      </p>
      <p class="muted" id="browser-note"></p>
      <div id="unsupported" style="display:none;">
        <p style="color: var(--danger);">
          Speech recognition isn't available in this browser. This tool works
          best in Chrome-based browsers (Chrome, Edge, Brave) on desktop.
          Safari and Firefox have limited or no support for the Web Speech
          API's recognition feature.
        </p>
      </div>
      <div id="controls" class="stack">
        <div class="row">
          <label for="lang-select" style="margin:0;">Language:
            <select id="lang-select" style="width:auto; display:inline-block; margin-left:0.4rem;">
              <option value="en-US">English</option>
              <option value="sr-RS">Srpski</option>
            </select>
          </label>
        </div>
        <div class="row">
          <button id="start-btn">Start speaking</button>
          <button id="stop-btn" disabled>Stop</button>
        </div>
        <div>
          <label>Live transcript</label>
          <div id="live-transcript" class="card mono" style="min-height:4rem; white-space:pre-wrap;"></div>
        </div>
        <p id="status" class="muted"></p>
      </div>
      <div id="results" style="display:none; margin-top:1.5rem;">
        <h2>Results</h2>
        <div class="row">
          <div class="card" style="flex:1; min-width:140px;">
            <div class="muted" style="font-size:0.8rem;">Words per minute</div>
            <div id="wpm-value" style="font-size:1.8rem; font-weight:700;"></div>
            <div id="pace-label" class="muted" style="font-size:0.8rem;"></div>
          </div>
          <div class="card" style="flex:1; min-width:140px;">
            <div class="muted" style="font-size:0.8rem;">Filler words</div>
            <div id="filler-value" style="font-size:1.8rem; font-weight:700;"></div>
          </div>
          <div class="card" style="flex:1; min-width:140px;">
            <div class="muted" style="font-size:0.8rem;">Duration</div>
            <div id="duration-value" style="font-size:1.8rem; font-weight:700;"></div>
          </div>
        </div>
        <div id="filler-breakdown" style="margin-top:1rem;"></div>
        <div style="margin-top:1rem;">
          <label>Full transcript</label>
          <div id="final-transcript" class="card mono" style="white-space:pre-wrap;"></div>
        </div>
      </div>
    `;

    const browserNote = card.querySelector("#browser-note");
    const unsupportedBox = card.querySelector("#unsupported");
    const controls = card.querySelector("#controls");
    const startBtn = card.querySelector("#start-btn");
    const stopBtn = card.querySelector("#stop-btn");
    const langSelect = card.querySelector("#lang-select");
    const liveTranscriptEl = card.querySelector("#live-transcript");
    const statusEl = card.querySelector("#status");
    const resultsEl = card.querySelector("#results");

    if (!SpeechRecognitionCtor) {
      browserNote.style.display = "none";
      unsupportedBox.style.display = "block";
      controls.style.display = "none";
      return;
    }

    browserNote.textContent =
      "Works best in Chrome-based browsers (Chrome, Edge, Brave) on desktop — Safari/Firefox support for speech recognition varies.";

    let recognition = null;
    let finalTranscript = "";
    let interimTranscript = "";
    let startTime = null;
    let stopping = false;

    function updateLiveView() {
      liveTranscriptEl.textContent =
        finalTranscript + (interimTranscript ? " " + interimTranscript : "");
    }

    function setupRecognition() {
      const r = new SpeechRecognitionCtor();
      r.continuous = true;
      r.interimResults = true;
      r.lang = langSelect.value;

      r.onresult = (event) => {
        interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += (finalTranscript ? " " : "") + result[0].transcript.trim();
          } else {
            interimTranscript += result[0].transcript;
          }
        }
        updateLiveView();
      };

      r.onerror = (event) => {
        if (event.error === "no-speech") {
          statusEl.textContent = "No speech detected — try speaking closer to the mic.";
        } else if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          statusEl.textContent = "Microphone access was denied. Allow mic access and try again.";
        } else {
          statusEl.textContent = `Recognition error: ${event.error}`;
        }
      };

      r.onend = () => {
        if (!stopping) {
          // Some browsers end recognition after a pause even in continuous
          // mode — restart automatically unless the user pressed Stop.
          try { r.start(); } catch (e) { /* already stopped/starting */ }
          return;
        }
        finishSession();
      };

      return r;
    }

    function finishSession() {
      const elapsedSeconds = startTime ? (Date.now() - startTime) / 1000 : 0;
      const analysis = analyzeSpeech(finalTranscript, elapsedSeconds, fillerWords);
      renderResults(analysis);
      statusEl.textContent = "Session ended.";
      startBtn.disabled = false;
      stopBtn.disabled = true;
    }

    function renderResults(analysis) {
      resultsEl.style.display = "block";
      card.querySelector("#wpm-value").textContent = analysis.wpm || "0";
      card.querySelector("#pace-label").textContent = paceLabel(analysis.wpm);
      card.querySelector("#filler-value").textContent = analysis.fillerTotal;
      card.querySelector("#duration-value").textContent = `${analysis.elapsedSeconds}s`;
      card.querySelector("#final-transcript").textContent =
        analysis.transcript || "(no speech captured)";

      const breakdown = card.querySelector("#filler-breakdown");
      const entries = Object.entries(analysis.fillerByPhrase);
      if (entries.length === 0) {
        breakdown.innerHTML = `<p class="muted">No filler words detected. Nice.</p>`;
      } else {
        breakdown.innerHTML =
          `<label>Filler word breakdown</label>` +
          entries
            .map(
              ([phrase, count]) =>
                `<div class="row" style="justify-content:space-between; border-bottom:1px solid var(--border); padding:0.3rem 0;">
                  <span class="mono">${phrase}</span><span>${count}</span>
                </div>`
            )
            .join("");
      }
    }

    startBtn.addEventListener("click", () => {
      finalTranscript = "";
      interimTranscript = "";
      stopping = false;
      resultsEl.style.display = "none";
      updateLiveView();
      statusEl.textContent = "Listening… speak now.";
      startBtn.disabled = true;
      stopBtn.disabled = false;
      langSelect.disabled = true;
      startTime = Date.now();
      recognition = setupRecognition();
      try {
        recognition.start();
      } catch (e) {
        statusEl.textContent = "Couldn't start recognition: " + e.message;
        startBtn.disabled = false;
        stopBtn.disabled = true;
      }
    });

    stopBtn.addEventListener("click", () => {
      stopping = true;
      langSelect.disabled = false;
      if (recognition) recognition.stop();
    });
  });
}

/* ---------- exports for Node-based sanity checks ---------- */

if (typeof module !== "undefined" && module.exports) {
  module.exports = { countWords, calcWPM, countFillers, analyzeSpeech, paceLabel };
}
