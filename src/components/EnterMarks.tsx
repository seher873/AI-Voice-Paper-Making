"use client";

import { useState } from "react";
import { useResult } from "@/context/ResultContext";
import { ASSESSMENT_LABELS } from "@/types/result";
import type { AssessmentConfig } from "@/types/result";

export default function EnterMarks() {
  const { state, dispatch } = useResult();
  const subjects = state.currentExam?.subjects || [];
  const config = state.currentExam?.assessmentConfig;
  const [rollNo, setRollNo] = useState("");
  const [studentName, setStudentName] = useState("");
  const [marks, setMarks] = useState<Record<string, string>>({});

  const enabledComponents = config
    ? (Object.keys(ASSESSMENT_LABELS) as (keyof AssessmentConfig)[]).filter((k) => config[k])
    : ["written" as keyof AssessmentConfig];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNo || !studentName || subjects.length === 0) return;

    const subjectMarks: Record<string, number> = {};
    for (const sub of subjects) {
      const val = marks[sub.name];
      subjectMarks[sub.name] = val ? Number(val) : 0;
    }

    dispatch({ type: "ADD_STUDENT", payload: { rollNo, studentName, subjectMarks } });
    setRollNo("");
    setStudentName("");
    setMarks({});
  };

  if (!state.currentExam) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p className="font-medium">Create an exam first to enter marks</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-lg font-bold text-slate-800 mb-4">Enter Student Marks</h2>
      <p className="text-xs text-slate-400 mb-4">
        Exam: {state.currentExam.name} — {state.currentExam.className}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded-xl border border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Roll Number</label>
            <input value={rollNo} onChange={(e) => setRollNo(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40" placeholder="e.g. 1" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Student Name</label>
            <input value={studentName} onChange={(e) => setStudentName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40" placeholder="Full name" required />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500">Assessment Components:</span>
            {enabledComponents.map((k) => (
              <span key={k} className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                {ASSESSMENT_LABELS[k]}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {subjects.map((sub) => (
              <div key={sub.id}>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{sub.name} ({sub.totalMarks})</label>
                <input
                  type="number"
                  min={0}
                  max={sub.totalMarks}
                  value={marks[sub.name] ?? ""}
                  onChange={(e) => setMarks({ ...marks, [sub.name]: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  placeholder={`Max ${sub.totalMarks}`}
                />
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium text-sm transition-all">
          Add Student
        </button>
      </form>

      {state.students.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-bold text-slate-700 mb-3">Entered Students ({state.students.length})</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {state.students.map((s) => (
              <div key={s.rollNo} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 w-6">#{s.rollNo}</span>
                  <span className="text-sm font-medium text-slate-700">{s.studentName}</span>
                </div>
                <button
                  onClick={() => dispatch({ type: "REMOVE_STUDENT", payload: s.rollNo })}
                  className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg transition-all"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {state.students.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => dispatch({ type: "CALCULATE_RESULTS" })}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold text-sm transition-all"
          >
            Calculate Results
          </button>
        </div>
      )}
    </div>
  );
}
