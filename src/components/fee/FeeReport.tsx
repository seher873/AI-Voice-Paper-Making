"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabase, getSchoolId } from "@/lib/supabase";
import type { StudentFee, FeePayment } from "@/types/fee";
import { formatPKR, STATUS_COLORS, STATUS_LABELS, MONTHS } from "@/types/fee";

interface PaymentRow extends FeePayment {
  student: StudentFee;
}

export default function FeeReport() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [students, setStudents] = useState<StudentFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sb = getSupabase();
      const schoolId = await getSchoolId();
      if (!schoolId) return;
      const [studRes, payRes] = await Promise.all([
        sb.from("student_fees").select("*").eq("school_id", schoolId).eq("is_active", true),
        sb.from("fee_payments").select("*").eq("school_id", schoolId).order("month_year", { ascending: false }),
      ]);
      const studMap: Record<string, StudentFee> = {};
      (studRes.data as StudentFee[] || []).forEach((s) => { studMap[s.id] = s; });
      setStudents(studRes.data as StudentFee[] || []);

      const combined: PaymentRow[] = (payRes.data as FeePayment[] || [])
        .filter((p) => studMap[p.student_fee_id])
        .map((p) => ({ ...p, student: studMap[p.student_fee_id] }));
      setRows(combined);
    } catch (e) {
      setError("Report load karne mein masla");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const uniqueClasses = [...new Set(students.map((s) => s.class_name))].sort();
  const uniqueMonths = [...new Set(rows.map((r) => r.month_label))];

  const filtered = rows.filter((r) => {
    const matchClass = !filterClass || r.student.class_name === filterClass;
    const matchStatus = !filterStatus || r.status === filterStatus;
    const matchMonth = !filterMonth || r.month_label === filterMonth;
    return matchClass && matchStatus && matchMonth;
  });

  // Stats
  const totalDue = filtered.reduce((a, r) => a + r.amount_due, 0);
  const totalPaid = filtered.reduce((a, r) => a + r.amount_paid, 0);
  const totalBalance = totalDue - totalPaid;
  const paidRows = filtered.filter((r) => r.status === "paid").length;
  const dueRows = filtered.filter((r) => r.status === "due").length;
  const partialRows = filtered.filter((r) => r.status === "partial").length;

  if (loading) return (
    <div className="flex items-center justify-center py-12 text-slate-400">
      <svg className="w-5 h-5 animate-spin mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" strokeWidth={3} className="opacity-25" />
        <path d="M4 12a8 8 0 018-8" strokeWidth={3} className="opacity-75" />
      </svg>
      Loading...
    </div>
  );

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">⚠️ {error}</div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[
          { label: "Total Collected", value: formatPKR(totalPaid), color: "bg-green-50 border-green-200 text-green-700" },
          { label: "Total Outstanding", value: formatPKR(totalBalance), color: "bg-red-50 border-red-200 text-red-700" },
          { label: "Total Fee Billed", value: formatPKR(totalDue), color: "bg-indigo-50 border-indigo-200 text-indigo-700" },
        ].map((c) => (
          <div key={c.label} className={`p-3 rounded-xl border ${c.color} text-center`}>
            <p className="text-base font-bold">{c.value}</p>
            <p className="text-[10px] font-semibold opacity-75">{c.label}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Paid ✅", value: paidRows, color: "text-green-700" },
          { label: "Partial ⚠️", value: partialRows, color: "text-yellow-700" },
          { label: "Due ❌", value: dueRows, color: "text-red-700" },
        ].map((c) => (
          <div key={c.label} className="text-center p-2 bg-slate-50 rounded-xl border border-slate-200">
            <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
            <p className="text-[10px] text-slate-400">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="">All Months</option>
          {uniqueMonths.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="">All Classes</option>
          {uniqueClasses.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="">All Status</option>
          <option value="paid">Paid ✅</option>
          <option value="partial">Partial ⚠️</option>
          <option value="due">Due ❌</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
          <span className="text-xs font-bold text-slate-600">Payment Records ({filtered.length})</span>
        </div>
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs">Koi record nahi mila</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase">
                  <th className="text-left px-4 py-2 font-semibold">Student</th>
                  <th className="text-left px-4 py-2 font-semibold">Class</th>
                  <th className="text-left px-4 py-2 font-semibold">Month</th>
                  <th className="text-right px-4 py-2 font-semibold">Fee Billed</th>
                  <th className="text-right px-4 py-2 font-semibold">Paid</th>
                  <th className="text-right px-4 py-2 font-semibold">Due Balance</th>
                  <th className="text-center px-4 py-2 font-semibold">Status</th>
                  <th className="text-left px-4 py-2 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const balance = r.amount_due - r.amount_paid;
                  return (
                    <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2.5">
                        <p className="font-semibold text-slate-700">{r.student.student_name}</p>
                        {r.student.father_name && <p className="text-[10px] text-slate-400">{r.student.father_name}</p>}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">{r.student.class_name}{r.student.section ? `-${r.student.section}` : ""}</td>
                      <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{r.month_label}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-slate-600">{formatPKR(r.amount_due)}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-green-700">{formatPKR(r.amount_paid)}</td>
                      <td className={`px-4 py-2.5 text-right font-bold ${balance > 0 ? "text-red-600" : "text-green-600"}`}>
                        {balance > 0 ? formatPKR(balance) : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${STATUS_COLORS[r.status]}`}>
                          {STATUS_LABELS[r.status]}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{r.payment_date || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold">
                  <td colSpan={3} className="px-4 py-2 text-xs text-slate-600">Total ({filtered.length} records)</td>
                  <td className="px-4 py-2 text-right text-xs text-slate-600">{formatPKR(totalDue)}</td>
                  <td className="px-4 py-2 text-right text-xs text-green-700">{formatPKR(totalPaid)}</td>
                  <td className="px-4 py-2 text-right text-xs text-red-600">{totalBalance > 0 ? formatPKR(totalBalance) : "—"}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
