"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabase, getSchoolId } from "@/lib/supabase";
import type { StudentFee, FeePayment } from "@/types/fee";
import { formatPKR, STATUS_COLORS, STATUS_LABELS, MONTHS, monthYearFromLabel } from "@/types/fee";
import { shareFeeSlipWhatsApp } from "@/lib/whatsapp";
import { useResult } from "@/context/ResultContext";

interface PaymentRow extends FeePayment {
  student: StudentFee;
}

export default function FeeSlipSender() {
  const resultCtx = useResult();
  const schoolName = resultCtx.state.schoolName || "School";

  const [students, setStudents] = useState<StudentFee[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  });
  const [filterClass, setFilterClass] = useState("");
  const [filterStatus, setFilterStatus] = useState("due");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

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

  const monthOptions: string[] = [];
  const now = new Date();
  for (let i = 0; i < 13; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthOptions.push(`${MONTHS[d.getMonth()]} ${d.getFullYear()}`);
  }

  function getPayment(studentId: string): FeePayment | null {
    return payments.find((p) => p.student_fee_id === studentId) || null;
  }

  // Build combined rows
  const allRows: { student: StudentFee; payment: FeePayment }[] = students.map((s) => {
    const payment = getPayment(s.id) || {
      id: `virtual-${s.id}`,
      school_id: "",
      student_fee_id: s.id,
      month_label: selectedMonth,
      month_year: monthYearFromLabel(selectedMonth),
      amount_due: s.monthly_fee,
      amount_paid: 0,
      status: "due" as const,
      payment_date: "",
      received_by: "",
      remarks: "",
      created_at: "",
      updated_at: "",
    };
    return { student: s, payment };
  });

  const filtered = allRows.filter(({ student, payment }) => {
    const q = search.toLowerCase();
    const matchSearch = !q || student.student_name.toLowerCase().includes(q) || student.roll_no.toLowerCase().includes(q);
    const matchClass = !filterClass || student.class_name === filterClass;
    const matchStatus = !filterStatus || payment.status === filterStatus;
    const hasPhone = student.parent_phone?.trim();
    return matchSearch && matchClass && matchStatus && hasPhone;
  });

  const noPhoneCount = allRows.filter(({ student }) => !student.parent_phone?.trim()).length;

  function sendSlip(student: StudentFee, payment: FeePayment) {
    setSending(student.id);
    try {
      shareFeeSlipWhatsApp(student, payment, schoolName);
      setSent((prev) => new Set([...prev, student.id]));
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setSending(null), 500);
    }
  }

  function sendAll() {
    filtered.forEach(({ student, payment }) => {
      setTimeout(() => {
        shareFeeSlipWhatsApp(student, payment, schoolName);
        setSent((prev) => new Set([...prev, student.id]));
      }, 300);
    });
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

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
          ⚠️ {error}<button onClick={() => setError(null)} className="ml-auto">✕</button>
        </div>
      )}

      {/* Info */}
      <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
        <p className="text-xs font-bold text-green-700 flex items-center gap-1.5">
          <span>📱</span> WhatsApp Fee Slip Sender
        </p>
        <p className="text-[10px] text-green-600 mt-0.5">
          Parents ko fee notification slip WhatsApp pe bhejein. Mobile pe directly open hoga, desktop pe PDF download + link milega.
        </p>
        {noPhoneCount > 0 && (
          <p className="text-[10px] text-orange-600 mt-1">⚠️ {noPhoneCount} students ke phone number nahi hain — unhe filter se hata diya gaya hai</p>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-green-400">
          {monthOptions.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-400">
          <option value="">All Classes</option>
          {uniqueClasses.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-400">
          <option value="">All Status</option>
          <option value="due">Due Only ❌</option>
          <option value="partial">Partial Only ⚠️</option>
          <option value="paid">Paid Only ✅</option>
        </select>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search student..."
          className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-400" />
      </div>

      {/* Send All Button */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <p className="text-xs font-bold text-slate-700">{filtered.length} students will receive slip</p>
            <p className="text-[10px] text-slate-400">Month: {selectedMonth}</p>
          </div>
          <button
            onClick={sendAll}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700 transition-all"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
            Send All Slips
          </button>
        </div>
      )}

      {/* Student Slip Cards */}
      {filtered.length === 0 ? (
        <div className="py-10 text-center text-slate-400 text-xs">
          {allRows.filter(({ student }) => !student.parent_phone?.trim()).length === allRows.length
            ? "Kisi bhi student ka phone number nahi hai — Students tab mein phone add karein"
            : "Koi student nahi mila"}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(({ student, payment }) => {
            const balance = payment.amount_due - payment.amount_paid;
            const isSent = sent.has(student.id);
            return (
              <div key={student.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-3 hover:border-green-300 transition-colors">
                {/* Slip Preview */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-slate-700">{student.student_name}</p>
                    {student.father_name && <p className="text-[10px] text-slate-400">S/o {student.father_name}</p>}
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${STATUS_COLORS[payment.status]}`}>
                      {STATUS_LABELS[payment.status]}
                    </span>
                    {isSent && <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-green-100 text-green-700">Sent ✓</span>}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {student.class_name}{student.section ? `-${student.section}` : ""} · Roll: {student.roll_no || "—"} · 📱 {student.parent_phone}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-500">Monthly Fee: <strong className="text-slate-700">{formatPKR(payment.amount_due)}</strong></span>
                    <span className="text-[10px] text-slate-500">Paid: <strong className="text-green-700">{formatPKR(payment.amount_paid)}</strong></span>
                    {balance > 0 ? (
                      <span className="text-[10px] text-slate-500">Due Balance: <strong className="text-red-600">{formatPKR(balance)}</strong></span>
                    ) : (
                      <span className="text-[10px] font-semibold text-green-600">Balance: Paid in full ✓</span>
                    )}
                  </div>
                </div>
                {/* Send Button */}
                <button
                  onClick={() => sendSlip(student, payment)}
                  disabled={sending === student.id}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all flex-shrink-0 ${
                    isSent
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-green-600 text-white hover:bg-green-700"
                  } disabled:opacity-60`}
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                  {isSent ? "Resend" : "Send"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
