// Ex-Yu Rock Trivia — app logic.
// Depends on TRIVIA_QUESTIONS from data.js (loaded first via <script>).
//
// SCOPE NOTE: the original idea mentions "global leaderboards". This is a
// pure static/client-only build (no backend/DB in this pass — that would be
// Wave 3 territory with the shared Supabase project). Score-keeping here is
// a personal best stored in localStorage on the visitor's own browser, not a
// shared global leaderboard. See SPEC.md.

/** Deterministic Fisher-Yates shuffle. Returns a new array, never mutates input. */
function shuffleArray(list, rng) {
  rng = rng || Math.random;
  const arr = list.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

/**
 * Return a copy of `question` with its options shuffled and correctIndex
 * remapped to match the new order.
 */
function shuffleQuestionOptions(question, rng) {
  const order = shuffleArray(
    question.options.map((opt, i) => ({ opt, i })),
    rng
  );
  return {
    ...question,
    options: order.map((o) => o.opt),
    correctIndex: order.findIndex((o) => o.i === question.correctIndex),
  };
}

/** Build a full quiz run: shuffled question order, each with shuffled options. */
function prepareQuiz(questions, rng) {
  rng = rng || Math.random;
  return shuffleArray(questions, rng).map((q) => shuffleQuestionOptions(q, rng));
}

/** Pure scoring check. */
function scoreAnswer(question, selectedIndex) {
  return selectedIndex === question.correctIndex;
}

const BEST_SCORE_KEY = "exyu-rock-trivia-best-v1";

function loadBestScore() {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(BEST_SCORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveBestScoreIfHigher(score, total) {
  if (typeof localStorage === "undefined") return null;
  const current = loadBestScore();
  if (!current || score > current.score) {
    const next = { score, total, at: new Date().toISOString() };
    try {
      localStorage.setItem(BEST_SCORE_KEY, JSON.stringify(next));
    } catch (e) {
      /* storage unavailable/full — fail silently, not critical */
    }
    return next;
  }
  return current;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    shuffleArray,
    shuffleQuestionOptions,
    prepareQuiz,
    scoreAnswer,
    loadBestScore,
    saveBestScoreIfHigher,
    BEST_SCORE_KEY,
  };
}

(function initExYuRockTrivia() {
  if (typeof document === "undefined") return;

  const introView = document.getElementById("intro-view");
  const quizView = document.getElementById("quiz-view");
  const endView = document.getElementById("end-view");
  const startBtn = document.getElementById("start-btn");
  const playAgainBtn = document.getElementById("play-again-btn");
  const bestScoreLine = document.getElementById("best-score-line");
  const progressLabel = document.getElementById("progress-label");
  const scoreLabel = document.getElementById("score-label");
  const questionText = document.getElementById("question-text");
  const optionsList = document.getElementById("options-list");
  const funFactBox = document.getElementById("fun-fact-box");
  const nextBtn = document.getElementById("next-btn");
  const finalScoreLine = document.getElementById("final-score-line");
  const finalBestLine = document.getElementById("final-best-line");

  let quiz = [];
  let currentIndex = 0;
  let score = 0;
  let answered = false;

  function renderBest() {
    const best = loadBestScore();
    bestScoreLine.textContent = best
      ? `Your best so far (this browser): ${best.score}/${best.total}`
      : "No personal best yet — this is your first run.";
  }

  function startQuiz() {
    quiz = prepareQuiz(TRIVIA_QUESTIONS, Math.random);
    currentIndex = 0;
    score = 0;
    introView.hidden = true;
    endView.hidden = true;
    quizView.hidden = false;
    renderQuestion();
  }

  function renderQuestion() {
    answered = false;
    funFactBox.hidden = true;
    nextBtn.hidden = true;
    const q = quiz[currentIndex];
    progressLabel.textContent = `Question ${currentIndex + 1} of ${quiz.length}`;
    scoreLabel.textContent = `Score: ${score}`;
    questionText.textContent = q.question;
    optionsList.innerHTML = "";
    q.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option-btn";
      btn.textContent = opt;
      btn.addEventListener("click", () => selectAnswer(i, btn));
      optionsList.appendChild(btn);
    });
  }

  function selectAnswer(index, btnEl) {
    if (answered) return;
    answered = true;
    const q = quiz[currentIndex];
    const correct = scoreAnswer(q, index);
    if (correct) score++;

    Array.from(optionsList.children).forEach((btn, i) => {
      btn.disabled = true;
      if (i === q.correctIndex) btn.classList.add("option-correct");
      else if (i === index) btn.classList.add("option-wrong");
    });

    funFactBox.hidden = false;
    funFactBox.textContent = (correct ? "Correct! " : "Not quite. ") + q.funFact;
    scoreLabel.textContent = `Score: ${score}`;
    nextBtn.hidden = false;
    nextBtn.textContent = currentIndex + 1 < quiz.length ? "Next question" : "See final score";
  }

  function nextQuestion() {
    currentIndex++;
    if (currentIndex >= quiz.length) {
      endQuiz();
    } else {
      renderQuestion();
    }
  }

  function endQuiz() {
    quizView.hidden = true;
    endView.hidden = false;
    const previousBest = loadBestScore();
    const best = saveBestScoreIfHigher(score, quiz.length);
    const isNewBest = !previousBest || score > previousBest.score;
    finalScoreLine.textContent = `You scored ${score} / ${quiz.length}.`;
    finalBestLine.textContent = isNewBest
      ? `That's a new personal best on this browser: ${best.score}/${best.total}!`
      : `Best on this browser: ${best.score}/${best.total}`;
  }

  startBtn.addEventListener("click", startQuiz);
  nextBtn.addEventListener("click", nextQuestion);
  playAgainBtn.addEventListener("click", () => {
    endView.hidden = true;
    startQuiz();
  });

  renderBest();
})();
