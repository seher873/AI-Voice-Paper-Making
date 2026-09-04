"use client";

import { useState } from "react";
import type { StudentFee, FeePayment } from "@/types/fee";
import { formatPKR, STATUS_COLORS, STATUS_LABELS } from "@/types/fee";

interface PaymentRow extends FeePayment {
  student: StudentFee;
}

interface Props {
  students: StudentFee[];
  payments: PaymentRow[];
  onViewStudent: (student: StudentFee) => void;
}

type SortKey = "name" | "class" | "total" | "paid" | "due" | "status";

export default function StudentFeeTable({ students, payments, onViewStudent }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  }

  function arrow(key: SortKey) {
    if (sortKey !== key) return <svg className="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>;
    return sortAsc
      ? <svg className="w-3 h-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
      : <svg className="w-3 h-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
  }

  // Build per-student rows
  const rows = students.map((s) => {
    const studentPayments = payments.filter((p) => p.student_fee_id === s.id);
    const totalPaid = studentPayments.reduce((a, p) => a + p.amount_paid, 0);
    const totalDue = studentPayments.reduce((a, p) => a + (p.amount_due - p.amount_paid), 0);
    const latestPayment = studentPayments[studentPayments.length - 1];
    const status = latestPayment?.status || "due";
    return { student: s, totalPaid, totalDue: s.monthly_fee * 12 - totalPaid, totalFee: s.monthly_fee * 12, status };
  });

  const sorted = [...rows].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "name": cmp = a.student.student_name.localeCompare(b.student.student_name); break;
      case "class": cmp = a.student.class_name.localeCompare(b.student.class_name); break;
      case "total": cmp = a.totalFee - b.totalFee; break;
      case "paid": cmp = a.totalPaid - b.totalPaid; break;
      case "due": cmp = a.totalDue - b.totalDue; break;
      case "status": cmp = a.status.localeCompare(b.status); break;
    }
    return sortAsc ? cmp : -cmp;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-700">All Students Fee Overview</h2>
        <p className="text-[10px] text-slate-400 mt-0.5">{students.length} active students</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-5 py-3 font-semibold text-slate-500 uppercase tracking-wide">Student ID</th>
              <th onClick={() => toggleSort("name")} className="text-left px-5 py-3 font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-indigo-600 select-none">
                <div className="flex items-center gap-1">Student Name {arrow("name")}</div>
              </th>
              <th onClick={() => toggleSort("class")} className="text-left px-5 py-3 font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-indigo-600 select-none">
                <div className="flex items-center gap-1">Class {arrow("class")}</div>
              </th>
              <th onClick={() => toggleSort("total")} className="text-right px-5 py-3 font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-indigo-600 select-none">
                <div className="flex items-center gap-1 justify-end">Total Fee {arrow("total")}</div>
              </th>
              <th onClick={() => toggleSort("paid")} className="text-right px-5 py-3 font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-indigo-600 select-none">
                <div className="flex items-center gap-1 justify-end">Paid {arrow("paid")}</div>
              </th>
              <th onClick={() => toggleSort("due")} className="text-right px-5 py-3 font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-indigo-600 select-none">
                <div className="flex items-center gap-1 justify-end">Due {arrow("due")}</div>
              </th>
              <th onClick={() => toggleSort("status")} className="text-center px-5 py-3 font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-indigo-600 select-none">
                <div className="flex items-center gap-1 justify-center">Status {arrow("status")}</div>
              </th>
              <th className="text-center px-5 py-3 font-semibold text-slate-500 uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                  <svg className="w-10 h-10 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-sm font-medium">No students found</p>
                  <p className="text-[10px] text-slate-400 mt-1">Add students from the Fee Students tab</p>
                </td>
              </tr>
            ) : (
              sorted.map((r, i) => (
                <tr key={r.student.id} className={`border-b border-slate-50 hover:bg-indigo-50/40 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                  <td className="px-5 py-3.5 font-mono text-slate-400 text-[11px]">{r.student.roll_no || "—"}</td>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-slate-700">{r.student.student_name}</p>
                    {r.student.father_name && <p className="text-[10px] text-slate-400 mt-0.5">S/o {r.student.father_name}</p>}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-medium text-[11px]">
                      {r.student.class_name}{r.student.section ? ` - ${r.student.section}` : ""}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-slate-700">{formatPKR(r.totalFee)}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-green-600">{formatPKR(r.totalPaid)}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-red-600">{formatPKR(Math.max(r.totalDue, 0))}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${STATUS_COLORS[r.status]}`}>
                      {STATUS_LABELS[r.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <button
                      onClick={() => onViewStudent(r.student)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 text-[11px] font-bold rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
