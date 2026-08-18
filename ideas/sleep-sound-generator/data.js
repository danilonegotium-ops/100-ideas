// Sleep Sound Generator — soundscape catalogue.
// Every sound is synthesized live with the Web Audio API in app.js (noise
// generators + oscillators + filters) — there are no audio files here, only
// the metadata used to render the cards and pick which synth engine to run.
// `type` must match a builder function name in app.js (SOUND_BUILDERS).

const SOUNDS = [
  {
    id: "mountain-forest",
    name: "Mountain forest",
    description: "Wind moving through pines, built from filtered noise with a slow-drifting drone underneath.",
    type: "forest",
  },
  {
    id: "rain-city-roof",
    name: "Rain on a city roof",
    description: "Steady brown-noise rainfall with a layer of higher-pitched patter, like drops on tin.",
    type: "rain",
  },
  {
    id: "serbian-village-night",
    name: "Serbian village night",
    description: "Crickets chirring at random intervals over a low, distant drone — a quiet countryside night.",
    type: "villageNight",
  },
  {
    id: "ocean-waves",
    name: "Ocean waves",
    description: "Filtered noise swelling and receding on a slow cycle, like waves rolling onto sand.",
    type: "ocean",
  },
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { SOUNDS };
}
