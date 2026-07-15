"use client";

import { useResult } from "@/context/ResultContext";
import { printElement } from "@/lib/reportEngine";

export default function GenerateReportCard() {
  const { state, dispatch } = useResult();
  const { results } = state;
  const selectedStudent = results.find((r) => r.rollNo === state.reportCardRollNo);

  const setReportState = (rollNo: string, remarks: string) =>
    dispatch({ type: "SET_REPORT_CARD_STATE", payload: { rollNo, remarks } });

  const handlePositionChange = (rollNo: string, position: string) => {
    const p = parseInt(position, 10);
    if (!isNaN(p) && p > 0) {
      dispatch({ type: "UPDATE_STUDENT_RESULT", payload: { rollNo, position: p } });
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        dispatch({ type: "SET_SCHOOL_INFO", payload: { name: state.schoolName, logo: ev.target?.result as string } });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      {results.length > 0 ? (
        <>
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
                    min="1"
                    value={selectedStudent.position}
                    onChange={(e) => handlePositionChange(selectedStudent.rollNo, e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
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
