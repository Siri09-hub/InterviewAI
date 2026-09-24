"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { apiFetch, ApiError } from "@/lib/api";

interface QuestionResultItem {
  question_id: number;
  question_number: number;
  question_text: string;
  question_type: "open" | "mcq";

  candidate_answer: string | null;
  answered: boolean;

  score: number;
  max_marks: number;

  status:
    | "correct"
    | "partially_correct"
    | "incorrect"
    | "skipped";

  correct_answer: string | null;
  ideal_answer: string | null;

  feedback: string | null;
  strengths: string | null;
  improvements: string | null;
}

interface ProctoringSummary {
  total_violations: number;
  tab_switches: number;
  interaction_violations: number;
  face_violations: number;

  // Kept because the backend may return them,
  // but these are not used by the current frontend.
  gaze_violations?: number;
  object_violations?: number;

  data_available: boolean;
}

interface InterviewResults {
  interview_id: number;
  status: string;
  completed_at: string | null;

  total_questions: number;
  answered_questions: number;
  skipped_questions: number;

  overall_score: number;
  max_score: number;
  percentage: number;

  questions: QuestionResultItem[];

  proctoring?: ProctoringSummary;
}

const STATUS_CONFIG: Record<
  QuestionResultItem["status"],
  {
    label: string;
    bg: string;
    text: string;
    border: string;
  }
> = {
  correct: {
    label: "Correct",
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-l-green-500",
  },

  partially_correct: {
    label: "Partially Correct",
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    border: "border-l-yellow-500",
  },

  incorrect: {
    label: "Incorrect",
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-l-red-500",
  },

  skipped: {
    label: "Skipped",
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-l-red-400",
  },
};

function formatCompletedAt(
  value: string | null
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
}

export default function InterviewResultsPage() {
  const params = useParams();
  const router = useRouter();

  const interviewId = params?.id as string;

  const [results, setResults] =
    useState<InterviewResults | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // --------------------------------------------------
  // Load results
  // --------------------------------------------------

  useEffect(() => {
    if (!interviewId) {
      return;
    }

    async function fetchResults() {
      try {
        setLoading(true);
        setError("");

        const data =
          await apiFetch<InterviewResults>(
            `/interviews/${interviewId}/results`
          );

        setResults(data);
      } catch (err) {
        console.error(
          "Load results error:",
          err
        );

        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError(
            "Could not load interview results."
          );
        }
      } finally {
        setLoading(false);
      }
    }

    void fetchResults();
  }, [interviewId]);

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (loading) {
    return (
      <AuthGuard>
        {() => (
          <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />

              <p className="text-sm text-gray-500">
                Loading your results...
              </p>
            </div>
          </main>
        )}
      </AuthGuard>
    );
  }

  // --------------------------------------------------
  // Error
  // --------------------------------------------------

  if (error) {
    return (
      <AuthGuard>
        {() => (
          <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <h1 className="text-xl font-semibold text-gray-900">
                Unable to load results
              </h1>

              <p className="mt-3 text-sm text-red-600">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  window.location.reload()
                }
                className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
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
  // No results
  // --------------------------------------------------

  if (!results) {
    return (
      <AuthGuard>
        {() => (
          <main className="flex min-h-screen items-center justify-center bg-slate-50">
            <div className="text-gray-600">
              No results found.
            </div>
          </main>
        )}
      </AuthGuard>
    );
  }

  // --------------------------------------------------
  // Proctoring data
  // --------------------------------------------------

  const proctoring = results.proctoring;

  const marksDeducted = proctoring
    ? Math.floor(
        proctoring.total_violations / 3
      )
    : 0;

  // --------------------------------------------------
  // Main
  // --------------------------------------------------

  return (
    <AuthGuard>
      {() => (
        <main className="min-h-screen bg-slate-50">
          {/* Header */}
          <header className="border-b border-gray-200 bg-white">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Interview Completed
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Your interview has been submitted successfully.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  router.push("/dashboard")
                }
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back to Dashboard
              </button>
            </div>
          </header>

          <div className="mx-auto max-w-5xl px-6 py-8">
            {/* ==================================================
                SCORE SUMMARY
            ================================================== */}

            <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
                {/* Overall Score */}
                <div className="rounded-xl bg-blue-50 p-5 text-center">
                  <p className="text-3xl font-bold text-blue-700">
                    {results.overall_score}
                    <span className="text-base font-normal text-gray-500">
                      /{results.max_score}
                    </span>
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-600">
                    Overall Score
                  </p>
                </div>

                {/* Percentage */}
                <div className="rounded-xl bg-indigo-50 p-5 text-center">
                  <p className="text-3xl font-bold text-indigo-700">
                    {results.percentage}%
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-600">
                    Percentage
                  </p>
                </div>

                {/* Answered */}
                <div className="rounded-xl bg-green-50 p-5 text-center">
                  <p className="text-3xl font-bold text-green-700">
                    {results.answered_questions}
                    <span className="text-base font-normal text-gray-500">
                      /{results.total_questions}
                    </span>
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-600">
                    Answered
                  </p>
                </div>

                {/* Skipped */}
                <div className="rounded-xl bg-red-50 p-5 text-center">
                  <p className="text-3xl font-bold text-red-700">
                    {results.skipped_questions}
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-600">
                    Skipped
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-900">
                  Interview Completed
                </p>

                <p className="mt-1 text-sm text-blue-800">
                  All questions are included in the
                  final score. Skipped questions
                  receive 0 marks.
                </p>

                <p className="mt-2 text-xs text-blue-700">
                  Completed on:{" "}
                  {formatCompletedAt(
                    results.completed_at
                  )}
                </p>
              </div>
            </section>

            {/* ==================================================
                PROCTORING SUMMARY
            ================================================== */}

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                Proctoring Summary
              </h2>

              {!proctoring ||
              !proctoring.data_available ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <p className="text-sm text-gray-500">
                    No proctoring data is available
                    for this interview.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  {/* Summary top */}
                  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Total Violations
                      </p>

                      <p
                        className={`mt-1 text-3xl font-bold ${
                          proctoring.total_violations ===
                          0
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {proctoring.total_violations}
                      </p>
                    </div>

                    <div
                      className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                        marksDeducted > 0
                          ? "bg-red-50 text-red-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      Marks deducted:{" "}
                      {marksDeducted}
                    </div>
                  </div>

                  {/* Violation cards */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {/* Tab switches */}
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-sm text-gray-500">
                        Tab Switches
                      </p>

                      <p className="mt-2 text-2xl font-bold text-gray-900">
                        {proctoring.tab_switches}
                      </p>
                    </div>

                    {/* Face */}
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-sm text-gray-500">
                        Face Violations
                      </p>

                      <p className="mt-2 text-2xl font-bold text-gray-900">
                        {proctoring.face_violations}
                      </p>
                    </div>

                    {/* Interaction */}
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-sm text-gray-500">
                        Interaction Violations
                      </p>

                      <p className="mt-2 text-2xl font-bold text-gray-900">
                        {proctoring.interaction_violations}
                      </p>
                    </div>
                  </div>

                  {/* Explanation */}
                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm leading-6 text-slate-600">
                      Proctoring violations include
                      tab switching, face-related
                      issues, and restricted
                      interactions such as copy,
                      paste, cut, and right-click.
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      One mark is deducted for every
                      3 recorded violations.
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* ==================================================
                QUESTION REVIEW
            ================================================== */}

            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                Question Review
              </h2>

              <div className="space-y-5">
                {results.questions.map(
                  (question) => {
                    const status =
                      STATUS_CONFIG[
                        question.status
                      ];

                    return (
                      <article
                        key={
                          question.question_id
                        }
                        className={`rounded-2xl border border-gray-200 border-l-4 ${status.border} bg-white p-6 shadow-sm`}
                      >
                        {/* Question header */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">
                              {
                                question.question_number
                              }
                            </span>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                question.question_type ===
                                "mcq"
                                  ? "bg-violet-50 text-violet-700"
                                  : "bg-blue-50 text-blue-700"
                              }`}
                            >
                              {question.question_type ===
                              "mcq"
                                ? "MCQ"
                                : "Open-ended"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${status.bg} ${status.text}`}
                            >
                              {status.label}
                            </span>

                            <span
                              className={`text-sm font-semibold ${status.text}`}
                            >
                              {question.score}/
                              {
                                question.max_marks
                              }{" "}
                              marks
                            </span>
                          </div>
                        </div>

                        {/* Question */}
                        <h3 className="mt-5 text-base font-semibold leading-7 text-gray-900">
                          {
                            question.question_text
                          }
                        </h3>

                        {/* ==================================================
                            SKIPPED
                        ================================================== */}

                        {!question.answered && (
                          <div className="mt-5 space-y-4">
                            <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                              <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                                Your Answer
                              </p>

                              <p className="mt-2 text-sm italic text-gray-500">
                                No answer submitted.
                              </p>
                            </div>

                            {question.question_type ===
                              "mcq" && (
                              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                                  Correct Answer
                                </p>

                                <p className="mt-2 text-sm font-semibold text-green-800">
                                  {question.correct_answer ??
                                    "Correct answer unavailable."}
                                </p>
                              </div>
                            )}

                            {question.question_type ===
                              "open" && (
                              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                                  Ideal Answer
                                </p>

                                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-green-800">
                                  {question.ideal_answer ??
                                    "Reference answer unavailable."}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* ==================================================
                            ANSWERED MCQ
                        ================================================== */}

                        {question.answered &&
                          question.question_type ===
                            "mcq" && (
                            <div className="mt-5 space-y-4">
                              <div
                                className={`rounded-xl border p-4 ${
                                  question.status ===
                                  "correct"
                                    ? "border-green-200 bg-green-50"
                                    : "border-red-200 bg-red-50"
                                }`}
                              >
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                  Your Answer
                                </p>

                                <p
                                  className={`mt-2 text-sm font-semibold ${
                                    question.status ===
                                    "correct"
                                      ? "text-green-800"
                                      : "text-red-800"
                                  }`}
                                >
                                  {question.candidate_answer ??
                                    "—"}
                                </p>
                              </div>

                              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                                  Correct Answer
                                </p>

                                <p className="mt-2 text-sm font-semibold text-green-800">
                                  {question.correct_answer ??
                                    "—"}
                                </p>
                              </div>

                              <div
                                className={`text-sm font-medium ${status.text}`}
                              >
                                {question.status ===
                                "correct"
                                  ? "Correct! You selected the right option."
                                  : "Incorrect. Review the correct answer above."}
                              </div>
                            </div>
                          )}

                        {/* ==================================================
                            ANSWERED OPEN
                        ================================================== */}

                        {question.answered &&
                          question.question_type ===
                            "open" && (
                            <div className="mt-5 space-y-5">
                              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                  Your Answer
                                </p>

                                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                                  {question.candidate_answer ??
                                    "—"}
                                </p>
                              </div>

                              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                                  Ideal Answer
                                </p>

                                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-green-800">
                                  {question.ideal_answer ??
                                    "Reference answer unavailable."}
                                </p>
                              </div>

                              {question.feedback && (
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Feedback
                                  </p>

                                  <p className="mt-2 text-sm leading-6 text-gray-700">
                                    {
                                      question.feedback
                                    }
                                  </p>
                                </div>
                              )}

                              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {question.strengths && (
                                  <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-green-800">
                                      Strengths
                                    </p>

                                    <p className="mt-2 text-sm leading-6 text-green-700">
                                      {
                                        question.strengths
                                      }
                                    </p>
                                  </div>
                                )}

                                {question.improvements && (
                                  <div className="rounded-xl border border-yellow-100 bg-yellow-50 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-yellow-800">
                                      Improvements
                                    </p>

                                    <p className="mt-2 text-sm leading-6 text-yellow-700">
                                      {
                                        question.improvements
                                      }
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                      </article>
                    );
                  }
                )}
              </div>
            </section>

            {/* Dashboard button */}
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() =>
                  router.push("/dashboard")
                }
                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </main>
      )}
    </AuthGuard>
  );
}