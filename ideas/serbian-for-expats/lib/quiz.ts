import type { QuizQuestion } from "./types";

/**
 * Pure grading function — no DOM, no Supabase, so it's directly testable
 * with a throwaway `node -e` / `require()` script. `answers[i]` is the
 * option index the user picked for `questions[i]`, or -1/undefined if
 * unanswered.
 */
export function gradeQuiz(
  questions: QuizQuestion[],
  answers: (number | undefined)[],
): { score: number; total: number } {
  const total = questions.length;
  const score = questions.reduce((count, question, index) => {
    return answers[index] === question.correctIndex ? count + 1 : count;
  }, 0);
  return { score, total };
}
