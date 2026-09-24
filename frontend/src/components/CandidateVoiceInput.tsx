"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  apiUploadAudio,
  ApiError,
} from "@/lib/api";

interface CandidateVoiceInputProps {
  onTranscript: (
    text: string
  ) => void;
  disabled?: boolean;
}

function getSupportedMimeType(): string {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];

  for (const type of types) {
    if (
      typeof MediaRecorder !==
        "undefined" &&
      MediaRecorder.isTypeSupported(
        type
      )
    ) {
      return type;
    }
  }

  return "";
}

export default function CandidateVoiceInput({
  onTranscript,
  disabled = false,
}: CandidateVoiceInputProps) {
  const mediaRecorderRef =
    useRef<MediaRecorder | null>(
      null
    );

  const streamRef =
    useRef<MediaStream | null>(
      null
    );

  const chunksRef =
    useRef<Blob[]>([]);

  const timerRef =
    useRef<ReturnType<
      typeof setInterval
    > | null>(null);

  const [recording, setRecording] =
    useState(false);

  const [processing, setProcessing] =
    useState(false);

  const [elapsedSeconds, setElapsedSeconds] =
    useState(0);

  const [error, setError] =
    useState("");

  // --------------------------------------------------
  // Cleanup
  // --------------------------------------------------

  function cleanupStream() {
    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) =>
          track.stop()
        );

      streamRef.current = null;
    }
  }

  function cleanupTimer() {
    if (timerRef.current) {
      clearInterval(
        timerRef.current
      );

      timerRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      cleanupTimer();
      cleanupStream();
    };
  }, []);

  // --------------------------------------------------
  // Start recording
  // --------------------------------------------------

  async function startRecording() {
    if (
      recording ||
      processing ||
      disabled
    ) {
      return;
    }

    setError("");

    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    if (
      !navigator.mediaDevices?.getUserMedia
    ) {
      setError(
        "Your browser does not support microphone access."
      );
      return;
    }

    if (
      typeof MediaRecorder ===
      "undefined"
    ) {
      setError(
        "Your browser does not support audio recording."
      );
      return;
    }

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          }
        );

      streamRef.current =
        stream;

      const mimeType =
        getSupportedMimeType();

      const recorder =
        mimeType
          ? new MediaRecorder(
              stream,
              { mimeType }
            )
          : new MediaRecorder(
              stream
            );

      mediaRecorderRef.current =
        recorder;

      chunksRef.current = [];

      recorder.ondataavailable =
        (event) => {
          if (
            event.data &&
            event.data.size > 0
          ) {
            chunksRef.current.push(
              event.data
            );
          }
        };

      recorder.onerror = () => {
        setError(
          "An error occurred while recording your answer."
        );

        setRecording(false);
        cleanupTimer();
        cleanupStream();
      };

      recorder.onstop = () => {
        cleanupTimer();
        cleanupStream();
      };

      recorder.start();

      setElapsedSeconds(0);
      setRecording(true);

      timerRef.current =
        setInterval(() => {
          setElapsedSeconds(
            (previous) =>
              previous + 1
          );
        }, 1000);
    } catch (err) {
      console.error(
        "Microphone access error:",
        err
      );

      cleanupTimer();
      cleanupStream();

      if (
        err instanceof DOMException &&
        err.name ===
          "NotAllowedError"
      ) {
        setError(
          "Microphone permission was denied. Please allow microphone access in Chrome."
        );
      } else {
        setError(
          "Unable to access the microphone."
        );
      }
    }
  }

  // --------------------------------------------------
  // Stop recording + transcribe
  // --------------------------------------------------

  function stopRecording() {
    const recorder =
      mediaRecorderRef.current;

    if (
      !recorder ||
      recorder.state ===
        "inactive"
    ) {
      return;
    }

    setProcessing(true);
    setError("");

    recorder.onstop =
      async () => {
        cleanupTimer();
        cleanupStream();

        try {
          const mimeType =
            recorder.mimeType ||
            "audio/webm";

          const audioBlob =
            new Blob(
              chunksRef.current,
              {
                type: mimeType,
              }
            );

          if (
            audioBlob.size === 0
          ) {
            throw new Error(
              "The recording was empty."
            );
          }

          const extension =
            mimeType.includes(
              "webm"
            )
              ? "webm"
              : mimeType.includes(
                    "mp4"
                  )
                ? "mp4"
                : "ogg";

          const audioFile =
            new File(
              [audioBlob],
              `candidate-answer.${extension}`,
              {
                type: mimeType,
              }
            );

          const result =
            await apiUploadAudio<{
              text: string;
              answer_source: string;
            }>(
              "/voice/transcribe",
              audioFile,
              "file"
            );

          const transcript =
            (
              result.text ||
              ""
            ).trim();

          if (!transcript) {
            throw new Error(
              "No speech was detected. Please try again."
            );
          }

          onTranscript(
            transcript
          );
        } catch (err) {
          console.error(
            "Transcription error:",
            err
          );

          if (
            err instanceof ApiError
          ) {
            setError(
              err.message
            );
          } else if (
            err instanceof Error
          ) {
            setError(
              err.message
            );
          } else {
            setError(
              "Unable to transcribe your answer."
            );
          }
        } finally {
          setProcessing(false);
          setRecording(false);
          mediaRecorderRef.current =
            null;
          chunksRef.current = [];
          setElapsedSeconds(0);
        }
      };

    recorder.stop();
  }

  function formatTime(
    seconds: number
  ): string {
    const minutes =
      Math.floor(
        seconds / 60
      );

    const remaining =
      seconds % 60;

    return `${minutes
      .toString()
      .padStart(
        2,
        "0"
      )}:${remaining
      .toString()
      .padStart(
        2,
        "0"
      )}`;
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">

      <div className="flex items-center justify-between gap-4">

        <div className="flex items-center gap-3">

          <div
            className={`flex h-11 w-11 items-center justify-center rounded-full ${
              recording
                ? "bg-red-100 text-red-600"
                : processing
                  ? "bg-blue-100 text-blue-600"
                  : "bg-white text-blue-600"
            }`}
          >
            {recording
              ? "●"
              : processing
                ? "..."
                : "🎙"}
          </div>

          <div>

            <p className="text-sm font-semibold text-slate-900">
              Candidate Voice
            </p>

            <p className="text-xs text-slate-500">
              {recording
                ? `Recording ${formatTime(
                    elapsedSeconds
                  )}`
                : processing
                  ? "Converting your answer to text..."
                  : "Answer using your microphone"}
            </p>

          </div>

        </div>

        {!recording &&
          !processing && (
            <button
              type="button"
              onClick={() =>
                void startRecording()
              }
              disabled={disabled}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              🎙 Start Answer
            </button>
          )}

        {recording && (
          <button
            type="button"
            onClick={
              stopRecording
            }
            className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
          >
            ⏹ Stop & Transcribe
          </button>
        )}

        {processing && (
          <div className="rounded-lg bg-blue-100 px-4 py-2.5 text-sm font-medium text-blue-700">
            Transcribing...
          </div>
        )}

      </div>

      {recording && (
        <div className="mt-4 flex items-center gap-2 text-xs text-red-600">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          Microphone is recording your answer
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2">
          <p className="text-xs text-red-600">
            {error}
          </p>
        </div>
      )}

    </div>
  );
}