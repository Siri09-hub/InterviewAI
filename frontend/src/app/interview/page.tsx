"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { apiFetch, ApiError } from "@/lib/api";

interface OptionConfig {
  label: string;
  icon: React.ReactNode;
}

interface CreateInterviewResponse {
  id: number;
  job_role: string;
  interview_type: string;
  difficulty: string;
  duration_minutes: number;
  status: string;
}

interface QuestionResponse {
  id: number;
  interview_id: number;
  question_number: number;
  question_text: string;
}

const jobRoles: OptionConfig[] = [
  {
    label: "Software Engineer",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          d="M16 18l6-6-6-6M8 6l-6 6 6 6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Frontend Developer",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          d="M4 5h16v12H4z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 9h16M8 21h8M12 17v4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Backend Developer",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          d="M4 5h16M4 5v4h16V5M4 9v10h16V9M4 9h16"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8 13h.01M8 16h.01"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Data Scientist",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "AI/ML Engineer",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle
          cx="12"
          cy="12"
          r="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Full Stack Developer",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h4a1 1 0 001-1V10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const interviewTypes: OptionConfig[] = [
  {
    label: "Technical",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          d="M9.75 17L14.25 7M6 8l-4 4 4 4M18 8l4 4-4 4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Behavioral",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Mixed",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          d="M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const difficulties: OptionConfig[] = [
  {
    label: "Easy",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          d="M5 15l4-4 3 3 7-7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Medium",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          d="M4 20V10M12 20V4M20 20v-6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Hard",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const durations: OptionConfig[] = [
  {
    label: "15 minutes",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 7v5l3 2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "30 minutes",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 7v5l3 2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "45 minutes",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 7v5l3 2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "60 minutes",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 7v5l3 2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const questionEstimates: Record<string, number> = {
  "15 minutes": 5,
  "30 minutes": 10,
  "45 minutes": 15,
  "60 minutes": 20,
};

const durationMinutesMap: Record<string, number> = {
  "15 minutes": 15,
  "30 minutes": 30,
  "45 minutes": 45,
  "60 minutes": 60,
};

const progressSteps = [
  { label: "Setup", active: true },
  { label: "Interview", active: false },
  { label: "Feedback", active: false },
];

function OptionCard({
  option,
  selected,
  onSelect,
  disabled = false,
}: {
  option: OptionConfig;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`group relative flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
        disabled
          ? "cursor-not-allowed opacity-60"
          : selected
            ? "border-indigo-500 bg-gradient-to-br from-indigo-50 to-violet-50 shadow-sm ring-1 ring-indigo-200"
            : "border-gray-200 bg-white hover:border-indigo-200 hover:bg-gray-50"
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
          selected
            ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white"
            : "bg-gray-100 text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600"
        }`}
      >
        {option.icon}
      </div>

      <span
        className={`text-sm font-medium ${
          selected ? "text-indigo-900" : "text-gray-700"
        }`}
      >
        {option.label}
      </span>

      {selected && (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="ml-auto h-4 w-4 shrink-0 text-indigo-600"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            d="M5 13l4 4L19 7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

function SectionBlock({
  step,
  title,
  options,
  selected,
  onSelect,
  columns = "sm:grid-cols-2",
  disabled = false,
}: {
  step: string;
  title: string;
  options: OptionConfig[];
  selected: string;
  onSelect: (value: string) => void;
  columns?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-semibold text-indigo-700">
          {step}
        </span>

        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>

      <div className={`grid grid-cols-1 ${columns} gap-2.5`}>
        {options.map((option) => (
          <OptionCard
            key={option.label}
            option={option}
            selected={selected === option.label}
            disabled={disabled}
            onSelect={() => onSelect(option.label)}
          />
        ))}
      </div>
    </div>
  );
}

export default function InterviewSetupPage() {
  const router = useRouter();

  const [jobRole, setJobRole] = useState("");
  const [interviewType, setInterviewType] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [duration, setDuration] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [createdInterviewId, setCreatedInterviewId] = useState<number | null>(
    null
  );

  const isComplete = Boolean(
    jobRole && interviewType && difficulty && duration
  );

  const missingFields = [
    !jobRole && "Job Role",
    !interviewType && "Interview Type",
    !difficulty && "Difficulty",
    !duration && "Duration",
  ].filter(Boolean) as string[];

  const estimatedQuestions = duration
    ? questionEstimates[duration]
    : null;

  const clearSubmitState = () => {
    setCreatedInterviewId(null);
    setSubmitError("");
  };

  const handleContinue = async () => {
    if (!isComplete || submitting) {
      return;
    }

    setSubmitError("");
    setCreatedInterviewId(null);
    setSubmitting(true);

    try {
      // ----------------------------------------
      // 1. Create the interview
      // ----------------------------------------
      const data = await apiFetch<CreateInterviewResponse>(
        "/interviews",
        {
          method: "POST",
          body: {
            job_role: jobRole,
            interview_type: interviewType,
            difficulty,
            duration_minutes: durationMinutesMap[duration],
          },
        }
      );

      setCreatedInterviewId(data.id);

      // Store the configuration for the session page.
      sessionStorage.setItem(
        `interview_${data.id}`,
        JSON.stringify({
          job_role: data.job_role,
          interview_type: data.interview_type,
          difficulty: data.difficulty,
          duration_minutes: data.duration_minutes,
        })
      );

      // ----------------------------------------
      // 2. Generate AI questions using Gemini
      // ----------------------------------------
      const generatedQuestions = await apiFetch<QuestionResponse[]>(
        `/interviews/${data.id}/generate-questions`,
        {
          method: "POST",
        }
      );

      // Safety check: make sure the backend actually
      // returned questions before opening proctoring.
      if (!generatedQuestions || generatedQuestions.length === 0) {
        throw new Error(
          "The interview was created, but no questions were generated."
        );
      }

      // ----------------------------------------
      // 3. Open the proctoring check
      // ----------------------------------------
      router.push(`/interview/proctoring?interviewId=${data.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError(
          "Could not create the interview. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      {() => (
        <div className="min-h-screen bg-gradient-to-b from-indigo-50/40 via-gray-50 to-gray-50">
          {/* Header */}
          <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-4 w-4 text-white"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-base font-semibold text-transparent">
                    InterviewAI
                  </span>

                  <span className="ml-1 hidden border-l border-gray-200 pl-2 text-xs text-gray-400 sm:inline">
                    Interview Setup
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                disabled={submitting}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-gray-600 transition hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-4 w-4"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    d="M15 19l-7-7 7-7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                <span className="hidden sm:inline">
                  Back to Dashboard
                </span>
              </button>
            </div>
          </header>

          <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
            {/* Progress */}
            <div className="mb-10 flex items-center justify-center">
              <div className="flex w-full max-w-md items-center">
                {progressSteps.map((step, index) => (
                  <div
                    key={step.label}
                    className="flex flex-1 items-center last:flex-none"
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold ${
                          step.active
                            ? "border-transparent bg-gradient-to-br from-indigo-600 to-violet-600 text-white"
                            : "border-gray-200 bg-white text-gray-400"
                        }`}
                      >
                        {index + 1}
                      </div>

                      <span
                        className={`text-xs font-medium ${
                          step.active
                            ? "text-indigo-700"
                            : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>

                    {index < progressSteps.length - 1 && (
                      <div className="mx-2 mb-5 h-px flex-1 bg-gray-200" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="mb-8 text-center sm:text-left">
              <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
                Set up your interview
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Configure your mock interview session before you begin.
              </p>
            </div>

            {/* Main content */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Configuration */}
              <div className="space-y-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 lg:col-span-2">
                <h2 className="text-base font-semibold text-gray-900">
                  Configure your interview
                </h2>

                <SectionBlock
                  step="A"
                  title="Job Role"
                  options={jobRoles}
                  selected={jobRole}
                  disabled={submitting}
                  onSelect={(value) => {
                    setJobRole(value);
                    clearSubmitState();
                  }}
                  columns="sm:grid-cols-2"
                />

                <SectionBlock
                  step="B"
                  title="Interview Type"
                  options={interviewTypes}
                  selected={interviewType}
                  disabled={submitting}
                  onSelect={(value) => {
                    setInterviewType(value);
                    clearSubmitState();
                  }}
                  columns="sm:grid-cols-3"
                />

                <SectionBlock
                  step="C"
                  title="Difficulty"
                  options={difficulties}
                  selected={difficulty}
                  disabled={submitting}
                  onSelect={(value) => {
                    setDifficulty(value);
                    clearSubmitState();
                  }}
                  columns="sm:grid-cols-3"
                />

                <SectionBlock
                  step="D"
                  title="Duration"
                  options={durations}
                  selected={duration}
                  disabled={submitting}
                  onSelect={(value) => {
                    setDuration(value);
                    clearSubmitState();
                  }}
                  columns="sm:grid-cols-4"
                />
              </div>

              {/* Summary */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-4">
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-sm font-semibold text-gray-900">
                      Interview Summary
                    </h3>

                    <div className="space-y-3">
                      {[
                        { label: "Role", value: jobRole },
                        { label: "Type", value: interviewType },
                        { label: "Difficulty", value: difficulty },
                        { label: "Duration", value: duration },
                      ].map((row) => (
                        <div
                          key={row.label}
                          className="flex items-center justify-between gap-4 text-sm"
                        >
                          <span className="text-gray-500">
                            {row.label}
                          </span>

                          <span
                            className={`text-right font-medium ${
                              row.value
                                ? "text-gray-900"
                                : "text-gray-300"
                            }`}
                          >
                            {row.value || "Not selected"}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-sm">
                      <span className="text-gray-500">
                        Questions
                      </span>

                      <span
                        className={`font-medium ${
                          estimatedQuestions
                            ? "text-indigo-700"
                            : "text-gray-300"
                        }`}
                      >
                        {estimatedQuestions
                          ? `~${estimatedQuestions} questions`
                          : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-sm font-semibold text-gray-900">
                      What you&apos;ll experience
                    </h3>

                    <ul className="space-y-3">
                      {[
                        {
                          text: "AI-generated interview questions",
                          icon: (
                            <path
                              d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          ),
                        },
                        {
                          text: "Real-time evaluation",
                          icon: (
                            <path
                              d="M12 8v4l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          ),
                        },
                        {
                          text: "Performance feedback",
                          icon: (
                            <path
                              d="M13 7h8m0 8v-8m0 0l-8 8-4-4-6 6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          ),
                        },
                      ].map((item) => (
                        <li
                          key={item.text}
                          className="flex items-center gap-2.5 text-sm text-gray-600"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              className="h-4 w-4"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              {item.icon}
                            </svg>
                          </span>

                          {item.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom actions */}
            <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              {createdInterviewId !== null && !submitError && (
                <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                  <div className="flex items-center gap-3">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    Generating your AI interview questions...
                  </div>
                </div>
              )}

              {submitError && (
                <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {submitError}
                </div>
              )}

              {!isComplete && (
                <p className="mb-4 text-sm text-gray-500">
                  Please select:{" "}
                  <span className="font-medium text-gray-700">
                    {missingFields.join(", ")}
                  </span>
                </p>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  disabled={submitting}
                  className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={!isComplete || submitting}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                    isComplete && !submitting
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90"
                      : "cursor-not-allowed bg-gray-100 text-gray-400"
                  }`}
                >
                  {submitting && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
                  )}

                  {submitting
                    ? "Generating AI questions..."
                    : "Continue to Interview"}
                </button>
              </div>
            </div>
          </main>
        </div>
      )}
    </AuthGuard>
  );
}