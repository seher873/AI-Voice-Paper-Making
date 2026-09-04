"use client";

import type { StudentFee, FeePayment } from "@/types/fee";
import { formatPKR, STATUS_COLORS, STATUS_LABELS, MONTHS } from "@/types/fee";

interface Props {
  student: StudentFee;
  payments: FeePayment[];
  onClose: () => void;
}

export default function StudentDetailsPanel({ student, payments, onClose }: Props) {
  const totalPaid = payments.reduce((a, p) => a + p.amount_paid, 0);
  const totalFee = student.monthly_fee * 12;
  const balance = totalFee - totalPaid;
  const status = balance <= 0 ? "paid" : totalPaid > 0 ? "partial" : "due";

  // Monthly payment history (April to March)
  const now = new Date();
  const year = now.getFullYear();
  const history = [
    ...MONTHS.slice(3).map((m, i) => ({ label: `${m} ${year}`, my: `${year}-${String(i + 4).padStart(2, "0")}` })),
    ...MONTHS.slice(0, 3).map((m, i) => ({ label: `${m} ${year + 1}`, my: `${year + 1}-${String(i + 1).padStart(2, "0")}` })),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-800">Student Fee Details</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Complete payment record and overview</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Student Info */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-indigo-600">{student.student_name.charAt(0)}</span>
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-slate-800">{student.student_name}</p>
              {student.father_name && <p className="text-xs text-slate-400">S/o {student.father_name}</p>}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-medium">{student.class_name}{student.section ? ` - ${student.section}` : ""}</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-medium">Roll: {student.roll_no || "—"}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold ${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</span>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Total Fee (Year)</p>
              <p className="text-base font-extrabold text-slate-700 mt-1">{formatPKR(totalFee)}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl border border-green-200 text-center">
              <p className="text-[10px] font-semibold text-green-500 uppercase">Paid</p>
              <p className="text-base font-extrabold text-green-700 mt-1">{formatPKR(totalPaid)}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-center">
              <p className="text-[10px] font-semibold text-red-400 uppercase">Due</p>
              <p className="text-base font-extrabold text-red-700 mt-1">{formatPKR(Math.max(balance, 0))}</p>
            </div>
          </div>

          {/* Payment History Table */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 mb-2">Payment History ({student.session || "2025-2026"})</h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-500">Month</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-slate-500">Fee</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-slate-500">Paid</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-slate-500">Balance</th>
                    <th className="text-center px-4 py-2.5 font-semibold text-slate-500">Status</th>
                    <th className="text-center px-4 py-2.5 font-semibold text-slate-500">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => {
                    const pay = payments.find((p) => p.month_year === h.my);
                    const due = student.monthly_fee;
                    const paid = pay?.amount_paid || 0;
                    const bal = due - paid;
                    const st = paid <= 0 ? "due" : paid >= due ? "paid" : "partial";
                    return (
                      <tr key={h.my} className="border-b border-slate-50 hover:bg-indigo-50/30 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-slate-700">{h.label}</td>
                        <td className="px-4 py-2.5 text-right text-slate-600">{formatPKR(due)}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-green-600">{formatPKR(paid)}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-red-600">{formatPKR(Math.max(bal, 0))}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${STATUS_COLORS[st]}`}>{STATUS_LABELS[st]}</span>
                        </td>
                        <td className="px-4 py-2.5 text-center text-slate-400">{pay?.payment_date || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
