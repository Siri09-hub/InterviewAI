
"use client";

import {
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

type PermissionStatus =
  | "checking"
  | "allowed"
  | "denied";

function ProctoringContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const interviewId =
    searchParams.get("interviewId");

  const videoRef =
    useRef<HTMLVideoElement | null>(null);

  const streamRef =
    useRef<MediaStream | null>(null);

  const [cameraStatus, setCameraStatus] =
    useState<PermissionStatus>("checking");

  const [
    microphoneStatus,
    setMicrophoneStatus,
  ] = useState<PermissionStatus>("checking");

  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function startMedia() {
      try {
        if (
          !navigator.mediaDevices?.getUserMedia
        ) {
          throw new Error(
            "Your browser does not support camera and microphone access."
          );
        }

        const stream =
          await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });

        if (!mounted) {
          stream
            .getTracks()
            .forEach((track) => track.stop());

          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const videoTracks =
          stream.getVideoTracks();

        const audioTracks =
          stream.getAudioTracks();

        setCameraStatus(
          videoTracks.length > 0
            ? "allowed"
            : "denied"
        );

        setMicrophoneStatus(
          audioTracks.length > 0
            ? "allowed"
            : "denied"
        );

        setError("");
      } catch (err) {
        console.error(
          "Media permission error:",
          err
        );

        if (!mounted) {
          return;
        }

        setCameraStatus("denied");
        setMicrophoneStatus("denied");

        if (err instanceof DOMException) {
          if (
            err.name === "NotAllowedError"
          ) {
            setError(
              "Camera and microphone access was denied. Please allow both permissions in your browser."
            );
          } else if (
            err.name === "NotFoundError"
          ) {
            setError(
              "No camera or microphone was found on this device."
            );
          } else {
            setError(
              "Could not access your camera and microphone. Please check your device settings."
            );
          }
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(
            "Could not access your camera and microphone."
          );
        }
      }
    }

    void startMedia();

    return () => {
      mounted = false;

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => {
            try {
              track.stop();
            } catch {
              // Ignore.
            }
          });

        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  const canContinue =
    cameraStatus === "allowed" &&
    microphoneStatus === "allowed";

  function handleContinue() {
    if (!interviewId) {
      setError("Interview ID is missing.");
      return;
    }

    if (!canContinue) {
      setError(
        "Please enable both camera and microphone before continuing."
      );
      return;
    }

    setStarting(true);

    router.push(
      `/interview/session/${interviewId}`
    );
  }

  function handleRetry() {
    window.location.reload();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-7 w-7"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                d="M15 10l4.5-2.5v9L15 14"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <rect
                x="3"
                y="6"
                width="12"
                height="12"
                rx="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-slate-900">
            Proctoring Check
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Make sure your camera and
            microphone are working before
            starting the interview.
          </p>
        </div>

        {/* Main card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          {/* Info */}
          <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm leading-6 text-blue-800">
              Please allow browser access
              to your camera and
              microphone. Your camera
              preview below confirms that
              your camera is working
              correctly.
            </p>
          </div>

          {/* Camera Preview */}
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Camera Preview
              </h2>

              {cameraStatus ===
                "allowed" && (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Camera Active
                </span>
              )}
            </div>

            <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-900">
              {/* Loading */}
              {cameraStatus ===
                "checking" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                  <p className="text-sm text-white/80">
                    Starting camera...
                  </p>
                </div>
              )}

              {/* Denied */}
              {cameraStatus ===
                "denied" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-6 w-6"
                      stroke="currentColor"
                      strokeWidth={1.8}
                    >
                      <path
                        d="M15 10l4.5-2.5v9L15 14"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      <rect
                        x="3"
                        y="6"
                        width="12"
                        height="12"
                        rx="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <p className="text-sm font-medium">
                    Camera unavailable
                  </p>

                  <p className="mt-1 text-xs text-white/60">
                    Enable camera access
                    and try again.
                  </p>
                </div>
              )}

              {/* Video */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover ${
                  cameraStatus ===
                  "allowed"
                    ? "block"
                    : "hidden"
                }`}
                style={{
                  transform:
                    "scaleX(-1)",
                }}
              />

              {cameraStatus ===
                "allowed" && (
                <div className="absolute bottom-3 left-3 rounded-lg bg-black/50 px-3 py-1.5 text-xs text-white backdrop-blur">
                  Live camera preview
                </div>
              )}
            </div>
          </div>

          {/* Permission Status */}
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {/* Camera */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    cameraStatus ===
                    "allowed"
                      ? "bg-emerald-100 text-emerald-600"
                      : cameraStatus ===
                          "denied"
                        ? "bg-red-100 text-red-600"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {cameraStatus ===
                  "allowed" ? (
                    "✓"
                  ) : cameraStatus ===
                    "denied" ? (
                    "!"
                  ) : (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Camera
                  </h3>

                  <p className="text-xs text-slate-500">
                    {cameraStatus ===
                      "checking" &&
                      "Checking camera..."}

                    {cameraStatus ===
                      "allowed" &&
                      "Camera is working correctly."}

                    {cameraStatus ===
                      "denied" &&
                      "Camera access is unavailable."}
                  </p>
                </div>
              </div>

              {cameraStatus ===
                "allowed" && (
                <span className="text-xs font-medium text-emerald-600">
                  Ready
                </span>
              )}
            </div>

            {/* Microphone */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    microphoneStatus ===
                    "allowed"
                      ? "bg-emerald-100 text-emerald-600"
                      : microphoneStatus ===
                          "denied"
                        ? "bg-red-100 text-red-600"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {microphoneStatus ===
                  "allowed" ? (
                    "✓"
                  ) : microphoneStatus ===
                    "denied" ? (
                    "!"
                  ) : (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Microphone
                  </h3>

                  <p className="text-xs text-slate-500">
                    {microphoneStatus ===
                      "checking" &&
                      "Checking microphone..."}

                    {microphoneStatus ===
                      "allowed" &&
                      "Microphone is ready."}

                    {microphoneStatus ===
                      "denied" &&
                      "Microphone access is unavailable."}
                  </p>
                </div>
              </div>

              {microphoneStatus ===
                "allowed" && (
                <span className="text-xs font-medium text-emerald-600">
                  Ready
                </span>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm leading-6 text-red-700">
                {error}
              </p>

              <button
                type="button"
                onClick={handleRetry}
                className="mt-3 text-sm font-semibold text-red-700 hover:underline"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Continue */}
          <button
            type="button"
            onClick={handleContinue}
            disabled={
              !canContinue ||
              starting
            }
            className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold transition ${
              canContinue &&
              !starting
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "cursor-not-allowed bg-slate-200 text-slate-400"
            }`}
          >
            {starting && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
            )}

            {starting
              ? "Starting Interview..."
              : canContinue
                ? "Continue to Interview"
                : "Waiting for Camera & Microphone"}
          </button>

          <p className="mt-4 text-center text-xs text-slate-400">
            Both camera and microphone
            must be available before
            continuing.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function ProctoringPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="text-sm text-slate-500">
            Loading proctoring check...
          </div>
        </main>
      }
    >
      <ProctoringContent />
    </Suspense>
  );
}
