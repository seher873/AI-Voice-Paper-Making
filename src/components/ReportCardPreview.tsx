import { forwardRef } from "react";
import type { StudentResult, Exam, AssessmentConfig, ThemeColors } from "@/types/result";
import { ASSESSMENT_LABELS } from "@/types/result";

interface Props {
  student: StudentResult | null;
  exam: Exam | null;
  schoolName: string;
  schoolLogo: string;
  remarks: string;
  themeColors: ThemeColors;
}

const ReportCardPreview = forwardRef<HTMLDivElement, Props>(
  ({ student, exam, schoolName, schoolLogo, remarks, themeColors: c }, ref) => {
    const subjects = exam?.subjects || [];
    const config = exam?.assessmentConfig;
    const enabledComponents = config
      ? (Object.keys(ASSESSMENT_LABELS) as (keyof AssessmentConfig)[]).filter((k) => config[k])
      : ["written" as keyof AssessmentConfig];

    return (
      <div ref={ref} className="bg-white rounded-xl border-2 shadow-sm overflow-hidden" style={{ borderColor: c.accent }}>
        {/* School Header */}
        <div className="text-center px-6 pt-5 pb-3" style={{ background: `linear-gradient(135deg, ${c.primary}, ${c.primary}dd)` }}>
          {schoolLogo && (
            <div className="flex justify-center mb-3">
              <div className="p-2.5 bg-white/95 rounded-full shadow-sm">
                <img src={schoolLogo} alt="School Logo" className="h-20 w-auto object-contain" />
              </div>
            </div>
          )}
          {schoolName && (
            <h1 className="text-2xl font-bold text-white mb-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>{schoolName}</h1>
          )}
          <h2 className="text-base font-bold text-white/90">{exam?.name || "Examination"} — Report Card</h2>
          <p className="text-xs text-white/70">{exam?.session || "Session"} | {exam?.className || "Class"}</p>
        </div>

        {!student ? (
          <div className="py-12 text-center bg-white">
            <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: c.text }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-medium" style={{ color: c.text }}>Select a student from the left panel</p>
            <p className="text-xs mt-1" style={{ color: c.text }}>School name & logo appear live above</p>
          </div>
        ) : (
          <div className="p-5 bg-white">
            {/* Info - compact side by side */}
            <div className="flex gap-4 items-start mb-3">
              <div className="flex-1 space-y-1 text-sm">
                <div className="flex gap-2">
                  <span className="font-semibold" style={{ color: c.primary, minWidth: 100 }}>Student Name:</span>
                  <span className="font-medium" style={{ color: c.text }}>{student.studentName}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold" style={{ color: c.primary, minWidth: 100 }}>Class:</span>
                  <span className="font-medium" style={{ color: c.text }}>{exam?.className}</span>
                </div>
              </div>
              <div className="flex-1 space-y-1 text-sm text-right">
                <div className="flex gap-2 justify-end">
                  <span className="font-semibold" style={{ color: c.primary }}>Roll No:</span>
                  <span className="font-bold" style={{ fontFamily: "'Playfair Display', 'Georgia', serif", fontSize: "15px", color: c.accent }}>{student.rollNo}</span>
                </div>
                <div className="flex gap-2 justify-end">
                  <span className="font-semibold" style={{ color: c.primary }}>Rank:</span>
                  <span className="font-bold" style={{ fontFamily: "'Playfair Display', 'Georgia', serif", color: c.accent }}>
                    {student.position <= 10
                      ? student.position + ["th","st","nd","rd"][student.position % 10 > 3 ? 0 : student.position % 10]
                      : "—"}
                  </span>
                </div>
                <div className="flex gap-2 justify-end">
                  <span className="font-semibold" style={{ color: c.primary }}>Section:</span>
                  <span className="font-bold" style={{ fontFamily: "'Playfair Display', 'Georgia', serif", color: c.accent }}>{exam?.section || "—"}</span>
                </div>
              </div>
            </div>

            {/* Terms */}
            {exam?.name && (
              <div className="flex items-center gap-1.5 mb-3 text-xs flex-wrap">
                <span className="font-semibold" style={{ color: c.primary }}>Terms:</span>
                <span className="inline-flex px-2 py-0.5 rounded-full font-medium" style={{ background: `${c.primary}18`, color: c.primary, border: `1px solid ${c.primary}40` }}>1st Term</span>
                <span className="inline-flex px-2 py-0.5 rounded-full font-medium" style={{ background: `${c.accent}18`, color: c.accent, border: `1px solid ${c.accent}40` }}>Mid Term</span>
                <span className="inline-flex px-2 py-0.5 rounded-full font-medium" style={{ background: `${c.highlight}18`, color: c.highlight, border: `1px solid ${c.highlight}40` }}>Final Term</span>
              </div>
            )}

            {/* Assessment Components */}
            {enabledComponents.length > 0 && (
              <div className="flex items-center gap-1.5 mb-3 flex-wrap text-xs">
                <span className="font-semibold" style={{ color: c.primary }}>Assessment:</span>
                {enabledComponents.map((k) => (
                  <span key={k} className="inline-flex px-2 py-0.5 rounded-full font-bold" style={{ background: `${c.text}18`, color: c.text, border: `1px solid ${c.text}30` }}>
                    {ASSESSMENT_LABELS[k]}
                  </span>
                ))}
              </div>
            )}

            {/* Marks Table with border */}
            <div className="rounded-lg overflow-hidden mb-4" style={{ border: `2px solid ${c.primary}30` }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: `linear-gradient(135deg, ${c.primary}, ${c.primary}dd)` }}>
                    <th className="text-left px-3 py-2.5 font-semibold text-white">Subject</th>
                    <th className="text-center px-3 py-2.5 font-semibold text-white">Total</th>
                    <th className="text-center px-3 py-2.5 font-semibold text-white">Obtained</th>
                    <th className="text-center px-3 py-2.5 font-semibold text-white">Passing</th>
                    <th className="text-center px-3 py-2.5 font-semibold text-white">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((sub, i) => {
                    const obtained = student!.subjectMarks[sub.name] ?? 0;
                    const passed = obtained >= sub.passingMarks;
                    return (
                      <tr key={sub.id} style={{ background: i % 2 === 0 ? "#ffffff" : `${c.text}08`, borderBottom: `1px solid ${c.primary}15` }}>
                        <td className="px-3 py-2 font-medium" style={{ color: c.text }}>{sub.name}</td>
                        <td className="text-center px-3 py-2" style={{ color: c.text }}>{sub.totalMarks}</td>
                        <td className="text-center px-3 py-2 font-semibold" style={{ color: c.primary }}>{obtained}</td>
                        <td className="text-center px-3 py-2" style={{ color: c.text }}>{sub.passingMarks}</td>
                        <td className="text-center px-3 py-2">
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: passed ? "#dcfce7" : "#fee2e2", color: passed ? "#166534" : "#991b1b" }}>
                            {passed ? "Pass" : "Fail"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: `${c.highlight}18` }}>
                    <td className="px-3 py-2 font-bold" style={{ color: c.accent }}>Total</td>
                    <td className="text-center px-3 py-2 font-bold" style={{ color: c.accent }}>{student!.totalMarks}</td>
                    <td className="text-center px-3 py-2 font-bold" style={{ color: c.accent }}>{student!.totalObtained}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
              <div className="p-3 rounded-lg text-center" style={{ background: `${c.primary}18`, border: `1px solid ${c.primary}30` }}>
                <p className="text-xs font-semibold" style={{ color: c.primary }}>Percentage</p>
                <p className="text-lg font-bold" style={{ color: c.primary }}>{student!.percentage}%</p>
              </div>
              <div className="p-3 rounded-lg text-center" style={{ background: `${c.accent}18`, border: `1px solid ${c.accent}30` }}>
                <p className="text-xs font-semibold" style={{ color: c.accent }}>Grade</p>
                <p className="text-lg font-bold" style={{ color: c.accent }}>{student!.grade}</p>
              </div>
              <div className="p-3 rounded-lg text-center" style={{ background: `${c.highlight}18`, border: `1px solid ${c.highlight}30` }}>
                <p className="text-xs font-semibold" style={{ color: c.highlight }}>Position</p>
                <p className="text-lg font-bold" style={{ color: c.highlight }}>{student!.position}{["th","st","nd","rd"][student!.position % 10 > 3 ? 0 : student!.position % 10] || "th"}</p>
              </div>
            </div>

            <div className="mb-3">
              <p className="text-xs font-semibold mb-0.5" style={{ color: c.primary }}>Grade Remark</p>
              <p className="text-sm italic" style={{ color: c.text }}>{student!.remark}</p>
            </div>

            <div className="mb-3">
              <p className="text-xs font-semibold mb-0.5" style={{ color: c.primary }}>Teacher Remarks</p>
              <p className="text-sm" style={{ color: c.text }}>{remarks || "—"}</p>
            </div>

            {/* Signatures */}
            <div className="flex justify-between pt-3" style={{ borderTop: `2px solid ${c.accent}50` }}>
              <div className="text-center">
                <div className="pt-1 mt-6" style={{ borderTop: `1px solid ${c.accent}`, width: 160 }}>
                  <p className="text-xs font-medium" style={{ color: c.text }}>Teacher&apos;s Signature</p>
                </div>
              </div>
              <div className="text-center">
                <div className="pt-1 mt-6" style={{ borderTop: `1px solid ${c.accent}`, width: 160 }}>
                  <p className="text-xs font-medium" style={{ color: c.text }}>Principal&apos;s Signature</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

ReportCardPreview.displayName = "ReportCardPreview";

export default ReportCardPreview;
