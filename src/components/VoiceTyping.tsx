"use client";

import { useSpeech } from "@/hooks/useSpeech";
import { useState, useCallback } from "react";
import { useToast } from "@/context/ToastContext";
import { cleanTranscript, mathsCleaner } from "@/lib/textCleaner";
import type { QuestionType } from "@/types/paper";

export const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "descriptive", label: "Descriptive" },
  { value: "mcq", label: "Multiple Choice" },
  { value: "fillblanks", label: "Fill in the Blanks" },
  { value: "truefalse", label: "True / False" },
  { value: "maths", label: "Maths Question" },
];

interface VoiceTypingProps {
  onTranscriptReady: (text: string, type: QuestionType) => void;
}

export default function VoiceTyping({ onTranscriptReady }: VoiceTypingProps) {
  const { isListening, transcript, confidence, startListening, stopListening } = useSpeech();
  const { addToast } = useToast();
  const [pendingText, setPendingText] = useState("");
  const [pendingConfidence, setPendingConfidence] = useState(0);
  const [language, setLanguage] = useState<"en-US" | "ur-PK" | "sd-PK">("en-US");
  const [questionType, setQuestionType] = useState<QuestionType>("descriptive");
  const [mathsMode, setMathsMode] = useState(false);
  const [editing, setEditing] = useState(false);

  const handleVoiceResult = useCallback(
    (result: { text: string; confidence: number }) => {
      let cleaned: string;
      if (mathsMode) {
        cleaned = mathsCleaner(result.text);
      } else if (language === "en-US") {
        cleaned = cleanTranscript(result.text);
      } else {
        cleaned = result.text;
      }
      setPendingText(cleaned);
      setPendingConfidence(result.confidence);
      setEditing(true);
    },
    [language, mathsMode]
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
    onTranscriptReady(text, questionType);
    setPendingText("");
    setPendingConfidence(0);
    setEditing(false);
    addToast("Question added from voice", "success");
  }, [pendingText, questionType, onTranscriptReady, addToast]);

  const handleReject = useCallback(() => {
    setPendingText("");
    setPendingConfidence(0);
    setEditing(false);
    addToast("Re-record", "info");
  }, [addToast]);

  const handleCancel = useCallback(() => {
    setPendingText("");
    setPendingConfidence(0);
    setEditing(false);
  }, []);

  return (
    <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4 shadow-sm">
      {/* Question Type & Language Row */}
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Type</label>
          <select
            value={questionType}
            onChange={(e) => setQuestionType(e.target.value as QuestionType)}
            disabled={isListening}
            className="appearance-none w-full px-3 py-2.5 pr-8 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50 transition-all cursor-pointer font-medium"
          >
            {QUESTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[100px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Language</label>
          <div className="relative">
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value as "en-US" | "ur-PK" | "sd-PK");
                if (e.target.value !== "en-US") setMathsMode(false);
              }}
              disabled={isListening}
              className="appearance-none w-full px-3 py-2.5 pr-8 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50 transition-all cursor-pointer font-medium"
            >
              <option value="en-US">English</option>
              <option value="ur-PK">اردو (Urdu)</option>
              <option value="sd-PK">سنڌي (Sindhi)</option>
            </select>
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {language === "en-US" && (
          <div className="min-w-[80px]">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Mode</label>
            <button
              onClick={() => setMathsMode(!mathsMode)}
              className={`w-full min-h-[42px] px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                mathsMode
                  ? "bg-orange-600 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-orange-400"
              }`}
            >
              {mathsMode ? "Maths" : "Text"}
            </button>
          </div>
        )}
      </div>

      {/* Mic Button */}
      <div className="flex items-center gap-3">
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

        {isListening && (
          <span className="flex items-center gap-2 text-red-600 text-sm font-bold">
            <span className="flex gap-1">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse-dot" />
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse-dot" style={{ animationDelay: "0.3s" }} />
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse-dot" style={{ animationDelay: "0.6s" }} />
            </span>
            Listening...
          </span>
        )}
      </div>

      {/* Pending transcription preview with edit */}
      {editing && (
        <div className="space-y-3 animate-fade-in p-4 bg-white border-2 border-indigo-200 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
              Preview — {QUESTION_TYPES.find((t) => t.value === questionType)?.label}
            </span>
          </div>
          <textarea
            value={pendingText}
            onChange={(e) => setPendingText(e.target.value)}
            dir="auto"
            rows={3}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none transition-all"
          />

          {language === "en-US" && !mathsMode && pendingConfidence > 0 && (
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
              className="flex items-center justify-center gap-2 min-h-[48px] flex-[2] px-5 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all text-sm font-bold shadow-sm"
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
              Re-record
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center justify-center gap-2 min-h-[48px] flex-1 px-5 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all text-sm font-bold shadow-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
