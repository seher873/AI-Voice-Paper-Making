"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useResult } from "@/context/ResultContext";
import { usePaper } from "@/context/PaperContext";
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

const POS_KEY = "paper-maker-agent-pos";

function loadPos(): { x: number; y: number } {
  if (typeof window === "undefined") return { x: -1, y: -1 };
  try {
    const saved = localStorage.getItem(POS_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return { x: -1, y: -1 };
}

export default function VoiceAgent({ isSuperAdmin }: VoiceAgentProps) {
  const { state, dispatch } = useResult();
  const { state: paperState, papers } = usePaper();
  const [status, setStatus] = useState<Status>("idle");
  const [isOpen, setIsOpen] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const speakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [feeStudents, setFeeStudents] = useState<import("@/types/fee").StudentFee[]>([]);
  const [feePayments, setFeePayments] = useState<import("@/types/fee").FeePayment[]>([]);

  // Drag state
  const savedPos = useRef(loadPos());
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    const p = savedPos.current;
    if (p.x >= 0 && p.y >= 0) return p;
    return { x: typeof window !== "undefined" ? window.innerWidth - 80 : 300, y: typeof window !== "undefined" ? window.innerHeight - 140 : 500 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, origX: 0, origY: 0, moved: false });

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setIsSupported(false); return; }
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;
    synthRef.current = window.speechSynthesis || null;
    // Force voices to load (Chrome quirk: returns [] until "voiceschanged")
    if (synthRef.current) {
      synthRef.current.getVoices();
      const onVoices = () => synthRef.current?.getVoices();
      synthRef.current.addEventListener?.("voiceschanged", onVoices);
    }
    return () => { recognition.abort(); synthRef.current?.cancel(); };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  // Save position to localStorage
  useEffect(() => {
    if (pos.x >= 0 && pos.y >= 0) {
      try { localStorage.setItem(POS_KEY, JSON.stringify(pos)); } catch { /* ignore */ }
    }
  }, [pos]);

  // Load fee data when agent opens
  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    (async () => {
      try {
        const { getSupabase, getSchoolId } = await import("@/lib/supabase");
        const sb = getSupabase();
        const schoolId = await getSchoolId();
        if (!schoolId || !mounted) return;
        const [studRes, payRes] = await Promise.all([
          sb.from("student_fees").select("*").eq("school_id", schoolId).eq("is_active", true),
          sb.from("fee_payments").select("*").eq("school_id", schoolId).order("month_year", { ascending: false }),
        ]);
        if (mounted) {
          if (studRes.data) setFeeStudents(studRes.data as import("@/types/fee").StudentFee[]);
          if (payRes.data) setFeePayments(payRes.data as import("@/types/fee").FeePayment[]);
        }
      } catch (e) {
        console.error("[VoiceAgent] Fee data load failed:", e);
      }
    })();
    return () => { mounted = false; };
  }, [isOpen]);

  const addMsg = useCallback((role: "user" | "agent", text: string, pendingAction?: MutationAction) => {
    setMessages((prev) => [...prev, { id: nextId(), role, text, pendingAction }]);
  }, []);

  const speak = useCallback((text: string) => {
    if (speakTimerRef.current) { clearTimeout(speakTimerRef.current); speakTimerRef.current = null; }
    const synth = synthRef.current;
    if (!synth) { setStatus("idle"); return; }
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const voice = synth.getVoices().find((v) => v.lang?.toLowerCase().startsWith("en")) || null;
    if (voice) { utter.voice = voice; utter.lang = voice.lang; }
    else utter.lang = "en-US";
    utter.rate = 0.95;
    utter.onend = () => setStatus("idle");
    utter.onerror = () => setStatus("idle");
    setStatus("speaking");
    // Chrome bug: speak() right after cancel() is often swallowed. Defer slightly.
    speakTimerRef.current = setTimeout(() => {
      speakTimerRef.current = null;
      if (synth.paused) synth.resume();
      synth.speak(utter);
    }, 60);
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
    const ctx: VoiceContext = {
      exams: state.exams,
      currentExam: state.currentExam,
      students: state.students,
      results: state.results,
      paper: paperState,
      savedPapers: papers,
      feeStudents,
      feePayments,
      schoolName: state.schoolName,
    };
    const answer = answerQuery(parsed, ctx);
    addMsg("agent", answer);
    speak(answer);
  }, [isSuperAdmin, state, paperState, papers, speak, addMsg]);

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

  // Drag handlers
  const onDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    dragRef.current = { startX: clientX, startY: clientY, origX: pos.x, origY: pos.y, moved: false };
    setIsDragging(true);
  }, [pos]);

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const dx = clientX - dragRef.current.startX;
      const dy = clientY - dragRef.current.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true;
      const newX = Math.max(8, Math.min(window.innerWidth - 68, dragRef.current.origX + dx));
      const newY = Math.max(8, Math.min(window.innerHeight - 68, dragRef.current.origY + dy));
      setPos({ x: newX, y: newY });
    };

    const onUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", onMove, { passive: false });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [isDragging]);

  const handleButtonClick = useCallback(() => {
    if (dragRef.current.moved) return;
    if (isOpen) { stopSpeaking(); setIsOpen(false); }
    else if (status === "listening") stopListening();
    else if (status === "speaking") stopSpeaking();
    else { setIsOpen(true); setTimeout(() => startListening(), 200); }
  }, [isOpen, status, stopSpeaking, stopListening, startListening]);

  if (!isSupported) return null;

  const lastAgentMsg = [...messages].reverse().find((m) => m.role === "agent" && m.pendingAction);

  // Position chat panel relative to button
  const panelWidth = typeof window !== "undefined" && window.innerWidth < 640 ? 340 : 380;
  const panelX = pos.x + 68 > panelWidth ? pos.x - panelWidth - 12 : pos.x + 68;
  const panelY = Math.max(8, Math.min(pos.y - 400, window.innerHeight - 500));

  return (
    <>
      {/* Draggable Agent Button */}
      <div
        className="fixed z-50 group select-none"
        style={{ left: pos.x, top: pos.y, width: 60, height: 60, cursor: isDragging ? "grabbing" : "grab", touchAction: "none" }}
      >
        <button
          onClick={handleButtonClick}
          onMouseDown={onDragStart}
          onTouchStart={onDragStart}
          className="relative w-[60px] h-[60px] cursor-pointer"
          title="AI Assistant — Drag to move"
        >
          {/* Glow ring */}
          <div className={`absolute inset-[-4px] rounded-full transition-all duration-500 ${
            status === "listening" ? "bg-red-400/30 animate-ping" :
            status === "speaking" ? "bg-emerald-400/30 animate-pulse" :
            status === "processing" ? "bg-amber-400/20 animate-spin" :
            "bg-violet-400/20 group-hover:bg-violet-400/40"
          }`} />

          {/* Agent body */}
          <svg viewBox="0 0 60 60" className="relative w-full h-full drop-shadow-xl">
            <defs>
              <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={status === "listening" ? "#ef4444" : status === "speaking" ? "#10b981" : status === "processing" ? "#f59e0b" : "#7c3aed"} />
                <stop offset="100%" stopColor={status === "listening" ? "#dc2626" : status === "speaking" ? "#059669" : status === "processing" ? "#d97706" : "#4f46e5"} />
              </linearGradient>
              <filter id="shadow2">
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
              </filter>
            </defs>
            <line x1="30" y1="8" x2="30" y2="16" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
            <circle cx="30" cy="6" r="3" fill="white" opacity="0.9">
              {status === "listening" && <animate attributeName="r" values="3;4.5;3" dur="0.8s" repeatCount="indefinite" />}
              {status === "processing" && <animate attributeName="opacity" values="0.9;0.3;0.9" dur="1s" repeatCount="indefinite" />}
            </circle>
            <circle cx="30" cy="33" r="18" fill="url(#bodyGrad)" filter="url(#shadow2)" />
            <ellipse cx="24" cy="28" rx="7" ry="5" fill="white" opacity="0.15" />
            {/* Left eye */}
            <g>
              {status === "speaking" ? (
                <><circle cx="23" cy="31" r="3.5" fill="white" /><circle cx="23" cy="31" r="2" fill="#1e1b4b"><animate attributeName="cy" values="31;30;31" dur="0.6s" repeatCount="indefinite" /></circle></>
              ) : status === "listening" ? (
                <><circle cx="23" cy="31" r="4" fill="white" /><circle cx="23" cy="31" r="2.5" fill="#1e1b4b"><animate attributeName="cx" values="23;24.5;21.5;23" dur="1.5s" repeatCount="indefinite" /></circle></>
              ) : status === "processing" ? (
                <g><line x1="19" y1="31" x2="27" y2="31" stroke="white" strokeWidth="2.5" strokeLinecap="round"><animate attributeName="y1" values="31;30;31" dur="0.8s" repeatCount="indefinite" /><animate attributeName="y2" values="31;32;31" dur="0.8s" repeatCount="indefinite" /></line></g>
              ) : (
                <><circle cx="23" cy="31" r="3.5" fill="white" /><circle cx="23" cy="32" r="2" fill="#1e1b4b" /><circle cx="22" cy="31" r="0.7" fill="white" /></>
              )}
            </g>
            {/* Right eye */}
            <g>
              {status === "speaking" ? (
                <><circle cx="37" cy="31" r="3.5" fill="white" /><circle cx="37" cy="31" r="2" fill="#1e1b4b"><animate attributeName="cy" values="31;30;31" dur="0.6s" repeatCount="indefinite" /></circle></>
              ) : status === "listening" ? (
                <><circle cx="37" cy="31" r="4" fill="white" /><circle cx="37" cy="31" r="2.5" fill="#1e1b4b"><animate attributeName="cx" values="37;38.5;35.5;37" dur="1.5s" repeatCount="indefinite" /></circle></>
              ) : status === "processing" ? (
                <g><line x1="33" y1="31" x2="41" y2="31" stroke="white" strokeWidth="2.5" strokeLinecap="round"><animate attributeName="y1" values="31;32;31" dur="0.8s" repeatCount="indefinite" /><animate attributeName="y2" values="31;30;31" dur="0.8s" repeatCount="indefinite" /></line></g>
              ) : (
                <><circle cx="37" cy="31" r="3.5" fill="white" /><circle cx="37" cy="32" r="2" fill="#1e1b4b" /><circle cx="36" cy="31" r="0.7" fill="white" /></>
              )}
            </g>
            {/* Mouth */}
            {status === "speaking" ? (
              <ellipse cx="30" cy="40" rx="3.5" ry="2.5" fill="white" opacity="0.9"><animate attributeName="ry" values="2.5;1.5;2.5" dur="0.3s" repeatCount="indefinite" /></ellipse>
            ) : status === "listening" ? (
              <circle cx="30" cy="40" r="2" fill="white" opacity="0.7" />
            ) : status === "processing" ? (
              <path d="M26 39 Q30 42 34 39" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8"><animate attributeName="d" values="M26 39 Q30 42 34 39;M26 40 Q30 38 34 40;M26 39 Q30 42 34 39" dur="1.2s" repeatCount="indefinite" /></path>
            ) : (
              <path d="M26 38 Q30 42 34 38" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />
            )}
            <circle cx="17" cy="37" r="2.5" fill="#f472b6" opacity="0.3" />
            <circle cx="43" cy="37" r="2.5" fill="#f472b6" opacity="0.3" />
          </svg>

          {/* Status badge */}
          {status === "listening" && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white">
              <div className="absolute inset-0 bg-red-400 rounded-full animate-ping" />
            </div>
          )}
          {status === "speaking" && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
          )}
        </button>
      </div>

      {/* Chat Panel */}
      {isOpen && (
        <div
          className="fixed z-50 w-[340px] sm:w-[380px] max-h-[480px] flex flex-col bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.18)] border border-slate-200/80 overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
          style={{ left: Math.max(8, Math.min(panelX, window.innerWidth - panelWidth - 8)), top: Math.max(8, panelY) }}
        >
          <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 px-4 py-3 flex items-center gap-3">
            <div className="relative">
              <svg viewBox="0 0 36 36" className="w-9 h-9">
                <circle cx="18" cy="18" r="16" fill="white" fillOpacity="0.2" />
                <line x1="18" y1="3" x2="18" y2="8" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
                <circle cx="18" cy="2" r="1.5" fill="white" opacity="0.8" />
                <circle cx="18" cy="19" r="11" fill="white" fillOpacity="0.9" />
                <circle cx="13" cy="17.5" r="2.2" fill="#1e1b4b" />
                <circle cx="23" cy="17.5" r="2.2" fill="#1e1b4b" />
                <circle cx="12.3" cy="16.8" r="0.6" fill="white" />
                <circle cx="22.3" cy="16.8" r="0.6" fill="white" />
                <path d="M14 22 Q18 25 22 22" stroke="#1e1b4b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <circle cx="9" cy="20" r="1.8" fill="#f472b6" opacity="0.3" />
                <circle cx="27" cy="20" r="1.8" fill="#f472b6" opacity="0.3" />
              </svg>
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
                <svg viewBox="0 0 64 64" className="w-16 h-16 mb-3 drop-shadow-md">
                  <circle cx="32" cy="32" r="30" fill="url(#emptyGrad)" />
                  <defs><linearGradient id="emptyGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#8b5cf6" /><stop offset="100%" stopColor="#6366f1" /></linearGradient></defs>
                  <line x1="32" y1="4" x2="32" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
                  <circle cx="32" cy="3" r="2" fill="white" opacity="0.8" />
                  <circle cx="32" cy="32" r="16" fill="white" fillOpacity="0.95" />
                  <circle cx="25" cy="30" r="2.8" fill="#1e1b4b" />
                  <circle cx="39" cy="30" r="2.8" fill="#1e1b4b" />
                  <circle cx="24.1" cy="29.1" r="0.8" fill="white" />
                  <circle cx="38.1" cy="29.1" r="0.8" fill="white" />
                  <path d="M26 36 Q32 40 38 36" stroke="#1e1b4b" strokeWidth="2" fill="none" strokeLinecap="round" />
                  <circle cx="19" cy="34" r="2.5" fill="#f472b6" opacity="0.25" />
                  <circle cx="45" cy="34" r="2.5" fill="#f472b6" opacity="0.25" />
                </svg>
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
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center mr-2 mt-1 flex-shrink-0 bg-gradient-to-br from-violet-500 to-indigo-600">
                    <svg viewBox="0 0 24 24" className="w-4 h-4">
                      <circle cx="12" cy="13" r="7" fill="white" fillOpacity="0.95" />
                      <circle cx="9.5" cy="12.5" r="1.2" fill="#1e1b4b" />
                      <circle cx="14.5" cy="12.5" r="1.2" fill="#1e1b4b" />
                      <path d="M10 15.5 Q12 17 14 15.5" stroke="#1e1b4b" strokeWidth="0.8" fill="none" strokeLinecap="round" />
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
                  <svg viewBox="0 0 24 24" className="w-4 h-4">
                    <circle cx="12" cy="13" r="7" fill="white" fillOpacity="0.95" />
                    <circle cx="9.5" cy="12.5" r="1.2" fill="#1e1b4b" />
                    <circle cx="14.5" cy="12.5" r="1.2" fill="#1e1b4b" />
                    <path d="M10 15.5 Q12 17 14 15.5" stroke="#1e1b4b" strokeWidth="0.8" fill="none" strokeLinecap="round" />
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
