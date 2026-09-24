
"use client";

import { useEffect, useRef, useState } from "react";
import {
  FaceDetector,
  FilesetResolver,
} from "@mediapipe/tasks-vision";
import { apiFetch, ApiError } from "@/lib/api";

interface ProctoringMonitorProps {
  interviewId: string;
  onViolation?: (count: number) => void;
}

interface ViolationResponse {
  id: number;
  interview_id: number;
  violation_type: string;
  details: string | null;
  occurred_at: string;
}

interface QueuedViolation {
  violationType: string;
  details: string;
}

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";

const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";

const FACE_ABNORMAL_THRESHOLD_MS = 3000;
const TAB_SWITCH_COOLDOWN_MS = 2000;
const INTERACTION_COOLDOWN_MS = 500;

const VIOLATIONS_PER_MARK_DEDUCTION = 3;

type FaceStatus =
  | "initializing"
  | "single"
  | "none"
  | "multiple"
  | "error";

export default function ProctoringMonitor({
  interviewId,
  onViolation,
}: ProctoringMonitorProps) {
  // --------------------------------------------------
  // CAMERA
  // --------------------------------------------------

  const videoRef =
    useRef<HTMLVideoElement | null>(null);

  const streamRef =
    useRef<MediaStream | null>(null);

  const detectorRef =
    useRef<FaceDetector | null>(null);

  const animationFrameRef =
    useRef<number | null>(null);

  const mountedRef =
    useRef(false);

  // --------------------------------------------------
  // PANEL
  // --------------------------------------------------

  const [isExpanded, setIsExpanded] =
    useState(false);

  // --------------------------------------------------
  // CAMERA STATE
  // --------------------------------------------------

  const [cameraReady, setCameraReady] =
    useState(false);

  const [faceStatus, setFaceStatus] =
    useState<FaceStatus>("initializing");

  const [statusLabel, setStatusLabel] =
    useState("Starting...");

  const [error, setError] =
    useState("");

  // --------------------------------------------------
  // VIOLATION COUNTS
  // --------------------------------------------------

  const [tabSwitchCount, setTabSwitchCount] =
    useState(0);

  const [faceViolationCount, setFaceViolationCount] =
    useState(0);

  const [
    interactionViolationCount,
    setInteractionViolationCount,
  ] = useState(0);

  const [savingViolation, setSavingViolation] =
    useState(false);

  // --------------------------------------------------
  // TIMING REFS
  // --------------------------------------------------

  const lastTabSwitchTimeRef =
    useRef(0);

  const lastInteractionTimeRef =
    useRef(0);

  const faceStatusRef =
    useRef<FaceStatus>("initializing");

  const abnormalTypeRef =
    useRef<"none" | "multiple" | null>(null);

  const abnormalSinceRef =
    useRef<number | null>(null);

  const abnormalReportedRef =
    useRef(false);

  // --------------------------------------------------
  // VIOLATION QUEUE
  // --------------------------------------------------

  const violationQueueRef =
    useRef<QueuedViolation[]>([]);

  const processingQueueRef =
    useRef(false);

  // --------------------------------------------------
  // TOTALS
  // --------------------------------------------------

  const totalViolations =
    tabSwitchCount +
    faceViolationCount +
    interactionViolationCount;

  const marksDeducted = Math.floor(
    totalViolations /
      VIOLATIONS_PER_MARK_DEDUCTION
  );

  // --------------------------------------------------
  // SEND TOTAL TO PARENT
  // --------------------------------------------------

  useEffect(() => {
    onViolation?.(totalViolations);
  }, [totalViolations, onViolation]);

  // ==================================================
  // VIOLATION QUEUE
  // ==================================================

  async function processViolationQueue() {
    if (processingQueueRef.current) {
      return;
    }

    if (!interviewId) {
      return;
    }

    processingQueueRef.current = true;
    setSavingViolation(true);

    while (
      violationQueueRef.current.length > 0
    ) {
      const violation =
        violationQueueRef.current.shift();

      if (!violation) {
        continue;
      }

      try {
        await apiFetch<ViolationResponse>(
          `/interviews/${interviewId}/proctoring/violations`,
          {
            method: "POST",
            body: {
              violation_type:
                violation.violationType,
              details:
                violation.details,
            },
          }
        );
      } catch (err) {
        console.error(
          "Could not save proctoring violation:",
          err
        );

        if (err instanceof ApiError) {
          console.error(
            `Proctoring API error (${err.status}):`,
            err.message
          );
        }
      }
    }

    processingQueueRef.current = false;
    setSavingViolation(false);
  }

  function saveViolation(
    violationType: string,
    details: string
  ) {
    if (!interviewId) {
      return;
    }

    violationQueueRef.current.push({
      violationType,
      details,
    });

    void processViolationQueue();
  }

  // ==================================================
  // TAB SWITCH
  // ==================================================

  useEffect(() => {
    function handleVisibilityChange() {
      if (
        document.visibilityState !==
        "hidden"
      ) {
        return;
      }

      const now = Date.now();

      if (
        now -
          lastTabSwitchTimeRef.current <
        TAB_SWITCH_COOLDOWN_MS
      ) {
        return;
      }

      lastTabSwitchTimeRef.current =
        now;

      setTabSwitchCount(
        (previous) => previous + 1
      );

      saveViolation(
        "tab_switch",
        "The candidate left the interview tab or window."
      );
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [interviewId]);

  // ==================================================
  // COPY / PASTE / CUT / RIGHT CLICK
  // ==================================================

  useEffect(() => {
    function registerInteractionViolation(
      violationType: string,
      details: string
    ) {
      const now = Date.now();

      if (
        now -
          lastInteractionTimeRef.current <
        INTERACTION_COOLDOWN_MS
      ) {
        return;
      }

      lastInteractionTimeRef.current =
        now;

      setInteractionViolationCount(
        (previous) => previous + 1
      );

      saveViolation(
        violationType,
        details
      );
    }

    function handleContextMenu(
      event: MouseEvent
    ) {
      event.preventDefault();

      registerInteractionViolation(
        "right_click",
        "The candidate used the right-click context menu during the interview."
      );
    }

    function handleCopy(
      event: ClipboardEvent
    ) {
      event.preventDefault();

      registerInteractionViolation(
        "copy",
        "The candidate attempted to copy content during the interview."
      );
    }

    function handlePaste(
      event: ClipboardEvent
    ) {
      event.preventDefault();

      registerInteractionViolation(
        "paste",
        "The candidate attempted to paste content during the interview."
      );
    }

    function handleCut(
      event: ClipboardEvent
    ) {
      event.preventDefault();

      registerInteractionViolation(
        "cut",
        "The candidate attempted to cut content during the interview."
      );
    }

    document.addEventListener(
      "contextmenu",
      handleContextMenu
    );

    document.addEventListener(
      "copy",
      handleCopy
    );

    document.addEventListener(
      "paste",
      handlePaste
    );

    document.addEventListener(
      "cut",
      handleCut
    );

    return () => {
      document.removeEventListener(
        "contextmenu",
        handleContextMenu
      );

      document.removeEventListener(
        "copy",
        handleCopy
      );

      document.removeEventListener(
        "paste",
        handlePaste
      );

      document.removeEventListener(
        "cut",
        handleCut
      );
    };
  }, [interviewId]);

  // ==================================================
  // CAMERA + FACE DETECTION
  // ==================================================

  useEffect(() => {
    mountedRef.current = true;

    let cancelled = false;

    async function cleanupMedia() {
      if (
        animationFrameRef.current !==
        null
      ) {
        cancelAnimationFrame(
          animationFrameRef.current
        );

        animationFrameRef.current =
          null;
      }

      if (detectorRef.current) {
        try {
          detectorRef.current.close();
        } catch {
          // Ignore.
        }

        detectorRef.current =
          null;
      }

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

      const video =
        videoRef.current;

      if (video) {
        try {
          video.pause();
        } catch {
          // Ignore.
        }

        video.srcObject = null;
      }
    }

    // ------------------------------------------------
    // FACE COUNT
    // ------------------------------------------------

    function handleFaceCount(
      count: number
    ) {
      let newStatus: FaceStatus;

      if (count === 0) {
        newStatus = "none";
      } else if (count === 1) {
        newStatus = "single";
      } else {
        newStatus = "multiple";
      }

      // Update UI status
      if (
        newStatus !==
        faceStatusRef.current
      ) {
        faceStatusRef.current =
          newStatus;

        setFaceStatus(
          newStatus
        );
      }

      // ----------------------------------------------
      // EXACTLY ONE FACE = NORMAL
      // ----------------------------------------------

      if (
        newStatus === "single"
      ) {
        abnormalTypeRef.current =
          null;

        abnormalSinceRef.current =
          null;

        abnormalReportedRef.current =
          false;

        return;
      }

      // ----------------------------------------------
      // NO FACE / MULTIPLE FACES
      // ----------------------------------------------

      const now = Date.now();

      if (
        abnormalTypeRef.current !==
        newStatus
      ) {
        abnormalTypeRef.current =
          newStatus === "none"
            ? "none"
            : "multiple";

        abnormalSinceRef.current =
          now;

        abnormalReportedRef.current =
          false;
      }

      if (
        abnormalSinceRef.current ===
        null
      ) {
        abnormalSinceRef.current =
          now;
      }

      const elapsed =
        now -
        abnormalSinceRef.current;

      // ----------------------------------------------
      // REPORT ONLY AFTER 3 SECONDS
      // ----------------------------------------------

      if (
        elapsed >=
          FACE_ABNORMAL_THRESHOLD_MS &&
        !abnormalReportedRef.current
      ) {
        abnormalReportedRef.current =
          true;

        setFaceViolationCount(
          (previous) =>
            previous + 1
        );

        if (
          newStatus === "none"
        ) {
          saveViolation(
            "no_face",
            "No face detected in the camera feed for a sustained period."
          );
        } else {
          saveViolation(
            "multiple_faces",
            "Multiple faces detected in the camera feed for a sustained period."
          );
        }
      }
    }

    // ------------------------------------------------
    // DETECTION LOOP
    // ------------------------------------------------

    function runDetectionLoop() {
      if (
        cancelled ||
        !mountedRef.current
      ) {
        return;
      }

      const video =
        videoRef.current;

      const detector =
        detectorRef.current;

      if (
        video &&
        detector &&
        video.readyState >= 2 &&
        video.videoWidth > 0 &&
        video.videoHeight > 0
      ) {
        try {
          const result =
            detector.detectForVideo(
              video,
              performance.now()
            );

          handleFaceCount(
            result.detections.length
          );
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : String(err);

          console.warn(
            "Face detection failed:",
            message
          );

          setFaceStatus("error");
          setError(message);
        }
      }

      animationFrameRef.current =
        requestAnimationFrame(
          runDetectionLoop
        );
    }

    // ------------------------------------------------
    // WAIT FOR VIDEO METADATA
    // ------------------------------------------------

    function waitForVideoReady(
      video: HTMLVideoElement
    ): Promise<void> {
      return new Promise(
        (resolve, reject) => {
          if (
            video.readyState >= 2 &&
            video.videoWidth > 0 &&
            video.videoHeight > 0
          ) {
            resolve();
            return;
          }

          const timeout =
            window.setTimeout(() => {
              cleanup();
              reject(
                new Error(
                  "Camera did not provide video frames."
                )
              );
            }, 10000);

          function cleanup() {
            window.clearTimeout(
              timeout
            );

            video.removeEventListener(
              "loadedmetadata",
              handleLoadedMetadata
            );

            video.removeEventListener(
              "canplay",
              handleCanPlay
            );
          }

          function handleLoadedMetadata() {
            if (
              video.videoWidth > 0 &&
              video.videoHeight > 0
            ) {
              cleanup();
              resolve();
            }
          }

          function handleCanPlay() {
            if (
              video.videoWidth > 0 &&
              video.videoHeight > 0
            ) {
              cleanup();
              resolve();
            }
          }

          video.addEventListener(
            "loadedmetadata",
            handleLoadedMetadata
          );

          video.addEventListener(
            "canplay",
            handleCanPlay
          );
        }
      );
    }

    // ------------------------------------------------
    // SETUP
    // ------------------------------------------------

    async function setup() {
      await cleanupMedia();

      if (
        cancelled ||
        !mountedRef.current
      ) {
        return;
      }

      try {
        setCameraReady(false);

        setFaceStatus(
          "initializing"
        );

        setStatusLabel(
          "Requesting camera..."
        );

        setError("");

        if (
          !navigator.mediaDevices?.getUserMedia
        ) {
          throw new Error(
            "Your browser does not support camera access."
          );
        }

        // ------------------------------------------------
        // SAME VIDEO ELEMENT ALWAYS EXISTS
        // ------------------------------------------------

        const video =
          videoRef.current;

        if (!video) {
          throw new Error(
            "Video element is not ready."
          );
        }

        // ------------------------------------------------
        // CAMERA + MICROPHONE
        // ------------------------------------------------

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              video: {
                width: {
                  ideal: 1280,
                },
                height: {
                  ideal: 720,
                },
                facingMode: "user",
              },
              audio: true,
            }
          );

        if (
          cancelled ||
          !mountedRef.current
        ) {
          stream
            .getTracks()
            .forEach((track) =>
              track.stop()
            );

          return;
        }

        streamRef.current =
          stream;

        // ------------------------------------------------
        // CONNECT STREAM
        // ------------------------------------------------

        video.srcObject =
          stream;

        video.muted = true;

        video.autoplay = true;

        video.playsInline = true;

        // Important for Chrome rendering
        video.setAttribute(
          "autoplay",
          ""
        );

        video.setAttribute(
          "muted",
          ""
        );

        video.setAttribute(
          "playsinline",
          ""
        );

        // ------------------------------------------------
        // WAIT FOR REAL CAMERA FRAMES
        // ------------------------------------------------

        await waitForVideoReady(
          video
        );

        if (
          cancelled ||
          !mountedRef.current
        ) {
          return;
        }

        // ------------------------------------------------
        // PLAY CAMERA
        // ------------------------------------------------

        try {
          await video.play();
        } catch (playError) {
          console.warn(
            "First camera play attempt failed:",
            playError
          );

          // Try once more after metadata is ready.
          await new Promise(
            (resolve) =>
              window.setTimeout(
                resolve,
                100
              )
          );

          await video.play();
        }

        if (
          cancelled ||
          !mountedRef.current
        ) {
          return;
        }

        if (
          video.videoWidth <= 0 ||
          video.videoHeight <= 0
        ) {
          throw new Error(
            "Camera is connected but no video frame is available."
          );
        }

        setCameraReady(true);

        setStatusLabel(
          "Loading face detector..."
        );

        // ------------------------------------------------
        // MEDIAPIPE
        // ------------------------------------------------

        const vision =
          await FilesetResolver.forVisionTasks(
            WASM_URL
          );

        if (
          cancelled ||
          !mountedRef.current
        ) {
          return;
        }

        const detector =
          await FaceDetector.createFromOptions(
            vision,
            {
              baseOptions: {
                modelAssetPath:
                  MODEL_URL,
                delegate: "GPU",
              },

              runningMode:
                "VIDEO",

              minDetectionConfidence:
                0.5,
            }
          );

        if (
          cancelled ||
          !mountedRef.current
        ) {
          detector.close();
          return;
        }

        detectorRef.current =
          detector;

        faceStatusRef.current =
          "initializing";

        setFaceStatus(
          "initializing"
        );

        setStatusLabel(
          "Monitoring active"
        );

        // ------------------------------------------------
        // START DETECTION
        // ------------------------------------------------

        animationFrameRef.current =
          requestAnimationFrame(
            runDetectionLoop
          );
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : String(err);

        console.error(
          "Proctoring setup failed:",
          err
        );

        setCameraReady(false);

        setFaceStatus(
          "error"
        );

        setStatusLabel(
          "Proctoring setup failed"
        );

        setError(message);
      }
    }

    void setup();

    return () => {
      cancelled = true;

      mountedRef.current =
        false;

      void cleanupMedia();
    };
  }, [interviewId]);

  // ==================================================
  // UI
  // ==================================================

  return (
    <>
      {/* =================================================
          PROCTORING PANEL

          IMPORTANT:
          This panel is always mounted.
          Therefore the SAME video element stays mounted.

          pointer-events-none lets the user click the
          interview content behind the panel.

          Only the arrow button uses pointer-events-auto.
      ================================================== */}

      <div
        className={`fixed bottom-20 right-4 z-50 w-72 transition-all duration-200 ${
          isExpanded
            ? "visible opacity-100"
            : "pointer-events-none invisible opacity-0"
        }`}
      >
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800">
                Proctoring
              </span>

              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  cameraReady
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              />
            </div>

            {/* Always clickable arrow */}
            <button
              type="button"
              onClick={() =>
                setIsExpanded(false)
              }
              className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-lg font-bold text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
              title="Minimize proctoring"
              aria-label="Minimize proctoring"
            >
              ▼
            </button>
          </div>

          {/* =================================================
              REAL CAMERA VIDEO

              SAME VIDEO ELEMENT ALWAYS EXISTS
          ================================================= */}

          <div className="relative h-40 w-full bg-black">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="pointer-events-none block h-full w-full object-cover"
              style={{
                transform:
                  "scaleX(-1)",
              }}
            />

            {/* Camera loading overlay */}
            {!cameraReady && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black">
                <div className="text-center">
                  <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />

                  <p className="text-xs text-white">
                    Camera loading...
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-3 px-4 py-3">
            {/* Monitoring status */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Status
              </span>

              <span
                className={`font-medium ${
                  cameraReady
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                {statusLabel}
              </span>
            </div>

            {/* Face */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Face
              </span>

              <span
                className={`font-bold ${
                  faceStatus ===
                  "single"
                    ? "text-emerald-600"
                    : faceStatus ===
                          "none" ||
                        faceStatus ===
                          "multiple"
                    ? "text-red-600"
                    : faceStatus ===
                          "error"
                    ? "text-red-600"
                    : "text-gray-500"
                }`}
              >
                {faceStatus ===
                "single"
                  ? "✓ Detected"
                  : faceStatus ===
                    "none"
                  ? "⚠ None"
                  : faceStatus ===
                    "multiple"
                  ? "⚠ Multiple"
                  : faceStatus ===
                    "error"
                  ? "⚠ Error"
                  : "..."}
              </span>
            </div>

            {/* Tab switches */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Tab switches
              </span>

              <span className="font-bold text-gray-800">
                {tabSwitchCount}
              </span>
            </div>

            {/* Face violations */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Face violations
              </span>

              <span className="font-bold text-gray-800">
                {faceViolationCount}
              </span>
            </div>

            {/* Interaction violations */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Copy/Paste/Right-click
              </span>

              <span className="font-bold text-gray-800">
                {interactionViolationCount}
              </span>
            </div>

            {/* Marks */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
              <span className="text-gray-500">
                Marks deducted
              </span>

              <span
                className={`font-bold ${
                  marksDeducted > 0
                    ? "text-red-600"
                    : "text-emerald-600"
                }`}
              >
                -{marksDeducted}
              </span>
            </div>

            {/* Saving */}
            {savingViolation && (
              <p className="text-[10px] text-gray-400">
                Saving proctoring event...
              </p>
            )}

            {/* Error */}
            {error && (
              <div className="break-words rounded-lg border border-red-100 bg-red-50 p-2 text-xs text-red-600">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =================================================
          COLLAPSED BUTTON

          ALWAYS VISIBLE WHEN PANEL IS CLOSED
      ================================================= */}

      {!isExpanded && (
        <button
          type="button"
          onClick={() =>
            setIsExpanded(true)
          }
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-3 shadow-lg transition hover:shadow-xl"
          title="Open proctoring monitor"
          aria-label="Open proctoring monitor"
        >
          {/* Camera status dot */}
          <span className="relative flex h-3 w-3">
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                cameraReady
                  ? "bg-green-400"
                  : "bg-red-400"
              }`}
            />

            <span
              className={`relative inline-flex h-3 w-3 rounded-full ${
                cameraReady
                  ? "bg-green-500"
                  : "bg-red-500"
              }`}
            />
          </span>

          <span className="text-sm font-semibold text-gray-800">
            Proctoring
          </span>

          {/* Violation badge */}
          {totalViolations > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
              {totalViolations}
            </span>
          )}

          {/* ALWAYS VISIBLE */}
          <span
            className="text-base font-bold text-gray-500"
            aria-hidden="true"
          >
            ▲
          </span>
        </button>
      )}
    </>
  );
}

