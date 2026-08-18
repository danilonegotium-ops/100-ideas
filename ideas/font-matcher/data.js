// Curated list of 25 real, free Google Fonts, each tagged along the same
// visual dimensions the questionnaire asks about.
// Dimensions:
//   category:   serif | sans-serif | monospace | script
//   weight:     light | regular | bold        (typical/default visual weight)
//   terminals:  rounded | sharp
//   width:      condensed | normal | wide
//   feature:    slab-serif | geometric | high-contrast | humanist | none
var FONTS = [
  { family: "Playfair Display", category: "serif", weight: "bold", terminals: "sharp", width: "normal", feature: "high-contrast" },
  { family: "Merriweather", category: "serif", weight: "regular", terminals: "rounded", width: "normal", feature: "none" },
  { family: "Lora", category: "serif", weight: "regular", terminals: "rounded", width: "normal", feature: "none" },
  { family: "PT Serif", category: "serif", weight: "regular", terminals: "sharp", width: "normal", feature: "none" },
  { family: "Roboto Slab", category: "serif", weight: "regular", terminals: "sharp", width: "normal", feature: "slab-serif" },
  { family: "Bitter", category: "serif", weight: "regular", terminals: "sharp", width: "normal", feature: "slab-serif" },
  { family: "Cormorant Garamond", category: "serif", weight: "light", terminals: "sharp", width: "normal", feature: "high-contrast" },
  { family: "Crimson Text", category: "serif", weight: "regular", terminals: "sharp", width: "normal", feature: "none" },
  { family: "Roboto", category: "sans-serif", weight: "regular", terminals: "rounded", width: "normal", feature: "none" },
  { family: "Open Sans", category: "sans-serif", weight: "regular", terminals: "rounded", width: "normal", feature: "humanist" },
  { family: "Montserrat", category: "sans-serif", weight: "regular", terminals: "sharp", width: "normal", feature: "geometric" },
  { family: "Poppins", category: "sans-serif", weight: "regular", terminals: "rounded", width: "normal", feature: "geometric" },
  { family: "Raleway", category: "sans-serif", weight: "light", terminals: "sharp", width: "normal", feature: "high-contrast" },
  { family: "Nunito", category: "sans-serif", weight: "regular", terminals: "rounded", width: "normal", feature: "humanist" },
  { family: "Quicksand", category: "sans-serif", weight: "light", terminals: "rounded", width: "normal", feature: "geometric" },
  { family: "Inter", category: "sans-serif", weight: "regular", terminals: "sharp", width: "normal", feature: "none" },
  { family: "Work Sans", category: "sans-serif", weight: "regular", terminals: "sharp", width: "normal", feature: "humanist" },
  { family: "Oswald", category: "sans-serif", weight: "regular", terminals: "sharp", width: "condensed", feature: "none" },
  { family: "Bebas Neue", category: "sans-serif", weight: "bold", terminals: "sharp", width: "condensed", feature: "none" },
  { family: "Archivo Black", category: "sans-serif", weight: "bold", terminals: "sharp", width: "wide", feature: "geometric" },
  { family: "Josefin Sans", category: "sans-serif", weight: "light", terminals: "rounded", width: "normal", feature: "geometric" },
  { family: "Comfortaa", category: "sans-serif", weight: "regular", terminals: "rounded", width: "normal", feature: "geometric" },
  { family: "Roboto Mono", category: "monospace", weight: "regular", terminals: "sharp", width: "normal", feature: "none" },
  { family: "Space Mono", category: "monospace", weight: "regular", terminals: "sharp", width: "normal", feature: "none" },
  { family: "Caveat", category: "script", weight: "regular", terminals: "rounded", width: "normal", feature: "none" },
];

// The questionnaire itself: each question maps to one FONTS tag dimension.
var QUESTIONS = [
  {
    dim: "category",
    prompt: "Which best describes the overall style of the letters?",
    options: [
      { label: "Serif — small feet/strokes at the ends of letters", value: "serif" },
      { label: "Sans-serif — clean lines, no feet", value: "sans-serif" },
      { label: "Monospace — looks like code, every letter the same width", value: "monospace" },
      { label: "Handwritten / script — looks like cursive writing", value: "script" },
    ],
  },
  {
    dim: "weight",
    prompt: "How heavy did the letters look?",
    options: [
      { label: "Light and thin", value: "light" },
      { label: "Regular / medium", value: "regular" },
      { label: "Bold and heavy", value: "bold" },
    ],
  },
  {
    dim: "terminals",
    prompt: "Were the letter endings rounded or sharp?",
    options: [
      { label: "Rounded, soft curves", value: "rounded" },
      { label: "Sharp, angular cuts", value: "sharp" },
    ],
  },
  {
    dim: "width",
    prompt: "How wide were the letters relative to their height?",
    options: [
      { label: "Condensed / narrow", value: "condensed" },
      { label: "Normal width", value: "normal" },
      { label: "Wide / expanded", value: "wide" },
    ],
  },
  {
    dim: "feature",
    prompt: "Did anything distinctive stand out?",
    options: [
      { label: "Thick, blocky serifs (slab serif)", value: "slab-serif" },
      { label: "Very geometric shapes, near-perfect circles", value: "geometric" },
      { label: "Elegant strokes that go from thick to thin", value: "high-contrast" },
      { label: "Warm, human, friendly feel", value: "humanist" },
      { label: "Nothing in particular stood out", value: "none" },
    ],
  },
];
