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
      <div className="p-4 sm:p-5 bg-amber-50 border border-amber-200 rounded-2xl">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-amber-800">Speech Recognition Unavailable</p>
            <p className="text-sm text-amber-600 mt-0.5">
              Please use Chrome, Edge, or Safari to use voice typing.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as "en-US" | "ur-PK")}
            disabled={isListening}
            className="appearance-none px-4 py-3 pr-10 bg-white border border-slate-200 rounded-xl text-base text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50 transition-all cursor-pointer font-medium"
          >
            <option value="en-US">English</option>
            <option value="ur-PK">اردو (Urdu)</option>
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {!isListening ? (
          <button
            onClick={handleStart}
            className="flex items-center gap-3 px-6 py-3.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all text-base font-bold shadow-md shadow-emerald-200 hover:shadow-lg"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 4a3 3 0 00-3 3v4a3 3 0 006 0V7a3 3 0 00-3-3zm0 10a5 5 0 005-5 1 1 0 10-2 0 3 3 0 11-6 0 1 1 0 10-2 0 5 5 0 005 5zm-1 3.07A7.001 7.001 0 015 11a1 1 0 10-2 0 9 9 0 008 8.94V22a1 1 0 102 0v-2.06A9 9 0 0021 11a1 1 0 10-2 0 7.001 7.001 0 01-6 6.07z" clipRule="evenodd" />
            </svg>
            <span>Start Recording</span>
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="flex items-center gap-3 px-6 py-3.5 bg-red-600 text-white rounded-xl hover:bg-red-700 active:scale-[0.98] transition-all text-base font-bold shadow-md shadow-red-200 hover:shadow-lg"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
            </svg>
            <span>Stop Recording</span>
          </button>
        )}

        {isListening && (
          <span className="flex items-center gap-2 text-red-600 text-base font-bold">
            <span className="flex gap-1">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse-dot" />
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse-dot" style={{ animationDelay: "0.3s" }} />
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse-dot" style={{ animationDelay: "0.6s" }} />
            </span>
            Recording...
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-3 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl">
          <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      {(transcript || interimTranscript) && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 min-h-[60px] shadow-sm">
          {transcript && (
            <p className="text-sm sm:text-base text-slate-800 break-words leading-relaxed">
              <span className="font-bold text-slate-500">Recognized: </span>
              {transcript}
            </p>
          )}
          {interimTranscript && (
            <p className="text-sm sm:text-base text-slate-400 italic mt-1">{interimTranscript}</p>
          )}
        </div>
      )}
    </div>
  );
}
