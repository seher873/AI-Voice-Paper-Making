"use client";

import { useRef } from "react";
import { useResult } from "@/context/ResultContext";
import { generateExcelBuffer, downloadExcel } from "@/lib/excelEngine";
import { generateResultSheetPDF, printElement } from "@/lib/reportEngine";
import { ASSESSMENT_LABELS } from "@/types/result";
import type { AssessmentConfig } from "@/types/result";

export default function GenerateResultSheet() {
  const { state } = useResult();
  const sheetRef = useRef<HTMLDivElement>(null);

  const subjects = state.currentExam?.subjects || [];
  const config = state.currentExam?.assessmentConfig;
  const { results } = state;

  const enabledComponents = config
    ? (Object.keys(ASSESSMENT_LABELS) as (keyof AssessmentConfig)[]).filter((k) => config[k])
    : ["written" as keyof AssessmentConfig];

  const handleExportExcel = () => {
    if (results.length === 0) return;
    const headers = ["Roll No", "Student Name", ...subjects.map((s) => s.name), "Total Obtained", "Total Marks", "Percentage", "Grade", "Position", "Status"];
    const data = results.map((r) => [
      r.rollNo, r.studentName,
      ...subjects.map((s) => r.subjectMarks[s.name] ?? "-"),
      r.totalObtained, r.totalMarks, `${r.percentage}%`, r.grade, r.position, r.passed ? "Pass" : "Fail",
    ]);
    const buffer = generateExcelBuffer(headers, data, "Result Sheet");
    downloadExcel(buffer, `${state.currentExam?.name || "result"}-result-sheet.xlsx`);
  };

  const handlePrint = () => {
    if (results.length === 0) return;
    printElement("result-sheet-content");
  };

  const handlePDF = async () => {
    if (!sheetRef.current || results.length === 0) return;
    await generateResultSheetPDF(
      sheetRef.current,
      state.currentExam?.name || "Result",
      state.currentExam?.className || ""
    );
  };

  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p className="font-medium">No results calculated yet</p>
        <p className="text-xs mt-2">Add students and calculate results first</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800">Result Sheet</h2>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all">Print</button>
          <button onClick={handlePDF} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-all">PDF</button>
          <button onClick={handleExportExcel} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-all">Excel</button>
        </div>
      </div>

      {enabledComponents.length > 0 && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xs font-semibold text-slate-500">Assessment:</span>
          {enabledComponents.map((k) => (
            <span key={k} className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
              {ASSESSMENT_LABELS[k]}
            </span>
          ))}
        </div>
      )}

      <div
        id="result-sheet-content"
        ref={sheetRef}
        className="bg-white rounded-xl border border-slate-200 overflow-hidden"
      >
        <div className="p-6 border-b border-slate-200 text-center">
          <h3 className="text-lg font-bold text-slate-800">
            {state.currentExam?.name || "Examination"} — {state.currentExam?.className || ""}
          </h3>
          <p className="text-sm text-slate-500">{state.currentExam?.session} | {state.currentExam?.section || "All Sections"}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-4 py-2.5 font-semibold text-slate-600 text-xs">Roll No</th>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-600 text-xs">Student Name</th>
                {subjects.map((s) => (
                  <th key={s.id} className="text-center px-2 py-2.5 font-semibold text-slate-600 text-xs">{s.name}</th>
                ))}
                <th className="text-center px-3 py-2.5 font-semibold text-slate-600 text-xs">Total</th>
                <th className="text-center px-3 py-2.5 font-semibold text-slate-600 text-xs">%</th>
                <th className="text-center px-3 py-2.5 font-semibold text-slate-600 text-xs">Grade</th>
                <th className="text-center px-3 py-2.5 font-semibold text-slate-600 text-xs">Pos</th>
                <th className="text-center px-3 py-2.5 font-semibold text-slate-600 text-xs">Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={r.rollNo} className={`${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"} border-t border-slate-100`}>
                  <td className="px-4 py-2.5 font-medium text-slate-700">{r.rollNo}</td>
                  <td className="px-4 py-2.5 text-slate-700">{r.studentName}</td>
                  {subjects.map((s) => (
                    <td key={s.id} className="text-center px-2 py-2.5 text-slate-600">
                      {r.subjectMarks[s.name] ?? "-"}
                    </td>
                  ))}
                  <td className="text-center px-3 py-2.5 font-medium text-slate-700">{r.totalObtained}/{r.totalMarks}</td>
                  <td className="text-center px-3 py-2.5 font-medium text-slate-700">{r.percentage}%</td>
                  <td className="text-center px-3 py-2.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                      r.grade === "A+" ? "bg-emerald-100 text-emerald-700" :
                      r.grade === "A" ? "bg-blue-100 text-blue-700" :
                      r.grade === "B" ? "bg-indigo-100 text-indigo-700" :
                      r.grade === "C" ? "bg-amber-100 text-amber-700" :
                      r.grade === "D" ? "bg-orange-100 text-orange-700" :
                      "bg-red-100 text-red-700"
                    }`}>{r.grade}</span>
                  </td>
                  <td className="text-center px-3 py-2.5 text-slate-600">{r.position}</td>
                  <td className="text-center px-3 py-2.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                      r.passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    }`}>{r.passed ? "Pass" : "Fail"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
