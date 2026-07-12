"use client";

import { usePaper } from "@/context/PaperContext";
import { useRef } from "react";
import { getTemplate } from "@/lib/paperFormat";

export default function PaperPreview() {
  const { state } = usePaper();
  const previewRef = useRef<HTMLDivElement>(null);
  const tpl = getTemplate(state.paperTemplate);

  const questionCount = state.questions.length;
  const isRTL = tpl.dir === "rtl";

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
          <span>{tpl.obtainedMarksLabel}: {state.obtainedMarks || "___"}</span>
        </div>
      </div>

      <div className="overflow-x-auto -mx-3 sm:-mx-4 lg:mx-0">
        <div className="flex justify-center min-w-[360px] px-3 sm:px-4 lg:px-0">
          <div
            ref={previewRef}
            id="paper-preview"
            className="bg-white shadow-xl border border-slate-200 mx-auto print-font"
            dir={isRTL ? "rtl" : "ltr"}
            style={{
              width: "min(210mm, 100%)",
              minHeight: "min(297mm, 140vw)",
              padding: "clamp(8mm, 3vw, 20mm) clamp(6mm, 2vw, 15mm)",
              position: "relative",
            }}
          >
            {/* Header */}
            <div className={`flex items-center gap-x-6 sm:gap-x-10 mb-3 sm:mb-4 ${isRTL ? "flex-row" : ""}`}>
              <div className={`w-[55px] sm:w-[65px] lg:w-[80px] h-[55px] sm:h-[65px] lg:h-[80px] flex-shrink-0`}>
                {state.schoolLogo ? (
                  <img src={state.schoolLogo} alt="School Logo" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-300 text-[8px] sm:text-[10px] font-medium">
                    Logo
                  </div>
                )}
              </div>
              <div className="flex-1 text-center min-w-0 px-1 sm:px-2">
                <h1 className="text-sm sm:text-base lg:text-xl font-bold uppercase tracking-wide text-slate-900 break-words">
                  {state.schoolName || (
                    <span className="text-slate-300 font-normal normal-case">School Name</span>
                  )}
                </h1>
                {state.paperTitle && (
                  <h2 className="text-xs sm:text-sm lg:text-base font-semibold mt-0.5 sm:mt-1 text-slate-700 break-words">
                    {state.paperTitle}
                  </h2>
                )}
              </div>
            </div>

            {/* Decorative line */}
            <div className="border-t-2 border-b border-slate-900 mb-3 sm:mb-5" />

            {/* Student Info */}
            <div className="space-y-1.5 text-[10px] sm:text-[11px] lg:text-[12px] mb-4 sm:mb-6 text-slate-800">
              <div className="flex gap-x-6">
                {(state.studentNameLabel || tpl.studentNameLabel) ? (
                  <div className="flex-1">
                    <p className="border-b border-slate-800 pb-0.5">
                      <span className="font-semibold">{state.studentNameLabel || tpl.studentNameLabel}:</span>
                      <span className="inline-block min-w-[120px] sm:min-w-[180px]">&nbsp;</span>
                    </p>
                  </div>
                ) : null}
                {(state.fatherNameLabel || tpl.fatherNameLabel) ? (
                  <div className="flex-1">
                    <p className="border-b border-slate-800 pb-0.5">
                      <span className="font-semibold">{state.fatherNameLabel || tpl.fatherNameLabel}:</span>
                      <span className="inline-block min-w-[120px] sm:min-w-[180px]">&nbsp;</span>
                    </p>
                  </div>
                ) : null}
              </div>
              <div className="flex gap-x-6">
                {state.className ? (
                  <div className="flex-1">
                    <p className="border-b border-slate-800 pb-0.5">
                      <span className="font-semibold">{tpl.classLabel}:</span>
                      <span className="inline-block min-w-[80px] sm:min-w-[120px]">&nbsp;</span>
                      <span>{state.className}</span>
                    </p>
                  </div>
                ) : null}
                {state.time ? (
                  <div className="flex-1">
                    <p className="border-b border-slate-800 pb-0.5">
                      <span className="font-semibold">{tpl.timeLabel}:</span>
                      <span>{isRTL && state.time === "3 Hours" ? "3 گھنٹے" : state.time}</span>
                    </p>
                  </div>
                ) : null}
              </div>
              <div className="flex gap-x-6">
                {state.totalMarks ? (
                  <div className="flex-1">
                    <p className="border-b border-slate-800 pb-0.5">
                      <span className="font-semibold">{tpl.totalMarksLabel}:</span>
                      <span>{state.totalMarks}</span>
                    </p>
                  </div>
                ) : null}
                {state.obtainedMarks ? (
                  <div className="flex-1">
                    <p className="border-b border-slate-800 pb-0.5">
                      <span className="font-semibold">{tpl.obtainedMarksLabel}:</span>
                      <span>{state.obtainedMarks}</span>
                    </p>
                  </div>
                ) : null}
              </div>
              <div className="flex gap-x-6">
                {state.subject ? (
                  <div className="flex-1">
                    <p className="border-b border-slate-800 pb-0.5">
                      <span className="font-semibold">{tpl.subjectLabel}:</span>
                      <span>{state.subject}</span>
                    </p>
                  </div>
                ) : null}
                {state.date ? (
                  <div className="flex-1">
                    <p className="border-b border-slate-800 pb-0.5">
                      <span className="font-semibold">{tpl.dateLabel}:</span>
                      <span>{state.date}</span>
                    </p>
                  </div>
                ) : null}
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
                <div className={`space-y-3 sm:space-y-5 ${isRTL ? "text-right" : ""}`}>
                  {state.questions.map((question, index) => (
                    <div key={question.id} className="text-[11px] sm:text-[12px] lg:text-[13px] leading-relaxed text-slate-800">
                      <span className="font-bold text-slate-900">{tpl.numbering(index)}</span>
                      {!isRTL && <span> </span>}
                      <span dir={isRTL ? "rtl" : "auto"}>
                        {question.text || (
                          <span className="text-slate-300 italic">[Empty question]</span>
                        )}
                        {isRTL && <span> {tpl.questionMark}</span>}
                        {!isRTL && question.type === "truefalse" && (
                          <span className="ml-2 text-slate-400 text-[11px] font-medium">{tpl.trueFalseLabel}</span>
                        )}
                      </span>
                      {isRTL && question.type === "truefalse" && (
                        <span className="mr-2 text-slate-400 text-[11px] font-medium">{tpl.trueFalseLabel}</span>
                      )}
                      {question.type === "mcq" && (
                        <div className={`mt-1 ${isRTL ? "mr-4 text-right" : "ml-4"} text-slate-600 text-[11px] flex flex-wrap gap-x-5 gap-y-1`}>
                          {[0, 1, 2, 3].map((i) => (
                            <span key={i}>{tpl.mcqOption(i)} {question.options?.[i] || "__________"}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Signatures */}
            <div className={`flex ${isRTL ? "justify-between flex-row" : "justify-between"} mt-8 sm:mt-12 pt-4 border-t border-slate-800`}>
              <div className={`text-[10px] sm:text-[11px] lg:text-[12px] ${isRTL ? "text-right" : ""}`}>
                <p className="font-semibold text-slate-800">{tpl.teacherSignatureLabel}</p>
                <p className="border-b border-slate-600 min-w-[100px] sm:min-w-[160px] inline-block mt-1">{state.teacherSignature || "______________"}</p>
              </div>
              <div className={`text-[10px] sm:text-[11px] lg:text-[12px] ${isRTL ? "text-right" : ""}`}>
                <p className="font-semibold text-slate-800">{tpl.principalSignatureLabel}</p>
                <p className="border-b border-slate-600 min-w-[100px] sm:min-w-[160px] inline-block mt-1">{state.principalSignature || "______________"}</p>
              </div>
            </div>

            {/* Obtained Marks Footer */}
            <div className={`mt-4 text-[10px] sm:text-[11px] lg:text-[12px] ${isRTL ? "text-right" : ""}`}>
              <p className="font-semibold text-slate-800">{tpl.obtainedMarksLabel}: {state.obtainedMarks || "________"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
