"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { apiFetch, ApiError } from "@/lib/api";
import ProctoringMonitor from "@/components/ProctoringMonitor";
import AIQuestionVoice from "@/components/AIQuestionVoice";

interface Question {
  id: number;
  interview_id: number;
  question_number: number;
  question_text: string;
  question_type: "open" | "mcq";
  options: string[];
}

interface Evaluation {
  score: number;
  feedback: string;
  strengths: string;
  improvements: string;
}

type SubmitPhase =
  | "idle"
  | "saving"
  | "evaluating"
  | "submitting";

export default function InterviewSessionPage() {
  const params = useParams();
  const router = useRouter();

  const interviewId = params?.id as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);

  const [evaluations, setEvaluations] = useState<
    Record<number, Evaluation>
  >({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [submitPhase, setSubmitPhase] =
    useState<SubmitPhase>("idle");

  const [proctoringViolations, setProctoringViolations] =
    useState(0);

  const savingRef = useRef(false);

  // --------------------------------------------------
  // Current question
  // --------------------------------------------------

  const currentQuestion = questions[currentIndex];

  // --------------------------------------------------
  // Load questions
  // --------------------------------------------------

  useEffect(() => {
    if (!interviewId) {
      return;
    }

    void loadQuestions();
  }, [interviewId]);

  async function loadQuestions() {
    try {
      setLoading(true);
      setError("");

      const data = await apiFetch<Question[]>(
        `/interviews/${interviewId}/questions`
      );

      const sortedQuestions = [...data].sort(
        (a, b) =>
          a.question_number - b.question_number
      );

      setQuestions(sortedQuestions);

      setAnswers(
        new Array(sortedQuestions.length).fill("")
      );

      setEvaluations({});
      setCurrentIndex(0);
    } catch (err) {
      console.error(
        "Load questions error:",
        err
      );

      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(
          "Could not connect to the server. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // Update answer
  // --------------------------------------------------

  function updateAnswer(value: string) {
    setAnswers((previous) => {
      const updated = [...previous];
      updated[currentIndex] = value;
      return updated;
    });

    setError("");
  }

  // --------------------------------------------------
  // Save answer
  // --------------------------------------------------

  async function saveCurrentAnswer(
    question: Question,
    answerText: string
  ) {
    return apiFetch(
      `/interviews/${interviewId}/questions/${question.id}/answers`,
      {
        method: "POST",
        body: {
          answer_text: answerText,
          answer_source: "text",
        },
      }
    );
  }

  // --------------------------------------------------
  // Evaluate answer
  // --------------------------------------------------

  async function evaluateCurrentAnswer(
    question: Question
  ) {
    const data = await apiFetch<Evaluation>(
      `/interviews/${interviewId}/questions/${question.id}/evaluate`,
      {
        method: "POST",
      }
    );

    setEvaluations((previous) => ({
      ...previous,
      [question.id]: data,
    }));

    return data;
  }

  // --------------------------------------------------
  // Submit interview
  // --------------------------------------------------

  async function submitInterview() {
    try {
      setSubmitPhase("submitting");
      setError("");

      await apiFetch(
        `/interviews/${interviewId}/submit`,
        {
          method: "POST",
        }
      );

      router.push(
        `/interview/results/${interviewId}`
      );
    } catch (err) {
      console.error(
        "Submit interview error:",
        err
      );

      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(
          "Unable to submit the interview."
        );
      }

      setSubmitPhase("idle");
      savingRef.current = false;
    }
  }

  // --------------------------------------------------
  // Next / Submit
  // --------------------------------------------------

  async function handleNext() {
    if (savingRef.current) {
      return;
    }

    if (submitPhase !== "idle") {
      return;
    }

    const question = questions[currentIndex];

    if (!question) {
      return;
    }

    const answerText =
      answers[currentIndex] || "";

    const hasAnswer =
      answerText.trim().length > 0;

    const isLastQuestion =
      currentIndex ===
      questions.length - 1;

    // User must answer or skip
    // before moving forward.
    if (!hasAnswer && !isLastQuestion) {
      return;
    }

    savingRef.current = true;
    setError("");

    try {
      // ------------------------------------------------
      // Save + evaluate answered question
      // ------------------------------------------------

      if (hasAnswer) {
        setSubmitPhase("saving");

        await saveCurrentAnswer(
          question,
          answerText
        );

        setSubmitPhase("evaluating");

        await evaluateCurrentAnswer(
          question
        );
      }

      // ------------------------------------------------
      // Last question
      // ------------------------------------------------

      if (isLastQuestion) {
        await submitInterview();
        return;
      }

      // ------------------------------------------------
      // Move to next question
      // ------------------------------------------------

      setCurrentIndex(
        (previous) => previous + 1
      );

      setSubmitPhase("idle");
      savingRef.current = false;
    } catch (err) {
      console.error(
        "Next question error:",
        err
      );

      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(
          "Something went wrong while saving your answer."
        );
      }

      setSubmitPhase("idle");
      savingRef.current = false;
    }
  }

  // --------------------------------------------------
  // Skip
  // --------------------------------------------------

  async function handleSkip() {
    if (savingRef.current) {
      return;
    }

    if (submitPhase !== "idle") {
      return;
    }

    const question = questions[currentIndex];

    if (!question) {
      return;
    }

    const isLastQuestion =
      currentIndex ===
      questions.length - 1;

    savingRef.current = true;
    setError("");

    try {
      setSubmitPhase("saving");

      // Save empty answer as skipped
      await saveCurrentAnswer(
        question,
        ""
      );

      // ------------------------------------------------
      // Last question
      // ------------------------------------------------

      if (isLastQuestion) {
        await submitInterview();
        return;
      }

      // ------------------------------------------------
      // Move to next question
      // ------------------------------------------------

      setCurrentIndex(
        (previous) => previous + 1
      );

      setSubmitPhase("idle");
      savingRef.current = false;
    } catch (err) {
      console.error(
        "Skip question error:",
        err
      );

      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(
          "Unable to skip this question."
        );
      }

      setSubmitPhase("idle");
      savingRef.current = false;
    }
  }

  // --------------------------------------------------
  // Loading screen
  // --------------------------------------------------

  if (loading) {
    return (
      <AuthGuard>
        {() => (
          <main className="flex min-h-screen items-center justify-center bg-slate-50">
            <div className="text-lg text-slate-600">
              Loading interview...
            </div>
          </main>
        )}
      </AuthGuard>
    );
  }

  // --------------------------------------------------
  // Error screen
  // --------------------------------------------------

  if (
    error &&
    questions.length === 0
  ) {
    return (
      <AuthGuard>
        {() => (
          <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
              <h1 className="text-xl font-semibold text-slate-900">
                Something went wrong
              </h1>

              <p className="mt-3 text-slate-600">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  void loadQuestions()
                }
                className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-white transition hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </main>
        )}
      </AuthGuard>
    );
  }

  // --------------------------------------------------
  // No questions
  // --------------------------------------------------

  if (questions.length === 0) {
    return (
      <AuthGuard>
        {() => (
          <main className="flex min-h-screen items-center justify-center bg-slate-50">
            <div className="text-slate-600">
              No questions found.
            </div>
          </main>
        )}
      </AuthGuard>
    );
  }

  // --------------------------------------------------
  // Current answer
  // --------------------------------------------------

  const currentAnswer =
    answers[currentIndex] || "";

  const isLastQuestion =
    currentIndex ===
    questions.length - 1;

  const answeredCount =
    answers.filter(
      (answer) =>
        answer.trim() !== ""
    ).length;

  const progress =
    ((currentIndex + 1) /
      questions.length) *
    100;

  const isCurrentAnswered =
    currentAnswer.trim().length > 0;

  const isProcessing =
    submitPhase !== "idle";

  // --------------------------------------------------
  // Button text
  // --------------------------------------------------

  let buttonText = "Next";

  if (submitPhase === "saving") {
    buttonText = "Saving...";
  } else if (
    submitPhase === "evaluating"
  ) {
    buttonText = "Evaluating...";
  } else if (
    submitPhase === "submitting"
  ) {
    buttonText = "Submitting...";
  } else if (isLastQuestion) {
    buttonText = "Submit Interview";
  } else if (!isCurrentAnswered) {
    buttonText = "Answer Required";
  }

  // --------------------------------------------------
  // Button disabled state
  // --------------------------------------------------

  const nextButtonDisabled =
    isProcessing ||
    (!isLastQuestion &&
      !isCurrentAnswered);

  // --------------------------------------------------
  // Main UI
  // --------------------------------------------------

  return (
    <AuthGuard>
      {() => (
        <main className="min-h-screen bg-slate-50">

          {/* Proctoring */}
          <ProctoringMonitor
            interviewId={interviewId}
            onViolation={
              setProctoringViolations
            }
          />

          <div className="mx-auto max-w-5xl px-6 py-8">

            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between gap-4">

                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    AI Interview
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    Question{" "}
                    {currentIndex + 1}{" "}
                    of{" "}
                    {questions.length}
                  </p>
                </div>

                <div className="text-right">

                  <div className="text-sm font-medium text-slate-600">
                    {answeredCount}/
                    {questions.length}{" "}
                    answered
                  </div>

                  <div
                    className={`mt-1 text-xs font-medium ${
                      proctoringViolations === 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {proctoringViolations === 0
                      ? "Proctoring active"
                      : `Proctoring violations: ${proctoringViolations}`}
                  </div>

                </div>

              </div>

              {/* Progress */}
              <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Question Card */}
            <div className="rounded-2xl bg-white p-8 shadow-sm">

              {/* Question type */}
              <div className="mb-6 flex items-center justify-between gap-4">

                <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                  {currentQuestion.question_type ===
                  "mcq"
                    ? "Multiple Choice"
                    : "Open Ended"}
                </span>

                <span className="text-sm text-slate-400">
                  2 marks
                </span>

              </div>

              {/* Question */}
              <h2 className="text-xl font-semibold leading-8 text-slate-900">
                {currentQuestion.question_text}
              </h2>
<AIQuestionVoice
  question={
    currentQuestion.question_text
  }
/>
              {/* MCQ */}
              {currentQuestion.question_type ===
                "mcq" && (
                <div className="mt-8 space-y-3">

                  {currentQuestion.options.map(
                    (
                      option,
                      index
                    ) => (
                      <label
                        key={index}
                        className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition ${
                          currentAnswer ===
                          String(index)
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 hover:border-blue-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          value={index}
                          checked={
                            currentAnswer ===
                            String(index)
                          }
                          onChange={(event) =>
                            updateAnswer(
                              event.target.value
                            )
                          }
                          className="h-4 w-4"
                        />

                        <span className="text-slate-800">
                          {option}
                        </span>
                      </label>
                    )
                  )}

                </div>
              )}

              {/* Open ended */}
              {currentQuestion.question_type ===
                "open" && (
                <div className="mt-8">

                  <textarea
                    value={currentAnswer}
                    onChange={(event) =>
                      updateAnswer(
                        event.target.value
                      )
                    }
                    placeholder="Type your answer here..."
                    rows={8}
                    className="w-full rounded-xl border border-slate-300 p-4 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>
              )}

              {/* Buttons */}
              <div className="mt-8 flex items-center justify-between gap-4">

                {/* Skip */}
                <button
                  type="button"
                  onClick={() =>
                    void handleSkip()
                  }
                  disabled={isProcessing}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Skip
                </button>

                {/* Next / Submit */}
                <button
                  type="button"
                  onClick={() =>
                    void handleNext()
                  }
                  disabled={
                    nextButtonDisabled
                  }
                  className={`rounded-lg px-6 py-2.5 font-medium transition ${
                    nextButtonDisabled
                      ? "cursor-not-allowed bg-slate-200 text-slate-400"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {buttonText}
                </button>

              </div>

            </div>

            {/* Evaluation status */}
            {submitPhase ===
              "evaluating" && (
              <div className="mt-5 rounded-xl bg-blue-50 p-4 text-center text-sm text-blue-700">
                Evaluating your answer...
              </div>
            )}

            {/* Submission status */}
            {submitPhase ===
              "submitting" && (
              <div className="mt-5 rounded-xl bg-blue-50 p-4 text-center text-sm text-blue-700">
                Submitting your interview...
              </div>
            )}

          </div>
        </main>
      )}
    </AuthGuard>
  );
}