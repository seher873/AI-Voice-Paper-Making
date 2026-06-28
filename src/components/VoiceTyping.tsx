"use client";

import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useState } from "react";
import { useToast } from "@/context/ToastContext";

interface VoiceTypingProps {
  onTranscriptReady: (text: string) => void;
}

export default function VoiceTyping({ onTranscriptReady }: VoiceTypingProps) {
  const { isListening, isSupported, transcript, interimTranscript, startListening, stopListening, error } =
    useSpeechRecognition();
  const { addToast } = useToast();
  const [language, setLanguage] = useState<"en-US" | "ur-PK">("en-US");

  const handleStart = () => {
    if (!isSupported) {
      addToast("Speech recognition not supported in this browser", "error");
      return;
    }
    startListening(language);
  };

  const handleStop = () => {
    stopListening();
    const text = transcript.trim();
    if (text) {
      onTranscriptReady(text);
      addToast("Question added from voice", "success");
    } else {
      addToast("No speech detected, try again", "warning");
    }
  };

  if (!isSupported) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-amber-800">Speech Recognition Unavailable</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Please use Chrome, Edge, or Safari to use voice typing.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as "en-US" | "ur-PK")}
            disabled={isListening}
            className="appearance-none px-3.5 py-2 pr-8 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50 transition-all cursor-pointer"
          >
            <option value="en-US">English</option>
            <option value="ur-PK">اردو (Urdu)</option>
          </select>
          <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {!isListening ? (
          <button
            onClick={handleStart}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 active:scale-[0.98] transition-all text-sm font-medium shadow-sm shadow-emerald-200"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
            Start Recording
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 active:scale-[0.98] transition-all text-sm font-medium shadow-sm shadow-red-200"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
            </svg>
            Stop Recording
          </button>
        )}

        {isListening && (
          <span className="flex items-center gap-1.5 text-red-600 text-sm font-medium">
            <span className="flex gap-0.5">
              <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse-dot" />
              <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse-dot" style={{ animationDelay: "0.3s" }} />
              <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse-dot" style={{ animationDelay: "0.6s" }} />
            </span>
            Recording...
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {(transcript || interimTranscript) && (
        <div className="bg-white border border-slate-200 rounded-lg p-3 min-h-[56px]">
          {transcript && (
            <p className="text-sm text-slate-800">
              <span className="font-medium text-slate-500">Recognized: </span>
              {transcript}
            </p>
          )}
          {interimTranscript && (
            <p className="text-sm text-slate-400 italic mt-0.5">{interimTranscript}</p>
          )}
        </div>
      )}
    </div>
  );
}
