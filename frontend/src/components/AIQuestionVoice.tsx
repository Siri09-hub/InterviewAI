"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetchBlob } from "@/lib/api";

interface AIQuestionVoiceProps {
  question: string;
}

export default function AIQuestionVoice({
  question,
}: AIQuestionVoiceProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");

  async function generateVoice() {
    if (!question.trim() || loading) return;

    try {
      setLoading(true);
      setError("");

      // Remove old audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }

      setAudioUrl("");
      setPlaying(false);

      // Get audio from backend
      const blob = await apiFetchBlob("/voice/speak", {
        method: "POST",
        body: {
          text: question,
        },
      });

      if (!blob || blob.size === 0) {
        throw new Error("No audio was returned from the backend.");
      }

      const url = URL.createObjectURL(blob);

      audioUrlRef.current = url;
      setAudioUrl(url);
    } catch (err) {
      console.error("AI voice generation error:", err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to generate the AI interviewer voice.");
      }
    } finally {
      setLoading(false);
    }
  }

  function playVoice() {
    if (!audioUrl) return;

    try {
      if (!audioRef.current) {
        const audio = new Audio(audioUrl);

        audioRef.current = audio;

        audio.onplay = () => {
          setPlaying(true);
        };

        audio.onended = () => {
          setPlaying(false);
        };

        audio.onpause = () => {
          setPlaying(false);
        };
        audio.onerror = () => {
          setPlaying(false);
          setError("Unable to play the generated audio.");
        };
      }

      audioRef.current.currentTime = 0;
      void audioRef.current.play();
    } catch (err) {
      console.error("AI voice playback error:", err);
      setError("Unable to play the generated audio.");
      setPlaying(false);
    }
  }

  function stopVoice() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setPlaying(false);
  }

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, [question]);

  return (
    <div className="mt-6 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
              playing
                ? "bg-blue-600 text-white"
                : "bg-white text-blue-600"
            }`}
          >
            <span className="text-sm font-bold">
              {playing ? "🔊" : "AI"}
            </span>
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">
              AI Interviewer
            </p>

            <p className="mt-0.5 text-xs text-slate-500">
              {loading
                ? "Generating AI voice..."
                : playing
                ? "AI interviewer is speaking..."
                : audioUrl
                ? "Voice generated successfully."
                : "Generate an AI voice for this question."}
            </p>
          </div>
        </div>

        <div className="shrink-0">
          {!audioUrl ? (
            <button
              type="button"
              onClick={() => void generateVoice()}
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Generating..." : "🔊 Generate Voice"}
            </button>
          ) : playing ? (
            <button
              type="button"
              onClick={stopVoice}
              className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              ⏹ Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={playVoice}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              ▶ Play Question
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}

