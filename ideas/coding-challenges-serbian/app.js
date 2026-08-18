// Programerski izazovi na srpskom (Coding Challenges in Serbian)
//
// Scope note (see MASTER_TRACKER.md): there's no safe way to execute
// arbitrary user code client-side for this sprint, so these are
// multiple-choice / fill-in-the-blank challenges (grading a fixed set of
// known-good answers) rather than a real code-execution judge.
//
// Grading logic is written as plain functions over plain data (no DOM) so
// it can be sanity-checked from Node. DOM wiring lives in the
// `if (typeof document !== "undefined")` block at the bottom.

/** Pure: normalize free-text input for forgiving comparison (trim, lowercase, strip spaces/quotes). */
function normalizeAnswer(str) {
  return String(str || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/^['"]+|['"]+$/g, "");
}

/** Pure: is `selectedIndex` the correct option for an mcq question? */
function checkMcqAnswer(question, selectedIndex) {
  return selectedIndex === question.correctIndex;
}

/** Pure: does `rawInput` match any of a fill-in-the-blank question's accepted answers? */
function checkFillAnswer(question, rawInput) {
  const normalized = normalizeAnswer(rawInput);
  if (!normalized) return false;
  return question.answers.some((a) => normalizeAnswer(a) === normalized);
}

/** Pure: dispatch to the right checker based on question.type. */
function checkAnswer(question, response) {
  return question.type === "mcq" ? checkMcqAnswer(question, response) : checkFillAnswer(question, response);
}

/** Pure: final-screen percentage + encouragement message. */
function scoreSummary(score, total) {
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;
  let message;
  if (percent === 100) message = "Savršeno! Znaš sve odgovore.";
  else if (percent >= 80) message = "Odlično! Skoro savršeno.";
  else if (percent >= 50) message = "Dobar početak — nastavi da vežbaš.";
  else message = "Ima prostora za napredak — pokušaj ponovo!";
  return { percent, message };
}

/** Pure: minimal HTML-escaping for text interpolated into template strings. */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

/* ---------------- DOM wiring ---------------- */

if (typeof document !== "undefined") {
  (function () {
    const progressLabel = document.getElementById("progress-label");
    const scoreLabel = document.getElementById("score-label");
    const quizView = document.getElementById("quiz-view");
    const categoryLabel = document.getElementById("category-label");
    const promptLabel = document.getElementById("prompt-label");
    const codeBlock = document.getElementById("code-block");
    const mcqOptions = document.getElementById("mcq-options");
    const fillInputWrap = document.getElementById("fill-input-wrap");
    const fillInput = document.getElementById("fill-input");
    const fillCheckBtn = document.getElementById("fill-check-btn");
    const feedbackBox = document.getElementById("feedback-box");
    const feedbackVerdict = document.getElementById("feedback-verdict");
    const feedbackExplanation = document.getElementById("feedback-explanation");
    const nextBtn = document.getElementById("next-btn");
    const summaryView = document.getElementById("summary-view");
    const summaryHeading = document.getElementById("summary-heading");
    const summaryDetail = document.getElementById("summary-detail");
    const restartBtn = document.getElementById("restart-btn");

    let currentIndex = 0;
    let score = 0;
    let answered = false;

    function renderQuestion(index) {
      const q = CHALLENGES[index];
      answered = false;
      progressLabel.textContent = `Pitanje ${index + 1} od ${CHALLENGES.length}`;
      scoreLabel.textContent = `Rezultat: ${score}`;
      categoryLabel.textContent = q.category;
      promptLabel.textContent = q.prompt;

      if (q.code) {
        codeBlock.textContent = q.code;
        codeBlock.hidden = false;
      } else {
        codeBlock.hidden = true;
      }

      feedbackBox.hidden = true;

      if (q.type === "mcq") {
        mcqOptions.hidden = false;
        fillInputWrap.hidden = true;
        mcqOptions.innerHTML = q.options.map((opt, i) => `
          <button type="button" class="btn ccs-option" data-index="${i}">${escapeHtml(opt)}</button>
        `).join("");
      } else {
        mcqOptions.hidden = true;
        fillInputWrap.hidden = false;
        fillInput.value = "";
        fillInput.disabled = false;
        fillCheckBtn.disabled = false;
        fillInput.focus();
      }
    }

    function showFeedback(correct, explanation, correctAnswerText) {
      feedbackBox.hidden = false;
      feedbackVerdict.className = `ccs-verdict ${correct ? "is-correct" : "is-wrong"}`;
      feedbackVerdict.textContent = correct
        ? "Tačno!"
        : correctAnswerText
          ? `Netačno. Tačan odgovor: ${correctAnswerText}`
          : "Netačno.";
      feedbackExplanation.textContent = explanation;
    }

    function answerMcq(selectedIndex) {
      if (answered) return;
      answered = true;
      const q = CHALLENGES[currentIndex];
      const correct = checkMcqAnswer(q, selectedIndex);
      Array.from(mcqOptions.querySelectorAll("button")).forEach((btn, i) => {
        btn.disabled = true;
        if (i === q.correctIndex) btn.classList.add("is-correct");
        else if (i === selectedIndex && !correct) btn.classList.add("is-wrong");
      });
      if (correct) score++;
      scoreLabel.textContent = `Rezultat: ${score}`;
      showFeedback(correct, q.explanation, null);
    }

    function answerFill() {
      if (answered) return;
      answered = true;
      const q = CHALLENGES[currentIndex];
      const correct = checkFillAnswer(q, fillInput.value);
      fillInput.disabled = true;
      fillCheckBtn.disabled = true;
      if (correct) score++;
      scoreLabel.textContent = `Rezultat: ${score}`;
      showFeedback(correct, q.explanation, correct ? null : q.answers[0]);
    }

    function showSummary() {
      quizView.hidden = true;
      summaryView.hidden = false;
      const { percent, message } = scoreSummary(score, CHALLENGES.length);
      summaryHeading.textContent = `Završio si kviz! ${score} / ${CHALLENGES.length} (${percent}%)`;
      summaryDetail.textContent = message;
    }

    function nextQuestion() {
      currentIndex++;
      if (currentIndex >= CHALLENGES.length) {
        showSummary();
      } else {
        renderQuestion(currentIndex);
      }
    }

    function restart() {
      currentIndex = 0;
      score = 0;
      quizView.hidden = false;
      summaryView.hidden = true;
      renderQuestion(0);
    }

    mcqOptions.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-index]");
      if (!btn) return;
      answerMcq(Number(btn.dataset.index));
    });
    fillCheckBtn.addEventListener("click", answerFill);
    fillInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") answerFill();
    });
    nextBtn.addEventListener("click", nextQuestion);
    restartBtn.addEventListener("click", restart);

    renderQuestion(0);
  })();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    normalizeAnswer,
    checkMcqAnswer,
    checkFillAnswer,
    checkAnswer,
    scoreSummary,
    escapeHtml,
  };
}
