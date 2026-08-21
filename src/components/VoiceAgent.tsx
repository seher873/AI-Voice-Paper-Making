"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useResult } from "@/context/ResultContext";
import { parseQuery, answerQuery, answerAdminQuery, parseMutation, describeMutation, type MutationAction, type VoiceContext } from "@/lib/voiceQuery";
import { executeMutation } from "@/lib/voiceMutations";

interface VoiceAgentProps {
  isSuperAdmin: boolean;
}

type Status = "idle" | "listening" | "processing" | "speaking";

interface ChatMsg {
  id: string;
  role: "user" | "agent";
  text: string;
  pendingAction?: MutationAction;
}

let msgId = 0;
function nextId() { return `m${++msgId}`; }

export default function VoiceAgent({ isSuperAdmin }: VoiceAgentProps) {
  const { state, dispatch } = useResult();
  const [status, setStatus] = useState<Status>("idle");
  const [isOpen, setIsOpen] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setIsSupported(false); return; }
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;
    synthRef.current = window.speechSynthesis || null;
    return () => { recognition.abort(); synthRef.current?.cancel(); };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const addMsg = useCallback((role: "user" | "agent", text: string, pendingAction?: MutationAction) => {
    setMessages((prev) => [...prev, { id: nextId(), role, text, pendingAction }]);
  }, []);

  const speak = useCallback((text: string) => {
    const synth = synthRef.current;
    if (!synth) { setStatus("idle"); return; }
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 0.95;
    utter.onend = () => setStatus("idle");
    utter.onerror = () => setStatus("idle");
    setStatus("speaking");
    synth.speak(utter);
  }, []);

  const processInput = useCallback((text: string) => {
    if (!text.trim()) return;
    setStatus("processing");

    const subjects = state.currentExam?.subjects?.map((s) => s.name) || [];
    const mutation = parseMutation(text, subjects);
    if (mutation) {
      const desc = describeMutation(mutation);
      addMsg("agent", `Kya ye karna hai:\n${desc}\n\n"Haan" ya "Yes" bolain / likhein ya "No" se cancel karein.`, mutation);
      speak(`Kya ye karna hai? ${desc} Haan ya No bolain.`);
      return;
    }

    const parsed = parseQuery(text);
    if (parsed.isAdminQuery && !isSuperAdmin) {
      const msg = "Ye query sirf super admin ke liye hai. Aap sirf apne exams/marks ke baare mein pooch sakte hain.";
      addMsg("agent", msg);
      speak(msg);
      return;
    }
    if (parsed.isAdminQuery && isSuperAdmin) {
      answerAdminQuery(parsed.adminMetric, text).then((msg) => {
        addMsg("agent", msg);
        speak(msg);
      });
      return;
    }
    const ctx: VoiceContext = { exams: state.exams, currentExam: state.currentExam, students: state.students, results: state.results };
    const answer = answerQuery(parsed, ctx);
    addMsg("agent", answer);
    speak(answer);
  }, [isSuperAdmin, state, speak, addMsg]);

  const processQuery = useCallback((text: string) => {
    const lower = text.toLowerCase().trim();
    const lastAgent = [...messages].reverse().find((m) => m.role === "agent" && m.pendingAction);
    if (lastAgent?.pendingAction) {
      if (/^(yes|haan|ha|ji|confirm|ok|theek|karo|y)/i.test(lower)) {
        const result = executeMutation(lastAgent.pendingAction, { resultState: state, resultDispatch: dispatch });
        addMsg("agent", result);
        speak(result);
        return;
      } else if (/^(no|nahi|nahin|nah|cancel|ruko|mat karo|n)/i.test(lower)) {
        addMsg("agent", "Thik hai, action cancel kar diya.");
        speak("Action cancel kar diya.");
        return;
      }
    }
    processInput(text);
  }, [messages, processInput, state, dispatch, speak, addMsg]);

  const confirmPending = useCallback((action: MutationAction) => {
    const result = executeMutation(action, { resultState: state, resultDispatch: dispatch });
    addMsg("user", "Haan, karo");
    addMsg("agent", result);
    speak(result);
  }, [state, dispatch, speak, addMsg]);

  const cancelPending = useCallback(() => {
    addMsg("user", "Nahi, cancel");
    addMsg("agent", "Action cancel kar diya.");
    speak("Cancel kar diya.");
  }, [speak, addMsg]);

  const startListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    synthRef.current?.cancel();
    setInterimText("");
    setStatus("listening");
    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      setInterimText(interim);
      if (final) {
        setInterimText("");
        addMsg("user", final);
        processQuery(final);
      }
    };
    recognition.onerror = () => setStatus("idle");
    recognition.onend = () => { if (status === "listening") setStatus("idle"); };
    try { recognition.start(); } catch { setStatus("idle"); }
  }, [processQuery, status, addMsg]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setStatus("idle");
  }, []);

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
    recognitionRef.current?.stop();
    setStatus("idle");
  }, []);

  if (!isSupported) return null;

  const lastAgentMsg = [...messages].reverse().find((m) => m.role === "agent" && m.pendingAction);

  return (
    <>
      <div className="fixed bottom-20 right-4 sm:right-6 z-40">
        <button
          onClick={() => {
            if (isOpen) { stopSpeaking(); setIsOpen(false); }
            else if (status === "listening") stopListening();
            else if (status === "speaking") stopSpeaking();
            else { setIsOpen(true); setTimeout(() => startListening(), 200); }
          }}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 border-2 border-white/30 ${
            status === "listening"
              ? "bg-red-500 animate-pulse ring-4 ring-red-200 scale-110"
              : status === "speaking"
              ? "bg-emerald-500 ring-4 ring-emerald-200 animate-bounce"
              : status === "processing"
              ? "bg-amber-500 ring-4 ring-amber-200"
              : "bg-gradient-to-br from-violet-600 to-indigo-700 hover:from-violet-700 hover:to-indigo-800 hover:scale-105"
          }`}
        >
          <div className="relative">
            {status === "idle" && (
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a3 3 0 00-3 3v6a3 3 0 006 0V5a3 3 0 00-3-3z" />
                <path d="M19 11a7 7 0 01-14 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                <path d="M12 18v4m-3 0h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
            {status === "listening" && (
              <div className="flex items-center gap-[3px]">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="w-[3px] bg-white rounded-full animate-pulse" style={{ height: `${10 + Math.random()*10}px`, animationDelay: `${i*0.1}s` }} />
                ))}
              </div>
            )}
            {status === "processing" && (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {status === "speaking" && (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            )}
          </div>
        </button>
        {status === "listening" && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-ping" />
        )}
      </div>

      {isOpen && (
        <div className="fixed bottom-[88px] right-4 sm:right-6 z-40 w-[340px] sm:w-[380px] max-h-[480px] flex flex-col bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.18)] border border-slate-200/80 overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 px-4 py-3 flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a3 3 0 00-3 3v6a3 3 0 006 0V5a3 3 0 00-3-3z" />
                  <path d="M19 11a7 7 0 01-14 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                  <path d="M12 18v4m-3 0h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-violet-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-tight">AI Assistant</p>
              <p className="text-[10px] text-white/70">
                {status === "listening" ? "Sun raha hoon..." : status === "processing" ? "Soch raha hoon..." : status === "speaking" ? "Bol raha hoon..." : "Online"}
              </p>
            </div>
            <button onClick={() => { stopSpeaking(); setIsOpen(false); }} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px] max-h-[320px] bg-slate-50/50">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center mb-3">
                  <svg className="w-8 h-8 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2a3 3 0 00-3 3v6a3 3 0 006 0V5a3 3 0 00-3-3z" />
                    <path d="M19 11a7 7 0 01-14 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                    <path d="M12 18v4m-3 0h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-700 mb-1">AI Voice Assistant</p>
                <p className="text-xs text-slate-400 max-w-[240px]">Mic dabayein ya type karein — marks puchen, exams manage karein, data add karein</p>
                <div className="mt-4 grid grid-cols-2 gap-1.5 w-full text-[10px]">
                  <QuickChip onClick={(t) => { addMsg("user", t); processInput(t); }} text="Kitne students?" color="slate" />
                  <QuickChip onClick={(t) => { addMsg("user", t); processInput(t); }} text="English topper" color="slate" />
                  <QuickChip onClick={(t) => { addMsg("user", t); processInput(t); }} text="Add 85 marks Math roll 5" color="emerald" />
                  <QuickChip onClick={(t) => { addMsg("user", t); processInput(t); }} text="Create exam Mid Term" color="emerald" />
                  {isSuperAdmin && (
                    <>
                      <QuickChip onClick={(t) => { addMsg("user", t); processInput(t); }} text="Kitne schools?" color="indigo" />
                      <QuickChip onClick={(t) => { addMsg("user", t); processInput(t); }} text="Full overview" color="indigo" />
                    </>
                  )}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "agent" && (
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                    <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2a3 3 0 00-3 3v6a3 3 0 006 0V5a3 3 0 00-3-3z" />
                    </svg>
                  </div>
                )}
                <div className={`max-w-[80%] ${msg.role === "user" ? "order-first" : ""}`}>
                  <div className={`px-3 py-2 text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-2xl rounded-tr-md"
                      : "bg-white text-slate-700 rounded-2xl rounded-tl-md shadow-sm border border-slate-100"
                  }`}>
                    {msg.text}
                  </div>
                  {msg.pendingAction && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => confirmPending(msg.pendingAction!)} className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-full hover:bg-emerald-600 transition-all active:scale-95 shadow-sm">
                        Confirm
                      </button>
                      <button onClick={cancelPending} className="px-3 py-1.5 bg-white text-red-500 text-xs font-bold rounded-full hover:bg-red-50 border border-red-200 transition-all active:scale-95">
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-6 h-6 rounded-lg bg-slate-200 flex items-center justify-center ml-2 mt-1 flex-shrink-0">
                    <svg className="w-3 h-3 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
              </div>
            ))}

            {interimText && (
              <div className="flex justify-end">
                <div className="px-3 py-2 text-sm bg-indigo-100 text-indigo-600 rounded-2xl rounded-tr-md italic max-w-[80%]">
                  {interimText}...
                </div>
              </div>
            )}

            {status === "processing" && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mr-2 flex-shrink-0">
                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2a3 3 0 00-3 3v6a3 3 0 006 0V5a3 3 0 00-3-3z" />
                  </svg>
                </div>
                <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-slate-100">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                    <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                    <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          <div className="border-t border-slate-100 px-3 py-2.5 bg-white flex items-center gap-2">
            <button
              onClick={() => { if (status === "listening") stopListening(); else startListening(); }}
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                status === "listening"
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {status === "listening" ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>
            <ChatInput onSubmit={(t) => { addMsg("user", t); processQuery(t); }} />
          </div>
        </div>
      )}
    </>
  );
}

function QuickChip({ onClick, text, color }: { onClick: (t: string) => void; text: string; color: string }) {
  const cls = color === "emerald"
    ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100"
    : color === "indigo"
    ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-100"
    : "bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-100";
  return (
    <button onClick={() => onClick(text)} className={`text-left px-2.5 py-1.5 rounded-lg border transition-all ${cls}`}>
      &ldquo;{text}&rdquo;
    </button>
  );
}

function ChatInput({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [val, setVal] = useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (val.trim()) { onSubmit(val.trim()); setVal(""); } }} className="flex-1 flex items-center gap-2">
      <input
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Type a command..."
        className="flex-1 text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400 transition-all"
      />
      <button type="submit" className="w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all active:scale-95 flex-shrink-0">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" d="M12 19V5m0 0l-5 5m5-5l5 5" />
        </svg>
      </button>
    </form>
  );
}
