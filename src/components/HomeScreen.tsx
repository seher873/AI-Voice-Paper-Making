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
    enabled: boolean;
    icon: React.ReactNode;
    bg: string;
  }[] = [
    {
      id: "paper",
      title: "Paper",
      subtitle: "School Paper Builder",
      enabled: plan.features.paper,
      bg: "from-indigo-500 to-indigo-700",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: "results",
      title: "Results",
      subtitle: "Results & Report Cards",
      enabled: plan.features.results,
      bg: "from-emerald-500 to-emerald-700",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: "fees",
      title: "Fees",
      subtitle: "Students · Fees · WhatsApp Slips",
      enabled: plan.features.fees,
      bg: "from-amber-500 to-orange-600",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  const visibleCards = cards.filter((c) => c.enabled);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/50 flex flex-col">
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
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white tracking-tight truncate">Dashboard</h1>
            <p className="text-[11px] text-indigo-200 font-medium truncate">Apna aik feature chunein</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isSuperAdmin && (
              <button
                onClick={onSchoolInfo}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-white/10 text-white hover:bg-white/20 flex-shrink-0"
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
      </div>

      {/* Icon cards */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Kya karna hai?</h2>
            <p className="text-sm text-slate-500 mt-1">Neeche icon par click karein</p>
          </div>
          <div className={`grid ${visibleCards.length === 1 ? "grid-cols-1" : "sm:grid-cols-3"} gap-5`}>
            {visibleCards.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={`group bg-gradient-to-br ${c.bg} rounded-3xl p-6 shadow-xl hover:shadow-2xl hover:scale-[1.03] active:scale-[0.97] transition-all flex flex-col items-center text-center text-white min-h-[180px]`}
              >
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-white/30 transition-all">
                  {c.icon}
                </div>
                <span className="text-xl font-bold">{c.title}</span>
                <span className="text-xs text-white/90 mt-1 leading-snug">{c.subtitle}</span>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold bg-white/15 px-3 py-1 rounded-full group-hover:bg-white/25 transition-all">
                  Open
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
