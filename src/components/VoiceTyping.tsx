"use client";

import { useSpeech } from "@/hooks/useSpeech";
import { useState, useCallback } from "react";
import { useToast } from "@/context/ToastContext";
import { cleanTranscript } from "@/lib/textCleaner";

interface VoiceTypingProps {
  onTranscriptReady: (text: string) => void;
}

export default function VoiceTyping({ onTranscriptReady }: VoiceTypingProps) {
  const { isListening, transcript, confidence, startListening, stopListening } = useSpeech();
  const { addToast } = useToast();
  const [pendingText, setPendingText] = useState("");
  const [pendingConfidence, setPendingConfidence] = useState(0);
  const [language, setLanguage] = useState<"en-US" | "ur-PK" | "sd-PK">("en-US");
  const [editing, setEditing] = useState(false);

  const handleVoiceResult = useCallback(
    (result: { text: string; confidence: number }) => {
      const cleaned = language === "en-US" ? cleanTranscript(result.text) : result.text;
      setPendingText(cleaned);
      setPendingConfidence(result.confidence);
      setEditing(true);
    },
    [language]
  );

  const handleStart = useCallback(() => {
    setEditing(false);
    setPendingText("");
    setPendingConfidence(0);
    startListening(handleVoiceResult, language);
  }, [startListening, handleVoiceResult, language]);

  const handleStop = useCallback(() => {
    stopListening();
  }, [stopListening]);

  const handleAccept = useCallback(() => {
    const text = pendingText.trim();
    if (!text) {
      addToast("No text to accept", "warning");
      return;
    }
    onTranscriptReady(text);
    setPendingText("");
    setPendingConfidence(0);
    setEditing(false);
    addToast("Question added from voice", "success");
  }, [pendingText, onTranscriptReady, addToast]);

  const handleReject = useCallback(() => {
    setPendingText("");
    setPendingConfidence(0);
    setEditing(false);
    addToast("Re-record", "info");
  }, [addToast]);

  return (
    <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as "en-US" | "ur-PK" | "sd-PK")}
            disabled={isListening}
            className="appearance-none w-full min-w-[130px] px-4 py-3 pr-10 bg-white border border-slate-200 rounded-xl text-base text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50 transition-all cursor-pointer font-medium"
          >
            <option value="en-US">English</option>
            <option value="ur-PK">اردو (Urdu)</option>
            <option value="sd-PK">سنڌي (Sindhi)</option>
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        <button
          onClick={isListening ? handleStop : handleStart}
          className={`flex items-center justify-center gap-2 min-h-[48px] px-5 py-3 rounded-xl text-sm font-bold transition-all shadow-sm flex-1 sm:flex-none ${
            isListening
              ? "bg-red-600 text-white shadow-md hover:bg-red-700"
              : "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]"
          }`}
        >
          {isListening ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
              <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m-4 0h8" />
            </svg>
          )}
          <span className="whitespace-nowrap">{isListening ? "Stop" : "Record"}</span>
        </button>

        {isListening && transcript && (
          <span className="text-xs text-slate-400">Listening...</span>
        )}
      </div>

      {/* Pending transcription preview with edit */}
      {editing && (
        <div className="space-y-3 animate-fade-in">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Preview & Edit
            </label>
            <textarea
              value={pendingText}
              onChange={(e) => setPendingText(e.target.value)}
              dir="auto"
              rows={3}
              className="w-full px-4 py-3 bg-white border-2 border-indigo-200 rounded-xl text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none transition-all"
            />
          </div>

          {language === "en-US" && pendingConfidence > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Confidence:</span>
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden max-w-[120px]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.round(pendingConfidence * 100)}%`,
                    backgroundColor: pendingConfidence > 0.7 ? "#10b981" : pendingConfidence > 0.4 ? "#f59e0b" : "#ef4444",
                  }}
                />
              </div>
              <span className="text-xs font-bold text-slate-600">{Math.round(pendingConfidence * 100)}%</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleAccept}
              className="flex items-center justify-center gap-2 min-h-[48px] flex-1 px-5 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all text-sm font-bold shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Accept
            </button>
            <button
              onClick={handleReject}
              className="flex items-center justify-center gap-2 min-h-[48px] flex-1 px-5 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 active:scale-[0.98] transition-all text-sm font-bold shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 6L6 18M6 6l12 12" />
              </svg>
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
