"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

interface InterviewResultsForScore {
  percentage: number;
}

type StatusFilter = "all" | "completed" | "not_completed";
type SortOrder = "newest" | "oldest";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    active: false,
    disabled: false,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-5 h-5"
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
    active: true,
    disabled: false,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-5 h-5"
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
    disabled: false,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-5 h-5"
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
    active: false,
    disabled: false,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-5 h-5"
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
    disabled: false,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-5 h-5"
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
    disabled: false,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-5 h-5"
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

function formatInterviewDate(iso: string | null): string {
  if (!iso) return "—";

  const date = new Date(iso);

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function InterviewsPage() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // --------------------------------------------------
  // Interview history
  // --------------------------------------------------

  const [interviews, setInterviews] =
    useState<InterviewSummary[] | null>(null);

  const [historyLoading, setHistoryLoading] =
    useState(true);

  const [historyError, setHistoryError] =
    useState("");

  // --------------------------------------------------
  // Interview scores
  // --------------------------------------------------

  const [percentageById, setPercentageById] =
    useState<Record<number, number>>({});

  const [scoresLoading, setScoresLoading] =
    useState(false);

  const fetchedScoreIdsRef =
    useRef<Set<number>>(new Set());

  // --------------------------------------------------
  // Filters
  // --------------------------------------------------

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [searchQuery, setSearchQuery] =
    useState("");

  const [sortOrder, setSortOrder] =
    useState<SortOrder>("newest");

  // --------------------------------------------------
  // Close menu
  // --------------------------------------------------

  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent
    ) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node
        )
      ) {
        setMenuOpen(false);
      }
    };

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

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push("/login");
  };

  // --------------------------------------------------
  // Fetch interviews
  // --------------------------------------------------

  const fetchInterviews = () => {
    let cancelled = false;

    (async () => {
      setHistoryLoading(true);
      setHistoryError("");

      try {
        const data =
          await apiFetch<InterviewSummary[]>(
            "/interviews"
          );

        if (cancelled) return;

        const sorted = [...data].sort(
          (a, b) => b.id - a.id
        );

        setInterviews(sorted);
      } catch (err) {
        if (cancelled) return;

        if (err instanceof ApiError) {
          setHistoryError(err.message);
        } else {
          setHistoryError(
            "Could not load your interview history."
          );
        }

        setInterviews(null);
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  };

  useEffect(() => {
    const cleanup = fetchInterviews();

    return cleanup;

    // Fetch only on initial mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------------------------------------------------
  // Fetch completed interview scores
  // --------------------------------------------------

  useEffect(() => {
    if (!interviews) return;

    const completedIds =
      interviews
        .filter(
          (interview) =>
            interview.status === "completed"
        )
        .map(
          (interview) => interview.id
        );

    const idsToFetch =
      completedIds.filter(
        (id) =>
          !fetchedScoreIdsRef.current.has(id)
      );

    if (idsToFetch.length === 0) {
      return;
    }

    let cancelled = false;

    (async () => {
      setScoresLoading(true);

      const updates: Record<
        number,
        number
      > = {};

      await Promise.all(
        idsToFetch.map(async (id) => {
          fetchedScoreIdsRef.current.add(id);

          try {
            const result =
              await apiFetch<InterviewResultsForScore>(
                `/interviews/${id}/results`
              );

            updates[id] = result.percentage;
          } catch (err) {
            console.error(
              `Could not load results for interview ${id}:`,
              err
            );
          }
        })
      );

      if (
        !cancelled &&
        Object.keys(updates).length > 0
      ) {
        setPercentageById(
          (previous) => ({
            ...previous,
            ...updates,
          })
        );
      }

      if (!cancelled) {
        setScoresLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [interviews]);

  // --------------------------------------------------
  // Statistics
  // --------------------------------------------------

  const totalInterviews =
    interviews?.length ?? 0;

  const completedInterviews =
    interviews?.filter(
      (interview) =>
        interview.status === "completed"
    ) ?? [];

  const completedCount =
    completedInterviews.length;

  const notCompletedCount =
    totalInterviews - completedCount;

  const availablePercentages =
    completedInterviews
      .map(
        (interview) =>
          percentageById[
            interview.id
          ]
      )
      .filter(
        (
          percentage
        ): percentage is number =>
          typeof percentage === "number"
      );

  const allCompletedScoresLoaded =
    completedCount > 0 &&
    availablePercentages.length ===
      completedCount;

  const averageScoreDisplay = (() => {
    if (completedCount === 0) {
      return "—";
    }

    if (!allCompletedScoresLoaded) {
      return "…";
    }

    const average =
      availablePercentages.reduce(
        (sum, percentage) =>
          sum + percentage,
        0
      ) /
      availablePercentages.length;

    return `${Math.round(
      average
    )}%`;
  })();

  // --------------------------------------------------
  // Filter / search / sort
  // --------------------------------------------------

  const visibleInterviews =
    useMemo(() => {
      if (!interviews) {
        return [];
      }

      let result = interviews;

      if (
        statusFilter ===
        "completed"
      ) {
        result = result.filter(
          (interview) =>
            interview.status ===
            "completed"
        );
      }

      if (
        statusFilter ===
        "not_completed"
      ) {
        result = result.filter(
          (interview) =>
            interview.status !==
            "completed"
        );
      }

      const query =
        searchQuery
          .trim()
          .toLowerCase();

      if (query) {
        result = result.filter(
          (interview) =>
            interview.job_role
              .toLowerCase()
              .includes(query) ||
            interview.interview_type
              .toLowerCase()
              .includes(query) ||
            interview.difficulty
              .toLowerCase()
              .includes(query)
        );
      }

      result = [...result].sort(
        (a, b) =>
          sortOrder === "newest"
            ? b.id - a.id
            : a.id - b.id
      );

      return result;
    }, [
      interviews,
      statusFilter,
      searchQuery,
      sortOrder,
    ]);

  // --------------------------------------------------
  // Stats
  // --------------------------------------------------

  const stats = [
    {
      label: "Total Interviews",
      value: historyLoading
        ? "…"
        : String(totalInterviews),
    },
    {
      label: "Completed",
      value: historyLoading
        ? "…"
        : String(completedCount),
    },
    {
      label: "Not Completed",
      value: historyLoading
        ? "…"
        : String(notCompletedCount),
    },
    {
      label: "Average Score",
      value: historyLoading
        ? "…"
        : averageScoreDisplay,
    },
  ];

  return (
    <AuthGuard>
      {(user) => {
        const initials = user.name
          .split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        return (
          <div className="min-h-screen bg-gray-50">

            {/* Mobile sidebar overlay */}

            {sidebarOpen && (
              <div
                className="fixed inset-0 bg-black/30 z-30 lg:hidden"
                onClick={() =>
                  setSidebarOpen(false)
                }
              />
            )}

            {/* Sidebar */}

            <aside
              className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-40 transform transition-transform duration-200 lg:translate-x-0 ${
                sidebarOpen
                  ? "translate-x-0"
                  : "-translate-x-full"
              }`}
            >

              {/* Logo */}

              <div className="h-16 flex items-center gap-2 px-6 border-b border-gray-200">

                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shrink-0">

                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="w-4 h-4 text-white"
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

                <span className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  InterviewAI
                </span>

              </div>

              {/* Navigation */}

              <nav className="px-3 py-6 space-y-1">

                {navItems.map(
                  (item) =>
                    item.disabled ? (
                      <button
                        key={item.label}
                        type="button"
                        disabled
                        title="Coming soon"
                        aria-disabled="true"
                        className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 cursor-not-allowed"
                      >
                        {item.icon}
                        {item.label}
                      </button>
                    ) : (
                      <Link
                        key={item.label}
                        href={
                          item.href ??
                          "/interviews"
                        }
                        onClick={() =>
                          setSidebarOpen(false)
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

              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">

                <div className="flex items-center gap-3 rounded-lg px-2 py-2">

                  <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center justify-center shrink-0">
                    {initials}
                  </div>

                  <div className="min-w-0">

                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.name}
                    </p>

                    <p className="text-xs text-gray-500 truncate">
                      {user.email}
                    </p>

                  </div>

                </div>

              </div>

            </aside>

            {/* Main content */}

            <div className="lg:pl-64">

              {/* Header */}

              <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6">

                <div className="flex items-center gap-3">

                  <button
                    type="button"
                    onClick={() =>
                      setSidebarOpen(true)
                    }
                    className="lg:hidden text-gray-600 hover:text-gray-900"
                    aria-label="Open sidebar"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="w-6 h-6"
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

                  <h1 className="text-base sm:text-lg font-semibold text-gray-900">
                    Interviews
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
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50 transition"
                    aria-haspopup="true"
                    aria-expanded={
                      menuOpen
                    }
                  >

                    <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center justify-center shrink-0">
                      {initials}
                    </div>

                    <span className="hidden sm:inline text-sm text-gray-700">
                      {user.name}
                    </span>

                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className={`hidden sm:inline w-4 h-4 text-gray-400 transition-transform ${
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
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-lg py-2 z-30">

                      <div className="px-4 py-3">

                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.name}
                        </p>

                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>

                      </div>

                      <div className="py-1 border-t border-gray-100">

                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              "/profile"
                            )
                          }
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
                        >

                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="w-4 h-4"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>

                          Profile

                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              "/settings"
                            )
                          }
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
                        >

                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="w-4 h-4"
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

                          Settings

                        </button>

                      </div>

                      <div className="border-t border-gray-100 pt-1">

                        <button
                          type="button"
                          onClick={
                            handleLogout
                          }
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-red-600 transition"
                        >

                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="w-4 h-4"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>

                          Log out

                        </button>

                      </div>

                    </div>
                  )}

                </div>

              </header>

              {/* Content */}

              <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

                {/* Page title */}

                <div className="mb-8">

                  <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900">
                    Interviews
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    View and review all your interview sessions.
                  </p>

                </div>

                {/* Stats */}

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

                  {stats.map(
                    (stat) => (
                      <div
                        key={
                          stat.label
                        }
                        className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5"
                      >

                        <p className="text-sm text-gray-500">
                          {
                            stat.label
                          }
                        </p>

                        <p className="mt-1 text-2xl font-semibold text-gray-900">
                          {
                            stat.value
                          }
                        </p>

                      </div>
                    )
                  )}

                </div>

                {/* Loading */}

                {historyLoading ? (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 flex flex-col items-center justify-center text-center">

                    <div className="h-8 w-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mb-3" />

                    <p className="text-sm text-gray-500">
                      Loading your interview history...
                    </p>

                  </div>
                ) : historyError ? (
                  /* Error */

                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">

                    <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 inline-block">
                      {
                        historyError
                      }
                    </p>

                    <div>

                      <button
                        type="button"
                        onClick={
                          fetchInterviews
                        }
                        className="mt-4 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium px-5 py-2.5 hover:opacity-90 transition"
                      >
                        Try Again
                      </button>

                    </div>

                  </div>
                ) : !interviews ||
                  interviews.length ===
                    0 ? (
                  /* Empty */

                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 flex flex-col items-center justify-center text-center">

                    <div className="h-12 w-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">

                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="w-6 h-6"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          d="M12 8v4l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>

                    </div>

                    <p className="text-sm font-medium text-gray-900">
                      No interviews yet
                    </p>

                    <p className="mt-1 text-sm text-gray-500 max-w-xs">
                      Start your first AI-powered mock interview.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          "/interview"
                        )
                      }
                      className="mt-4 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium px-5 py-2.5 hover:opacity-90 transition"
                    >
                      Start New Interview
                    </button>

                  </div>
                ) : (
                  <>

                    {/* Filters */}

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-6">

                      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">

                        {/* Status filters */}

                        <div className="flex items-center gap-2 flex-wrap">

                          {(
                            [
                              "all",
                              "completed",
                              "not_completed",
                            ] as StatusFilter[]
                          ).map(
                            (
                              filter
                            ) => (
                              <button
                                key={
                                  filter
                                }
                                type="button"
                                onClick={() =>
                                  setStatusFilter(
                                    filter
                                  )
                                }
                                className={`rounded-lg text-sm font-medium px-3 py-1.5 transition ${
                                  statusFilter ===
                                  filter
                                    ? "bg-indigo-600 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                              >
                                {filter ===
                                "all"
                                  ? "All"
                                  : filter ===
                                    "completed"
                                  ? "Completed"
                                  : "Not Completed"}
                              </button>
                            )
                          )}

                        </div>

                        {/* Search / Sort */}

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">

                          {/* Search */}

                          <div className="relative">

                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <circle
                                cx="11"
                                cy="11"
                                r="7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />

                              <path
                                d="M21 21l-4.35-4.35"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>

                            <input
                              type="text"
                              value={
                                searchQuery
                              }
                              onChange={(
                                event
                              ) =>
                                setSearchQuery(
                                  event.target
                                    .value
                                )
                              }
                              placeholder="Search role, type, difficulty..."
                              className="pl-9 pr-3 py-1.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64"
                            />

                          </div>

                          {/* Sort */}

                          <select
                            value={
                              sortOrder
                            }
                            onChange={(
                              event
                            ) =>
                              setSortOrder(
                                event.target
                                  .value as SortOrder
                              )
                            }
                            className="text-sm rounded-lg border border-gray-300 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          >

                            <option value="newest">
                              Newest first
                            </option>

                            <option value="oldest">
                              Oldest first
                            </option>

                          </select>

                        </div>

                      </div>

                    </div>

                    {/* Results count */}

                    <div className="flex items-center justify-between mb-4">

                      <p className="text-sm text-gray-500">

                        Showing{" "}
                        <span className="font-medium text-gray-900">
                          {
                            visibleInterviews.length
                          }
                        </span>{" "}
                        of{" "}
                        <span className="font-medium text-gray-900">
                          {
                            totalInterviews
                          }
                        </span>{" "}
                        interviews

                      </p>

                      {scoresLoading && (
                        <p className="text-xs text-gray-400">
                          Loading scores...
                        </p>
                      )}

                    </div>

                    {/* No results */}

                    {visibleInterviews.length ===
                    0 ? (
                      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">

                        <p className="text-sm font-medium text-gray-900">
                          No matching interviews found.
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          Try changing your search or filter.
                        </p>

                      </div>
                    ) : (
                      /* Interview list */

                      <div className="space-y-3">

                        {visibleInterviews.map(
                          (
                            interview
                          ) => {

                            const isCompleted =
                              interview.status ===
                              "completed";

                            const percentage =
                              percentageById[
                                interview.id
                              ];

                            const percentageKnown =
                              typeof percentage ===
                              "number";

                            return (
                              <div
                                key={
                                  interview.id
                                }
                                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:border-gray-300 transition"
                              >

                                <div className="flex items-start justify-between gap-4 flex-wrap">

                                  {/* Interview info */}

                                  <div className="min-w-0 flex-1">

                                    <p className="text-base font-semibold text-gray-900">
                                      {
                                        interview.job_role
                                      }
                                    </p>

                                    <div className="mt-2 flex flex-wrap items-center gap-1.5">

                                      <span className="rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-medium px-2.5 py-1">
                                        {
                                          interview.interview_type
                                        }
                                      </span>

                                      <span className="rounded-full bg-gray-100 text-gray-700 text-[11px] font-medium px-2.5 py-1">
                                        {
                                          interview.difficulty
                                        }
                                      </span>

                                      <span className="rounded-full bg-gray-100 text-gray-700 text-[11px] font-medium px-2.5 py-1">
                                        {
                                          interview.duration_minutes
                                        }{" "}
                                        min
                                      </span>

                                    </div>

                                  </div>

                                  {/* Status/date */}

                                  <div className="flex flex-col items-end gap-1.5 shrink-0">

                                    {isCompleted ? (
                                      <span className="rounded-full bg-green-100 text-green-700 text-[11px] font-medium px-2.5 py-1">
                                        Completed
                                      </span>
                                    ) : (
                                      <span className="rounded-full bg-amber-100 text-amber-700 text-[11px] font-medium px-2.5 py-1">
                                        Not Completed
                                      </span>
                                    )}

                                    <span className="text-xs text-gray-400">
                                      {
                                        formatInterviewDate(
                                          interview.completed_at
                                        )
                                      }
                                    </span>

                                  </div>

                                </div>

                                {/* Completed details */}

                                {isCompleted && (
                                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap">

                                    <div className="text-sm">

                                      <span className="text-gray-500">
                                        Score:{" "}
                                      </span>

                                      <span className="font-semibold text-gray-900">

                                        {percentageKnown
                                          ? `${percentage}%`
                                          : scoresLoading
                                          ? "Loading..."
                                          : "—"}

                                      </span>

                                    </div>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        router.push(
                                          `/interview/results/${interview.id}`
                                        )
                                      }
                                      className="rounded-lg border border-indigo-200 text-indigo-700 text-xs font-medium px-3 py-1.5 hover:bg-indigo-50 transition"
                                    >
                                      View Results
                                    </button>

                                  </div>
                                )}

                              </div>
                            );
                          }
                        )}

                      </div>
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