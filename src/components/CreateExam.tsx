"use client";

import { useState } from "react";
import { useResult } from "@/context/ResultContext";
import { DEFAULT_SUBJECTS, ASSESSMENT_PRESETS, ASSESSMENT_LABELS, DEFAULT_ASSESSMENT } from "@/types/result";
import type { AssessmentConfig } from "@/types/result";

export default function CreateExam() {
  const { state, dispatch } = useResult();
  const [form, setForm] = useState({
    name: "",
    session: "",
    className: "",
    section: "",
    date: "",
  });
  const [assessment, setAssessment] = useState<AssessmentConfig>({ ...DEFAULT_ASSESSMENT });
  const [presetLabel, setPresetLabel] = useState("Custom");

  const applyPreset = (label: string) => {
    const preset = ASSESSMENT_PRESETS.find((p) => p.label === label);
    if (preset) {
      setAssessment({ ...preset.config });
      setPresetLabel(label);
    }
  };

  const toggleComponent = (key: keyof AssessmentConfig) => {
    setAssessment((prev) => ({ ...prev, [key]: !prev[key] }));
    setPresetLabel("Custom");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.session || !form.className) return;

    const exam = {
      id: crypto.randomUUID(),
      name: form.name,
      session: form.session,
      className: form.className,
      section: form.section,
      date: form.date,
      subjects: DEFAULT_SUBJECTS.map((s, i) => ({
        ...s,
        id: `subj-${i}-${crypto.randomUUID().slice(0, 4)}`,
      })),
      assessmentConfig: assessment,
    };

    dispatch({ type: "CREATE_EXAM", payload: exam });
    setForm({ name: "", session: "", className: "", section: "", date: "" });
    setAssessment({ ...DEFAULT_ASSESSMENT });
    setPresetLabel("Custom");
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-bold text-slate-800 mb-4">Create New Exam</h2>

      {state.exams.length > 0 && (
        <div className="mb-6 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
          <p className="text-sm font-semibold text-indigo-700 mb-2">Current Exam</p>
          <p className="text-sm text-indigo-600">
            {state.currentExam?.name} — {state.currentExam?.className} ({state.currentExam?.session})
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Exam Name</label>
            <select
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              required
            >
              <option value="">Select Exam Type</option>
              <option value="Monthly Test">Monthly Test</option>
              <option value="Unit Test">Unit Test</option>
              <option value="Mid-Term Exam">Mid-Term Exam</option>
              <option value="Final Term Exam">Final Term Exam</option>
              <option value="Annual Examination">Annual Examination</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Academic Session</label>
            <select
              value={form.session}
              onChange={(e) => setForm({ ...form, session: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              required
            >
              <option value="">Select Session</option>
              <option value="2025-2026">2025-2026</option>
              <option value="2026-2027">2026-2027</option>
              <option value="2027-2028">2027-2028</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Class</label>
            <select
              value={form.className}
              onChange={(e) => setForm({ ...form, className: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              required
            >
              <option value="">Select Class</option>
              {[1,2,3,4,5,6,7,8].map((n) => (
                <option key={n} value={`Class ${n}`}>Class {n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Section</label>
            <select
              value={form.section}
              onChange={(e) => setForm({ ...form, section: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            >
              <option value="">Select Section</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Exam Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>
        </div>

        {/* Assessment Settings */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <label className="block text-xs font-bold text-slate-600 mb-3 uppercase">Assessment Components</label>

          <div className="mb-3">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Quick Preset</label>
            <div className="flex gap-1.5 flex-wrap">
              {ASSESSMENT_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p.label)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    presetLabel === p.label
                      ? "bg-indigo-100 border-indigo-300 text-indigo-700"
                      : "bg-white border-slate-200 text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {(Object.keys(ASSESSMENT_LABELS) as (keyof AssessmentConfig)[]).map((key) => (
              <label
                key={key}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                  assessment[key]
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                    : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={assessment[key]}
                  onChange={() => toggleComponent(key)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                {ASSESSMENT_LABELS[key]}
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold text-sm"
        >
          Create Exam
        </button>
      </form>

      {state.exams.length > 1 && (
        <div className="mt-8">
          <h3 className="text-sm font-bold text-slate-700 mb-3">Previous Exams</h3>
          <div className="space-y-2">
            {state.exams.slice(0, -1).reverse().map((exam) => (
              <div
                key={exam.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-700">{exam.name}</p>
                  <p className="text-xs text-slate-400">{exam.className} — {exam.session}</p>
                </div>
                <button
                  onClick={() => dispatch({ type: "SET_CURRENT_EXAM", payload: exam })}
                  className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                >
                  Load
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
