// Font Matcher — pure scoring logic first (testable from Node via the
// module.exports guard at the bottom), DOM wiring after.
//
// This is a guided questionnaire matcher, not image recognition: the user
// describes what a font looked like and we score that description against a
// curated, tagged list of real Google Fonts.

var DIMENSIONS = ["category", "weight", "terminals", "width", "feature"];

// Category is the most visually distinctive trait, so it's weighted highest.
var WEIGHTS = { category: 3, weight: 1, terminals: 2, width: 2, feature: 2 };

var DIMENSION_LABELS = {
  category: { serif: "serif", "sans-serif": "sans-serif", monospace: "monospace", script: "handwritten/script" },
  weight: { light: "a light weight", regular: "a regular weight", bold: "a bold weight" },
  terminals: { rounded: "rounded terminals", sharp: "sharp terminals" },
  width: { condensed: "a condensed width", normal: "a normal width", wide: "a wide, expanded width" },
  feature: {
    "slab-serif": "thick slab serifs",
    geometric: "geometric, circular shapes",
    "high-contrast": "elegant high-contrast strokes",
    humanist: "a warm, humanist feel",
    none: "no strong distinctive feature",
  },
};

/** True if every question in `questions` has an answer in `answers`. */
function allAnswered(answers, questions) {
  return questions.every(function (q) {
    return Boolean(answers[q.dim]);
  });
}

/** Score one font against the user's questionnaire answers. */
function scoreFont(answers, font) {
  var score = 0;
  DIMENSIONS.forEach(function (dim) {
    if (answers[dim] && font[dim] === answers[dim]) {
      score += WEIGHTS[dim];
    }
  });
  return score;
}

/** Rank all fonts by score, descending, stable on ties (original order). */
function rankFonts(answers, fonts) {
  return fonts
    .map(function (font, i) {
      return { font: font, score: scoreFont(answers, font), i: i };
    })
    .sort(function (a, b) {
      return b.score - a.score || a.i - b.i;
    })
    .map(function (entry) {
      return { font: entry.font, score: entry.score };
    });
}

/** One-line explanation of which characteristics matched for this font. */
function generateMatchReason(answers, font) {
  var matched = DIMENSIONS.filter(function (dim) {
    return answers[dim] && font[dim] === answers[dim];
  }).map(function (dim) {
    return DIMENSION_LABELS[dim][answers[dim]];
  });

  if (matched.length === 0) {
    return "No strong matches on your answers, but this is a reasonable stylistic fallback.";
  }
  return "Matches: " + matched.join(", ") + ".";
}

/** Google Fonts specimen page URL for a given family name. */
function fontSpecimenUrl(family) {
  return "https://fonts.google.com/specimen/" + String(family).split(" ").join("+");
}

/** Build a single Google Fonts CSS2 <link> href that loads every family at once. */
function buildGoogleFontsHref(fonts) {
  var families = fonts
    .map(function (f) {
      return "family=" + String(f.family).split(" ").join("+");
    })
    .join("&");
  return "https://fonts.googleapis.com/css2?" + families + "&display=swap";
}

// ---------------------------------------------------------------------------
// DOM wiring
// ---------------------------------------------------------------------------

function initApp() {
  var questionsEl = document.getElementById("fm-questions");
  var form = document.getElementById("fm-form");
  var errorEl = document.getElementById("fm-error");
  var resultsView = document.getElementById("fm-results-view");
  var resultsList = document.getElementById("fm-results-list");
  var retakeBtn = document.getElementById("fm-retake");

  // Load every candidate font up front so results render instantly once matched.
  var fontsLink = document.createElement("link");
  fontsLink.rel = "stylesheet";
  fontsLink.href = buildGoogleFontsHref(FONTS);
  document.head.appendChild(fontsLink);

  function renderQuestions() {
    questionsEl.innerHTML = "";
    QUESTIONS.forEach(function (q, qIndex) {
      var fieldset = document.createElement("fieldset");
      fieldset.style.border = "1px solid var(--border)";
      fieldset.style.borderRadius = "8px";
      fieldset.style.padding = "0.9rem 1rem";

      var legend = document.createElement("legend");
      legend.textContent = (qIndex + 1) + ". " + q.prompt;
      legend.style.padding = "0 0.4rem";
      fieldset.appendChild(legend);

      q.options.forEach(function (opt, optIndex) {
        var optLabel = document.createElement("label");
        optLabel.style.display = "flex";
        optLabel.style.alignItems = "center";
        optLabel.style.gap = "0.5rem";
        optLabel.style.margin = optIndex === 0 ? "0" : "0.4rem 0 0";
        optLabel.style.color = "var(--text)";
        optLabel.style.cursor = "pointer";

        var input = document.createElement("input");
        input.type = "radio";
        input.name = "q-" + q.dim;
        input.value = opt.value;
        input.style.width = "auto";

        optLabel.appendChild(input);
        optLabel.appendChild(document.createTextNode(opt.label));
        fieldset.appendChild(optLabel);
      });

      questionsEl.appendChild(fieldset);
    });
  }

  function collectAnswers() {
    var answers = {};
    QUESTIONS.forEach(function (q) {
      var checked = form.querySelector('input[name="q-' + q.dim + '"]:checked');
      if (checked) answers[q.dim] = checked.value;
    });
    return answers;
  }

  function renderResults(answers) {
    var ranked = rankFonts(answers, FONTS).slice(0, 4);
    resultsList.innerHTML = "";
    ranked.forEach(function (entry, i) {
      var card = document.createElement("div");
      card.className = "font-result";
      // Surface the tilt/spotlight effects on the visual result cards: the
      // top match gets the cursor-follow spotlight (it's the "answer"), and
      // the top few get a subtle 3D tilt since these are the side-by-side
      // typography samples that are the whole point of this tool.
      if (i === 0) card.setAttribute("data-spotlight", "");
      if (i < 3) card.setAttribute("data-tilt", "");

      var title = document.createElement("h3");
      title.textContent = (i + 1) + ". " + entry.font.family;
      title.style.margin = "0 0 0.4rem";

      var sample = document.createElement("p");
      sample.className = "font-sample";
      sample.style.fontFamily = "'" + entry.font.family + "', sans-serif";
      sample.textContent = "The quick brown fox jumps over the lazy dog";

      var reason = document.createElement("p");
      reason.className = "muted";
      reason.style.margin = "0.4rem 0";
      reason.textContent = generateMatchReason(answers, entry.font);

      var specimenLink = document.createElement("a");
      specimenLink.href = fontSpecimenUrl(entry.font.family);
      specimenLink.target = "_blank";
      specimenLink.rel = "noopener noreferrer";
      specimenLink.textContent = "View " + entry.font.family + " on Google Fonts ↗";

      card.appendChild(title);
      card.appendChild(sample);
      card.appendChild(reason);
      card.appendChild(specimenLink);
      resultsList.appendChild(card);
    });

    form.hidden = true;
    resultsView.hidden = false;

    // Results are created after tier2.js's own DOMContentLoaded autoInit()
    // pass, so wire up the spotlight/tilt effects on these specific cards
    // manually. Degrades silently if tier2.js didn't load for any reason.
    if (typeof Tier2 !== "undefined") {
      Tier2.initSpotlight(resultsList);
      Tier2.initTilt(resultsList);
    }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var answers = collectAnswers();
    if (!allAnswered(answers, QUESTIONS)) {
      errorEl.hidden = false;
      return;
    }
    errorEl.hidden = true;
    renderResults(answers);
  });

  retakeBtn.addEventListener("click", function () {
    form.reset();
    form.hidden = false;
    errorEl.hidden = true;
    resultsView.hidden = true;
  });

  renderQuestions();
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", initApp);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    allAnswered,
    scoreFont,
    rankFonts,
    generateMatchReason,
    fontSpecimenUrl,
    buildGoogleFontsHref,
    DIMENSIONS,
  };
}
