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
      <div className="hidden lg:flex items-center justify-between mb-4 px-1">
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

      <div className="overflow-x-auto -mx-3 sm:-mx-4 lg:mx-0">
        <div className="flex justify-center min-w-[360px] px-3 sm:px-4 lg:px-0">
          <div
            ref={previewRef}
            id="paper-preview"
            className="bg-white shadow-xl border border-slate-200 mx-auto print-font"
            style={{
              width: "min(210mm, 100%)",
              minHeight: "min(297mm, 140vw)",
              padding: "clamp(8mm, 3vw, 20mm) clamp(6mm, 2vw, 15mm)",
              position: "relative",
            }}
          >
            {/* Header */}
            <div className="flex items-start mb-4 sm:mb-6">
              <div className="w-[50px] sm:w-[60px] lg:w-[75px] h-[50px] sm:h-[60px] lg:h-[75px] flex-shrink-0">
                {state.schoolLogo ? (
                  <img src={state.schoolLogo} alt="School Logo" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-300 text-[8px] sm:text-[10px] font-medium">
                    Logo
                  </div>
                )}
              </div>
              <div className="flex-1 text-center px-2 sm:px-4 min-w-0">
                <h1 className="text-sm sm:text-base lg:text-xl font-bold uppercase tracking-wide text-slate-900 truncate">
                  {state.schoolName || (
                    <span className="text-slate-300 font-normal normal-case">School Name</span>
                  )}
                </h1>
                {state.paperTitle && (
                  <h2 className="text-xs sm:text-sm lg:text-base font-semibold mt-0.5 sm:mt-1 text-slate-700 truncate">
                    {state.paperTitle}
                  </h2>
                )}
              </div>
              <div className="text-[9px] sm:text-[10px] lg:text-[11px] leading-relaxed text-slate-700 whitespace-nowrap">
                <p><span className="font-semibold">Time:</span> {state.time || "________"}</p>
                <p><span className="font-semibold">Marks:</span> {state.totalMarks || "________"}</p>
              </div>
            </div>

            {/* Decorative line */}
            <div className="border-t-2 border-b border-slate-900 mb-3 sm:mb-5" />

            {/* Student Info */}
            <div className="text-[10px] sm:text-[11px] lg:text-[12px] mb-4 sm:mb-6 space-y-1.5 sm:space-y-2 text-slate-800">
              <div className="flex flex-col sm:flex-row gap-1 sm:gap-10">
                <span>
                  <span className="font-semibold">{state.studentNameLabel}:</span>{" "}
                  <span className="border-b border-slate-800 inline-block min-w-[100px] sm:min-w-[180px]">&nbsp;</span>
                </span>
                <span>
                  <span className="font-semibold">{state.fatherNameLabel}:</span>{" "}
                  <span className="border-b border-slate-800 inline-block min-w-[100px] sm:min-w-[180px]">&nbsp;</span>
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-1 sm:gap-10">
                {state.className && (
                  <span>
                    <span className="font-semibold">Class:</span>{" "}
                    <span className="border-b border-slate-800 inline-block min-w-[60px] sm:min-w-[100px]">{state.className}</span>
                  </span>
                )}
                {state.subject && (
                  <span>
                    <span className="font-semibold">Subject:</span>{" "}
                    <span className="border-b border-slate-800 inline-block min-w-[60px] sm:min-w-[100px]">{state.subject}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Questions */}
            <div className="mb-6 sm:mb-8 min-h-[120px] sm:min-h-[200px]">
              {questionCount === 0 ? (
                <div className="flex items-center justify-center h-[120px] sm:h-[200px] border-2 border-dashed border-slate-200 rounded-xl">
                  <div className="text-center">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-slate-200 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-xs sm:text-sm text-slate-300 font-medium">Questions will appear here</p>
                  </div>
                </div>
              ) : (
                <ol className="list-none space-y-3 sm:space-y-5">
                  {state.questions.map((question, index) => (
                    <li key={question.id} className="text-[11px] sm:text-[12px] lg:text-[13px] leading-relaxed text-slate-800">
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
            <div style={{ position: "absolute", bottom: "clamp(8mm, 3vw, 20mm)", left: "clamp(6mm, 2vw, 15mm)", right: "clamp(6mm, 2vw, 15mm)" }}>
              <div className="border-t border-slate-800 pt-2 sm:pt-4">
                <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0 text-[9px] sm:text-[10px] lg:text-[11px] text-slate-700">
                  <div>
                    <p className="font-semibold text-slate-800">Teacher&apos;s Signature</p>
                    <p className="border-b border-slate-600 min-w-[80px] sm:min-w-[140px] inline-block mt-0.5 sm:mt-1">
                      {state.footer.teacherSignature}&nbsp;
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Principal&apos;s Signature</p>
                    <p className="border-b border-slate-600 min-w-[80px] sm:min-w-[140px] inline-block mt-0.5 sm:mt-1">
                      {state.footer.principalSignature}&nbsp;
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className="font-semibold text-slate-800">Total Marks</p>
                    <p className="font-bold text-sm sm:text-base text-slate-900 mt-0.5">
                      {totalMarks}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
