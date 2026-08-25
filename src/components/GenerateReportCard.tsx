"use client";

import { useResult } from "@/context/ResultContext";
import { printElement } from "@/lib/reportEngine";
import { shareResultWhatsApp, shareAllResultsWhatsApp } from "@/lib/whatsapp";

export default function GenerateReportCard() {
  const { state, dispatch } = useResult();
  const { results } = state;
  const selectedStudent = results.find((r) => r.rollNo === state.reportCardRollNo);

  const setReportState = (rollNo: string, remarks: string) =>
    dispatch({ type: "SET_REPORT_CARD_STATE", payload: { rollNo, remarks } });

  const handlePositionChange = (rollNo: string, position: string) => {
    if (position.trim() === "") {
      dispatch({ type: "UPDATE_STUDENT_RESULT", payload: { rollNo, position: 0, overridden: false } });
      return;
    }
    const p = parseInt(position, 10);
    if (!isNaN(p) && p > 0) {
      dispatch({ type: "UPDATE_STUDENT_RESULT", payload: { rollNo, position: p, overridden: true } });
    }
  };

  return (
    <div className="space-y-4">
      {results.length > 0 ? (
        <>
          {/* Share All */}
          <button
            onClick={() => shareAllResultsWhatsApp(results, state.currentExam, state.schoolName)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all active:scale-[0.98]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Share All Results on WhatsApp
          </button>

          {/* Student Selector */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-700">Student</h3>
            <select
              value={state.reportCardRollNo}
              onChange={(e) => setReportState(e.target.value, "")}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            >
              <option value="">Choose a student</option>
              {results.map((r) => (
                <option key={r.rollNo} value={r.rollNo}>
                  {r.rollNo}. {r.studentName}
                </option>
              ))}
            </select>
          </div>

          {/* Remarks & Export */}
          {selectedStudent && (
            <>
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-slate-700">Teacher Remarks</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Position / Rank (override)</label>
                  <input
                    type="number"
                    min="0"
                    value={selectedStudent.position || ""}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handlePositionChange(selectedStudent.rollNo, e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Leave empty to auto-assign on next calculate</p>
                </div>
                <textarea
                  value={state.reportCardRemarks}
                  onChange={(e) => setReportState(state.reportCardRollNo, e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  placeholder="Write remarks or use suggestion"
                />
                <div className="flex flex-wrap gap-1.5">
                  {["Excellent Performance", "Very Good Progress", "Needs Improvement", "Outstanding in Mathematics", "Good Reading Skills", "Requires More Practice"].map((r) => (
                    <button
                      key={r}
                      onClick={() => setReportState(state.reportCardRollNo, r)}
                      className="px-2.5 py-1 text-[10px] bg-slate-100 text-slate-600 rounded-full hover:bg-indigo-100 hover:text-indigo-600 transition-all font-medium"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => printElement("report-card-preview-content")}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all"
                >
                  Print
                </button>
                <button
                  onClick={async () => {
                    const el = document.getElementById("report-card-preview-content");
                    if (!el) return;
                    const { generateReportCardPDF } = await import("@/lib/reportEngine");
                    await generateReportCardPDF(el as HTMLDivElement, selectedStudent.studentName, state.currentExam?.name || "Report");
                  }}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all"
                >
                  PDF
                </button>
                <button
                  onClick={() => shareResultWhatsApp(selectedStudent, state.currentExam, state.schoolName)}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </button>
              </div>
            </>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-200">
          <p className="font-medium">No results calculated yet</p>
          <p className="text-xs mt-2">Calculate results first to generate report cards</p>
        </div>
      )}
    </div>
  );
}
