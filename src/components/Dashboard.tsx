"use client";

import HeaderSection from "./HeaderSection";
import QuestionEditor from "./QuestionEditor";
import FooterSection from "./FooterSection";
import PaperPreview from "./PaperPreview";
import ExportBar from "./ExportBar";
import { useState } from "react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"header" | "questions" | "footer">("header");

  const tabs = [
    { id: "header" as const, label: "Header", icon: "M4 6h16M4 12h16M4 18h16" },
    { id: "questions" as const, label: "Questions", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
    { id: "footer" as const, label: "Footer", icon: "M5 10l5-5m0 0l5 5m-5-5v12" },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-indigo-50/50 overflow-hidden">
      {/* Left Panel */}
      <div className="w-[480px] min-w-[480px] bg-white/90 backdrop-blur-sm border-r border-slate-200 flex flex-col overflow-hidden shadow-lg">
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
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-3 pt-2 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all ${
                activeTab === tab.id
                  ? "bg-white text-indigo-700 border border-b-white border-slate-200 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === "header" && <HeaderSection />}
          {activeTab === "questions" && <QuestionEditor />}
          {activeTab === "footer" && <FooterSection />}
        </div>

        {/* Export */}
        <div className="flex-shrink-0 bg-white border-t border-slate-200 px-4 py-3">
          <ExportBar />
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-100 to-slate-50 p-6">
        <div className="max-w-[210mm] mx-auto">
          <PaperPreview />
        </div>
      </div>
    </div>
  );
}
