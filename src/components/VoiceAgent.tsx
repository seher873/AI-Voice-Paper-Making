"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useResult } from "@/context/ResultContext";
import { parseQuery, answerQuery, answerAdminQuery, type VoiceContext } from "@/lib/voiceQuery";

interface VoiceAgentProps {
  isSuperAdmin: boolean;
}

type Status = "idle" | "listening" | "processing" | "speaking";

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export default function VoiceAgent({ isSuperAdmin }: VoiceAgentProps) {
  const { state } = useResult();
  const [status, setStatus] = useState<Status>("idle");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setIsSupported(false);
      return;
    }
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;
    synthRef.current = window.speechSynthesis || null;

    return () => {
      recognition.abort();
      synthRef.current?.cancel();
    };
  }, []);

  const speak = useCallback((text: string) => {
    const synth = synthRef.current;
    if (!synth) { setStatus("idle"); return; }
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 0.95;
    utter.pitch = 1;
    utter.onend = () => setStatus("idle");
    utter.onerror = () => setStatus("idle");
    setStatus("speaking");
    synth.speak(utter);
  }, []);

  const processQuery = useCallback((text: string) => {
    if (!text.trim()) { setStatus("idle"); return; }
    setStatus("processing");
    const parsed = parseQuery(text);

    if (parsed.isAdminQuery && !isSuperAdmin) {
      const msg = "Ye query sirf admin ke liye hai. Aap sirf apne exams aur marks ke baare mein pooch sakte hain.";
      setResponse(msg);
      speak(msg);
      return;
    }

    if (parsed.isAdminQuery && isSuperAdmin) {
      answerAdminQuery(parsed.adminMetric, text).then((msg) => {
        setResponse(msg);
        speak(msg);
      });
      return;
    }

    const ctx: VoiceContext = {
      exams: state.exams,
      currentExam: state.currentExam,
      students: state.students,
      results: state.results,
    };
    const answer = answerQuery(parsed, ctx);
    setResponse(answer);
    speak(answer);
  }, [isSuperAdmin, state, speak]);

  const startListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    synthRef.current?.cancel();
    setTranscript("");
    setResponse("");
    setStatus("listening");

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      setTranscript(final || interim);
      if (final) processQuery(final);
    };

    recognition.onerror = () => setStatus("idle");
    recognition.onend = () => {
      if (status === "listening") setStatus("idle");
    };

    try {
      recognition.start();
    } catch {
      setStatus("idle");
    }
  }, [processQuery, status]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setStatus("idle");
  }, []);

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
    recognitionRef.current?.stop();
    setStatus("idle");
  }, []);

  const handleTextSubmit = useCallback((text: string) => {
    setTranscript(text);
    processQuery(text);
  }, [processQuery]);

  if (!isSupported) return null;

  return (
    <div className="fixed bottom-20 right-4 sm:right-6 z-40 flex flex-col items-end gap-2">
      {isOpen && (
        <div className="w-[320px] sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden mb-2">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 flex items-center gap-2">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-white flex-1">Voice Assistant</span>
            <button onClick={() => { stopSpeaking(); setIsOpen(false); }} className="text-white/70 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
            {transcript && (
              <div className="bg-slate-50 rounded-xl px-3 py-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Aapne kaha</p>
                <p className="text-sm text-slate-700">{transcript}</p>
              </div>
            )}

            {response && (
              <div className="bg-indigo-50 rounded-xl px-3 py-2">
                <p className="text-[10px] font-bold text-indigo-400 uppercase mb-0.5">Assistant</p>
                <p className="text-sm text-indigo-800">{response}</p>
              </div>
            )}

            {!transcript && !response && (
              <div className="text-center py-4">
                <p className="text-xs text-slate-400">Mic dabayein ya text likhein</p>
                <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px] text-slate-400">
                  <div className="bg-slate-50 rounded-lg px-2 py-1.5">&quot;Hamza ki marks kitni h&quot;</div>
                  <div className="bg-slate-50 rounded-lg px-2 py-1.5">&quot;English mein topper&quot;</div>
                  <div className="bg-slate-50 rounded-lg px-2 py-1.5">&quot;Kitne students hain&quot;</div>
                  <div className="bg-slate-50 rounded-lg px-2 py-1.5">&quot;Average kya hai&quot;</div>
                  {isSuperAdmin && (
                    <>
                      <div className="bg-indigo-50 rounded-lg px-2 py-1.5 text-indigo-500">&quot;Kitne schools hain&quot;</div>
                      <div className="bg-indigo-50 rounded-lg px-2 py-1.5 text-indigo-500">&quot;School activity batao&quot;</div>
                    </>
                  )}
                </div>
              </div>
            )}

            {status === "processing" && (
              <div className="flex items-center gap-2 text-xs text-indigo-500">
                <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                Soch raha hoon...
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 px-4 py-3 flex items-center gap-2">
            <TextSubmit onSubmit={handleTextSubmit} />
          </div>
        </div>
      )}

      <button
        onClick={() => {
          if (isOpen) { stopSpeaking(); setIsOpen(false); }
          else if (status === "listening") { stopListening(); }
          else if (status === "speaking") { stopSpeaking(); }
          else { setIsOpen(true); setTimeout(() => startListening(), 200); }
        }}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
          status === "listening"
            ? "bg-red-500 animate-pulse ring-4 ring-red-300"
            : status === "speaking"
            ? "bg-green-500 ring-4 ring-green-300"
            : status === "processing"
            ? "bg-amber-500 ring-4 ring-amber-300"
            : "bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
        }`}
        title={status === "listening" ? "Ruko" : "Bolo"}
      >
        {status === "listening" ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" fill="white" />
          </svg>
        ) : status === "speaking" ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>
    </div>
  );
}

function TextSubmit({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [val, setVal] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (val.trim()) { onSubmit(val.trim()); setVal(""); }
      }}
      className="flex items-center gap-2 w-full"
    >
      <input
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Type your question..."
        className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
      <button
        type="submit"
        className="px-3 py-2 bg-indigo-500 text-white text-xs font-bold rounded-lg hover:bg-indigo-600 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </form>
  );
}
