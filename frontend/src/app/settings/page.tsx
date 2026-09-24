"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";

interface NavItem {
  label: string;
  href: string;
  active: boolean;
  icon: React.ReactNode;
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
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 001.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543-.1-2.924 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

type InterviewType =
  | "Technical"
  | "Behavioral"
  | "Mixed";

type Difficulty =
  | "Easy"
  | "Medium"
  | "Hard";

type Duration =
  | 15
  | 30
  | 45
  | 60;

type Theme =
  | "light"
  | "dark";

interface InterviewPreferences {
  defaultInterviewType: InterviewType;
  defaultDifficulty: Difficulty;
  defaultDuration: Duration;
  emailNotifications: boolean;
  interviewReminders: boolean;
}

const DEFAULT_PREFERENCES: InterviewPreferences = {
  defaultInterviewType: "Technical",
  defaultDifficulty: "Medium",
  defaultDuration: 30,
  emailNotifications: true,
  interviewReminders: true,
};

const PREFERENCES_STORAGE_KEY =
  "interviewai_settings_preferences";

const THEME_STORAGE_KEY =
  "interviewai_theme";

const INTERVIEW_TYPES: InterviewType[] = [
  "Technical",
  "Behavioral",
  "Mixed",
];

const DIFFICULTIES: Difficulty[] = [
  "Easy",
  "Medium",
  "Hard",
];

const DURATIONS: Duration[] = [
  15,
  30,
  45,
  60,
];

function loadPreferencesFromStorage(): InterviewPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_PREFERENCES;
  }

  try {
    const raw =
      window.localStorage.getItem(
        PREFERENCES_STORAGE_KEY
      );

    if (!raw) {
      return DEFAULT_PREFERENCES;
    }

    const parsed =
      JSON.parse(raw);

    const type: InterviewType =
      INTERVIEW_TYPES.includes(
        parsed.defaultInterviewType
      )
        ? parsed.defaultInterviewType
        : DEFAULT_PREFERENCES.defaultInterviewType;

    const difficulty: Difficulty =
      DIFFICULTIES.includes(
        parsed.defaultDifficulty
      )
        ? parsed.defaultDifficulty
        : DEFAULT_PREFERENCES.defaultDifficulty;

    const duration: Duration =
      DURATIONS.includes(
        parsed.defaultDuration
      )
        ? parsed.defaultDuration
        : DEFAULT_PREFERENCES.defaultDuration;

    const emailNotifications =
      typeof parsed.emailNotifications ===
      "boolean"
        ? parsed.emailNotifications
        : DEFAULT_PREFERENCES.emailNotifications;

    const interviewReminders =
      typeof parsed.interviewReminders ===
      "boolean"
        ? parsed.interviewReminders
        : DEFAULT_PREFERENCES.interviewReminders;

    return {
      defaultInterviewType: type,
      defaultDifficulty: difficulty,
      defaultDuration: duration,
      emailNotifications,
      interviewReminders,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function loadTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  const saved =
    window.localStorage.getItem(
      THEME_STORAGE_KEY
    );

  return saved === "dark"
    ? "dark"
    : "light";
}

function applyTheme(
  theme: Theme
) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.classList.toggle(
    "dark",
    theme === "dark"
  );

  document.documentElement.style.colorScheme =
    theme;
}

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() =>
        onChange(!checked)
      }
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked
          ? "bg-indigo-600"
          : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked
            ? "translate-x-6"
            : "translate-x-1"
        }`}
      />
    </button>
  );
}

function ThemeToggle({
  theme,
  onChange,
}: {
  theme: Theme;
  onChange: (theme: Theme) => void;
}) {
  const dark =
    theme === "dark";

  return (
    <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 p-1">
      <button
        type="button"
        onClick={() =>
          onChange("light")
        }
        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
          !dark
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-800"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-4 w-4"
          stroke="currentColor"
          strokeWidth={2}
        >
          <circle
            cx="12"
            cy="12"
            r="4"
          />
          <path
            d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"
            strokeLinecap="round"
          />
        </svg>
        Light
      </button>

      <button
        type="button"
        onClick={() =>
          onChange("dark")
        }
        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
          dark
            ? "bg-gray-800 text-white shadow-sm"
            : "text-gray-500 hover:text-gray-800"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-4 w-4"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Dark
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [menuOpen, setMenuOpen] =
    useState(false);

  const menuRef =
    useRef<HTMLDivElement>(null);

  const [preferences, setPreferences] =
    useState<InterviewPreferences>(
      DEFAULT_PREFERENCES
    );

  const [theme, setTheme] =
    useState<Theme>("light");

  const [mounted, setMounted] =
    useState(false);

  const [saveMessage, setSaveMessage] =
    useState("");

  const [resetMessage, setResetMessage] =
    useState("");

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
  // Load settings
  // --------------------------------------------------

  useEffect(() => {
    const storedPreferences =
      loadPreferencesFromStorage();

    const storedTheme =
      loadTheme();

    setPreferences(
      storedPreferences
    );

    setTheme(storedTheme);

    applyTheme(storedTheme);

    setMounted(true);
  }, []);

  // --------------------------------------------------
  // Change theme
  // --------------------------------------------------

  function handleThemeChange(
    nextTheme: Theme
  ) {
    setTheme(nextTheme);

    localStorage.setItem(
      THEME_STORAGE_KEY,
      nextTheme
    );

    applyTheme(nextTheme);
  }

  // --------------------------------------------------
  // Save preferences
  // --------------------------------------------------

  function handleSave() {
    try {
      localStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify(
          preferences
        )
      );

      localStorage.setItem(
        THEME_STORAGE_KEY,
        theme
      );

      applyTheme(theme);

      setResetMessage("");

      setSaveMessage(
        "Preferences saved successfully."
      );
    } catch {
      setSaveMessage(
        "Could not save preferences."
      );
    }
  }

  // --------------------------------------------------
  // Reset
  // --------------------------------------------------

  function handleReset() {
    const defaultTheme: Theme =
      "light";

    setPreferences(
      DEFAULT_PREFERENCES
    );

    setTheme(defaultTheme);

    try {
      localStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify(
          DEFAULT_PREFERENCES
        )
      );

      localStorage.setItem(
        THEME_STORAGE_KEY,
        defaultTheme
      );

      applyTheme(
        defaultTheme
      );
    } catch {
      // Non-fatal.
    }

    setSaveMessage("");

    setResetMessage(
      "Preferences reset to defaults."
    );
  }

  // --------------------------------------------------
  // Auto-hide messages
  // --------------------------------------------------

  useEffect(() => {
    if (!saveMessage) {
      return;
    }

    const timer =
      window.setTimeout(
        () =>
          setSaveMessage(""),
        4000
      );

    return () =>
      window.clearTimeout(timer);
  }, [saveMessage]);

  useEffect(() => {
    if (!resetMessage) {
      return;
    }

    const timer =
      window.setTimeout(
        () =>
          setResetMessage(""),
        4000
      );

    return () =>
      window.clearTimeout(timer);
  }, [resetMessage]);

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
                    Settings
                  </h1>
                </div>

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
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
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
                        className="w-full px-4 py-2 text-left text-sm text-gray-600 transition hover:bg-gray-50"
                      >
                        Profile
                      </button>

                      <div className="border-t border-gray-100 pt-1">
                        <button
                          type="button"
                          onClick={
                            handleLogout
                          }
                          className="w-full px-4 py-2 text-left text-sm text-gray-600 transition hover:bg-gray-50 hover:text-red-600"
                        >
                          Log out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </header>

              <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
                    Settings
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Manage your account, interview
                    preferences, appearance, and
                    notifications.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Account */}
                  <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">
                          Account
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          Manage your personal information
                          and security.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            "/profile"
                          )
                        }
                        className="rounded-lg border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50"
                      >
                        Manage Profile
                      </button>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <p className="text-xs text-gray-500">
                          Full Name
                        </p>

                        <p className="mt-1 text-sm font-medium text-gray-900">
                          {user.name}
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <p className="text-xs text-gray-500">
                          Email Address
                        </p>

                        <p className="mt-1 break-all text-sm font-medium text-gray-900">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Password
                        </p>

                        <p className="mt-0.5 text-xs text-gray-500">
                          Update your password from your Profile.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            "/profile"
                          )
                        }
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
                      >
                        Change Password
                      </button>
                    </div>
                  </section>

                  {/* Appearance */}
                  <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">
                          Appearance
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          Choose how InterviewAI looks on your device.
                        </p>
                      </div>

                      {mounted && (
                        <ThemeToggle
                          theme={theme}
                          onChange={
                            handleThemeChange
                          }
                        />
                      )}
                    </div>

                    {mounted && (
                      <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                            {theme ===
                            "dark" ? (
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                className="h-5 w-5"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            ) : (
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
                                  r="4"
                                />
                                <path
                                  d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"
                                  strokeLinecap="round"
                                />
                              </svg>
                            )}
                          </div>

                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {theme ===
                              "dark"
                                ? "Dark mode enabled"
                                : "Light mode enabled"}
                            </p>

                            <p className="text-xs text-gray-500">
                              Your preference is saved automatically.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </section>

                  {/* Interview Preferences */}
                  <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                    <h3 className="text-base font-semibold text-gray-900">
                      Interview Preferences
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      These defaults will pre-fill your next interview setup.
                    </p>

                    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-700">
                          Default Interview Type
                        </label>

                        <select
                          value={
                            preferences.defaultInterviewType
                          }
                          onChange={(event) =>
                            setPreferences(
                              (previous) => ({
                                ...previous,
                                defaultInterviewType:
                                  event
                                    .target
                                    .value as InterviewType,
                              })
                            )
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                        >
                          {INTERVIEW_TYPES.map(
                            (type) => (
                              <option
                                key={type}
                                value={type}
                              >
                                {type}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-700">
                          Default Difficulty
                        </label>

                        <select
                          value={
                            preferences.defaultDifficulty
                          }
                          onChange={(event) =>
                            setPreferences(
                              (previous) => ({
                                ...previous,
                                defaultDifficulty:
                                  event
                                    .target
                                    .value as Difficulty,
                              })
                            )
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                        >
                          {DIFFICULTIES.map(
                            (difficulty) => (
                              <option
                                key={
                                  difficulty
                                }
                                value={
                                  difficulty
                                }
                              >
                                {difficulty}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-700">
                          Default Duration
                        </label>

                        <select
                          value={
                            preferences.defaultDuration
                          }
                          onChange={(event) =>
                            setPreferences(
                              (previous) => ({
                                ...previous,
                                defaultDuration:
                                  Number(
                                    event
                                      .target
                                      .value
                                  ) as Duration,
                              })
                            )
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                        >
                          {DURATIONS.map(
                            (duration) => (
                              <option
                                key={
                                  duration
                                }
                                value={
                                  duration
                                }
                              >
                                {
                                  duration
                                }{" "}
                                minutes
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>
                  </section>

                  {/* Notifications */}
                  <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                    <h3 className="text-base font-semibold text-gray-900">
                      Notifications
                    </h3>

                    <div className="mt-5 space-y-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Email Notifications
                          </p>

                          <p className="mt-0.5 text-xs text-gray-500">
                            Receive updates about interview results.
                          </p>
                        </div>

                        <ToggleSwitch
                          checked={
                            preferences.emailNotifications
                          }
                          onChange={(value) =>
                            setPreferences(
                              (previous) => ({
                                ...previous,
                                emailNotifications:
                                  value,
                              })
                            )
                          }
                          label="Email notifications"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-5">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Interview Reminders
                          </p>

                          <p className="mt-0.5 text-xs text-gray-500">
                            Receive reminders for upcoming interviews.
                          </p>
                        </div>

                        <ToggleSwitch
                          checked={
                            preferences.interviewReminders
                          }
                          onChange={(value) =>
                            setPreferences(
                              (previous) => ({
                                ...previous,
                                interviewReminders:
                                  value,
                              })
                            )
                          }
                          label="Interview reminders"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Privacy */}
                  <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                    <h3 className="text-base font-semibold text-gray-900">
                      Privacy
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      Your interview sessions, answers, evaluation
                      results, proctoring data, and uploaded resume
                      are associated with your authenticated account.
                    </p>
                  </section>

                  {/* Save / Reset */}
                  <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                    {mounted &&
                      saveMessage && (
                        <div className="mb-4 rounded-lg border border-green-100 bg-green-50 px-4 py-2.5 text-sm text-green-700">
                          {saveMessage}
                        </div>
                      )}

                    {mounted &&
                      resetMessage && (
                        <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-2.5 text-sm text-indigo-700">
                          {resetMessage}
                        </div>
                      )}

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={
                          handleSave
                        }
                        className="flex-1 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                      >
                        Save Preferences
                      </button>

                      <button
                        type="button"
                        onClick={
                          handleReset
                        }
                        className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        Reset Preferences
                      </button>
                    </div>
                  </section>
                </div>
              </main>
            </div>
          </div>
        );
      }}
    </AuthGuard>
  );
}