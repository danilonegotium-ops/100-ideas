import { extractText, parseJsonFromText, type GeminiRawResponse } from "@/lib/gemini";

export const MAX_PROBLEM_LENGTH = 1000;

export interface MathTutorInput {
  problem: string;
}

export interface SolutionStep {
  stepNumber: number;
  explanation: string;
}

export interface MathTutorResult {
  isMathProblem: boolean;
  restatedProblem: string | null;
  finalAnswer: string | null;
  steps: SolutionStep[];
  note: string | null;
}

type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string };

/** Pure — validates/sanitizes the raw request body before it touches the AI call. */
export function validateMathTutorInput(body: unknown): ValidationResult<MathTutorInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, message: "Request body must be an object." };
  }
  const raw = body as Record<string, unknown>;

  if (typeof raw.problem !== "string" || raw.problem.trim().length === 0) {
    return { ok: false, message: "Type a math problem to solve." };
  }

  return { ok: true, value: { problem: raw.problem.trim().slice(0, MAX_PROBLEM_LENGTH) } };
}

/** Pure — builds the model prompt from validated input. */
export function buildMathTutorPrompt(input: MathTutorInput): string {
  return `You are a patient math tutor explaining to a general student (no specific curriculum assumed — explain from first principles, don't assume a particular textbook or grade level). A student typed this into a solver: "${input.problem}"

If this is a solvable math problem (arithmetic, algebra, geometry, calculus, word problem, etc), solve it correctly and break the solution into clear, plain-language steps a student could follow along with — explain the REASONING for each step, not just the mechanical operation. Give the final answer clearly.

If what they typed is NOT a math problem (or is too ambiguous/incomplete to solve, e.g. missing a variable's value), set "isMathProblem" to false and use "note" to explain what's needed, rather than guessing.

Respond with ONLY minified JSON matching exactly this shape, no other text:
{"isMathProblem":true,"restatedProblem":"a clean restatement of the problem being solved","finalAnswer":"the final answer, concise","steps":[{"stepNumber":1,"explanation":"..."}],"note":null}

If not a math problem: {"isMathProblem":false,"restatedProblem":null,"finalAnswer":null,"steps":[],"note":"explanation of why / what's missing"}`;
}

function asStep(value: unknown, fallbackIndex: number): SolutionStep | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  if (typeof v.explanation !== "string" || v.explanation.trim().length === 0) return null;
  const stepNumber = Number(v.stepNumber);
  return {
    stepNumber: Number.isFinite(stepNumber) ? stepNumber : fallbackIndex + 1,
    explanation: v.explanation.trim(),
  };
}

/** Pure — validates the parsed JSON shape coming back from the model. */
export function parseMathTutorPayload(payload: unknown): ValidationResult<MathTutorResult> {
  if (typeof payload !== "object" || payload === null) {
    return { ok: false, message: "Unexpected response shape from the AI." };
  }
  const raw = payload as Record<string, unknown>;

  if (typeof raw.isMathProblem !== "boolean") {
    return { ok: false, message: "Unexpected response shape from the AI." };
  }

  if (!raw.isMathProblem) {
    return {
      ok: true,
      value: {
        isMathProblem: false,
        restatedProblem: null,
        finalAnswer: null,
        steps: [],
        note:
          typeof raw.note === "string" && raw.note.trim().length > 0
            ? raw.note.trim()
            : "This doesn't look like a solvable math problem.",
      },
    };
  }

  const steps: SolutionStep[] = [];
  if (Array.isArray(raw.steps)) {
    raw.steps.forEach((entry, i) => {
      const step = asStep(entry, i);
      if (step) steps.push(step);
    });
  }

  if (steps.length === 0 || typeof raw.finalAnswer !== "string" || raw.finalAnswer.trim().length === 0) {
    return { ok: false, message: "The AI response didn't contain a usable solution." };
  }

  return {
    ok: true,
    value: {
      isMathProblem: true,
      restatedProblem:
        typeof raw.restatedProblem === "string" && raw.restatedProblem.trim().length > 0
          ? raw.restatedProblem.trim()
          : null,
      finalAnswer: raw.finalAnswer.trim(),
      steps,
      note: typeof raw.note === "string" && raw.note.trim().length > 0 ? raw.note.trim() : null,
    },
  };
}

/** Pure end-to-end response parser: raw Gemini response -> validated result. */
export function parseMathTutorResponse(response: GeminiRawResponse): ValidationResult<MathTutorResult> {
  const text = extractText(response);
  if (!text) {
    return { ok: false, message: "The AI didn't return a usable response." };
  }
  let payload: unknown;
  try {
    payload = parseJsonFromText(text);
  } catch {
    return { ok: false, message: "Couldn't parse the AI's response as JSON." };
  }
  return parseMathTutorPayload(payload);
}
