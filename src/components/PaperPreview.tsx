"use client";

import { usePaper } from "@/context/PaperContext";
import { useRef } from "react";

export default function PaperPreview() {
  const { state } = usePaper();
  const previewRef = useRef<HTMLDivElement>(null);

  const questionCount = state.questions.length;
  const totalMarks = state.footer.total || state.totalMarks || "___";

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-base font-semibold text-slate-700 flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Live Preview
        </h2>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {questionCount} question{questionCount !== 1 ? "s" : ""}
          </span>
          <span className="text-slate-300">|</span>
          <span>{totalMarks} marks</span>
        </div>
      </div>

      <div
        ref={previewRef}
        id="paper-preview"
        className="bg-white shadow-xl border border-slate-200 mx-auto print-font"
        style={{
          width: "210mm",
          minHeight: "297mm",
          padding: "20mm 15mm",
          position: "relative",
        }}
      >
        {/* Header */}
        <div className="flex items-start mb-6">
          <div className="w-[75px] h-[75px] flex-shrink-0">
            {state.schoolLogo ? (
              <img src={state.schoolLogo} alt="School Logo" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-300 text-[10px] font-medium">
                Logo
              </div>
            )}
          </div>
          <div className="flex-1 text-center px-4">
            <h1 className="text-xl font-bold uppercase tracking-wide text-slate-900">
              {state.schoolName || (
                <span className="text-slate-300 font-normal normal-case">School Name</span>
              )}
            </h1>
            {state.paperTitle && (
              <h2 className="text-base font-semibold mt-1 text-slate-700">
                {state.paperTitle}
              </h2>
            )}
          </div>
          <div className="text-right text-[11px] leading-relaxed text-slate-700 whitespace-nowrap">
            <p><span className="font-semibold">Time:</span> {state.time || "________"}</p>
            <p><span className="font-semibold">Marks:</span> {state.totalMarks || "________"}</p>
          </div>
        </div>

        {/* Decorative line */}
        <div className="border-t-2 border-b border-slate-900 mb-5" />

        {/* Student Info */}
        <div className="text-[12px] mb-6 space-y-2 text-slate-800">
          <div className="flex gap-10">
            <span>
              <span className="font-semibold">{state.studentNameLabel}:</span>{" "}
              <span className="border-b border-slate-800 inline-block min-w-[180px]">&nbsp;</span>
            </span>
            <span>
              <span className="font-semibold">{state.fatherNameLabel}:</span>{" "}
              <span className="border-b border-slate-800 inline-block min-w-[180px]">&nbsp;</span>
            </span>
          </div>
          <div className="flex gap-10">
            {state.className && (
              <span>
                <span className="font-semibold">Class:</span>{" "}
                <span className="border-b border-slate-800 inline-block min-w-[100px]">{state.className}</span>
              </span>
            )}
            {state.subject && (
              <span>
                <span className="font-semibold">Subject:</span>{" "}
                <span className="border-b border-slate-800 inline-block min-w-[100px]">{state.subject}</span>
              </span>
            )}
          </div>
        </div>

        {/* Questions */}
        <div className="mb-8 min-h-[200px]">
          {questionCount === 0 ? (
            <div className="flex items-center justify-center h-[200px] border-2 border-dashed border-slate-200 rounded-xl">
              <div className="text-center">
                <svg className="w-10 h-10 text-slate-200 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm text-slate-300 font-medium">Questions will appear here</p>
              </div>
            </div>
          ) : (
            <ol className="list-none space-y-5">
              {state.questions.map((question, index) => (
                <li key={question.id} className="text-[13px] leading-relaxed text-slate-800">
                  <span className="font-bold text-slate-900">Q{index + 1}.</span>{" "}
                  {question.text || (
                    <span className="text-slate-300 italic">[Empty question]</span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Footer */}
        <div style={{ position: "absolute", bottom: "20mm", left: "15mm", right: "15mm" }}>
          <div className="border-t border-slate-800 pt-4">
            <div className="flex justify-between text-[11px] text-slate-700">
              <div>
                <p className="font-semibold text-slate-800">Teacher&apos;s Signature</p>
                <p className="border-b border-slate-600 min-w-[140px] inline-block mt-1">
                  {state.footer.teacherSignature}&nbsp;
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-800">Principal&apos;s Signature</p>
                <p className="border-b border-slate-600 min-w-[140px] inline-block mt-1">
                  {state.footer.principalSignature}&nbsp;
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-800">Total Marks</p>
                <p className="font-bold text-base text-slate-900 mt-0.5">
                  {totalMarks}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
