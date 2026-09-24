"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import { apiFetch, ApiError } from "@/lib/api";

interface ResumeMetadata {
  id: number;
  original_filename: string;
  content_type: string;
  file_size: number;
  uploaded_at: string;
}

interface UpdateProfileResponse {
  id: number;
  name: string;
  email: string;
  message: string;
}

interface ChangePasswordResponse {
  message: string;
}

const PROFILE_IMAGE_KEY =
  "interviewai_profile_image";

const MAX_PROFILE_IMAGE_SIZE =
  2 * 1024 * 1024;

const navItems = [
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
          d="M19.4 15a1.7 1.7 0 00.34 1.88l.06.06-1.41 1.41-.06-.06a1.7 1.7 0 00-1.88-.34 1.7 1.7 0 00-1.03 1.57v.08h-2v-.08a1.7 1.7 0 00-1.04-1.57 1.7 1.7 0 00-1.87.34l-.06.06-1.42-1.41.06-.06A1.7 1.7 0 008.5 15a1.7 1.7 0 00-1.57-1.03h-.08v-2h.08A1.7 1.7 0 008.5 10.9a1.7 1.7 0 00-.34-1.88l-.06-.06 1.41-1.41.06.06a1.7 1.7 0 001.87.34 1.7 1.7 0 001.04-1.57V6.3h2v.08a1.7 1.7 0 001.03 1.57 1.7 1.7 0 001.88-.34l.06-.06 1.41 1.41-.06.06A1.7 1.7 0 0019.4 10.9a1.7 1.7 0 001.57 1.03h.08v2h-.08A1.7 1.7 0 0019.4 15z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

function formatUploadedAt(
  iso: string
): string {
  if (!iso) {
    return "";
  }

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );
}

function formatFileSize(
  bytes: number
): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

export default function ProfilePage() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [menuOpen, setMenuOpen] =
    useState(false);

  const menuRef =
    useRef<HTMLDivElement>(null);

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  // --------------------------------------------------
  // Resume
  // --------------------------------------------------

  const [resume, setResume] =
    useState<ResumeMetadata | null>(
      null
    );

  const [resumeLoading, setResumeLoading] =
    useState(true);

  // --------------------------------------------------
  // Profile photo
  // --------------------------------------------------

  const [profileImage, setProfileImage] =
    useState<string | null>(null);

  const [photoMessage, setPhotoMessage] =
    useState("");

  // --------------------------------------------------
  // Edit profile
  // --------------------------------------------------

  const [editingProfile, setEditingProfile] =
    useState(false);

  const [editName, setEditName] =
    useState("");

  const [editEmail, setEditEmail] =
    useState("");

  const [profileSaving, setProfileSaving] =
    useState(false);

  const [profileMessage, setProfileMessage] =
    useState("");

  const [profileError, setProfileError] =
    useState("");

  // --------------------------------------------------
  // Change password
  // --------------------------------------------------

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [passwordLoading, setPasswordLoading] =
    useState(false);

  const [passwordMessage, setPasswordMessage] =
    useState("");

  const [passwordError, setPasswordError] =
    useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

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
  // Load saved profile photo
  // --------------------------------------------------

  useEffect(() => {
    const savedImage =
      localStorage.getItem(
        PROFILE_IMAGE_KEY
      );

    if (savedImage) {
      setProfileImage(savedImage);
    }
  }, []);

  // --------------------------------------------------
  // Load resume
  // --------------------------------------------------

  useEffect(() => {
    async function fetchResume() {
      try {
        const data =
          await apiFetch<ResumeMetadata>(
            "/resumes/me"
          );

        setResume(data);
      } catch (err) {
        if (
          !(
            err instanceof ApiError &&
            err.status === 404
          )
        ) {
          console.error(
            "Could not load resume:",
            err
          );
        }

        setResume(null);
      } finally {
        setResumeLoading(false);
      }
    }

    void fetchResume();
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
  // Profile photo
  // --------------------------------------------------

  function handlePhotoChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setPhotoMessage("");

    if (
      !file.type.startsWith("image/")
    ) {
      setPhotoMessage(
        "Please select an image file."
      );
      return;
    }

    if (
      file.size >
      MAX_PROFILE_IMAGE_SIZE
    ) {
      setPhotoMessage(
        "Profile photo must be smaller than 2 MB."
      );
      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      if (
        typeof reader.result !==
        "string"
      ) {
        return;
      }

      localStorage.setItem(
        PROFILE_IMAGE_KEY,
        reader.result
      );

      setProfileImage(
        reader.result
      );

      setPhotoMessage(
        "Profile photo updated successfully."
      );
    };

    reader.onerror = () => {
      setPhotoMessage(
        "Could not read the selected image."
      );
    };

    reader.readAsDataURL(file);
  }

  function handleRemovePhoto() {
    localStorage.removeItem(
      PROFILE_IMAGE_KEY
    );

    setProfileImage(null);

    setPhotoMessage(
      "Profile photo removed."
    );

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // --------------------------------------------------
  // Edit profile
  // --------------------------------------------------

  function openEditProfile(
    name: string,
    email: string
  ) {
    setEditName(name);
    setEditEmail(email);

    setProfileMessage("");
    setProfileError("");

    setEditingProfile(true);
  }

  function cancelEditProfile() {
    setEditingProfile(false);
    setProfileMessage("");
    setProfileError("");
  }

  async function handleUpdateProfile(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setProfileMessage("");
    setProfileError("");

    const trimmedName =
      editName.trim();

    const trimmedEmail =
      editEmail.trim();

    if (!trimmedName) {
      setProfileError(
        "Full name cannot be empty."
      );
      return;
    }

    if (!trimmedEmail) {
      setProfileError(
        "Email address cannot be empty."
      );
      return;
    }

    try {
      setProfileSaving(true);

      const response =
        await apiFetch<UpdateProfileResponse>(
          "/auth/me",
          {
            method: "PUT",
            body: {
              name: trimmedName,
              email: trimmedEmail,
            },
          }
        );

      setEditName(
        response.name
      );

      setEditEmail(
        response.email
      );

      setProfileMessage(
        response.message
      );

      setEditingProfile(false);

      // Reload so AuthGuard and all
      // header/sidebar references show
      // the updated user data immediately.
      window.location.reload();
    } catch (err) {
      if (err instanceof ApiError) {
        setProfileError(
          err.message
        );
      } else {
        setProfileError(
          "Could not update your profile."
        );
      }
    } finally {
      setProfileSaving(false);
    }
  }

  // --------------------------------------------------
  // Change password
  // --------------------------------------------------

  async function handleChangePassword(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    if (!currentPassword) {
      setPasswordError(
        "Enter your current password."
      );
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(
        "New password must contain at least 8 characters."
      );
      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setPasswordError(
        "New passwords do not match."
      );
      return;
    }

    if (
      currentPassword ===
      newPassword
    ) {
      setPasswordError(
        "New password must be different from the current password."
      );
      return;
    }

    try {
      setPasswordLoading(true);

      const response =
        await apiFetch<ChangePasswordResponse>(
          "/auth/change-password",
          {
            method: "POST",
            body: {
              current_password:
                currentPassword,
              new_password:
                newPassword,
            },
          }
        );

      setPasswordMessage(
        response.message
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      if (err instanceof ApiError) {
        setPasswordError(
          err.message
        );
      } else {
        setPasswordError(
          "Could not change your password."
        );
      }
    } finally {
      setPasswordLoading(false);
    }
  }

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

              {/* Sidebar user */}
              <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4">
                <div className="flex items-center gap-3 rounded-lg px-2 py-2">
                  {profileImage ? (
                    <img
                      src={
                        profileImage
                      }
                      alt="Profile"
                      className="h-9 w-9 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                      {initials}
                    </div>
                  )}

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
                    Profile
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
                    {profileImage ? (
                      <img
                        src={
                          profileImage
                        }
                        alt="Profile"
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                        {initials}
                      </div>
                    )}

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
              <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
                {/* Page title */}
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
                    Profile
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Manage your personal information,
                    profile photo, security, and resume.
                  </p>
                </div>

                {/* Profile header */}
                <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                    {/* Profile image */}
                    <div className="relative shrink-0">
                      {profileImage ? (
                        <img
                          src={
                            profileImage
                          }
                          alt="Profile"
                          className="h-24 w-24 rounded-full object-cover ring-4 ring-indigo-50"
                        />
                      ) : (
                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-2xl font-semibold text-white ring-4 ring-indigo-50">
                          {initials}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          fileInputRef.current?.click()
                        }
                        className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-indigo-600 text-white shadow-md transition hover:bg-indigo-700"
                        aria-label="Change profile photo"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className="h-4 w-4"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            d="M12 20h9"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />

                          <path
                            d="M16.5 3.5a2.121 2.121 0 013 3L8 18l-4 1 1-4 11.5-11.5z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>

                      <input
                        ref={
                          fileInputRef
                        }
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={
                          handlePhotoChange
                        }
                        className="hidden"
                      />
                    </div>

                    {/* User info */}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {user.name}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        {user.email}
                      </p>

                      <span className="mt-3 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                        InterviewAI Member
                      </span>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            fileInputRef.current?.click()
                          }
                          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
                        >
                          {profileImage
                            ? "Change Photo"
                            : "Upload Photo"}
                        </button>

                        {profileImage && (
                          <button
                            type="button"
                            onClick={
                              handleRemovePhoto
                            }
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                          >
                            Remove Photo
                          </button>
                        )}
                      </div>

                      {photoMessage && (
                        <p className="mt-3 text-xs text-gray-500">
                          {photoMessage}
                        </p>
                      )}

                      <p className="mt-2 text-xs text-gray-400">
                        PNG, JPG, or WEBP · Maximum 2 MB
                      </p>
                    </div>
                  </div>
                </section>

                {/* Personal Information */}
                <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        Personal Information
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        Update your name and email address.
                      </p>
                    </div>

                    {!editingProfile && (
                      <button
                        type="button"
                        onClick={() =>
                          openEditProfile(
                            user.name,
                            user.email
                          )
                        }
                        className="shrink-0 rounded-lg border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50"
                      >
                        Edit Profile
                      </button>
                    )}
                  </div>

                  {!editingProfile ? (
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

                      {typeof user.id !==
                        "undefined" && (
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                          <p className="text-xs text-gray-500">
                            User ID
                          </p>

                          <p className="mt-1 text-sm font-medium text-gray-900">
                            {user.id}
                          </p>
                        </div>
                      )}

                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <p className="text-xs text-gray-500">
                          Account Status
                        </p>

                        <p className="mt-1 text-sm font-medium text-emerald-600">
                          Active
                        </p>
                      </div>
                    </div>
                  ) : (
                    <form
                      onSubmit={
                        handleUpdateProfile
                      }
                      className="mt-6 space-y-5"
                    >
                      {/* Full name */}
                      <div>
                        <label
                          htmlFor="profile-name"
                          className="text-sm font-medium text-gray-700"
                        >
                          Full Name
                        </label>

                        <input
                          id="profile-name"
                          type="text"
                          value={editName}
                          onChange={(
                            event
                          ) =>
                            setEditName(
                              event.target
                                .value
                            )
                          }
                          className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                          placeholder="Enter your full name"
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label
                          htmlFor="profile-email"
                          className="text-sm font-medium text-gray-700"
                        >
                          Email Address
                        </label>

                        <input
                          id="profile-email"
                          type="email"
                          value={
                            editEmail
                          }
                          onChange={(
                            event
                          ) =>
                            setEditEmail(
                              event.target
                                .value
                            )
                          }
                          className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                          placeholder="Enter your email address"
                        />
                      </div>

                      {/* Error */}
                      {profileError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                          {
                            profileError
                          }
                        </div>
                      )}

                      {/* Success */}
                      {profileMessage && (
                        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                          {
                            profileMessage
                          }
                        </div>
                      )}

                      {/* Buttons */}
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="submit"
                          disabled={
                            profileSaving
                          }
                          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {profileSaving
                            ? "Saving..."
                            : "Save Changes"}
                        </button>

                        <button
                          type="button"
                          disabled={
                            profileSaving
                          }
                          onClick={
                            cancelEditProfile
                          }
                          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </section>

                {/* Security */}
                <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                  <div className="mb-5">
                    <h3 className="text-base font-semibold text-gray-900">
                      Security
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      Update your account password securely.
                    </p>
                  </div>

                  <form
                    onSubmit={
                      handleChangePassword
                    }
                    className="space-y-5"
                  >
                    {/* Current password */}
                    <div>
                      <label
                        htmlFor="current-password"
                        className="text-sm font-medium text-gray-700"
                      >
                        Current Password
                      </label>

                      <div className="relative mt-1.5">
                        <input
                          id="current-password"
                          type={
                            showCurrentPassword
                              ? "text"
                              : "password"
                          }
                          value={
                            currentPassword
                          }
                          onChange={(
                            event
                          ) =>
                            setCurrentPassword(
                              event.target
                                .value
                            )
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-16 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                          placeholder="Enter current password"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowCurrentPassword(
                              (value) =>
                                !value
                            )
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 hover:text-gray-700"
                        >
                          {showCurrentPassword
                            ? "Hide"
                            : "Show"}
                        </button>
                      </div>
                    </div>

                    {/* New password */}
                    <div>
                      <label
                        htmlFor="new-password"
                        className="text-sm font-medium text-gray-700"
                      >
                        New Password
                      </label>

                      <div className="relative mt-1.5">
                        <input
                          id="new-password"
                          type={
                            showNewPassword
                              ? "text"
                              : "password"
                          }
                          value={
                            newPassword
                          }
                          onChange={(
                            event
                          ) =>
                            setNewPassword(
                              event.target
                                .value
                            )
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-16 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                          placeholder="Enter new password"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowNewPassword(
                              (value) =>
                                !value
                            )
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 hover:text-gray-700"
                        >
                          {showNewPassword
                            ? "Hide"
                            : "Show"}
                        </button>
                      </div>

                      <p className="mt-1.5 text-xs text-gray-400">
                        Minimum 8 characters.
                      </p>
                    </div>

                    {/* Confirm password */}
                    <div>
                      <label
                        htmlFor="confirm-password"
                        className="text-sm font-medium text-gray-700"
                      >
                        Confirm New Password
                      </label>

                      <div className="relative mt-1.5">
                        <input
                          id="confirm-password"
                          type={
                            showConfirmPassword
                              ? "text"
                              : "password"
                          }
                          value={
                            confirmPassword
                          }
                          onChange={(
                            event
                          ) =>
                            setConfirmPassword(
                              event.target
                                .value
                            )
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-16 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                          placeholder="Confirm new password"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(
                              (value) =>
                                !value
                            )
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 hover:text-gray-700"
                        >
                          {showConfirmPassword
                            ? "Hide"
                            : "Show"}
                        </button>
                      </div>
                    </div>

                    {/* Password error */}
                    {passwordError && (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {
                          passwordError
                        }
                      </div>
                    )}

                    {/* Password success */}
                    {passwordMessage && (
                      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                        {
                          passwordMessage
                        }
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={
                        passwordLoading
                      }
                      className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {passwordLoading
                        ? "Changing Password..."
                        : "Change Password"}
                    </button>
                  </form>
                </section>

                {/* Resume */}
                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                          resume
                            ? "bg-green-50 text-green-600"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className="h-5 w-5"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          Resume
                        </p>

                        {resumeLoading ? (
                          <p className="mt-0.5 text-xs text-gray-400">
                            Checking...
                          </p>
                        ) : resume ? (
                          <>
                            <p className="mt-0.5 truncate text-sm text-gray-700">
                              {
                                resume.original_filename
                              }
                            </p>

                            <p className="mt-0.5 text-xs font-medium text-green-600">
                              Uploaded ·{" "}
                              {formatFileSize(
                                resume.file_size
                              )}{" "}
                              ·{" "}
                              {formatUploadedAt(
                                resume.uploaded_at
                              )}
                            </p>
                          </>
                        ) : (
                          <p className="mt-0.5 text-xs font-medium text-amber-600">
                            Not uploaded
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          "/resume-upload"
                        )
                      }
                      className="shrink-0 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                    >
                      {resume
                        ? "Update Resume"
                        : "Upload Resume"}
                    </button>
                  </div>
                </section>
              </main>
            </div>
          </div>
        );
      }}
    </AuthGuard>
  );
}