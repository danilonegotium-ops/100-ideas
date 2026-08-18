// Sleep Sound Generator
//
// All four soundscapes are synthesized in real time with the Web Audio API —
// noise generators run through filters, plus a few low detuned oscillators
// for drones. Nothing is loaded from disk or a CDN, so there are zero audio
// files and zero licensing questions.
//
// The noise-generation math and the timer/volume math are kept as plain
// functions of plain arrays/numbers (no AudioContext, no DOM) so they can be
// sanity-checked from Node. Everything that actually touches AudioContext
// only runs `if (typeof document !== "undefined")`.

const FADE_IN_SECONDS = 1.5;
const FADE_OUT_SECONDS = 0.9;
const SWITCH_FADE_SECONDS = 0.5;

/** Pure: clamp any number into [min, max]. */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/** Pure: turn a 0-100 slider value (or any number) into a safe 0..1 gain. */
function clampVolume(percentOr01) {
  const n = Number(percentOr01);
  if (!Number.isFinite(n)) return 0.6;
  // Accept either a 0-1 gain or a 0-100 percent, whichever this looks like.
  const asGain = n > 1 ? n / 100 : n;
  return clamp(asGain, 0, 1);
}

/** Pure: format whole seconds as MM:SS. */
function formatClock(totalSeconds) {
  const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Pure: given "now" and a minute count, return the timestamp the timer ends at (or null if off). */
function computeTimerEndTimestamp(nowMs, minutes) {
  const m = Number(minutes);
  if (!Number.isFinite(m) || m <= 0) return null;
  return nowMs + m * 60 * 1000;
}

/** Pure: seconds remaining until endMs, clamped at 0. Returns null if there's no active timer. */
function computeRemainingSeconds(nowMs, endMs) {
  if (endMs === null || endMs === undefined) return null;
  return Math.max(0, Math.ceil((endMs - nowMs) / 1000));
}

/** Pure: integer in [min, max], inclusive, for cricket-chirp scheduling. */
function randomBetween(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

/** Pure: minimal HTML-escaping for text interpolated into template strings. */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

/* ---------------- Noise generators (pure: length in samples -> Float32Array) ---------------- */

function generateWhiteNoise(length) {
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) out[i] = Math.random() * 2 - 1;
  return out;
}

/** Brown (red) noise: a leaky integrator over white noise, gain-compensated and clamped. */
function generateBrownNoise(length) {
  const out = new Float32Array(length);
  let last = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    out[i] = clamp(last * 3.5, -1, 1);
  }
  return out;
}

/** Pink noise via Paul Kellet's refined method (-3dB/octave). */
function generatePinkNoise(length) {
  const out = new Float32Array(length);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    b6 = white * 0.115926;
    out[i] = clamp(pink * 0.11, -1, 1);
  }
  return out;
}

const NOISE_GENERATORS = {
  white: generateWhiteNoise,
  brown: generateBrownNoise,
  pink: generatePinkNoise,
};

/* ---------------- Everything below touches AudioContext, so it's browser-only ---------------- */

if (typeof document !== "undefined") {
  (function () {
    function createNoiseSource(ctx, generatorName, seconds) {
      const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
      const data = NOISE_GENERATORS[generatorName](length);
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      buffer.getChannelData(0).set(data);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      return src;
    }

    /** Rain on a city roof: brown-noise wash + a quieter high-pass "patter" layer. */
    function buildRainSound(ctx, destination) {
      const wash = createNoiseSource(ctx, "brown", 4);
      const washFilter = ctx.createBiquadFilter();
      washFilter.type = "lowpass";
      washFilter.frequency.value = 700;
      const washGain = ctx.createGain();
      washGain.gain.value = 0.9;
      wash.connect(washFilter).connect(washGain).connect(destination);

      const patter = createNoiseSource(ctx, "pink", 4);
      const patterFilter = ctx.createBiquadFilter();
      patterFilter.type = "bandpass";
      patterFilter.frequency.value = 3000;
      patterFilter.Q.value = 0.6;
      const patterGain = ctx.createGain();
      patterGain.gain.value = 0.22;
      patter.connect(patterFilter).connect(patterGain).connect(destination);

      wash.start();
      patter.start();

      return { stop: () => { wash.stop(); patter.stop(); } };
    }

    /** Mountain forest: slow wind (filtered noise with a drifting cutoff) plus a soft low drone. */
    function buildForestSound(ctx, destination) {
      const wind = createNoiseSource(ctx, "pink", 5);
      const windFilter = ctx.createBiquadFilter();
      windFilter.type = "lowpass";
      windFilter.frequency.value = 500;
      const windGain = ctx.createGain();
      windGain.gain.value = 0.55;
      wind.connect(windFilter).connect(windGain).connect(destination);

      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.07;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 250;
      lfo.connect(lfoGain).connect(windFilter.frequency);

      const droneFreqs = [98, 100.5, 147];
      const droneOscs = droneFreqs.map((freq) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq;
        const gain = ctx.createGain();
        gain.gain.value = 0.045;
        osc.connect(gain).connect(destination);
        return osc;
      });

      wind.start();
      lfo.start();
      droneOscs.forEach((osc) => osc.start());

      return {
        stop: () => {
          wind.stop();
          lfo.stop();
          droneOscs.forEach((osc) => osc.stop());
        },
      };
    }

    /** Serbian village night: distant low drone + soft noise bed + randomly-timed cricket chirps. */
    function buildVillageNightSound(ctx, destination) {
      const drone = ctx.createOscillator();
      drone.type = "sine";
      drone.frequency.value = 80;
      const droneGain = ctx.createGain();
      droneGain.gain.value = 0.045;
      drone.connect(droneGain).connect(destination);

      const bed = createNoiseSource(ctx, "pink", 6);
      const bedFilter = ctx.createBiquadFilter();
      bedFilter.type = "lowpass";
      bedFilter.frequency.value = 350;
      const bedGain = ctx.createGain();
      bedGain.gain.value = 0.1;
      bed.connect(bedFilter).connect(bedGain).connect(destination);

      drone.start();
      bed.start();

      let stopped = false;
      let timeoutId = null;

      function playChirp() {
        const now = ctx.currentTime;
        const pulses = randomBetween(2, 4);
        for (let i = 0; i < pulses; i++) {
          const start = now + i * 0.06;
          const osc = ctx.createOscillator();
          osc.type = "square";
          osc.frequency.value = 4200 + Math.random() * 400;
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.028, start + 0.005);
          gain.gain.linearRampToValueAtTime(0, start + 0.04);
          osc.connect(gain).connect(destination);
          osc.start(start);
          osc.stop(start + 0.05);
        }
      }

      function scheduleNext() {
        if (stopped) return;
        timeoutId = setTimeout(() => {
          if (stopped) return;
          playChirp();
          scheduleNext();
        }, randomBetween(150, 900));
      }
      scheduleNext();

      return {
        stop: () => {
          stopped = true;
          if (timeoutId) clearTimeout(timeoutId);
          drone.stop();
          bed.stop();
        },
      };
    }

    /** Ocean waves: brown noise whose level swells and recedes on a slow LFO cycle. */
    function buildOceanSound(ctx, destination) {
      const src = createNoiseSource(ctx, "brown", 6);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 900;
      const waveGain = ctx.createGain();
      waveGain.gain.value = 0.7;
      src.connect(filter).connect(waveGain).connect(destination);

      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 0.09;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.35;
      lfo.connect(lfoGain).connect(waveGain.gain);

      src.start();
      lfo.start();

      return { stop: () => { src.stop(); lfo.stop(); } };
    }

    const SOUND_BUILDERS = {
      rain: buildRainSound,
      forest: buildForestSound,
      villageNight: buildVillageNightSound,
      ocean: buildOceanSound,
    };

    class SleepSoundEngine {
      constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.current = null; // { id, sessionGain, instance }
        this._volume = 0.6;
      }

      ensureContext() {
        if (!this.ctx) {
          const AudioCtor = window.AudioContext || window.webkitAudioContext;
          this.ctx = new AudioCtor();
          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.value = this._volume;
          this.masterGain.connect(this.ctx.destination);
        }
        if (this.ctx.state === "suspended") this.ctx.resume();
        return this.ctx;
      }

      setVolume(percentOr01) {
        this._volume = clampVolume(percentOr01);
        if (this.masterGain) {
          this.masterGain.gain.setTargetAtTime(this._volume, this.ctx.currentTime, 0.05);
        }
        return this._volume;
      }

      isPlaying(id) {
        return !!this.current && this.current.id === id;
      }

      currentId() {
        return this.current ? this.current.id : null;
      }

      play(id) {
        const builder = SOUND_BUILDERS[id];
        if (!builder) return null;
        const ctx = this.ensureContext();
        if (this.current) this._retire(this.current, SWITCH_FADE_SECONDS);

        const sessionGain = ctx.createGain();
        sessionGain.gain.setValueAtTime(0, ctx.currentTime);
        sessionGain.gain.linearRampToValueAtTime(1, ctx.currentTime + FADE_IN_SECONDS);
        sessionGain.connect(this.masterGain);

        const instance = builder(ctx, sessionGain);
        this.current = { id, sessionGain, instance };
        return id;
      }

      stop() {
        if (!this.current) return;
        this._retire(this.current, FADE_OUT_SECONDS);
        this.current = null;
      }

      toggle(id) {
        if (this.isPlaying(id)) {
          this.stop();
          return null;
        }
        return this.play(id);
      }

      _retire(session, fadeSeconds) {
        const ctx = this.ctx;
        const now = ctx.currentTime;
        session.sessionGain.gain.cancelScheduledValues(now);
        session.sessionGain.gain.setValueAtTime(session.sessionGain.gain.value, now);
        session.sessionGain.gain.linearRampToValueAtTime(0, now + fadeSeconds);
        setTimeout(() => {
          session.instance.stop();
          session.sessionGain.disconnect();
        }, fadeSeconds * 1000 + 60);
      }
    }

    /* ---------------- DOM wiring ---------------- */

    const engine = new SleepSoundEngine();
    const grid = document.getElementById("sound-grid");
    const volumeSlider = document.getElementById("volume");
    const volumeLabel = document.getElementById("volume-label");
    const timerSelect = document.getElementById("timer-minutes");
    const timerStartBtn = document.getElementById("timer-start");
    const timerCancelBtn = document.getElementById("timer-cancel");
    const timerRemainingEl = document.getElementById("timer-remaining");

    grid.innerHTML = SOUNDS.map((sound) => `
      <div class="sound-card" data-id="${escapeHtml(sound.id)}">
        <h3>${escapeHtml(sound.name)}</h3>
        <p>${escapeHtml(sound.description)}</p>
        <button type="button" data-play="${escapeHtml(sound.id)}">Play</button>
      </div>
    `).join("");

    function refreshCardUI() {
      const activeId = engine.currentId();
      grid.querySelectorAll(".sound-card").forEach((card) => {
        const id = card.dataset.id;
        const isActive = id === activeId;
        card.classList.toggle("is-playing", isActive);
        const btn = card.querySelector("button");
        btn.textContent = isActive ? "Stop" : "Play";
      });
    }

    grid.addEventListener("click", (event) => {
      const btn = event.target.closest("button[data-play]");
      if (!btn) return;
      engine.toggle(btn.dataset.play);
      refreshCardUI();
    });

    volumeSlider.addEventListener("input", () => {
      const vol = engine.setVolume(volumeSlider.value);
      volumeLabel.textContent = `${Math.round(vol * 100)}%`;
    });
    volumeLabel.textContent = `${volumeSlider.value}%`;
    engine.setVolume(volumeSlider.value);

    // Sleep timer: stores an absolute end timestamp and polls against Date.now()
    // (instead of counting down ticks) so it stays accurate if the tab is
    // backgrounded and timers get throttled.
    let timerEndMs = null;
    let timerIntervalId = null;

    function updateTimerDisplay() {
      const remaining = computeRemainingSeconds(Date.now(), timerEndMs);
      if (remaining === null) {
        timerRemainingEl.textContent = "No timer running.";
        return;
      }
      if (remaining <= 0) {
        clearInterval(timerIntervalId);
        timerIntervalId = null;
        timerEndMs = null;
        engine.stop();
        refreshCardUI();
        timerRemainingEl.textContent = "Timer finished — sound stopped.";
        timerStartBtn.disabled = false;
        timerCancelBtn.disabled = true;
        return;
      }
      timerRemainingEl.textContent = `Stops in ${formatClock(remaining)}`;
    }

    timerStartBtn.addEventListener("click", () => {
      const minutes = parseInt(timerSelect.value, 10);
      const end = computeTimerEndTimestamp(Date.now(), minutes);
      if (end === null) return; // "Off" selected
      timerEndMs = end;
      if (timerIntervalId) clearInterval(timerIntervalId);
      timerIntervalId = setInterval(updateTimerDisplay, 500);
      updateTimerDisplay();
      timerStartBtn.disabled = true;
      timerCancelBtn.disabled = false;
    });

    timerCancelBtn.addEventListener("click", () => {
      if (timerIntervalId) clearInterval(timerIntervalId);
      timerIntervalId = null;
      timerEndMs = null;
      timerRemainingEl.textContent = "No timer running.";
      timerStartBtn.disabled = false;
      timerCancelBtn.disabled = true;
    });
  })();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    clamp,
    clampVolume,
    formatClock,
    computeTimerEndTimestamp,
    computeRemainingSeconds,
    randomBetween,
    escapeHtml,
    generateWhiteNoise,
    generateBrownNoise,
    generatePinkNoise,
  };
}
