"use client";

import { useState } from "react";
import type { Plan } from "@/lib/subscription";

interface HomeScreenProps {
  plan: Plan;
  isSuperAdmin: boolean;
  onSchoolInfo: () => void;
  onSelect: (mode: "paper" | "results" | "fees") => void;
}

export default function HomeScreen({ plan, isSuperAdmin, onSchoolInfo, onSelect }: HomeScreenProps) {
  const [showDataTip, setShowDataTip] = useState(() => {
    if (typeof window === "undefined") return true;
    try { return localStorage.getItem("pm-data-tip-dismissed") !== "1"; } catch { return true; }
  });

  const cards: {
    id: "paper" | "results" | "fees";
    title: string;
    subtitle: string;
    desc: string;
    accent: string;
    chip: string;
    enabled: boolean;
    art: React.ReactNode;
  }[] = [
    {
      id: "paper",
      title: "Paper",
      subtitle: "School Paper Builder",
      desc: "AI voice se exam papers banayein, print/Pdf/WhatsApp par share karein",
      enabled: plan.features.paper,
      accent: "from-indigo-500 via-indigo-600 to-violet-700",
      chip: "bg-indigo-50 text-indigo-700",
      art: (
        <svg className="w-full h-full" viewBox="0 0 200 140" fill="none">
          <rect x="60" y="10" width="80" height="105" rx="8" fill="white" stroke="#c7d2fe" strokeWidth="2" />
          <line x1="78" y1="32" x2="122" y2="32" stroke="#a5b4fc" strokeWidth="4" strokeLinecap="round" />
          <line x1="78" y1="46" x2="122" y2="46" stroke="#a5b4fc" strokeWidth="4" strokeLinecap="round" />
          <line x1="78" y1="60" x2="122" y2="60" stroke="#a5b4fc" strokeWidth="4" strokeLinecap="round" />
          <line x1="78" y1="74" x2="108" y2="74" stroke="#a5b4fc" strokeWidth="4" strokeLinecap="round" />
          <path d="M148 30l18 17 14-15" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18 70q55 60 100 0" stroke="#312e81" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.25" />
          <circle cx="170" cy="95" r="5" fill="#c7d2fe" />
          <circle cx="25" cy="30" r="6" fill="#e0e7ff" />
        </svg>
      ),
    },
    {
      id: "results",
      title: "Results",
      subtitle: "Results & Report Cards",
      desc: "Exams, grades aur professional report cards — sab aik jagah",
      enabled: plan.features.results,
      accent: "from-emerald-500 via-emerald-600 to-teal-700",
      chip: "bg-emerald-50 text-emerald-700",
      art: (
        <svg className="w-full h-full" viewBox="0 0 200 140" fill="none">
          <path d="M30 110h140" stroke="#6ee7b7" strokeWidth="4" strokeLinecap="round" />
          <rect x="42" y="62" width="20" height="48" rx="4" fill="#a7f3d0" />
          <rect x="72" y="44" width="20" height="66" rx="4" fill="#34d399" />
          <rect x="102" y="26" width="20" height="84" rx="4" fill="#059669" />
          <path d="M138 88l28 24-14 14" stroke="#047857" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M30 30l28 24" stroke="#6ee7b7" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
          <circle cx="150" cy="22" r="10" fill="#ffd166" />
          <path d="M150 17v5l4 3" stroke="#92400e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      id: "fees",
      title: "Fees",
      subtitle: "Students · Fees · WhatsApp Slips",
      desc: "Monthly fee collect karein aur parents ko WhatsApp par slip bhejein",
      enabled: plan.features.fees,
      accent: "from-amber-500 via-orange-500 to-orange-700",
      chip: "bg-orange-50 text-orange-700",
      art: (
        <svg className="w-full h-full" viewBox="0 0 200 140" fill="none">
          <circle cx="100" cy="70" r="46" fill="#ffedd5" />
          <circle cx="100" cy="70" r="30" fill="#fdba74" />
          <path d="M93 62v8m0 8v4m0-20c-4 0-8 2-8 6s4 5 8 6 8 2 8 5-4 5-8 5m0-20c-4 0-8 2-8 6" stroke="#7c2d12" strokeWidth="3" strokeLinecap="round" />
          <rect x="96" y="54" width="9" height="5" rx="2" fill="#9a3412" />
          <rect x="76" y="30" width="18" height="12" rx="3" fill="#fbbf24" transform="rotate(-20 85 36)" />
          <rect x="118" y="94" width="16" height="11" rx="3" fill="#f59e0b" transform="rotate(15 126 99)" />
          <path d="M28 32l40 10-42 4z" fill="#fde68a" opacity="0.6" />
        </svg>
      ),
    },
  ];

  const visibleCards = cards.filter((c) => c.enabled);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100 flex flex-col">
      {showDataTip && (
        <div className="absolute top-2 right-2 z-40 max-w-[260px] bg-amber-50 border border-amber-200 rounded-2xl shadow-lg p-3 text-[11px] text-amber-800 flex gap-2 items-start">
          <span className="text-base leading-none">💡</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold mb-0.5">Data Bachayein!</p>
            <p>App ko sara din khula rakhein (school time 8–12). Baar baar kholne se internet data waste hota hai.</p>
          </div>
          <button
            onClick={() => { setShowDataTip(false); try { localStorage.setItem("pm-data-tip-dismissed", "1"); } catch {} }}
            className="text-amber-500 hover:text-amber-700 flex-shrink-0"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top bar */}
      <header className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 px-5 py-5 flex-shrink-0 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-11 h-11 bg-white/15 backdrop-blur rounded-2xl flex items-center justify-center ring-1 ring-white/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white tracking-tight">Paperbol Dashboard</h1>
            <p className="text-[11px] text-indigo-200 font-medium truncate">Apna aik feature chunein</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isSuperAdmin && (
              <button
                onClick={onSchoolInfo}
                className="px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-white/10 text-white hover:bg-white/20 flex-shrink-0 ring-1 ring-white/20 active:scale-[0.97]"
                title="Schools / Admin"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10M9 21h6" />
                </svg>
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Icon cards */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-5xl">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold uppercase tracking-wider mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Welcome
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
              Aaj kya karna hai?
            </h2>
            <p className="text-sm text-slate-500 mt-2">Ek card chunein — apna kaam shuru karein</p>
          </div>

          <div className={`grid gap-6 ${visibleCards.length === 1 ? "grid-cols-1" : "sm:grid-cols-3"}`}>
            {visibleCards.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className="group relative bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 text-left overflow-hidden border border-slate-100"
              >
                <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${c.accent}`} />
                <div className={`absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br ${c.accent} opacity-10 group-hover:opacity-20 transition-opacity`} />

                {/* Illustration */}
                <div className="relative h-36 mb-4 flex items-center justify-center rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden group-hover:scale-[1.03] transition-transform duration-300">
                  {c.art}
                </div>

                <div className="relative">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${c.chip}`}>
                    {c.subtitle}
                  </span>
                  <h3 className="mt-2 text-2xl font-extrabold text-slate-800">{c.title}</h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">{c.desc}</p>

                  <span className={`mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${c.accent} text-white text-xs font-bold shadow-md group-hover:shadow-lg transition-all`}>
                    Kholein
                    <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
