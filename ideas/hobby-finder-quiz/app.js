// Hobby Finder Quiz — pure scoring logic first (testable from Node via the
// module.exports guard at the bottom), DOM wiring after.

var DIMENSIONS = ["budget", "setting", "social", "physicality", "time", "style"];

var DIMENSION_LABELS = {
  budget: { low: "low-budget", medium: "a moderate budget", high: "investing in good gear" },
  setting: { indoor: "indoor", outdoor: "outdoor", both: "flexible indoor/outdoor" },
  social: { solo: "solo", social: "social", both: "flexible solo-or-social" },
  physicality: { physical: "hands-on and physical", mental: "mentally-focused", both: "a mix of physical and mental" },
  time: { low: "a light time commitment", medium: "a moderate time commitment", high: "a serious time commitment" },
  style: { creative: "creative", analytical: "analytical", both: "both creative and analytical" },
};

/** True if every question in `questions` has an answer in `answers`. */
function allAnswered(answers, questions) {
  return questions.every((q) => Boolean(answers[q.dim]));
}

/**
 * Score one hobby against the user's answers. Exact dimension match = 2 pts.
 * A "both"/flexible tag on either side (hobby or user) counts as a partial
 * match = 1 pt, since it's compatible without being a perfect fit.
 */
function scoreHobby(answers, hobby) {
  var score = 0;
  DIMENSIONS.forEach(function (dim) {
    var userVal = answers[dim];
    var hobbyVal = hobby.tags[dim];
    if (!userVal || !hobbyVal) return;
    if (hobbyVal === userVal) {
      score += 2;
    } else if (hobbyVal === "both" || userVal === "both") {
      score += 1;
    }
  });
  return score;
}

/** Rank all hobbies by score, descending, stable on ties (original order). */
function rankHobbies(answers, hobbies) {
  return hobbies
    .map(function (hobby, i) {
      return { hobby: hobby, score: scoreHobby(answers, hobby), i: i };
    })
    .sort(function (a, b) {
      return b.score - a.score || a.i - b.i;
    })
    .map(function (entry) {
      return { hobby: entry.hobby, score: entry.score };
    });
}

/** One-line "why this fits you" built from the dimensions that matched exactly. */
function generateWhy(answers, hobby) {
  var matched = DIMENSIONS.filter(function (dim) {
    return answers[dim] && hobby.tags[dim] === answers[dim];
  }).map(function (dim) {
    return DIMENSION_LABELS[dim][answers[dim]];
  });

  if (matched.length === 0) {
    return hobby.blurb + " Its flexible style adapts well to your answers.";
  }
  var picked = matched.slice(0, 2).join(" and ");
  return hobby.blurb + " A solid fit if you want something " + picked + ".";
}

// ---------------------------------------------------------------------------
// DOM wiring
// ---------------------------------------------------------------------------

function initApp() {
  var questionsEl = document.getElementById("quiz-questions");
  var form = document.getElementById("quiz-form");
  var errorEl = document.getElementById("quiz-error");
  var quizView = document.getElementById("quiz-view");
  var resultsView = document.getElementById("results-view");
  var resultsList = document.getElementById("results-list");
  var retakeBtn = document.getElementById("quiz-retake");

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
    var ranked = rankHobbies(answers, HOBBIES).slice(0, 3);
    resultsList.innerHTML = "";
    ranked.forEach(function (entry, i) {
      var card = document.createElement("div");
      // Bento layout: the #1 match is the featured full-width card, the
      // next two share a row — reflects that these are 3 genuinely ranked
      // results, not a flat list.
      card.className = "hobby-result " + (i === 0 ? "span-4" : "span-2");
      card.setAttribute("data-reveal", "");
      if (i === 0) card.setAttribute("data-spotlight", "");
      card.setAttribute("data-tilt", "");

      var title = document.createElement("h3");
      title.textContent = (i + 1) + ". " + entry.hobby.name;
      title.style.margin = "0 0 0.35rem";

      var why = document.createElement("p");
      why.className = "muted";
      why.style.margin = "0";
      why.textContent = generateWhy(answers, entry.hobby);

      card.appendChild(title);
      card.appendChild(why);
      resultsList.appendChild(card);
    });

    quizView.hidden = true;
    resultsView.hidden = false;

    // Results are created after tier2.js's own DOMContentLoaded autoInit()
    // pass, so wire up spotlight/tilt/reveal on these specific cards
    // manually. Degrades silently if tier2.js didn't load for any reason.
    if (typeof Tier2 !== "undefined") {
      Tier2.initSpotlight(resultsList);
      Tier2.initTilt(resultsList);
      Tier2.initReveal(resultsList);
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
    errorEl.hidden = true;
    quizView.hidden = false;
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
    scoreHobby,
    rankHobbies,
    generateWhy,
    DIMENSIONS,
  };
}
