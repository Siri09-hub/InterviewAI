"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import { apiFetch, ApiError } from "@/lib/api";

interface InterviewSummary {
  id: number;
  job_role: string;
  interview_type: string;
  difficulty: string;
  duration_minutes: number;
  status: string;
  completed_at: string | null;
}

interface ProctoringSummary {
  total_violations: number;
  tab_switches: number;
  interaction_violations: number;
  face_violations: number;
  data_available: boolean;
}

interface PerformanceAnalysis {
  strengths: string[];
  weaknesses: string[];
  areas_for_improvement: string[];
  overall_feedback: string;
  recommended_topics: string[];
}

interface InterviewResultsFull {
  interview_id: number;
  status: string;
  completed_at: string | null;

  job_role: string;
  interview_type: string;
  difficulty: string;
  duration_minutes: number;

  total_questions: number;
  answered_questions: number;
  skipped_questions: number;

  correct_count: number;
  partially_correct_count: number;
  incorrect_count: number;

  overall_score: number;
  max_score: number;
  percentage: number;

  questions: unknown[];

  proctoring: ProctoringSummary;
  performance: PerformanceAnalysis;
}

interface NavItem {
  label: string;
  href: string;
  active: boolean;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    active: false,
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
  {
    label: "Interviews",
    href: "/interviews",
    active: false,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          d="M8 10h.01M12 10h.01M16 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Coding Practice",
    href: "/coding-practice",
    active: false,
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
    label: "Reports",
    href: "/reports",
    active: true,
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
    label: "Profile",
    href: "/profile",
    active: false,
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
    label: "Settings",
    href: "/settings",
    active: false,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M19.4 15a1.7 1.7 0 00.34 1.88l.06.06-1.41 1.41-.06-.06a1.7 1.7 0 00-1.88-.34 1.7 1.7 0 00-1.03 1.57v.08h-2v-.08a1.7 1.7 0 00-1.04-1.57 1.7 1.7 0 00-1.87.34l-.06.06-1.42-1.41.06-.06A1.7 1.7 0 008.5 15a1.7 1.7 0 00-1.57-1.03h-.08v-2h.08A1.7 1.7 0 008.5 10.9a1.7 1.7 0 00-.34-1.88l-.06-.06 1.41-1.41.06.06a1.7 1.7 0 001.87.34 1.7 1.7 0 001.04-1.57V6.3h2v.08a1.7 1.7 0 001.03 1.57 1.7 1.7 0 001.88-.34l.06-.06 1.41 1.41-.06.06a1.7 1.7 0 00-.34 1.88 1.7 1.7 0 001.57 1.03h.08v2h-.08A1.7 1.7 0 0019.4 15z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const TYPE_ORDER = [
  "Technical",
  "Behavioral",
  "Mixed",
];

const DIFFICULTY_ORDER = [
  "Easy",
  "Medium",
  "Hard",
];

function average(numbers: number[]): number {
  if (numbers.length === 0) {
    return 0;
  }

  return (
    numbers.reduce(
      (total, value) =>
        total + value,
      0
    ) / numbers.length
  );
}

function formatDate(
  iso: string | null
): string {
  if (!iso) {
    return "—";
  }

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );
}

function StatTile({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-semibold text-gray-900">
        {value}
      </p>
    </div>
  );
}

function GroupedScoreBar({
  label,
  avg,
  count,
}: {
  label: string;
  avg: number;
  count: number;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          {label}{" "}
          <span className="text-xs font-normal text-gray-400">
            ({count})
          </span>
        </span>

        <span className="text-sm font-semibold text-gray-900">
          {avg}%
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-600"
          style={{
            width: `${Math.min(
              100,
              Math.max(0, avg)
            )}%`,
          }}
        />
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [menuOpen, setMenuOpen] =
    useState(false);

  const menuRef =
    useRef<HTMLDivElement>(null);

  const [
    interviews,
    setInterviews,
  ] =
    useState<InterviewSummary[] | null>(
      null
    );

  const [
    historyLoading,
    setHistoryLoading,
  ] = useState(true);

  const [
    historyError,
    setHistoryError,
  ] = useState("");

  const [
    resultsById,
    setResultsById,
  ] =
    useState<
      Record<
        number,
        InterviewResultsFull
      >
    >({});

  const [
    resultsLoading,
    setResultsLoading,
  ] = useState(false);

  const [
    someResultsFailed,
    setSomeResultsFailed,
  ] = useState(false);

  const fetchedResultIdsRef =
    useRef<Set<number>>(
      new Set()
    );

  // --------------------------------------------------
  // Close menu
  // --------------------------------------------------

  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent
    ) {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node
        )
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // --------------------------------------------------
  // Logout
  // --------------------------------------------------

  function handleLogout() {
    localStorage.removeItem(
      "access_token"
    );

    router.push("/login");
  }

  // --------------------------------------------------
  // Fetch interviews
  // --------------------------------------------------

  async function fetchInterviews() {
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const data =
        await apiFetch<InterviewSummary[]>(
          "/interviews"
        );

      const sorted = [...data].sort(
        (a, b) => b.id - a.id
      );

      setInterviews(sorted);
    } catch (err) {
      console.error(
        "Could not load interview history:",
        err
      );

      if (err instanceof ApiError) {
        setHistoryError(
          err.message
        );
      } else {
        setHistoryError(
          "Could not load your interview history."
        );
      }

      setInterviews([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    void fetchInterviews();
  }, []);

  // --------------------------------------------------
  // Fetch completed results
  // --------------------------------------------------

  useEffect(() => {
    if (!interviews) {
      return;
    }

    const completedIds =
      interviews
        .filter(
          (interview) =>
            interview.status ===
            "completed"
        )
        .map(
          (interview) =>
            interview.id
        );

    const idsToFetch =
      completedIds.filter(
        (id) =>
          !fetchedResultIdsRef.current.has(
            id
          )
      );

    if (
      idsToFetch.length === 0
    ) {
      return;
    }

    let cancelled = false;

    async function fetchResults() {
      setResultsLoading(true);

      const updates: Record<
        number,
        InterviewResultsFull
      > = {};

      let anyFailed = false;

      await Promise.all(
        idsToFetch.map(
          async (id) => {
            fetchedResultIdsRef.current.add(
              id
            );

            try {
              const result =
                await apiFetch<InterviewResultsFull>(
                  `/interviews/${id}/results`
                );

              updates[id] = result;
            } catch (err) {
              console.error(
                `Could not load results for interview ${id}:`,
                err
              );

              anyFailed = true;
            }
          }
        )
      );

      if (cancelled) {
        return;
      }

      if (
        Object.keys(updates).length >
        0
      ) {
        setResultsById(
          (previous) => ({
            ...previous,
            ...updates,
          })
        );
      }

      if (anyFailed) {
        setSomeResultsFailed(
          true
        );
      }

      setResultsLoading(false);
    }

    void fetchResults();

    return () => {
      cancelled = true;
    };
  }, [interviews]);

  // --------------------------------------------------
  // Overall statistics
  // --------------------------------------------------

  const totalInterviews =
    interviews?.length ?? 0;

  const completedSummaries =
    interviews?.filter(
      (interview) =>
        interview.status ===
        "completed"
    ) ?? [];

  const completedCount =
    completedSummaries.length;

  const notCompletedCount =
    totalInterviews -
    completedCount;

  const completedResults =
    useMemo(() => {
      return completedSummaries
        .map(
          (summary) =>
            resultsById[
              summary.id
            ]
        )
        .filter(
          (
            result
          ): result is InterviewResultsFull =>
            Boolean(result)
        );
    }, [
      completedSummaries,
      resultsById,
    ]);

  const allCompletedResultsLoaded =
    completedCount > 0 &&
    completedResults.length ===
      completedCount;

  const percentages =
    completedResults.map(
      (result) =>
        result.percentage
    );

  const avgScore =
    allCompletedResultsLoaded
      ? Math.round(
          average(percentages)
        )
      : null;

  const bestScore =
    allCompletedResultsLoaded &&
    percentages.length > 0
      ? Math.max(
          ...percentages
        )
      : null;

  const lowestScore =
    allCompletedResultsLoaded &&
    percentages.length > 0
      ? Math.min(
          ...percentages
        )
      : null;

  const totalQuestionsAnswered =
    allCompletedResultsLoaded
      ? completedResults.reduce(
          (sum, result) =>
            sum +
            result.answered_questions,
          0
        )
      : null;

  function scoreDisplay(
    value: number | null
  ) {
    if (value === null) {
      if (completedCount === 0) {
        return "—";
      }

      return resultsLoading
        ? "…"
        : "—";
    }

    return `${value}%`;
  }

  // --------------------------------------------------
  // Score history
  // --------------------------------------------------

  const scoreHistory =
    useMemo(() => {
      return [...completedResults]
        .sort(
          (a, b) =>
            a.interview_id -
            b.interview_id
        )
        .map(
          (result, index) => ({
            interviewId:
              result.interview_id,
            index: index + 1,
            jobRole:
              result.job_role,
            percentage:
              result.percentage,
            date:
              result.completed_at,
          })
        );
    }, [completedResults]);

  // --------------------------------------------------
  // By interview type
  // --------------------------------------------------

  const byType = useMemo(() => {
    const map: Record<
      string,
      number[]
    > = {};

    completedResults.forEach(
      (result) => {
        (
          map[
            result.interview_type
          ] ??= []
        ).push(
          result.percentage
        );
      }
    );

    return TYPE_ORDER.filter(
      (type) =>
        map[type]?.length
    ).map((type) => ({
      label: type,
      avg: Math.round(
        average(map[type])
      ),
      count:
        map[type].length,
    }));
  }, [completedResults]);

  // --------------------------------------------------
  // By difficulty
  // --------------------------------------------------

  const byDifficulty =
    useMemo(() => {
      const map: Record<
        string,
        number[]
      > = {};

      completedResults.forEach(
        (result) => {
          (
            map[
              result.difficulty
            ] ??= []
          ).push(
            result.percentage
          );
        }
      );

      return DIFFICULTY_ORDER.filter(
        (difficulty) =>
          map[difficulty]?.length
      ).map(
        (difficulty) => ({
          label: difficulty,
          avg: Math.round(
            average(
              map[difficulty]
            )
          ),
          count:
            map[difficulty]
              .length,
        })
      );
    }, [completedResults]);

  // --------------------------------------------------
  // By role
  // --------------------------------------------------

  const byRole = useMemo(() => {
    const map: Record<
      string,
      number[]
    > = {};

    completedResults.forEach(
      (result) => {
        (
          map[
            result.job_role
          ] ??= []
        ).push(
          result.percentage
        );
      }
    );

    return Object.entries(map)
      .map(
        ([role, scores]) => ({
          label: role,
          avg: Math.round(
            average(scores)
          ),
          count:
            scores.length,
        })
      )
      .sort(
        (a, b) =>
          b.avg - a.avg
      );
  }, [completedResults]);

  // --------------------------------------------------
  // Proctoring aggregation
  // --------------------------------------------------

  const proctoringTotals =
    useMemo(() => {
      const withData =
        completedResults.filter(
          (result) =>
            result.proctoring
              ?.data_available
        );

      if (
        withData.length ===
        0
      ) {
        return null;
      }

      return withData.reduce(
        (accumulator, result) => ({
          total:
            accumulator.total +
            result.proctoring
              .total_violations,

          tab:
            accumulator.tab +
            result.proctoring
              .tab_switches,

          interaction:
            accumulator.interaction +
            result.proctoring
              .interaction_violations,

          face:
            accumulator.face +
            result.proctoring
              .face_violations,
        }),
        {
          total: 0,
          tab: 0,
          interaction: 0,
          face: 0,
        }
      );
    }, [completedResults]);

  // --------------------------------------------------
  // Performance aggregation
  // --------------------------------------------------

  const aggregatedPerformance =
    useMemo(() => {
      const newestFirst =
        [...completedResults].sort(
          (a, b) =>
            b.interview_id -
            a.interview_id
        );

      function collect(
        pick: (
          result: InterviewResultsFull
        ) => string[],
        limit: number
      ) {
        const seen =
          new Set<string>();

        const output: string[] =
          [];

        for (
          const result of newestFirst
        ) {
          for (
            const item of pick(
              result
            )
          ) {
            if (
              !seen.has(item)
            ) {
              seen.add(item);
              output.push(item);
            }

            if (
              output.length >=
              limit
            ) {
              return output;
            }
          }
        }

        return output;
      }

      return {
        strengths: collect(
          (result) =>
            result.performance
              ?.strengths ?? [],
          6
        ),

        weaknesses: collect(
          (result) =>
            result.performance
              ?.weaknesses ?? [],
          6
        ),

        areasForImprovement:
          collect(
            (result) =>
              result.performance
                ?.areas_for_improvement ??
              [],
            6
          ),
      };
    }, [completedResults]);

  // --------------------------------------------------
  // Recent completed interviews
  // --------------------------------------------------

  const recentCompleted =
    useMemo(() => {
      return [
        ...completedResults,
      ]
        .sort(
          (a, b) =>
            b.interview_id -
            a.interview_id
        )
        .slice(0, 5);
    }, [completedResults]);

  const maxBarHeight = 140;

  return (
    <AuthGuard>
      {(user) => {
        const initials =
          user.name
            .split(" ")
            .filter(Boolean)
            .map(
              (part) =>
                part[0]
            )
            .join("")
            .slice(0, 2)
            .toUpperCase();

        return (
          <div className="min-h-screen bg-gray-50">
            {/* Mobile overlay */}
            {sidebarOpen && (
              <div
                className="fixed inset-0 z-30 bg-black/30 lg:hidden"
                onClick={() =>
                  setSidebarOpen(
                    false
                  )
                }
              />
            )}

            {/* Sidebar */}
            <aside
              className={`fixed left-0 top-0 z-40 h-full w-64 transform border-r border-gray-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
                sidebarOpen
                  ? "translate-x-0"
                  : "-translate-x-full"
              }`}
            >
              {/* Logo */}
              <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
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

                <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-lg font-semibold text-transparent">
                  InterviewAI
                </span>
              </div>

              {/* Navigation */}
              <nav className="space-y-1 px-3 py-6">
                {navItems.map(
                  (item) => (
                    <Link
                      key={
                        item.label
                      }
                      href={
                        item.href
                      }
                      onClick={() =>
                        setSidebarOpen(
                          false
                        )
                      }
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                        item.active
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  )
                )}
              </nav>

              {/* User */}
              <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4">
                <div className="flex items-center gap-3 rounded-lg px-2 py-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                    {initials}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {user.name}
                    </p>

                    <p className="truncate text-xs text-gray-500">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main */}
            <div className="lg:pl-64">
              {/* Header */}
              <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setSidebarOpen(
                        true
                      )
                    }
                    className="text-gray-600 hover:text-gray-900 lg:hidden"
                    aria-label="Open sidebar"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-6 w-6"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        d="M4 6h16M4 12h16M4 18h16"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  <h1 className="text-base font-semibold text-gray-900 sm:text-lg">
                    Reports
                  </h1>
                </div>

                {/* User menu */}
                <div
                  className="relative"
                  ref={menuRef}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setMenuOpen(
                        (previous) =>
                          !previous
                      )
                    }
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-gray-50"
                    aria-haspopup="true"
                    aria-expanded={
                      menuOpen
                    }
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                      {initials}
                    </div>

                    <span className="hidden text-sm text-gray-700 sm:inline">
                      {user.name}
                    </span>

                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className={`hidden h-4 w-4 text-gray-400 transition-transform sm:inline ${
                        menuOpen
                          ? "rotate-180"
                          : ""
                      }`}
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        d="M6 9l6 6 6-6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 z-30 mt-2 w-56 rounded-xl border border-gray-200 bg-white py-2 shadow-lg">
                      <div className="border-b border-gray-100 px-4 py-3">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {user.name}
                        </p>

                        <p className="truncate text-xs text-gray-500">
                          {user.email}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            "/profile"
                          )
                        }
                        className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50"
                      >
                        Profile
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            "/settings"
                          )
                        }
                        className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50"
                      >
                        Settings
                      </button>

                      <div className="border-t border-gray-100 pt-1">
                        <button
                          type="button"
                          onClick={
                            handleLogout
                          }
                          className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 hover:text-red-600"
                        >
                          Log out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </header>

              {/* Content */}
              <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
                {/* Title */}
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
                    Reports &
                    Performance
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Track your interview
                    performance and identify
                    areas for improvement.
                  </p>
                </div>

                {/* Loading */}
                {historyLoading ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
                    <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />

                    <p className="text-sm text-gray-500">
                      Collecting your report
                      data...
                    </p>
                  </div>
                ) : historyError ? (
                  <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                    <p className="inline-block rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
                      {historyError}
                    </p>

                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          void fetchInterviews()
                        }
                        className="mt-4 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                ) : !interviews ||
                  interviews.length ===
                    0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-6 w-6"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>

                    <p className="text-sm font-medium text-gray-900">
                      No completed interviews yet.
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Complete an interview to
                      see your reports.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          "/interview"
                        )
                      }
                      className="mt-4 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                    >
                      Start New Interview
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Partial results warning */}
                    {someResultsFailed && (
                      <div className="mb-6 rounded-lg border border-amber-100 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
                        Some interview results could
                        not be loaded. Showing the
                        data that loaded successfully.
                      </div>
                    )}

                    {/* Statistics */}
                    <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
                      <StatTile
                        label="Total Interviews"
                        value={
                          totalInterviews
                        }
                      />

                      <StatTile
                        label="Completed"
                        value={
                          completedCount
                        }
                      />

                      <StatTile
                        label="Not Completed"
                        value={
                          notCompletedCount
                        }
                      />

                      <StatTile
                        label="Average Score"
                        value={scoreDisplay(
                          avgScore
                        )}
                      />

                      <StatTile
                        label="Best Score"
                        value={scoreDisplay(
                          bestScore
                        )}
                      />

                      <StatTile
                        label="Questions Answered"
                        value={
                          totalQuestionsAnswered ===
                          null
                            ? completedCount ===
                              0
                              ? "—"
                              : "…"
                            : totalQuestionsAnswered
                        }
                      />
                    </div>

                    {/* No completed */}
                    {completedCount ===
                    0 ? (
                      <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
                        <p className="text-sm font-medium text-gray-900">
                          No completed interviews yet.
                        </p>

                        <p className="mt-1 max-w-xs text-sm text-gray-500">
                          Complete an interview to
                          see your performance
                          analytics here.
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              "/interview"
                            )
                          }
                          className="mt-4 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                        >
                          Start New Interview
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Performance overview */}
                        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                          <h3 className="mb-4 text-base font-semibold text-gray-900">
                            Performance Overview
                          </h3>

                          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            <StatTile
                              label="Average Score"
                              value={scoreDisplay(
                                avgScore
                              )}
                            />

                            <StatTile
                              label="Best Score"
                              value={scoreDisplay(
                                bestScore
                              )}
                            />

                            <StatTile
                              label="Lowest Score"
                              value={scoreDisplay(
                                lowestScore
                              )}
                            />

                            <StatTile
                              label="Completed Interviews"
                              value={
                                completedCount
                              }
                            />
                          </div>
                        </div>

                        {/* Score history */}
                        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                          <h3 className="mb-1 text-base font-semibold text-gray-900">
                            Score History
                          </h3>

                          <p className="mb-6 text-sm text-gray-500">
                            Your completed interview scores over
                            time.
                          </p>

                          {scoreHistory.length ===
                          0 ? (
                            <div className="flex justify-center py-8">
                              <p className="text-sm text-gray-400">
                                Loading score history...
                              </p>
                            </div>
                          ) : (
                            <div
                              className="flex items-end gap-2 overflow-x-auto pb-2"
                              style={{
                                height:
                                  maxBarHeight +
                                  50,
                              }}
                            >
                              {scoreHistory.map(
                                (entry) => (
                                  <div
                                    key={
                                      entry.interviewId
                                    }
                                    className="flex shrink-0 flex-col items-center gap-1.5"
                                    style={{
                                      width: 44,
                                    }}
                                    title={`${entry.jobRole} — ${entry.percentage}% (${formatDate(
                                      entry.date
                                    )})`}
                                  >
                                    <span className="text-[11px] font-medium text-gray-600">
                                      {
                                        entry.percentage
                                      }%
                                    </span>

                                    <div
                                      className="w-6 rounded-t-md bg-gradient-to-t from-indigo-600 to-violet-500"
                                      style={{
                                        height:
                                          Math.max(
                                            4,
                                            (entry.percentage /
                                              100) *
                                              maxBarHeight
                                          ),
                                      }}
                                    />

                                    <span className="text-[10px] text-gray-400">
                                      #
                                      {
                                        entry.index
                                      }
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </div>

                        {/* Grouped analytics */}
                        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                          {byType.length >
                            0 && (
                            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                              <h3 className="mb-4 text-base font-semibold text-gray-900">
                                By Interview
                                Type
                              </h3>

                              <div className="space-y-4">
                                {byType.map(
                                  (
                                    entry
                                  ) => (
                                    <GroupedScoreBar
                                      key={
                                        entry.label
                                      }
                                      {...entry}
                                    />
                                  )
                                )}
                              </div>
                            </div>
                          )}

                          {byDifficulty.length >
                            0 && (
                            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                              <h3 className="mb-4 text-base font-semibold text-gray-900">
                                By Difficulty
                              </h3>

                              <div className="space-y-4">
                                {byDifficulty.map(
                                  (
                                    entry
                                  ) => (
                                    <GroupedScoreBar
                                      key={
                                        entry.label
                                      }
                                      {...entry}
                                    />
                                  )
                                )}
                              </div>
                            </div>
                          )}

                          {byRole.length >
                            0 && (
                            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                              <h3 className="mb-4 text-base font-semibold text-gray-900">
                                By Job Role
                              </h3>

                              <div className="space-y-4">
                                {byRole.map(
                                  (
                                    entry
                                  ) => (
                                    <GroupedScoreBar
                                      key={
                                        entry.label
                                      }
                                      {...entry}
                                    />
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Proctoring */}
                        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                          <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-base font-semibold text-gray-900">
                              Proctoring Summary
                            </h3>

                            {!proctoringTotals && (
                              <span className="text-xs text-gray-400">
                                Data unavailable
                              </span>
                            )}
                          </div>

                          {proctoringTotals ? (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                              <div className="rounded-xl border border-gray-200 p-3 text-center">
                                <p
                                  className={`text-lg font-semibold ${
                                    proctoringTotals.total ===
                                    0
                                      ? "text-emerald-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {
                                    proctoringTotals.total
                                  }
                                </p>

                                <p className="mt-0.5 text-xs text-gray-500">
                                  Total Violations
                                </p>
                              </div>

                              <div className="rounded-xl border border-gray-200 p-3 text-center">
                                <p className="text-lg font-semibold text-gray-900">
                                  {
                                    proctoringTotals.tab
                                  }
                                </p>

                                <p className="mt-0.5 text-xs text-gray-500">
                                  Tab Switches
                                </p>
                              </div>

                              <div className="rounded-xl border border-gray-200 p-3 text-center">
                                <p className="text-lg font-semibold text-gray-900">
                                  {
                                    proctoringTotals.interaction
                                  }
                                </p>

                                <p className="mt-0.5 text-xs text-gray-500">
                                  Copy/Paste/
                                  Right-click
                                </p>
                              </div>

                              <div className="rounded-xl border border-gray-200 p-3 text-center">
                                <p className="text-lg font-semibold text-gray-900">
                                  {
                                    proctoringTotals.face
                                  }
                                </p>

                                <p className="mt-0.5 text-xs text-gray-500">
                                  Face Violations
                                </p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400">
                              Proctoring data is not
                              available for your
                              completed interviews.
                            </p>
                          )}
                        </div>

                        {/* Strengths and improvement */}
                        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                          <h3 className="mb-4 text-base font-semibold text-gray-900">
                            Strengths & Improvement Areas
                          </h3>

                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            {/* Strengths */}
                            <div>
                              <p className="mb-2 text-xs font-medium text-green-700">
                                Common Strengths
                              </p>

                              <ul className="space-y-1.5">
                                {aggregatedPerformance
                                  .strengths.length >
                                0 ? (
                                  aggregatedPerformance.strengths.map(
                                    (
                                      strength,
                                      index
                                    ) => (
                                      <li
                                        key={`${strength}-${index}`}
                                        className="rounded-lg border border-green-100 bg-green-50 px-2.5 py-1.5 text-xs text-gray-600"
                                      >
                                        {
                                          strength
                                        }
                                      </li>
                                    )
                                  )
                                ) : (
                                  <li className="text-xs text-gray-400">
                                    Not enough data
                                    yet.
                                  </li>
                                )}
                              </ul>
                            </div>

                            {/* Weaknesses */}
                            <div>
                              <p className="mb-2 text-xs font-medium text-red-700">
                                Common Weaknesses
                              </p>

                              <ul className="space-y-1.5">
                                {aggregatedPerformance
                                  .weaknesses
                                  .length >
                                0 ? (
                                  aggregatedPerformance.weaknesses.map(
                                    (
                                      weakness,
                                      index
                                    ) => (
                                      <li
                                        key={`${weakness}-${index}`}
                                        className="rounded-lg border border-red-100 bg-red-50 px-2.5 py-1.5 text-xs text-gray-600"
                                      >
                                        {
                                          weakness
                                        }
                                      </li>
                                    )
                                  )
                                ) : (
                                  <li className="text-xs text-gray-400">
                                    Not enough data
                                    yet.
                                  </li>
                                )}
                              </ul>
                            </div>

                            {/* Areas for improvement */}
                            <div>
                              <p className="mb-2 text-xs font-medium text-amber-700">
                                Areas for
                                Improvement
                              </p>

                              <ul className="space-y-1.5">
                                {aggregatedPerformance
                                  .areasForImprovement
                                  .length >
                                0 ? (
                                  aggregatedPerformance.areasForImprovement.map(
                                    (
                                      improvement,
                                      index
                                    ) => (
                                      <li
                                        key={`${improvement}-${index}`}
                                        className="rounded-lg border border-amber-100 bg-amber-50 px-2.5 py-1.5 text-xs text-gray-600"
                                      >
                                        {
                                          improvement
                                        }
                                      </li>
                                    )
                                  )
                                ) : (
                                  <li className="text-xs text-gray-400">
                                    Not enough data
                                    yet.
                                  </li>
                                )}
                              </ul>
                            </div>
                          </div>
                        </div>

                        {/* Recent completed */}
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                          <h3 className="mb-4 text-base font-semibold text-gray-900">
                            Recent Completed Interviews
                          </h3>

                          {recentCompleted.length ===
                          0 ? (
                            <p className="py-8 text-center text-sm text-gray-400">
                              No completed interview
                              results available.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {recentCompleted.map(
                                (
                                  result
                                ) => (
                                  <div
                                    key={
                                      result.interview_id
                                    }
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 p-4"
                                  >
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold text-gray-900">
                                        {
                                          result.job_role
                                        }
                                      </p>

                                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                                          {
                                            result.interview_type
                                          }
                                        </span>

                                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                                          {
                                            result.difficulty
                                          }
                                        </span>

                                        <span className="text-[11px] text-gray-400">
                                          {formatDate(
                                            result.completed_at
                                          )}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-3">
                                      <span className="text-sm font-semibold text-gray-900">
                                        {
                                          result.percentage
                                        }%
                                      </span>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          router.push(
                                            `/interview/results/${result.interview_id}`
                                          )
                                        }
                                        className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-50"
                                      >
                                        View Results
                                      </button>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </div>

                        {/* Refresh */}
                        <div className="mt-6 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              fetchedResultIdsRef.current.clear();
                              setResultsById({});
                              setSomeResultsFailed(false);
                              void fetchInterviews();
                            }}
                            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                          >
                            Refresh Reports
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </main>
            </div>
          </div>
        );
      }}
    </AuthGuard>
  );
}