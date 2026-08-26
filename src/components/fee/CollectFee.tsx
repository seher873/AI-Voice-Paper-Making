"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabase, getSchoolId } from "@/lib/supabase";
import type { StudentFee, FeePayment } from "@/types/fee";
import { formatPKR, currentMonthLabel, currentMonthYear, monthYearFromLabel, calcStatus, STATUS_COLORS, STATUS_LABELS, MONTHS } from "@/types/fee";

export default function CollectFee() {
  const [students, setStudents] = useState<StudentFee[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [filterClass, setFilterClass] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(currentMonthLabel());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Pay modal
  const [payModal, setPayModal] = useState<{ student: StudentFee; payment: FeePayment | null } | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [payRemarks, setPayRemarks] = useState("");
  const [receivedBy, setReceivedBy] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sb = getSupabase();
      const schoolId = await getSchoolId();
      if (!schoolId) return;
      const monthYear = monthYearFromLabel(selectedMonth);
      const [studRes, payRes] = await Promise.all([
        sb.from("student_fees").select("*").eq("school_id", schoolId).eq("is_active", true).order("class_name").order("student_name"),
        sb.from("fee_payments").select("*").eq("school_id", schoolId).eq("month_year", monthYear),
      ]);
      if (studRes.data) setStudents(studRes.data as StudentFee[]);
      if (payRes.data) setPayments(payRes.data as FeePayment[]);
    } catch (e) {
      setError("Load karne mein masla");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => { load(); }, [load]);

  const uniqueClasses = [...new Set(students.map((s) => s.class_name))].sort();
  const filteredStudents = filterClass ? students.filter((s) => s.class_name === filterClass) : students;

  function getPayment(studentId: string): FeePayment | null {
    return payments.find((p) => p.student_fee_id === studentId) || null;
  }

  // Month picker options — current + 11 months back
  const monthOptions: string[] = [];
  const now = new Date();
  for (let i = 0; i < 13; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthOptions.push(`${MONTHS[d.getMonth()]} ${d.getFullYear()}`);
  }

  function openPayModal(student: StudentFee) {
    const existing = getPayment(student.id);
    setPayModal({ student, payment: existing });
    setPayAmount(existing ? String(existing.amount_paid) : String(student.monthly_fee));
    setPayDate(existing?.payment_date || new Date().toISOString().slice(0, 10));
    setPayRemarks(existing?.remarks || "");
    setReceivedBy(existing?.received_by || "");
  }

  async function savePayment() {
    if (!payModal) return;
    const { student, payment } = payModal;
    const amountDue = student.monthly_fee;
    const amountPaid = Number(payAmount) || 0;
    const status = calcStatus(amountDue, amountPaid);
    const monthYear = monthYearFromLabel(selectedMonth);

    setSaving(student.id);
    setError(null);
    try {
      const sb = getSupabase();
      const schoolId = await getSchoolId();
      if (!schoolId) return;

      const payload = {
        school_id: schoolId,
        student_fee_id: student.id,
        month_label: selectedMonth,
        month_year: monthYear,
        amount_due: amountDue,
        amount_paid: amountPaid,
        status,
        payment_date: payDate,
        received_by: receivedBy,
        remarks: payRemarks,
        updated_at: new Date().toISOString(),
      };

      if (payment) {
        await sb.from("fee_payments").update(payload).eq("id", payment.id);
      } else {
        await sb.from("fee_payments").insert(payload);
      }
      setSuccess(`${student.student_name} ki fee save ho gayi ✅`);
      setPayModal(null);
      setTimeout(() => setSuccess(null), 3000);
      await load();
    } catch (e) {
      setError("Payment save karne mein masla");
      console.error(e);
    } finally {
      setSaving(null);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-12 text-slate-400">
      <svg className="w-5 h-5 animate-spin mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" strokeWidth={3} className="opacity-25" />
        <path d="M4 12a8 8 0 018-8" strokeWidth={3} className="opacity-75" />
      </svg>
      Loading...
    </div>
  );

  const paidCount = filteredStudents.filter((s) => getPayment(s.id)?.status === "paid").length;
  const dueCount = filteredStudents.filter((s) => !getPayment(s.id) || getPayment(s.id)?.status === "due").length;
  const partialCount = filteredStudents.filter((s) => getPayment(s.id)?.status === "partial").length;
  const totalCollected = filteredStudents.reduce((acc, s) => acc + (getPayment(s.id)?.amount_paid || 0), 0);
  const totalDue = filteredStudents.reduce((acc, s) => acc + (s.monthly_fee - (getPayment(s.id)?.amount_paid || 0)), 0);

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
          ⚠️ {error}<button onClick={() => setError(null)} className="ml-auto">✕</button>
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 font-medium">
          {success}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400">
          {monthOptions.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="">All Classes</option>
          {uniqueClasses.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: "Paid ✅", value: paidCount, color: "bg-green-50 border-green-200 text-green-700" },
          { label: "Partial ⚠️", value: partialCount, color: "bg-yellow-50 border-yellow-200 text-yellow-700" },
          { label: "Due ❌", value: dueCount, color: "bg-red-50 border-red-200 text-red-700" },
          { label: "Collected", value: formatPKR(totalCollected), color: "bg-indigo-50 border-indigo-200 text-indigo-700" },
        ].map((card) => (
          <div key={card.label} className={`p-3 rounded-xl border ${card.color} text-center`}>
            <p className="text-lg font-bold">{card.value}</p>
            <p className="text-[10px] font-semibold opacity-75">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Outstanding */}
      {totalDue > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
          <span className="text-lg">💸</span>
          <div>
            <p className="text-xs font-bold text-red-700">Total Outstanding: {formatPKR(totalDue)}</p>
            <p className="text-[10px] text-red-500">{dueCount + partialCount} students ki fee pending hai</p>
          </div>
        </div>
      )}

      {/* Student List */}
      {filteredStudents.length === 0 ? (
        <div className="py-10 text-center text-slate-400 text-xs">
          Koi student nahi — pehle Students tab mein students add karein
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 uppercase">{selectedMonth} — Fee Collection</span>
          </div>
          <div className="divide-y divide-slate-50">
            {filteredStudents.map((student) => {
              const payment = getPayment(student.id);
              const statusKey = payment?.status || "due";
              const balance = student.monthly_fee - (payment?.amount_paid || 0);
              return (
                <div key={student.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{student.student_name}</p>
                    <p className="text-[10px] text-slate-400">{student.class_name}{student.section ? `-${student.section}` : ""} · Roll: {student.roll_no || "—"}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-slate-600">{formatPKR(student.monthly_fee)}</p>
                    {balance > 0 && payment && <p className="text-[10px] text-red-500">Balance: {formatPKR(balance)}</p>}
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex-shrink-0 ${STATUS_COLORS[statusKey]}`}>
                    {STATUS_LABELS[statusKey]}
                  </span>
                  <button
                    onClick={() => openPayModal(student)}
                    disabled={saving === student.id}
                    className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-all flex-shrink-0"
                  >
                    {saving === student.id ? "..." : payment ? "Update" : "Collect"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {payModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-1">💰 Fee Collection</h3>
            <p className="text-xs text-slate-500 mb-4">
              {payModal.student.student_name} — {selectedMonth}
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                  Fee Due: <span className="font-bold text-slate-700">{formatPKR(payModal.student.monthly_fee)}</span>
                </label>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Amount Paid (PKR) *</label>
                <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-indigo-300 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="2500" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Payment Date</label>
                <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Received By</label>
                <input type="text" value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="Teacher name" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Remarks</label>
                <input type="text" value={payRemarks} onChange={(e) => setPayRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="Optional note" />
              </div>
              {payAmount && (
                <div className={`p-2 rounded-lg text-xs font-bold text-center ${STATUS_COLORS[calcStatus(payModal.student.monthly_fee, Number(payAmount))]}`}>
                  Status: {STATUS_LABELS[calcStatus(payModal.student.monthly_fee, Number(payAmount))]}
                  {Number(payAmount) < payModal.student.monthly_fee && Number(payAmount) > 0 && (
                    <span className="ml-2 font-normal">Balance: {formatPKR(payModal.student.monthly_fee - Number(payAmount))}</span>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={savePayment} disabled={!!saving}
                className="flex-1 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-all">
                {saving ? "Saving..." : "Save Payment"}
              </button>
              <button onClick={() => setPayModal(null)}
                className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
