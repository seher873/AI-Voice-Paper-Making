"use client";

import HeaderSection from "./HeaderSection";
import QuestionEditor from "./QuestionEditor";
import FooterSection from "./FooterSection";
import PaperPreview from "./PaperPreview";
import ExportBar from "./ExportBar";
import { useState } from "react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"header" | "questions" | "footer">("header");
  const [menuOpen, setMenuOpen] = useState(false);

  const tabs = [
    { id: "header" as const, label: "Header", icon: "M4 6h16M4 12h16M4 18h16" },
    { id: "questions" as const, label: "Questions", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
    { id: "footer" as const, label: "Footer", icon: "M5 10l5-5m0 0l5 5m-5-5v12" },
  ];

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gradient-to-br from-slate-50 to-indigo-50/50 overflow-hidden">
      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between bg-white border-b border-slate-200 px-4 py-2 z-30">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 text-slate-700 hover:text-indigo-600 transition-colors"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
          <span className="font-bold text-sm">PaperBol</span>
        </button>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
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
        } lg:translate-x-0 fixed lg:relative top-0 left-0 z-25 w-[85vw] max-w-[400px] h-full lg:h-auto lg:w-[460px] lg:min-w-[460px] xl:w-[500px] xl:min-w-[500px] bg-white/95 backdrop-blur-sm border-r border-slate-200 flex flex-col overflow-hidden shadow-2xl lg:shadow-lg transition-transform duration-300 ease-in-out`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">PaperBol</h1>
              <p className="text-xs text-indigo-200 font-medium">School Paper Builder</p>
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              className="lg:hidden ml-auto p-1 text-white/70 hover:text-white transition-colors"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-2 sm:px-3 pt-2 gap-0.5 sm:gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-4 py-2.5 text-xs sm:text-sm font-medium rounded-t-lg transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-white text-indigo-700 border border-b-white border-slate-200 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
              }`}
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              <span className="hidden xs:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          {activeTab === "header" && <HeaderSection />}
          {activeTab === "questions" && <QuestionEditor />}
          {activeTab === "footer" && <FooterSection />}
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
