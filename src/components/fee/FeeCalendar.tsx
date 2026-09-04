"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabase, getSchoolId } from "@/lib/supabase";
import type { StudentFee, FeePayment } from "@/types/fee";
import { formatPKR, MONTHS } from "@/types/fee";

interface MonthStats {
  monthLabel: string;
  monthYear: string;
  collected: number;
  dueBalance: number;
  paidCount: number;
  partialCount: number;
  dueCount: number;
  totalStudents: number;
}

export default function FeeCalendar() {
  const [stats, setStats] = useState<MonthStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sb = getSupabase();
      const schoolId = await getSchoolId();
      if (!schoolId) return;
      const [studRes, payRes] = await Promise.all([
        sb.from("student_fees").select("*").eq("school_id", schoolId).eq("is_active", true),
        sb.from("fee_payments").select("*").eq("school_id", schoolId),
      ]);
      const students = (studRes.data || []) as StudentFee[];
      const payments = (payRes.data || []) as FeePayment[];

      // Build calendar for last 13 months (current + 12 back)
      const now = new Date();
      const months: { label: string; year: string }[] = [];
      for (let i = 12; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({ label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, year: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` });
      }

      const rows = months.map((m) => {
        const monthPayments = payments.filter((p) => p.month_year === m.year);
        const paidStudents = new Set(monthPayments.filter((p) => p.status === "paid").map((p) => p.student_fee_id));
        const partialStudents = new Set(monthPayments.filter((p) => p.status === "partial").map((p) => p.student_fee_id));
        const dueStudents = students.filter((s) => {
          const pay = monthPayments.find((p) => p.student_fee_id === s.id);
          return !pay || pay.status === "due";
        });

        const collected = monthPayments.reduce((a, p) => a + p.amount_paid, 0);
        const totalBilled = students.reduce((a, s) => a + s.monthly_fee, 0);
        const dueBalance = students.reduce((a, s) => {
          const pay = monthPayments.find((p) => p.student_fee_id === s.id);
          return a + (s.monthly_fee - (pay?.amount_paid || 0));
        }, 0);

        return {
          monthLabel: m.label,
          monthYear: m.year,
          collected,
          dueBalance,
          paidCount: paidStudents.size,
          partialCount: partialStudents.size,
          dueCount: dueStudents.length,
          totalStudents: students.length,
        };
      });

      setStats(rows);
    } catch (e) {
      setError("Calendar load karne mein masla");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center py-12 text-slate-400">
      <svg className="w-5 h-5 animate-spin mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" strokeWidth={3} className="opacity-25" />
        <path d="M4 12a8 8 0 018-8" strokeWidth={3} className="opacity-75" />
      </svg>
      Loading...
    </div>
  );

  const grandCollected = stats.reduce((a, s) => a + s.collected, 0);
  const grandDue = stats.reduce((a, s) => a + s.dueBalance, 0);

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
          <span>⚠️</span> {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <div className="p-3 rounded-xl border bg-indigo-50 border-indigo-200 text-indigo-700 text-center">
          <p className="text-lg font-bold">{formatPKR(grandCollected)}</p>
          <p className="text-[10px] font-semibold opacity-75">Total Collected (13 months)</p>
        </div>
        <div className="p-3 rounded-xl border bg-red-50 border-red-200 text-red-700 text-center">
          <p className="text-lg font-bold">{formatPKR(grandDue)}</p>
          <p className="text-[10px] font-semibold opacity-75">Total Due Balance</p>
        </div>
        <div className="p-3 rounded-xl border bg-green-50 border-green-200 text-green-700 text-center">
          <p className="text-lg font-bold">{stats.length}</p>
          <p className="text-[10px] font-semibold opacity-75">Months Tracked</p>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {stats.map((s) => {
          const pct = s.totalStudents ? Math.round((s.paidCount / s.totalStudents) * 100) : 0;
          const monthNum = parseInt(s.monthYear.split("-")[1]);
          return (
            <div key={s.monthYear} className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm hover:border-indigo-300 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-700">{monthNum}</p>
                <p className="text-[9px] text-slate-400">{s.monthLabel}</p>
              </div>
              <div className="text-center mb-2">
                <p className="text-sm font-extrabold text-slate-800">{formatPKR(s.collected)}</p>
                <p className="text-[9px] text-slate-400">collected</p>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
                <div className={`h-full rounded-full ${pct >= 100 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="flex items-center justify-between text-[9px]">
                <span className="text-green-600 font-semibold">{s.paidCount} paid</span>
                <span className="text-red-600 font-semibold">{s.dueCount} due</span>
              </div>
              <p className="text-[9px] text-slate-400 mt-1">Due: {formatPKR(s.dueBalance)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
