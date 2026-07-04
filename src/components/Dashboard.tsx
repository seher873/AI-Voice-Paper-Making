"use client";

import HeaderSection from "./HeaderSection";
import QuestionEditor from "./QuestionEditor";
import TemplateSection from "./TemplateSection";
import PaperPreview from "./PaperPreview";
import ExportBar from "./ExportBar";
import { useState } from "react";
import { usePaper } from "@/context/PaperContext";
import { TEMPLATES } from "@/lib/paperFormat";
import type { PaperTemplate } from "@/lib/paperFormat";

export default function Dashboard() {
  const { state, dispatch } = usePaper();
  const [activeTab, setActiveTab] = useState<"header" | "questions" | "template">("header");
  const [menuOpen, setMenuOpen] = useState(false);

  const tabs = [
    { id: "header" as const, label: "Header", icon: "M4 6h16M4 12h16M4 18h16" },
    { id: "questions" as const, label: "Questions", icon: "M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2m4 9l2 2 4-4" },
    { id: "template" as const, label: "Template", icon: "M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" },
  ];

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gradient-to-br from-slate-50 to-indigo-50/50">
      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between bg-white border-b border-slate-200 px-4 py-2 z-30 shadow-sm">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 min-h-[48px] px-2 text-slate-700 hover:text-indigo-600 active:scale-[0.96] transition-all rounded-xl"
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <rect x="2" y="3" width="20" height="18" rx="3" stroke="currentColor" fill="none" />
              <path strokeLinecap="round" d="M7 8h10M7 12h10M7 16h10" />
            </svg>
          )}
          <span className="font-bold text-sm tracking-tight truncate max-w-[120px]">AI Voice Paper</span>
        </button>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Preview
        </div>
      </div>

      {/* Mobile backdrop */}
      {menuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-20 transition-opacity"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Left Panel - Controls */}
      <div
        className={`${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:relative top-0 left-0 z-30           w-[92vw] max-w-[480px] h-full lg:h-auto lg:w-[520px] lg:min-w-[520px] xl:w-[560px] xl:min-w-[560px] bg-white/95 backdrop-blur-sm border-r border-slate-200 flex flex-col shadow-2xl lg:shadow-lg transition-transform duration-300 ease-in-out`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-2.5 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight truncate">AI Voice Paper</h1>
              <p className="text-[10px] text-indigo-200 font-medium">School Paper Builder</p>
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              className="lg:hidden ml-auto min-h-[36px] min-w-[36px] flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all rounded-xl"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Template Selector */}
        <div className="px-3 sm:px-4 pt-4 pb-3 bg-slate-50/80 border-b border-slate-200">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Paper Template</label>
          <div className="relative">
            <select
              value={TEMPLATES.find((t) => t.lang === state.paperLanguage)?.id || "english"}
              onChange={(e) => {
                const id = e.target.value as PaperTemplate;
                const tpl = TEMPLATES.find((t) => t.id === id);
                if (tpl) dispatch({ type: "SET_PAPER_LANGUAGE", payload: tpl.lang });
              }}
              className="appearance-none w-full px-3 py-2.5 pr-8 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all cursor-pointer font-medium"
            >
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-2 sm:px-3 pt-2 gap-0.5 sm:gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-1.5 min-h-[48px] px-3 sm:px-5 py-2.5 text-xs sm:text-sm font-medium rounded-t-lg transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-white text-indigo-700 border border-b-white border-slate-200 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
              }`}
            >
              <svg className="w-5 h-5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={tab.icon} />
              </svg>
              <span className="hidden xs:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          {activeTab === "header" && <HeaderSection />}
          {activeTab === "questions" && <QuestionEditor />}
          {activeTab === "template" && <TemplateSection />}
        </div>

        {/* Export */}
        <div className="flex-shrink-0 bg-white border-t border-slate-200 px-3 sm:px-4 py-3">
          <ExportBar />
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-100 to-slate-50 p-3 sm:p-4 lg:p-6">
        <div className="max-w-[210mm] mx-auto">
          <PaperPreview />
        </div>
      </div>
    </div>
  );
}
