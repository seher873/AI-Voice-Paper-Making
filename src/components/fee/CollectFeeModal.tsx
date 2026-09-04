"use client";

import { useState } from "react";
import type { StudentFee } from "@/types/fee";
import { formatPKR, calcStatus, monthYearFromLabel, currentMonthLabel, MONTHS } from "@/types/fee";
import { getSupabase, getSchoolId } from "@/lib/supabase";

interface Props {
  students: StudentFee[];
  selectedMonth: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function CollectFeeModal({ students, selectedMonth, onClose, onSaved }: Props) {
  const [studentId, setStudentId] = useState("");
  const [month, setMonth] = useState(selectedMonth);
  const [amountPaid, setAmountPaid] = useState("");
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState("cash");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const student = students.find((s) => s.id === studentId);
  const totalFee = student?.monthly_fee || 0;

  // Month options
  const monthOptions: string[] = [];
  const now = new Date();
  for (let i = 0; i < 13; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthOptions.push(`${MONTHS[d.getMonth()]} ${d.getFullYear()}`);
  }

  async function handleSave() {
    if (!student || !amountPaid) {
      setError("Student aur amount select karein");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const sb = getSupabase();
      const schoolId = await getSchoolId();
      if (!schoolId) return;

      const amount = Number(amountPaid) || 0;
      const monthYear = monthYearFromLabel(month);
      const status = calcStatus(totalFee, amount);

      const payload = {
        school_id: schoolId,
        student_fee_id: student.id,
        month_label: month,
        month_year: monthYear,
        amount_due: totalFee,
        amount_paid: amount,
        status,
        payment_date: payDate,
        received_by: method,
        remarks,
        updated_at: new Date().toISOString(),
      };

      const { error: insertError } = await sb.from("fee_payments").insert(payload);
      if (insertError) throw new Error(insertError.message);
      onSaved();
    } catch (e: any) {
      setError(e.message || "Save karne mein masla");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-800">Collect Fee</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Record a student fee payment</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
              <span>⚠️</span> {error}
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
            </div>
          )}

          {/* Student Select */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Student Name *</label>
            <select
              value={studentId}
              onChange={(e) => { setStudentId(e.target.value); setAmountPaid(""); }}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
            >
              <option value="">-- Select Student --</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.student_name} — {s.class_name}{s.section ? `-${s.section}` : ""}</option>
              ))}
            </select>
          </div>

          {student && (
            <>
              {/* Info row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <p className="text-[9px] text-slate-400 uppercase font-semibold">Class</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{student.class_name}{student.section ? `-${student.section}` : ""}</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <p className="text-[9px] text-slate-400 uppercase font-semibold">Roll</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{student.roll_no || "—"}</p>
                </div>
                <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-200 text-center">
                  <p className="text-[9px] text-indigo-400 uppercase font-semibold">Monthly Fee</p>
                  <p className="text-xs font-bold text-indigo-700 mt-0.5">{formatPKR(totalFee)}</p>
                </div>
              </div>

              {/* Month */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Month *</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                >
                  {monthOptions.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {/* Amount + Date row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Amount Paid (PKR) *</label>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder={String(totalFee)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Payment Method</label>
                <div className="flex gap-2">
                  {["cash", "bank", "online", "other"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setMethod(m)}
                      className={`flex-1 px-3 py-2 text-[11px] font-semibold rounded-xl border transition-all capitalize ${
                        method === m
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20"
                          : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Note (Optional)</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Any remarks..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                />
              </div>

              {/* Preview */}
              {amountPaid && (
                <div className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                  calcStatus(totalFee, Number(amountPaid) || 0) === "paid"
                    ? "bg-green-50 border-green-200 text-green-700"
                    : calcStatus(totalFee, Number(amountPaid) || 0) === "partial"
                    ? "bg-yellow-50 border-yellow-200 text-yellow-700"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}>
                  <span className="font-bold">
                    {calcStatus(totalFee, Number(amountPaid) || 0) === "paid" ? "✅ Paid in full" :
                     calcStatus(totalFee, Number(amountPaid) || 0) === "partial" ? "⚠️ Partial" : "❌ Due"}
                  </span>
                  <span className="ml-auto">{formatPKR(totalFee - (Number(amountPaid) || 0))} remaining</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !studentId || !amountPaid}
            className="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-600/20"
          >
            {saving ? "Saving..." : "Save Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
