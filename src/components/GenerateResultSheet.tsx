"use client";

import { useRef, useState } from "react";
import { useResult } from "@/context/ResultContext";
import { generateExcelBuffer, downloadExcel } from "@/lib/excelEngine";
import { generateResultSheetPDF, printElement } from "@/lib/reportEngine";
import { shareResultSheetPdfWhatsApp } from "@/lib/whatsapp";
import { ASSESSMENT_LABELS } from "@/types/result";
import type { AssessmentConfig } from "@/types/result";

export default function GenerateResultSheet() {
  const { state } = useResult();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [sendingPdf, setSendingPdf] = useState(false);

  const subjects = state.currentExam?.subjects || [];
  const config = state.currentExam?.assessmentConfig;
  const { results } = state;

  const enabledComponents = config
    ? (Object.keys(ASSESSMENT_LABELS) as (keyof AssessmentConfig)[]).filter((k) => config[k])
    : ["written" as keyof AssessmentConfig];

  const handleExportExcel = () => {
    if (results.length === 0) return;
    const headers = ["Roll No", "Student Name", "Father Name", ...subjects.map((s) => s.name), "Total Obtained", "Total Marks", "Percentage", "Grade", "Position", "Status"];
    const data = results.map((r) => [
      r.rollNo, r.studentName, r.fatherName,
      ...subjects.map((s) => r.subjectMarks[s.name] ?? "-"),
      r.totalObtained, r.totalMarks, r.passed ? `${r.percentage}%` : "/", r.grade, r.position === 0 ? "—" : r.position, r.passed ? "Pass" : "Fail",
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
          <button
            onClick={async () => {
              setSendingPdf(true);
              try {
                await shareResultSheetPdfWhatsApp(
                  state.currentExam?.name || "Result",
                  state.currentExam?.className || ""
                );
              } finally {
                setSendingPdf(false);
              }
            }}
            disabled={sendingPdf}
            className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-800 disabled:opacity-60 transition-all flex items-center gap-1.5"
          >
            {sendingPdf ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            )}
            {sendingPdf ? "Sending..." : "WhatsApp"}
          </button>
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
                <th className="text-left px-4 py-2.5 font-semibold text-slate-600 text-xs">Father Name</th>
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
                  <td className="px-4 py-2.5 text-slate-700">{r.fatherName || "—"}</td>
                  {subjects.map((s) => (
                    <td key={s.id} className="text-center px-2 py-2.5 text-slate-600">
                      {r.subjectMarks[s.name] ?? "-"}
                    </td>
                  ))}
                  <td className="text-center px-3 py-2.5 font-medium text-slate-700">{r.totalObtained}/{r.totalMarks}</td>
                  <td className="text-center px-3 py-2.5 font-medium text-slate-700">{r.passed ? `${r.percentage}%` : "/"}</td>
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
                  <td className="text-center px-3 py-2.5 text-slate-600">{r.position === 0 ? "—" : r.position}</td>
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
