"use client";

import HeaderSection from "./HeaderSection";
import QuestionEditor from "./QuestionEditor";
import TemplateSection from "./TemplateSection";
import PaperPreview from "./PaperPreview";
import ExportBar from "./ExportBar";
import ResultManagement from "./ResultManagement";
import ReportCardPreview from "./ReportCardPreview";
import GenerateResultSheet from "./GenerateResultSheet";
import UpgradeBanner from "./UpgradeBanner";
import SchoolSetup from "./SchoolSetup";
import BackupPanel from "./BackupPanel";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { usePaper } from "@/context/PaperContext";
import { useResult } from "@/context/ResultContext";
import { TEMPLATES } from "@/lib/paperFormat";
import { PLANS, setPlan } from "@/lib/subscription";
import { THEME_PRESETS, DEFAULT_THEME } from "@/types/result";
import type { PaperTemplate } from "@/lib/paperFormat";
import type { PlanId } from "@/lib/subscription";
import type { ThemeColors } from "@/types/result";

export default function Dashboard() {
  const { state, dispatch } = usePaper();
  const resultCtx = useResult();
  const [plan, setPlanState] = useState(PLANS[2]);
  const [mode, setMode] = useState<"paper" | "results">("paper");
  const [activeTab, setActiveTab] = useState<"header" | "questions" | "template">("header");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSchoolInfo, setShowSchoolInfo] = useState(false);
  const [lockedPlan, setLockedPlan] = useState<"paper" | "results" | null>(null);
  const [schoolReady, setSchoolReady] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("profiles").select("school_id").eq("id", user.id).then(({ data }) => {
        setSchoolReady(data && data.length > 0);
      });
    });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const planParam = params.get("plan");
    if (planParam === "paper" || planParam === "results") {
      setLockedPlan(planParam);
      const lockedPlanObj = PLANS.find((p) => p.id === planParam) || PLANS[2];
      setPlanState(lockedPlanObj);
      setMode(planParam);
      return;
    }
    const stored = localStorage.getItem("subscription_plan") as PlanId | null;
    const p = PLANS.find((x) => x.id === stored) || PLANS[2];
    setPlanState(p);
    if (!p.features.paper) setMode("results");
    if (!p.features.results) setMode("paper");
  }, []);

  const switchPlan = (id: PlanId) => {
    setPlan(id);
    const newPlan = PLANS.find((p) => p.id === id) || PLANS[2];
    setPlanState(newPlan);
    if (!newPlan.features.paper && mode === "paper") setMode("results");
    if (!newPlan.features.results && mode === "results") setMode("paper");
  };

  const availableModes = ["paper", "results"].filter((m) =>
    plan.features[m as "paper" | "results"]
  ) as ("paper" | "results")[];

  const tabs = [
    { id: "header" as const, label: "Header", icon: "M4 6h16M4 12h16M4 18h16" },
    { id: "questions" as const, label: "Questions", icon: "M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2m4 9l2 2 4-4" },
    { id: "template" as const, label: "Template", icon: "M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" },
  ];

  if (schoolReady === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100">
        <div className="flex items-center gap-3 text-slate-500">
          <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeWidth={3} className="opacity-25" />
            <path d="M4 12a8 8 0 018-8" strokeWidth={3} className="opacity-75" />
          </svg>
          <span className="font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  if (!schoolReady) {
    return <SchoolSetup onComplete={(id) => setSchoolReady(true)} />;
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gradient-to-br from-slate-50 to-indigo-50/50">
      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between bg-white border-b border-slate-200 px-4 py-2 z-30 shadow-sm">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 min-h-[48px] px-2 text-slate-700 hover:text-indigo-600 active:scale-[0.96] transition-all rounded-xl"
          aria-label="Toggle menu"
        >
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <rect x="2" y="3" width="20" height="18" rx="3" stroke="currentColor" fill="none" />
            <path strokeLinecap="round" d="M7 8h10M7 12h10M7 16h10" />
          </svg>
          <span className="font-bold text-sm tracking-tight truncate max-w-[160px]">
            {mode === "paper" ? "AI Voice Paper" : "Result Management"}
          </span>
        </button>
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
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight truncate">
                  {mode === "paper" ? "AI Voice Paper" : "Result Management"}
                </h1>
                <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-white/15 text-indigo-200 leading-none">
                  {plan.label}
                </span>
              </div>
              <p className="text-[10px] text-indigo-200 font-medium">
                {mode === "paper" ? "School Paper Builder" : "Results & Report Cards"}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <button
                  onClick={() => setShowSchoolInfo(!showSchoolInfo)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    showSchoolInfo ? "bg-white/20 text-white" : "text-indigo-200 hover:bg-white/10 hover:text-white"
                  }`}
                  title="School Info"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>School</span>
                </button>
              {!lockedPlan && availableModes.length > 1 && (
                <button
                  onClick={() => setMode(mode === "paper" ? "results" : "paper")}
                  className={`hidden lg:inline-flex px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    mode === "results"
                      ? "bg-white/20 text-white"
                      : "bg-white/10 text-indigo-200 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  {mode === "paper" ? "Results" : "Papers"}
                </button>
              )}
              {!lockedPlan && (
                <div className="relative group hidden lg:block">
                  <button
                    className="px-2 py-1.5 rounded-lg text-xs font-bold text-indigo-200 hover:bg-white/10 hover:text-white transition-all"
                  >
                    {plan.label[0]}
                  </button>
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                  {PLANS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => switchPlan(p.id)}
                      className={`w-full text-left px-4 py-2 text-xs font-medium transition-all hover:bg-slate-50 ${
                        plan.id === p.id
                          ? "text-indigo-600 bg-indigo-50"
                          : "text-slate-600"
                      }`}
                    >
                      <span className="font-semibold">{p.label}</span>
                      <span className="block text-[10px] text-slate-400">{p.description}</span>
                    </button>
                  ))}
                </div>
              </div>
              )}
          </div>
          </div>
        </div>

        {/* School Info (all modes) */}
        {showSchoolInfo && (
          <div className="px-3 sm:px-4 py-3 bg-white border-b border-slate-200 space-y-3">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold mb-1" style={{ color: resultCtx.state.schoolName ? "#475569" : "#dc2626" }}>
                  School Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={resultCtx.state.schoolName}
                  onChange={(e) => {
                    resultCtx.dispatch({ type: "SET_SCHOOL_INFO", payload: { name: e.target.value, logo: resultCtx.state.schoolLogo } });
                    dispatch({ type: "SET_SCHOOL_NAME", payload: e.target.value });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  placeholder="e.g. Sunshine Public School"
                />
              </div>
              <div className="flex-shrink-0">
                <label className="block text-xs font-semibold mb-1" style={{ color: resultCtx.state.schoolLogo ? "#475569" : "#dc2626" }}>
                  Logo <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  {resultCtx.state.schoolLogo ? (
                    <div className="relative w-16 h-16 rounded-xl border-2 border-slate-300 overflow-hidden flex-shrink-0">
                      <img src={resultCtx.state.schoolLogo} alt="Logo" className="w-full h-full object-contain" />
                      <button
                        onClick={() => { resultCtx.dispatch({ type: "SET_SCHOOL_INFO", payload: { name: resultCtx.state.schoolName, logo: "" } }); dispatch({ type: "SET_SCHOOL_LOGO", payload: null }); }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow-md hover:bg-red-600"
                      >
                        &times;
                      </button>
                    </div>
                  ) : (
                    <label className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all flex-shrink-0">
                      <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <input type="file" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) { const r = new FileReader(); r.onload = (ev) => { const logo = ev.target?.result as string; resultCtx.dispatch({ type: "SET_SCHOOL_INFO", payload: { name: resultCtx.state.schoolName, logo } }); dispatch({ type: "SET_SCHOOL_LOGO", payload: logo }); }; r.readAsDataURL(file); }
                      }} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Theme Colors */}
            <div className="border-t border-slate-100 pt-3">
              <label className="block text-xs font-semibold text-slate-500 mb-2">Theme Colors</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => resultCtx.dispatch({ type: "SET_THEME_COLORS", payload: preset.colors })}
                    className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                      resultCtx.state.themeColors.primary === preset.colors.primary &&
                      resultCtx.state.themeColors.accent === preset.colors.accent
                        ? "ring-2 ring-offset-1 ring-indigo-500 scale-105"
                        : "opacity-70 hover:opacity-100"
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${preset.colors.primary}, ${preset.colors.accent})`,
                      color: "#fff",
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-3">
                {(["primary", "accent", "text", "highlight"] as (keyof ThemeColors)[]).map((k) => (
                  <div key={k}>
                    <label className="block text-[10px] font-medium text-slate-400 mb-0.5 capitalize">{k}</label>
                    <input
                      type="color"
                      value={resultCtx.state.themeColors[k]}
                      onChange={(e) =>
                        resultCtx.dispatch({
                          type: "SET_THEME_COLORS",
                          payload: { ...resultCtx.state.themeColors, [k]: e.target.value },
                        })
                      }
                      className="w-full h-8 rounded cursor-pointer border border-slate-300"
                    />
                  </div>
                ))}
              </div>
            </div>
            <BackupPanel />
          </div>
        )}

        {/* Template Selector */}
        {mode === "paper" && plan.features.paper && (
          <div className="px-3 sm:px-4 pt-4 pb-3 bg-slate-50/80 border-b border-slate-200">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Paper Template</label>
            <div className="relative">
              <select
                value={state.paperTemplate}
                onChange={(e) => {
                  dispatch({ type: "SET_PAPER_TEMPLATE", payload: e.target.value as PaperTemplate });
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
        )}

        {/* Tabs */}
        {mode === "paper" && plan.features.paper && (
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
        )}

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          {mode === "paper" && !plan.features.paper && <UpgradeBanner feature="Paper Generator" />}
          {mode === "results" && !plan.features.results && <UpgradeBanner feature="Result Management" />}
          {mode === "paper" && plan.features.paper && activeTab === "header" && <HeaderSection />}
          {mode === "paper" && plan.features.paper && activeTab === "questions" && <QuestionEditor />}
          {mode === "paper" && plan.features.paper && activeTab === "template" && <TemplateSection />}
          {mode === "results" && plan.features.results && <ResultManagement />}
        </div>

        {/* Export */}
        {mode === "paper" && plan.features.paper && (
          <div className="flex-shrink-0 bg-white border-t border-slate-200 px-3 sm:px-4 py-3">
            <ExportBar />
          </div>
        )}
      </div>

      {/* Right Panel - Preview */}
      {mode === "paper" && plan.features.paper && (
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-100 to-slate-50 p-3 sm:p-4 lg:p-6">
          <div className="max-w-[210mm] mx-auto">
            <PaperPreview />
          </div>
        </div>
      )}
      {mode === "results" && plan.features.results && resultCtx.activeTab === "report-cards" && (
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-100 to-slate-50 p-3 sm:p-4 lg:p-6">
          <div className="max-w-[210mm] mx-auto">
            <div id="report-card-preview-content">
              <ReportCardPreview
                student={resultCtx.state.results.find((r) => r.rollNo === resultCtx.state.reportCardRollNo) || null}
                exam={resultCtx.state.currentExam}
                schoolName={resultCtx.state.schoolName}
                schoolLogo={resultCtx.state.schoolLogo}
                remarks={resultCtx.state.reportCardRemarks}
                themeColors={resultCtx.state.themeColors}
              />
            </div>
          </div>
        </div>
      )}
      {mode === "results" && plan.features.results && resultCtx.activeTab === "result-sheet" && (
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-100 to-slate-50 p-3 sm:p-4 lg:p-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm">
            <GenerateResultSheet />
          </div>
        </div>
      )}
      {mode === "results" && plan.features.results && resultCtx.activeTab !== "report-cards" && resultCtx.activeTab !== "result-sheet" && (
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-100 to-slate-50 p-3 sm:p-4 lg:p-6 flex items-center justify-center">
          <div className="text-center text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm font-medium">Result Management</p>
            <p className="text-xs mt-1">Manage exams, marks, and report cards</p>
          </div>
        </div>
      )}
    </div>
  );
}
