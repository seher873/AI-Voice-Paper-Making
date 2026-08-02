"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/context/ToastContext";
import { getSupabase } from "@/lib/supabase";

interface SchoolRow {
  school_id: string;
  name: string;
  plan: string;
  created_at: string;
  exam_count: number;
  student_count: number;
  paper_count: number;
  last_active: string | null;
}

export default function SchoolsOverview({ onClose }: { onClose: () => void }) {
  const [schools, setSchools] = useState<SchoolRow[] | null>(null);
  const [error, setError] = useState("");
  const { addToast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await getSupabase().rpc("get_admin_school_stats");
        if (error) throw new Error("Not allowed");
        setSchools((data || []) as SchoolRow[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
        addToast(err instanceof Error ? err.message : "Failed to load schools", "error");
      }
    })();
  }, [addToast]);

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString() : "—";

  const fmtAgo = (iso: string | null) => {
    if (!iso) return "—";
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / 86400000);
    if (days <= 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 30) return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
  };

  const total = {
    schools: schools?.length || 0,
    exams: schools?.reduce((a, s) => a + s.exam_count, 0) || 0,
    students: schools?.reduce((a, s) => a + s.student_count, 0) || 0,
    papers: schools?.reduce((a, s) => a + s.paper_count, 0) || 0,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mt-8 mb-8 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-800 to-slate-900">
          <div>
            <h2 className="text-base font-bold text-white">School Overview</h2>
            <p className="text-[11px] text-slate-300">All schools using the system & their usage</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all flex items-center justify-center"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 bg-slate-50 border-b border-slate-200">
          <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
            <p className="text-xl font-bold text-slate-800">{total.schools}</p>
            <p className="text-[11px] text-slate-400">Schools</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
            <p className="text-xl font-bold text-indigo-600">{total.exams}</p>
            <p className="text-[11px] text-slate-400">Exams</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
            <p className="text-xl font-bold text-emerald-600">{total.students}</p>
            <p className="text-[11px] text-slate-400">Students</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
            <p className="text-xl font-bold text-amber-600">{total.papers}</p>
            <p className="text-[11px] text-slate-400">Papers</p>
          </div>
        </div>

        <div className="p-5">
          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : !schools ? (
            <div className="flex items-center gap-2 text-slate-400">
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth={3} className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" strokeWidth={3} className="opacity-75" />
              </svg>
              <span className="text-sm">Loading schools...</span>
            </div>
          ) : schools.length === 0 ? (
            <p className="text-sm text-slate-400">No schools yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="px-3 py-2.5 font-semibold text-slate-600 text-xs">School</th>
                    <th className="px-3 py-2.5 font-semibold text-slate-600 text-xs">Plan</th>
                    <th className="px-3 py-2.5 font-semibold text-slate-600 text-xs text-center">Exams</th>
                    <th className="px-3 py-2.5 font-semibold text-slate-600 text-xs text-center">Students</th>
                    <th className="px-3 py-2.5 font-semibold text-slate-600 text-xs text-center">Papers</th>
                    <th className="px-3 py-2.5 font-semibold text-slate-600 text-xs">Last Active</th>
                    <th className="px-3 py-2.5 font-semibold text-slate-600 text-xs">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {schools.map((s, i) => (
                    <tr key={s.school_id} className={`${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"} border-t border-slate-100`}>
                      <td className="px-3 py-2.5 font-medium text-slate-700">{s.name || "My School"}</td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          s.plan === "full" ? "bg-indigo-100 text-indigo-700" :
                          s.plan === "results" ? "bg-emerald-100 text-emerald-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>{s.plan}</span>
                      </td>
                      <td className="px-3 py-2.5 text-center font-semibold text-slate-700">{s.exam_count}</td>
                      <td className="px-3 py-2.5 text-center font-semibold text-slate-700">{s.student_count}</td>
                      <td className="px-3 py-2.5 text-center font-semibold text-slate-700">{s.paper_count}</td>
                      <td className="px-3 py-2.5 text-slate-600 text-xs">{fmtAgo(s.last_active)}</td>
                      <td className="px-3 py-2.5 text-slate-400 text-xs">{fmtDate(s.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
