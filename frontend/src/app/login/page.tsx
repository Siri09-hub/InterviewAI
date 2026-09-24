"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // --------------------------------------------------
  // Validation
  // --------------------------------------------------

  const validate = () => {
    if (!email.trim()) {
      return "Email is required.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Enter a valid email address.";
    }

    if (!password) {
      return "Password is required.";
    }

    return "";
  };

  // --------------------------------------------------
  // Login
  // --------------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const data = await apiFetch<{
        access_token: string;
        token_type: string;
      }>("/auth/login", {
        method: "POST",
        body: {
          email,
          password,
        },
      });

      // Save authentication token.
      localStorage.setItem(
        "access_token",
        data.access_token
      );

      // --------------------------------------------------
      // Resume check
      // --------------------------------------------------
      //
      // Existing user with resume:
      //      Login -> Dashboard
      //
      // New user without resume:
      //      Login -> Resume Upload
      //
      // Any unexpected resume-check error:
      //      Login -> Dashboard
      //

      try {
        await apiFetch("/resumes/me");

        router.push("/dashboard");
      } catch (resumeError) {
        if (
          resumeError instanceof ApiError &&
          resumeError.status === 404
        ) {
          router.push("/resume-upload");
        } else {
          console.error(
            "Could not check resume status:",
            resumeError
          );

          router.push("/dashboard");
        }
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(
          "Could not connect to the server. Please try again."
        );
      }

      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-50 px-4 py-10 relative overflow-hidden">
      {/* Decorative background blobs */}

      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-violet-200/40 blur-3xl" />

      <div className="relative w-full max-w-md">

        {/* Brand header */}

        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5"
          >
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-5 h-5 text-white"
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

            <span className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              InterviewAI
            </span>
          </Link>
        </div>

        {/* Card */}

        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl shadow-indigo-100/50 border border-gray-100 p-8 sm:p-10">

          {/* Title */}

          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold text-gray-900">
              Welcome back
            </h1>

            <p className="mt-1.5 text-sm text-gray-500">
              Sign in to continue your interview preparation
            </p>
          </div>

          {/* Login form */}

          <form
            onSubmit={handleSubmit}
            autoComplete="off"
            className="space-y-5"
          >

            {/* --------------------------------------------------
                Email
            -------------------------------------------------- */}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Email
              </label>

              <div className="relative">

                {/* Email icon */}

                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="w-4.5 h-4.5"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  className="w-full rounded-xl border border-gray-300 pl-10 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  placeholder="you@example.com"
                  disabled={loading}
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                />
              </div>
            </div>

            {/* --------------------------------------------------
                Password
            -------------------------------------------------- */}

            <div>
              <div className="flex items-center justify-between mb-1.5">

                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>

              </div>

              <div className="relative">

                {/* Password icon */}

                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="w-4.5 h-4.5"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <rect
                      x="5"
                      y="11"
                      width="14"
                      height="9"
                      rx="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    <path
                      d="M8 11V7a4 4 0 118 0v4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  className="w-full rounded-xl border border-gray-300 pl-10 pr-10 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  placeholder="••••••••"
                  disabled={loading}
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-1p-ignore="true"
                />

                {/* Show / hide password */}

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (previous) => !previous
                    )
                  }
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 transition"
                  tabIndex={-1}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="w-4.5 h-4.5"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        d="M3 3l18 18M10.58 10.58a2 2 0 002.83 2.83M9.88 4.24A9.94 9.94 0 0112 4c5 0 9 4 10 8a10.4 10.4 0 01-3.29 4.47M6.5 6.64C3.87 8.32 2 12 2 12a10.44 10.44 0 004.11 4.71"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="w-4.5 h-4.5"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-4 h-4 mt-0.5 shrink-0"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                <span>{error}</span>
              </div>
            )}

            {/* Submit */}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium py-3 hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-indigo-200"
            >
              {loading && (
                <span className="h-4 w-4 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
              )}

              {loading
                ? "Signing in..."
                : "Sign in"}
            </button>
          </form>

          {/* Register */}

          <div className="mt-8 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />

            <span className="text-xs text-gray-400">
              New to InterviewAI?
            </span>

            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <Link
            href="/register"
            className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium py-2.5 hover:bg-gray-50 transition"
          >
            Create an account
          </Link>
        </div>

        {/* Footer */}

        <p className="mt-6 text-center text-xs text-gray-400">
          By signing in, you agree to practice with focus and confidence.
        </p>
      </div>
    </div>
  );
}