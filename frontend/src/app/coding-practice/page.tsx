"use client";

import type { ReactNode } from "react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import { apiFetch } from "@/lib/api";

type Difficulty = "Easy" | "Medium" | "Hard";

interface CodingProblem {
  slug: string;
  title: string;
  difficulty: Difficulty;
  topic: string;
  status: "Not Started" | "Solved";
}

interface NavItem {
  label: string;
  href: string;
  active: boolean;
  disabled: boolean;
  icon: ReactNode;
}

interface CodingStatusResponse {
  problems: Array<{
    slug: string;
    solved: boolean;
  }>;
}

const navItems: NavItem[] = [
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
          d="M19.4 15a1.7 1.7 0 00.34 1.88l.06.06-1.41 1.41-.06-.06a1.7 1.7 0 00-1.88-.34 1.7 1.7 0 00-1.03 1.57v.08h-2v-.08a1.7 1.7 0 00-1.04-1.57 1.7 1.7 0 00-1.87.34l-.06.06-1.42-1.41.06-.06A1.7 1.7 0 008.5 15a1.7 1.7 0 00-1.57-1.03h-.08v-2h.08A1.7 1.7 0 008.5 10.9a1.7 1.7 0 00-.34-1.88l-.06-.06 1.41-1.41.06.06a1.7 1.7 0 001.87.34 1.7 1.7 0 001.04-1.57V6.3h2v.08a1.7 1.7 0 001.03 1.57 1.7 1.7 0 001.88-.34l.06-.06 1.41 1.41-.06.06A1.7 1.7 0 0019.4 10.9a1.7 1.7 0 001.57 1.03h.08v2h-.08A1.7 1.7 0 0019.4 15z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const problems: CodingProblem[] = [
  // -------------------- ARRAYS --------------------
  {
    slug: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    topic: "Arrays",
    status: "Not Started",
  },
  {
    slug: "best-time-to-buy-and-sell-stock",
    title: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    topic: "Arrays",
    status: "Not Started",
  },
  {
    slug: "contains-duplicate",
    title: "Contains Duplicate",
    difficulty: "Easy",
    topic: "Arrays",
    status: "Not Started",
  },
  {
    slug: "product-of-array-except-self",
    title: "Product of Array Except Self",
    difficulty: "Medium",
    topic: "Arrays",
    status: "Not Started",
  },
  {
    slug: "maximum-subarray",
    title: "Maximum Subarray",
    difficulty: "Medium",
    topic: "Arrays",
    status: "Not Started",
  },
  {
    slug: "maximum-product-subarray",
    title: "Maximum Product Subarray",
    difficulty: "Medium",
    topic: "Arrays",
    status: "Not Started",
  },
  {
    slug: "merge-intervals",
    title: "Merge Intervals",
    difficulty: "Medium",
    topic: "Arrays",
    status: "Not Started",
  },
  {
    slug: "insert-interval",
    title: "Insert Interval",
    difficulty: "Medium",
    topic: "Arrays",
    status: "Not Started",
  },
  {
    slug: "rotate-array",
    title: "Rotate Array",
    difficulty: "Medium",
    topic: "Arrays",
    status: "Not Started",
  },
  {
    slug: "move-zeroes",
    title: "Move Zeroes",
    difficulty: "Easy",
    topic: "Arrays",
    status: "Not Started",
  },
  {
    slug: "missing-number",
    title: "Missing Number",
    difficulty: "Easy",
    topic: "Arrays",
    status: "Not Started",
  },
  {
    slug: "majority-element",
    title: "Majority Element",
    difficulty: "Easy",
    topic: "Arrays",
    status: "Not Started",
  },
  {
    slug: "find-the-duplicate-number",
    title: "Find the Duplicate Number",
    difficulty: "Medium",
    topic: "Arrays",
    status: "Not Started",
  },
  {
    slug: "subarray-sum-equals-k",
    title: "Subarray Sum Equals K",
    difficulty: "Medium",
    topic: "Arrays",
    status: "Not Started",
  },
  {
    slug: "trapping-rain-water",
    title: "Trapping Rain Water",
    difficulty: "Hard",
    topic: "Arrays",
    status: "Not Started",
  },

  // -------------------- STRINGS --------------------
  {
    slug: "valid-anagram",
    title: "Valid Anagram",
    difficulty: "Easy",
    topic: "Strings",
    status: "Not Started",
  },
  {
    slug: "valid-palindrome",
    title: "Valid Palindrome",
    difficulty: "Easy",
    topic: "Strings",
    status: "Not Started",
  },
  {
    slug: "longest-common-prefix",
    title: "Longest Common Prefix",
    difficulty: "Easy",
    topic: "Strings",
    status: "Not Started",
  },
  {
    slug: "reverse-string",
    title: "Reverse String",
    difficulty: "Easy",
    topic: "Strings",
    status: "Not Started",
  },
  {
    slug: "reverse-words-in-a-string",
    title: "Reverse Words in a String",
    difficulty: "Medium",
    topic: "Strings",
    status: "Not Started",
  },
  {
    slug: "longest-substring-without-repeating-characters",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    topic: "Strings",
    status: "Not Started",
  },
  {
    slug: "longest-palindromic-substring",
    title: "Longest Palindromic Substring",
    difficulty: "Medium",
    topic: "Strings",
    status: "Not Started",
  },
  {
    slug: "group-anagrams",
    title: "Group Anagrams",
    difficulty: "Medium",
    topic: "Strings",
    status: "Not Started",
  },
  {
    slug: "string-to-integer-atoi",
    title: "String to Integer (atoi)",
    difficulty: "Medium",
    topic: "Strings",
    status: "Not Started",
  },
  {
    slug: "minimum-window-substring",
    title: "Minimum Window Substring",
    difficulty: "Hard",
    topic: "Strings",
    status: "Not Started",
  },
  {
    slug: "implement-strstr",
    title: "Find the Index of the First Occurrence",
    difficulty: "Easy",
    topic: "Strings",
    status: "Not Started",
  },
  {
    slug: "palindromic-substrings",
    title: "Palindromic Substrings",
    difficulty: "Medium",
    topic: "Strings",
    status: "Not Started",
  },

  // -------------------- HASHING --------------------
  {
    slug: "contains-duplicate-ii",
    title: "Contains Duplicate II",
    difficulty: "Easy",
    topic: "Hashing",
    status: "Not Started",
  },
  {
    slug: "happy-number",
    title: "Happy Number",
    difficulty: "Easy",
    topic: "Hashing",
    status: "Not Started",
  },
  {
    slug: "isomorphic-strings",
    title: "Isomorphic Strings",
    difficulty: "Easy",
    topic: "Hashing",
    status: "Not Started",
  },
  {
    slug: "word-pattern",
    title: "Word Pattern",
    difficulty: "Easy",
    topic: "Hashing",
    status: "Not Started",
  },
  {
    slug: "longest-consecutive-sequence",
    title: "Longest Consecutive Sequence",
    difficulty: "Medium",
    topic: "Hashing",
    status: "Not Started",
  },
  {
    slug: "top-k-frequent-elements",
    title: "Top K Frequent Elements",
    difficulty: "Medium",
    topic: "Hashing",
    status: "Not Started",
  },
  {
    slug: "subarray-sum",
    title: "Subarray Sum",
    difficulty: "Medium",
    topic: "Hashing",
    status: "Not Started",
  },
  {
    slug: "four-sum-ii",
    title: "4Sum II",
    difficulty: "Medium",
    topic: "Hashing",
    status: "Not Started",
  },

  // -------------------- TWO POINTERS --------------------
  {
    slug: "two-sum-ii",
    title: "Two Sum II - Input Array Is Sorted",
    difficulty: "Medium",
    topic: "Two Pointers",
    status: "Not Started",
  },
  {
    slug: "three-sum",
    title: "3Sum",
    difficulty: "Medium",
    topic: "Two Pointers",
    status: "Not Started",
  },
  {
    slug: "container-with-most-water",
    title: "Container With Most Water",
    difficulty: "Medium",
    topic: "Two Pointers",
    status: "Not Started",
  },
  {
    slug: "sort-colors",
    title: "Sort Colors",
    difficulty: "Medium",
    topic: "Two Pointers",
    status: "Not Started",
  },
  {
    slug: "squares-of-a-sorted-array",
    title: "Squares of a Sorted Array",
    difficulty: "Easy",
    topic: "Two Pointers",
    status: "Not Started",
  },
  {
    slug: "remove-duplicates-from-sorted-array",
    title: "Remove Duplicates from Sorted Array",
    difficulty: "Easy",
    topic: "Two Pointers",
    status: "Not Started",
  },
  {
    slug: "four-sum",
    title: "4Sum",
    difficulty: "Medium",
    topic: "Two Pointers",
    status: "Not Started",
  },

  // -------------------- SLIDING WINDOW --------------------
  {
    slug: "maximum-average-subarray",
    title: "Maximum Average Subarray I",
    difficulty: "Easy",
    topic: "Sliding Window",
    status: "Not Started",
  },
  {
    slug: "minimum-size-subarray-sum",
    title: "Minimum Size Subarray Sum",
    difficulty: "Medium",
    topic: "Sliding Window",
    status: "Not Started",
  },
  {
    slug: "permutation-in-string",
    title: "Permutation in String",
    difficulty: "Medium",
    topic: "Sliding Window",
    status: "Not Started",
  },
  {
    slug: "find-all-anagrams",
    title: "Find All Anagrams in a String",
    difficulty: "Medium",
    topic: "Sliding Window",
    status: "Not Started",
  },
  {
    slug: "longest-repeating-character-replacement",
    title: "Longest Repeating Character Replacement",
    difficulty: "Medium",
    topic: "Sliding Window",
    status: "Not Started",
  },
  {
    slug: "substring-concatenation-all-words",
    title: "Substring with Concatenation of All Words",
    difficulty: "Hard",
    topic: "Sliding Window",
    status: "Not Started",
  },
  {
    slug: "sliding-window-maximum",
    title: "Sliding Window Maximum",
    difficulty: "Hard",
    topic: "Sliding Window",
    status: "Not Started",
  },

  // -------------------- SEARCHING / BINARY SEARCH --------------------
  {
    slug: "binary-search",
    title: "Binary Search",
    difficulty: "Easy",
    topic: "Searching",
    status: "Not Started",
  },
  {
    slug: "search-insert-position",
    title: "Search Insert Position",
    difficulty: "Easy",
    topic: "Searching",
    status: "Not Started",
  },
  {
    slug: "first-bad-version",
    title: "First Bad Version",
    difficulty: "Easy",
    topic: "Searching",
    status: "Not Started",
  },
  {
    slug: "search-a-2d-matrix",
    title: "Search a 2D Matrix",
    difficulty: "Medium",
    topic: "Searching",
    status: "Not Started",
  },
  {
    slug: "find-minimum-rotated-sorted-array",
    title: "Find Minimum in Rotated Sorted Array",
    difficulty: "Medium",
    topic: "Searching",
    status: "Not Started",
  },
  {
    slug: "search-rotated-sorted-array",
    title: "Search in Rotated Sorted Array",
    difficulty: "Medium",
    topic: "Searching",
    status: "Not Started",
  },
  {
    slug: "koko-eating-bananas",
    title: "Koko Eating Bananas",
    difficulty: "Medium",
    topic: "Searching",
    status: "Not Started",
  },
  {
    slug: "median-of-two-sorted-arrays",
    title: "Median of Two Sorted Arrays",
    difficulty: "Hard",
    topic: "Searching",
    status: "Not Started",
  },

  // -------------------- STACK / QUEUE --------------------
  {
    slug: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "Easy",
    topic: "Stack",
    status: "Not Started",
  },
  {
    slug: "min-stack",
    title: "Min Stack",
    difficulty: "Medium",
    topic: "Stack",
    status: "Not Started",
  },
  {
    slug: "daily-temperatures",
    title: "Daily Temperatures",
    difficulty: "Medium",
    topic: "Stack",
    status: "Not Started",
  },
  {
    slug: "evaluate-reverse-polish-notation",
    title: "Evaluate Reverse Polish Notation",
    difficulty: "Medium",
    topic: "Stack",
    status: "Not Started",
  },
  {
    slug: "next-greater-element",
    title: "Next Greater Element I",
    difficulty: "Easy",
    topic: "Stack",
    status: "Not Started",
  },
  {
    slug: "largest-rectangle-histogram",
    title: "Largest Rectangle in Histogram",
    difficulty: "Hard",
    topic: "Stack",
    status: "Not Started",
  },
  {
    slug: "implement-queue-using-stacks",
    title: "Implement Queue using Stacks",
    difficulty: "Easy",
    topic: "Queue",
    status: "Not Started",
  },
  {
    slug: "design-circular-queue",
    title: "Design Circular Queue",
    difficulty: "Medium",
    topic: "Queue",
    status: "Not Started",
  },

  // -------------------- LINKED LIST --------------------
  {
    slug: "reverse-linked-list",
    title: "Reverse Linked List",
    difficulty: "Easy",
    topic: "Linked List",
    status: "Not Started",
  },
  {
    slug: "merge-two-sorted-lists",
    title: "Merge Two Sorted Lists",
    difficulty: "Easy",
    topic: "Linked List",
    status: "Not Started",
  },
  {
    slug: "linked-list-cycle",
    title: "Linked List Cycle",
    difficulty: "Easy",
    topic: "Linked List",
    status: "Not Started",
  },
  {
    slug: "middle-of-the-linked-list",
    title: "Middle of the Linked List",
    difficulty: "Easy",
    topic: "Linked List",
    status: "Not Started",
  },
  {
    slug: "remove-nth-node-from-end",
    title: "Remove Nth Node From End of List",
    difficulty: "Medium",
    topic: "Linked List",
    status: "Not Started",
  },
  {
    slug: "reorder-list",
    title: "Reorder List",
    difficulty: "Medium",
    topic: "Linked List",
    status: "Not Started",
  },
  {
    slug: "add-two-numbers",
    title: "Add Two Numbers",
    difficulty: "Medium",
    topic: "Linked List",
    status: "Not Started",
  },
  {
    slug: "merge-k-sorted-lists",
    title: "Merge k Sorted Lists",
    difficulty: "Hard",
    topic: "Linked List",
    status: "Not Started",
  },

  // -------------------- TREES --------------------
  {
    slug: "maximum-depth-binary-tree",
    title: "Maximum Depth of Binary Tree",
    difficulty: "Easy",
    topic: "Trees",
    status: "Not Started",
  },
  {
    slug: "invert-binary-tree",
    title: "Invert Binary Tree",
    difficulty: "Easy",
    topic: "Trees",
    status: "Not Started",
  },
  {
    slug: "same-tree",
    title: "Same Tree",
    difficulty: "Easy",
    topic: "Trees",
    status: "Not Started",
  },
  {
    slug: "binary-tree-level-order-traversal",
    title: "Binary Tree Level Order Traversal",
    difficulty: "Medium",
    topic: "Trees",
    status: "Not Started",
  },
  {
    slug: "validate-binary-search-tree",
    title: "Validate Binary Search Tree",
    difficulty: "Medium",
    topic: "Trees",
    status: "Not Started",
  },
  {
    slug: "kth-smallest-element-bst",
    title: "Kth Smallest Element in a BST",
    difficulty: "Medium",
    topic: "Trees",
    status: "Not Started",
  },
  {
    slug: "lowest-common-ancestor",
    title: "Lowest Common Ancestor of a Binary Tree",
    difficulty: "Medium",
    topic: "Trees",
    status: "Not Started",
  },
  {
    slug: "serialize-and-deserialize-binary-tree",
    title: "Serialize and Deserialize Binary Tree",
    difficulty: "Hard",
    topic: "Trees",
    status: "Not Started",
  },
  {
    slug: "diameter-of-binary-tree",
    title: "Diameter of Binary Tree",
    difficulty: "Easy",
    topic: "Trees",
    status: "Not Started",
  },
  {
    slug: "balanced-binary-tree",
    title: "Balanced Binary Tree",
    difficulty: "Easy",
    topic: "Trees",
    status: "Not Started",
  },

  // -------------------- HEAP --------------------
  {
    slug: "kth-largest-element",
    title: "Kth Largest Element in an Array",
    difficulty: "Medium",
    topic: "Heap",
    status: "Not Started",
  },
  {
    slug: "last-stone-weight",
    title: "Last Stone Weight",
    difficulty: "Easy",
    topic: "Heap",
    status: "Not Started",
  },
  {
    slug: "find-median-data-stream",
    title: "Find Median from Data Stream",
    difficulty: "Hard",
    topic: "Heap",
    status: "Not Started",
  },
  {
    slug: "top-k-frequent-words",
    title: "Top K Frequent Words",
    difficulty: "Medium",
    topic: "Heap",
    status: "Not Started",
  },
  {
    slug: "task-scheduler",
    title: "Task Scheduler",
    difficulty: "Medium",
    topic: "Heap",
    status: "Not Started",
  },

  // -------------------- DYNAMIC PROGRAMMING --------------------
  {
    slug: "climbing-stairs",
    title: "Climbing Stairs",
    difficulty: "Easy",
    topic: "Dynamic Programming",
    status: "Not Started",
  },
  {
    slug: "house-robber",
    title: "House Robber",
    difficulty: "Medium",
    topic: "Dynamic Programming",
    status: "Not Started",
  },
  {
    slug: "coin-change",
    title: "Coin Change",
    difficulty: "Medium",
    topic: "Dynamic Programming",
    status: "Not Started",
  },
  {
    slug: "longest-increasing-subsequence",
    title: "Longest Increasing Subsequence",
    difficulty: "Medium",
    topic: "Dynamic Programming",
    status: "Not Started",
  },
  {
    slug: "word-break",
    title: "Word Break",
    difficulty: "Medium",
    topic: "Dynamic Programming",
    status: "Not Started",
  },
  {
    slug: "edit-distance",
    title: "Edit Distance",
    difficulty: "Hard",
    topic: "Dynamic Programming",
    status: "Not Started",
  },

  // -------------------- BACKTRACKING --------------------
  {
    slug: "subsets",
    title: "Subsets",
    difficulty: "Medium",
    topic: "Backtracking",
    status: "Not Started",
  },
  {
    slug: "permutations",
    title: "Permutations",
    difficulty: "Medium",
    topic: "Backtracking",
    status: "Not Started",
  },
  {
    slug: "combination-sum",
    title: "Combination Sum",
    difficulty: "Medium",
    topic: "Backtracking",
    status: "Not Started",
  },
  {
    slug: "n-queens",
    title: "N-Queens",
    difficulty: "Hard",
    topic: "Backtracking",
    status: "Not Started",
  },

  // -------------------- GRAPHS --------------------
  {
    slug: "number-of-islands",
    title: "Number of Islands",
    difficulty: "Medium",
    topic: "Graphs",
    status: "Not Started",
  },
  {
    slug: "clone-graph",
    title: "Clone Graph",
    difficulty: "Medium",
    topic: "Graphs",
    status: "Not Started",
  },
  {
    slug: "course-schedule",
    title: "Course Schedule",
    difficulty: "Medium",
    topic: "Graphs",
    status: "Not Started",
  },
  {
    slug: "rotting-oranges",
    title: "Rotting Oranges",
    difficulty: "Medium",
    topic: "Graphs",
    status: "Not Started",
  },

  // -------------------- DESIGN --------------------
  {
    slug: "lru-cache",
    title: "LRU Cache",
    difficulty: "Hard",
    topic: "Design",
    status: "Not Started",
  },
  {
    slug: "design-twitter",
    title: "Design Twitter",
    difficulty: "Medium",
    topic: "Design",
    status: "Not Started",
  },
];

const TOPICS = [
  "All Topics",
  "Arrays",
  "Strings",
  "Hashing",
  "Two Pointers",
  "Sliding Window",
  "Searching",
  "Stack",
  "Queue",
  "Linked List",
  "Trees",
  "Heap",
  "Dynamic Programming",
  "Backtracking",
  "Graphs",
  "Design",
];

const DIFFICULTIES = [
  "All",
  "Easy",
  "Medium",
  "Hard",
];

function getDifficultyClass(
  difficulty: Difficulty
): string {
  if (difficulty === "Easy") {
    return "bg-green-50 text-green-700";
  }

  if (difficulty === "Medium") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-red-50 text-red-700";
}

export default function CodingPracticePage() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [difficultyFilter, setDifficultyFilter] =
    useState("All");

  const [topicFilter, setTopicFilter] =
    useState("All Topics");

  const [searchQuery, setSearchQuery] =
    useState("");

  const [solvedSlugs, setSolvedSlugs] =
    useState<Set<string>>(new Set());

  const [codingLoading, setCodingLoading] =
    useState(true);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push("/login");
  };

  // ========================================================
  // LOAD CODING PROGRESS FROM BACKEND
  // ========================================================

  useEffect(() => {
    let cancelled = false;

    const loadCodingStatus = async () => {
      try {
        setCodingLoading(true);

        const data =
          await apiFetch<CodingStatusResponse>(
            "/coding/problems"
          );

        if (cancelled) {
          return;
        }

        const solved = new Set(
          data.problems
            .filter(
              (problem) => problem.solved
            )
            .map(
              (problem) => problem.slug
            )
        );

        setSolvedSlugs(solved);
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Could not load coding progress:",
            error
          );

          setSolvedSlugs(
            new Set()
          );
        }
      } finally {
        if (!cancelled) {
          setCodingLoading(false);
        }
      }
    };

    void loadCodingStatus();

    // Refresh progress whenever the page gets focus again.
    const handleFocus = () => {
      void loadCodingStatus();
    };

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      cancelled = true;

      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, []);

  // ========================================================
  // APPLY BACKEND SOLVED STATUS
  // ========================================================

  const problemsWithStatus =
    useMemo(() => {
      return problems.map(
        (problem) => ({
          ...problem,
          status: solvedSlugs.has(
            problem.slug
          )
            ? "Solved"
            : "Not Started",
        })
      );
    }, [solvedSlugs]);

  // ========================================================
  // FILTERED PROBLEMS
  // ========================================================

  const filteredProblems =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      return problemsWithStatus.filter(
        (problem) => {
          const difficultyMatches =
            difficultyFilter === "All" ||
            problem.difficulty ===
              difficultyFilter;

          const topicMatches =
            topicFilter === "All Topics" ||
            problem.topic ===
              topicFilter;

          const searchMatches =
            !query ||
            problem.title
              .toLowerCase()
              .includes(query) ||
            problem.topic
              .toLowerCase()
              .includes(query);

          return (
            difficultyMatches &&
            topicMatches &&
            searchMatches
          );
        }
      );
    }, [
      difficultyFilter,
      topicFilter,
      searchQuery,
      problemsWithStatus,
    ]);

  const totalProblems =
    problems.length;

  const easyCount =
    problems.filter(
      (problem) =>
        problem.difficulty ===
        "Easy"
    ).length;

  const mediumCount =
    problems.filter(
      (problem) =>
        problem.difficulty ===
        "Medium"
    ).length;

  const hardCount =
    problems.filter(
      (problem) =>
        problem.difficulty ===
        "Hard"
    ).length;

  const solvedCount =
    problemsWithStatus.filter(
      (problem) =>
        problem.status ===
        "Solved"
    ).length;

  return (
    <AuthGuard>
      {(user) => {
        const initials =
          user.name
            .split(" ")
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

            {/* Main */}

            <div className="lg:pl-64">

              {/* Header */}

              <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6">

                <div className="flex items-center gap-3">

                  <button
                    type="button"
                    onClick={() =>
                      setSidebarOpen(
                        true
                      )
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
                    Coding Practice
                  </h1>

                </div>

                {/* User Menu */}

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

                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.name}
                        </p>

                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>

                      <div className="py-1">

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
                              d="M19.4 15a1.7 1.7 0 00.34 1.88l.06.06-1.41 1.41-.06-.06a1.7 1.7 0 00-1.88-.34 1.7 1.7 0 00-1.03.34 1.7 1.7 0 00-1.03 1.57v.08h-2v-.08a1.7 1.7 0 00-1.04-1.57 1.7 1.7 0 00-1.87.34l-.06.06-1.42-1.41.06-.06A1.7 1.7 0 008.5 15a1.7 1.7 0 00-1.57-1.03h-.08v-2h.08A1.7 1.7 0 008.5 10.9a1.7 1.7 0 00-.34-1.88l-.06-.06 1.41-1.41.06.06A1.7 1.7 0 0010.7 8.3a1.7 1.7 0 001.04-1.57V6.3h2v.08a1.7 1.7 0 001.03 1.57 1.7 1.7 0 001.88-.34l.06-.06 1.41 1.41-.06.06A1.7 1.7 0 0019.4 10.9a1.7 1.7 0 001.57 1.03h.08v2h-.08A1.7 1.7 0 0019.4 15z"
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

                {/* Title */}

                <div className="mb-8">
                  <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900">
                    Coding Practice
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Improve your problem-solving skills with coding challenges.
                  </p>
                </div>

                {/* Stats */}

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">

                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <p className="text-sm text-gray-500">
                      Total Problems
                    </p>

                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {totalProblems}
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <p className="text-sm text-gray-500">
                      Easy
                    </p>

                    <p className="mt-1 text-2xl font-semibold text-green-600">
                      {easyCount}
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <p className="text-sm text-gray-500">
                      Medium
                    </p>

                    <p className="mt-1 text-2xl font-semibold text-amber-600">
                      {mediumCount}
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <p className="text-sm text-gray-500">
                      Hard
                    </p>

                    <p className="mt-1 text-2xl font-semibold text-red-600">
                      {hardCount}
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <p className="text-sm text-gray-500">
                      Solved
                    </p>

                    <p className="mt-1 text-2xl font-semibold text-indigo-600">
                      {codingLoading
                        ? "..."
                        : solvedCount}
                    </p>
                  </div>

                </div>

                {/* Filters */}

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-6">

                  <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">

                    {/* Difficulty */}

                    <div className="flex items-center gap-2 flex-wrap">
                      {DIFFICULTIES.map(
                        (difficulty) => (
                          <button
                            key={
                              difficulty
                            }
                            type="button"
                            onClick={() =>
                              setDifficultyFilter(
                                difficulty
                              )
                            }
                            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                              difficultyFilter ===
                              difficulty
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {difficulty}
                          </button>
                        )
                      )}
                    </div>

                    {/* Search + topic */}

                    <div className="flex flex-col sm:flex-row gap-2">

                      <div className="relative">

                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <circle
                            cx="11"
                            cy="11"
                            r="7"
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
                          placeholder="Search coding problems..."
                          className="w-full sm:w-64 pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />

                      </div>

                      <select
                        value={
                          topicFilter
                        }
                        onChange={(
                          event
                        ) =>
                          setTopicFilter(
                            event.target
                              .value
                          )
                        }
                        className="w-full sm:w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        {TOPICS.map(
                          (topic) => (
                            <option
                              key={
                                topic
                              }
                              value={
                                topic
                              }
                            >
                              {topic}
                            </option>
                          )
                        )}
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
                        filteredProblems.length
                      }
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-gray-900">
                      {
                        totalProblems
                      }
                    </span>{" "}
                    problems
                  </p>

                </div>

                {/* Problem list */}

                {filteredProblems.length ===
                0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">

                    <div className="h-12 w-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">

                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="w-6 h-6"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <circle
                          cx="11"
                          cy="11"
                          r="7"
                        />
                        <path
                          d="M21 21l-4.35-4.35"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>

                    </div>

                    <p className="text-sm font-semibold text-gray-900">
                      No problems found
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Try changing your search or filters.
                    </p>

                  </div>
                ) : (
                  <div className="space-y-3">

                    {filteredProblems.map(
                      (problem) => (
                        <div
                          key={
                            problem.slug
                          }
                          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:border-gray-300 hover:shadow-md transition"
                        >

                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                            <div className="min-w-0">

                              <div className="flex flex-wrap items-center gap-2">

                                <h3 className="text-base font-semibold text-gray-900">
                                  {
                                    problem.title
                                  }
                                </h3>

                                <span
                                  className={`rounded-full text-[11px] font-medium px-2.5 py-1 ${getDifficultyClass(
                                    problem.difficulty
                                  )}`}
                                >
                                  {
                                    problem.difficulty
                                  }
                                </span>

                              </div>

                              <div className="mt-2 flex flex-wrap items-center gap-2">

                                <span className="rounded-full bg-gray-100 text-gray-700 text-[11px] font-medium px-2.5 py-1">
                                  {
                                    problem.topic
                                  }
                                </span>

                                <span
                                  className={`text-xs ${
                                    problem.status ===
                                    "Solved"
                                      ? "text-green-600 font-medium"
                                      : "text-gray-400"
                                  }`}
                                >
                                  {
                                    problem.status
                                  }
                                </span>

                              </div>

                            </div>

                            <Link
                              href={`/coding-practice/${problem.slug}`}
                              className="shrink-0 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium px-5 py-2.5 hover:opacity-90 transition"
                            >
                              Solve

                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                className="w-4 h-4"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  d="M5 12h14M13 6l6 6-6 6"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </Link>

                          </div>

                        </div>
                      )
                    )}

                  </div>
                )}

              </main>

            </div>
          </div>
        );
      }}
    </AuthGuard>
  );
}