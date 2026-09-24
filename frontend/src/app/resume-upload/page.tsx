"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import {
  apiFetch,
  apiUploadWithProgress,
  ApiError,
} from "@/lib/api";

interface ResumeMetadata {
  id: number;
  original_filename: string;
  content_type: string;
  file_size: number;
  uploaded_at: string;
}

interface EducationAnalysis {
  degree: string;
  institution: string;
  year: string;
  details: string;
}

interface ExperienceAnalysis {
  role: string;
  organization: string;
  duration: string;
  details: string;
}

interface ProjectAnalysis {
  name: string;
  technologies: string[];
  details: string;
}

interface ResumeAnalysis {
  resume_id: number;
  original_filename: string;
  summary: string;
  skills: string[];
  education: EducationAnalysis[];
  experience: ExperienceAnalysis[];
  projects: ProjectAnalysis[];
  certifications: string[];
  strengths: string[];
  areas_for_improvement: string[];
  overall_assessment: string;
  suggested_roles: string[];
}

const MAX_FILE_SIZE_BYTES =
  5 * 1024 * 1024;

function validateResumeFile(
  file: File
): string {
  const name =
    file.name.toLowerCase();

  if (
    !name.endsWith(".pdf") &&
    !name.endsWith(".docx")
  ) {
    return "Only PDF or DOCX files are supported.";
  }

  if (file.size === 0) {
    return "The selected file is empty.";
  }

  if (
    file.size >
    MAX_FILE_SIZE_BYTES
  ) {
    return "File is too large. Maximum size is 5MB.";
  }

  return "";
}

function formatFileSize(
  bytes: number
): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function formatDate(
  value: string
): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  return date.toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );
}

export default function ResumeUploadPage() {
  const router = useRouter();

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [checkingResume, setCheckingResume] =
    useState(true);

  const [existingResume, setExistingResume] =
    useState<ResumeMetadata | null>(
      null
    );

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [error, setError] =
    useState("");

  const [uploading, setUploading] =
    useState(false);

  const [progress, setProgress] =
    useState(0);

  const [success, setSuccess] =
    useState(false);

  const [analyzing, setAnalyzing] =
    useState(false);

  const [analysis, setAnalysis] =
    useState<ResumeAnalysis | null>(
      null
    );

  const [analysisSuccess, setAnalysisSuccess] =
    useState(false);

  // --------------------------------------------------
  // CHECK EXISTING RESUME
  // --------------------------------------------------

  useEffect(() => {
    async function checkResume() {
      try {
        const data =
          await apiFetch<ResumeMetadata>(
            "/resumes/me"
          );

        setExistingResume(data);
      } catch (err) {
        if (
          !(
            err instanceof ApiError &&
            err.status === 404
          )
        ) {
          console.error(
            "Could not check resume:",
            err
          );
        }
      } finally {
        setCheckingResume(false);
      }
    }

    void checkResume();
  }, []);

  // --------------------------------------------------
  // FILE SELECTION
  // --------------------------------------------------

  function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      e.target.files?.[0] ?? null;

    setError("");
    setSuccess(false);
    setAnalysis(null);
    setAnalysisSuccess(false);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const validationError =
      validateResumeFile(file);

    if (validationError) {
      setSelectedFile(null);
      setError(validationError);
      return;
    }

    setSelectedFile(file);
  }

  // --------------------------------------------------
  // UPLOAD RESUME
  // --------------------------------------------------

  async function handleUpload() {
    if (
      !selectedFile ||
      uploading
    ) {
      return;
    }

    setUploading(true);
    setProgress(0);
    setError("");
    setSuccess(false);
    setAnalysis(null);
    setAnalysisSuccess(false);

    try {
      const data =
        await apiUploadWithProgress<ResumeMetadata>(
          "/resumes",
          selectedFile,
          "file",
          (percent) =>
            setProgress(percent)
        );

      setExistingResume(data);
      setSelectedFile(null);
      setSuccess(true);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(
          "Could not upload your resume. Please try again."
        );
      }
    } finally {
      setUploading(false);
    }
  }

  // --------------------------------------------------
  // ANALYZE RESUME
  // --------------------------------------------------

  async function handleAnalyzeResume() {
    if (
      !existingResume ||
      analyzing
    ) {
      return;
    }

    setAnalyzing(true);
    setError("");
    setAnalysis(null);
    setAnalysisSuccess(false);

    try {
      const data =
        await apiFetch<ResumeAnalysis>(
          "/resumes/analyze",
          {
            method: "POST",
          }
        );

      setAnalysis(data);
      setAnalysisSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.message
          || "Could not analyze your resume."
        );
      } else {
        setError(
          "Could not analyze your resume. Please try again."
        );
      }
    } finally {
      setAnalyzing(false);
    }
  }

  // --------------------------------------------------
  // NAVIGATION
  // --------------------------------------------------

  function handleContinue() {
    router.push("/dashboard");
  }

  const isUpdate =
    existingResume !== null;

  return (
    <AuthGuard>
      {() => (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50">

          {/* --------------------------------------------------
              HEADER
          -------------------------------------------------- */}

          <header className="bg-white/80 backdrop-blur border-b border-gray-200">
            <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                  <span className="text-white font-bold">
                    I
                  </span>
                </div>

                <span className="text-lg font-semibold text-indigo-600">
                  InterviewAI
                </span>
              </div>

              {isUpdate && (
                <button
                  type="button"
                  onClick={() =>
                    router.push("/dashboard")
                  }
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Back to Dashboard
                </button>
              )}
            </div>
          </header>

          {/* --------------------------------------------------
              MAIN
          -------------------------------------------------- */}

          <main className="px-4 py-10">
            <div className="max-w-5xl mx-auto">

              {/* TITLE */}

              <div className="mb-8 text-center">
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
                  {isUpdate
                    ? "Update your resume"
                    : "Upload your resume"}
                </h1>

                <p className="mt-2 text-sm text-gray-500">
                  Your resume will be used to personalize
                  your AI interview.
                </p>
              </div>

              {/* --------------------------------------------------
                  UPLOAD CARD
              -------------------------------------------------- */}

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">

                {checkingResume ? (
                  <div className="py-10 flex justify-center">
                    <div className="h-6 w-6 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* CURRENT RESUME */}

                    {existingResume && (
                      <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4">
                        <p className="text-sm font-semibold text-green-800">
                          Current resume
                        </p>

                        <p className="mt-1 text-sm text-green-700 truncate">
                          {
                            existingResume.original_filename
                          }
                        </p>

                        <p className="mt-1 text-xs text-green-600">
                          {formatFileSize(
                            existingResume.file_size
                          )}{" "}
                          · Uploaded{" "}
                          {formatDate(
                            existingResume.uploaded_at
                          )}
                        </p>
                      </div>
                    )}

                    {/* FILE PICKER */}

                    <label className="block cursor-pointer rounded-xl border-2 border-dashed border-gray-300 hover:border-indigo-400 transition p-8 text-center">

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx"
                        onChange={
                          handleFileChange
                        }
                        disabled={
                          uploading ||
                          analyzing
                        }
                        className="hidden"
                      />

                      <p className="text-sm font-medium text-gray-700">
                        {selectedFile
                          ? selectedFile.name
                          : "Choose your resume"}
                      </p>

                      <p className="mt-2 text-xs text-gray-400">
                        PDF or DOCX · Maximum 5MB
                      </p>
                    </label>

                    {/* ERROR */}

                    {error && (
                      <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3">
                        <p className="text-sm text-red-700">
                          {error}
                        </p>
                      </div>
                    )}

                    {/* UPLOAD SUCCESS */}

                    {success && (
                      <div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-3">
                        <p className="text-sm text-green-700">
                          Resume uploaded successfully.
                        </p>
                      </div>
                    )}

                    {/* ANALYSIS SUCCESS */}

                    {analysisSuccess && (
                      <div className="mt-4 rounded-lg bg-indigo-50 border border-indigo-200 p-3">
                        <p className="text-sm text-indigo-700">
                          Resume analyzed successfully.
                        </p>
                      </div>
                    )}

                    {/* UPLOAD PROGRESS */}

                    {uploading && (
                      <div className="mt-5">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>
                            Uploading...
                          </span>

                          <span>
                            {progress}%
                          </span>
                        </div>

                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 transition-all"
                            style={{
                              width: `${progress}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* UPLOAD BUTTON */}

                    {selectedFile &&
                      !uploading &&
                      !analyzing && (
                        <button
                          type="button"
                          onClick={
                            handleUpload
                          }
                          className="mt-5 w-full rounded-lg bg-indigo-600 text-white py-2.5 text-sm font-medium hover:bg-indigo-700 transition"
                        >
                          {isUpdate
                            ? "Update Resume"
                            : "Upload Resume"}
                        </button>
                      )}

                    {/* ANALYZE BUTTON */}

                    {existingResume &&
                      !selectedFile &&
                      !uploading && (
                        <button
                          type="button"
                          onClick={
                            handleAnalyzeResume
                          }
                          disabled={analyzing}
                          className="mt-4 w-full rounded-lg bg-violet-600 text-white py-2.5 text-sm font-medium hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                        >
                          {analyzing
                            ? "Analyzing Resume..."
                            : "Analyze Resume with AI"}
                        </button>
                      )}

                    {/* ANALYSIS LOADING */}

                    {analyzing && (
                      <div className="mt-5 rounded-xl border border-violet-200 bg-violet-50 p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-5 w-5 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />

                          <div>
                            <p className="text-sm font-medium text-violet-800">
                              Analyzing your resume...
                            </p>

                            <p className="mt-1 text-xs text-violet-600">
                              Extracting your resume details and generating AI insights.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* DASHBOARD BUTTON */}

                    {isUpdate && (
                      <button
                        type="button"
                        onClick={
                          handleContinue
                        }
                        disabled={
                          analyzing ||
                          uploading
                        }
                        className="mt-4 w-full rounded-lg bg-gray-900 text-white py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-60 transition"
                      >
                        Back to Dashboard
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* --------------------------------------------------
                  AI ANALYSIS
              -------------------------------------------------- */}

              {analysis && (
                <div className="mt-8 space-y-6">

                  {/* ANALYSIS HEADER */}

                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
                          AI Resume Analysis
                        </p>

                        <h2 className="mt-1 text-xl font-semibold text-gray-900">
                          {analysis.original_filename}
                        </h2>
                      </div>

                      <div className="rounded-lg bg-violet-50 px-3 py-2">
                        <p className="text-xs text-violet-600">
                          Resume ID
                        </p>

                        <p className="text-sm font-semibold text-violet-800">
                          #{analysis.resume_id}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SUMMARY */}

                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Summary
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-gray-600">
                      {analysis.summary}
                    </p>
                  </div>

                  {/* SKILLS */}

                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Skills
                    </h3>

                    {analysis.skills.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {analysis.skills.map(
                          (skill, index) => (
                            <span
                              key={`${skill}-${index}`}
                              className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 border border-indigo-100"
                            >
                              {skill}
                            </span>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-gray-500">
                        No skills identified.
                      </p>
                    )}
                  </div>

                  {/* EDUCATION */}

                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Education
                    </h3>

                    {analysis.education.length > 0 ? (
                      <div className="mt-4 space-y-4">
                        {analysis.education.map(
                          (item, index) => (
                            <div
                              key={`${item.degree}-${index}`}
                              className="rounded-xl border border-gray-200 p-4"
                            >
                              <h4 className="font-medium text-gray-900">
                                {item.degree}
                              </h4>

                              <p className="mt-1 text-sm text-indigo-600">
                                {item.institution}
                              </p>

                              {item.year && (
                                <p className="mt-1 text-xs text-gray-500">
                                  {item.year}
                                </p>
                              )}

                              {item.details && (
                                <p className="mt-2 text-sm text-gray-600">
                                  {item.details}
                                </p>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-gray-500">
                        No education information identified.
                      </p>
                    )}
                  </div>

                  {/* EXPERIENCE */}

                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Experience
                    </h3>

                    {analysis.experience.length > 0 ? (
                      <div className="mt-4 space-y-4">
                        {analysis.experience.map(
                          (item, index) => (
                            <div
                              key={`${item.role}-${index}`}
                              className="rounded-xl border border-gray-200 p-4"
                            >
                              <h4 className="font-medium text-gray-900">
                                {item.role}
                              </h4>

                              <p className="mt-1 text-sm text-indigo-600">
                                {item.organization}
                              </p>

                              {item.duration && (
                                <p className="mt-1 text-xs text-gray-500">
                                  {item.duration}
                                </p>
                              )}

                              {item.details && (
                                <p className="mt-2 text-sm leading-6 text-gray-600">
                                  {item.details}
                                </p>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-gray-500">
                        No experience information identified.
                      </p>
                    )}
                  </div>

                  {/* PROJECTS */}

                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Projects
                    </h3>

                    {analysis.projects.length > 0 ? (
                      <div className="mt-4 grid gap-4">
                        {analysis.projects.map(
                          (project, index) => (
                            <div
                              key={`${project.name}-${index}`}
                              className="rounded-xl border border-gray-200 p-4"
                            >
                              <h4 className="font-medium text-gray-900">
                                {project.name}
                              </h4>

                              {project.technologies.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {project.technologies.map(
                                    (
                                      tech,
                                      techIndex
                                    ) => (
                                      <span
                                        key={`${tech}-${techIndex}`}
                                        className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600"
                                      >
                                        {tech}
                                      </span>
                                    )
                                  )}
                                </div>
                              )}

                              {project.details && (
                                <p className="mt-3 text-sm leading-6 text-gray-600">
                                  {project.details}
                                </p>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-gray-500">
                        No projects identified.
                      </p>
                    )}
                  </div>

                  {/* CERTIFICATIONS */}

                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Certifications
                    </h3>

                    {analysis.certifications.length > 0 ? (
                      <div className="mt-4 space-y-2">
                        {analysis.certifications.map(
                          (
                            certification,
                            index
                          ) => (
                            <div
                              key={`${certification}-${index}`}
                              className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-700"
                            >
                              {certification}
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-gray-500">
                        No certifications identified.
                      </p>
                    )}
                  </div>

                  {/* STRENGTHS + IMPROVEMENTS */}

                  <div className="grid gap-6 md:grid-cols-2">

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Strengths
                      </h3>

                      {analysis.strengths.length > 0 ? (
                        <ul className="mt-4 space-y-3">
                          {analysis.strengths.map(
                            (
                              strength,
                              index
                            ) => (
                              <li
                                key={`${strength}-${index}`}
                                className="flex gap-3 text-sm text-gray-600"
                              >
                                <span className="mt-1 text-green-600">
                                  ✓
                                </span>

                                <span>
                                  {strength}
                                </span>
                              </li>
                            )
                          )}
                        </ul>
                      ) : (
                        <p className="mt-3 text-sm text-gray-500">
                          No specific strengths identified.
                        </p>
                      )}
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Areas for Improvement
                      </h3>

                      {analysis.areas_for_improvement.length > 0 ? (
                        <ul className="mt-4 space-y-3">
                          {analysis.areas_for_improvement.map(
                            (
                              improvement,
                              index
                            ) => (
                              <li
                                key={`${improvement}-${index}`}
                                className="flex gap-3 text-sm text-gray-600"
                              >
                                <span className="mt-1 text-amber-600">
                                  •
                                </span>

                                <span>
                                  {improvement}
                                </span>
                              </li>
                            )
                          )}
                        </ul>
                      ) : (
                        <p className="mt-3 text-sm text-gray-500">
                          No specific improvement areas identified.
                        </p>
                      )}
                    </div>

                  </div>

                  {/* OVERALL ASSESSMENT */}

                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Overall Assessment
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-gray-600">
                      {analysis.overall_assessment}
                    </p>
                  </div>

                  {/* SUGGESTED ROLES */}

                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Suggested Roles
                    </h3>

                    {analysis.suggested_roles.length > 0 ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {analysis.suggested_roles.map(
                          (
                            role,
                            index
                          ) => (
                            <div
                              key={`${role}-${index}`}
                              className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-medium text-violet-800"
                            >
                              {role}
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-gray-500">
                        No suggested roles identified.
                      </p>
                    )}
                  </div>

                  {/* DASHBOARD */}

                  <button
                    type="button"
                    onClick={
                      handleContinue
                    }
                    className="w-full rounded-lg bg-gray-900 text-white py-3 text-sm font-medium hover:bg-gray-800 transition"
                  >
                    Continue to Dashboard
                  </button>

                </div>
              )}

            </div>
          </main>
        </div>
      )}
    </AuthGuard>
  );
}