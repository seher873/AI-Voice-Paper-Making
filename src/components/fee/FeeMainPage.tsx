"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabase, getSchoolId } from "@/lib/supabase";
import type { StudentFee, FeePayment } from "@/types/fee";
import { currentMonthLabel, sessionOptions } from "@/types/fee";
import HeaderSection from "./HeaderSection";
import SummaryCards from "./SummaryCards";
import StudentFeeTable from "./StudentFeeTable";
import StudentDetailsPanel from "./StudentDetailsPanel";
import CollectFeeModal from "./CollectFeeModal";
import FeeSlipSender from "./FeeSlipSender";

interface PaymentRow extends FeePayment {
  student: StudentFee;
}

interface Props {
  onHome: () => void;
}

export default function FeeMainPage({ onHome }: Props) {
  const [students, setStudents] = useState<StudentFee[]>([]);
  const [allPayments, setAllPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterSession, setFilterSession] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(currentMonthLabel());

  const [viewStudent, setViewStudent] = useState<StudentFee | null>(null);
  const [showCollect, setShowCollect] = useState(false);
  const [showSlips, setShowSlips] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sb = getSupabase();
      const schoolId = await getSchoolId();
      if (!schoolId) return;
      const [studRes, payRes] = await Promise.all([
        sb.from("student_fees").select("*").eq("school_id", schoolId).eq("is_active", true).order("class_name").order("student_name"),
        sb.from("fee_payments").select("*").eq("school_id", schoolId).order("month_year", { ascending: false }),
      ]);
      const studs = (studRes.data || []) as StudentFee[];
      const studMap: Record<string, StudentFee> = {};
      studs.forEach((s) => { studMap[s.id] = s; });
      setStudents(studs);
      const pays = (payRes.data || []) as FeePayment[];
      setAllPayments(pays.filter((p) => studMap[p.student_fee_id]).map((p) => ({ ...p, student: studMap[p.student_fee_id] })));
    } catch (e) {
      setError("Data load karne mein masla");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [refreshKey]);

  useEffect(() => { load(); }, [load]);

  // Filters
  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.student_name.toLowerCase().includes(q) || s.roll_no.toLowerCase().includes(q) || s.father_name.toLowerCase().includes(q);
    const matchClass = !filterClass || s.class_name === filterClass;
    const matchSession = !filterSession || s.session === filterSession;
    return matchSearch && matchClass && matchSession;
  });

  const filteredPayments = allPayments.filter((p) => filteredStudents.some((s) => s.id === p.student_fee_id));

  // Summary stats (yearly)
  const totalFeesYear = filteredStudents.reduce((a, s) => a + s.monthly_fee * 12, 0);
  const totalCollected = filteredPayments.reduce((a, p) => a + p.amount_paid, 0);
  const totalPending = totalFeesYear - totalCollected;

  const uniqueClasses = [...new Set(students.map((s) => s.class_name))].sort();
  const sessions = sessionOptions();

  function handleSaved() {
    setShowCollect(false);
    setRefreshKey((k) => k + 1);
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-slate-400">
      <svg className="w-6 h-6 animate-spin mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" strokeWidth={3} className="opacity-25" />
        <path d="M4 12a8 8 0 018-8" strokeWidth={3} className="opacity-75" />
      </svg>
      <span className="text-sm font-medium">Loading fee data...</span>
    </div>
  );

  return (
    <div className="space-y-5">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
          <span>⚠️</span> {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      <HeaderSection
        search={search} setSearch={setSearch}
        filterClass={filterClass} setFilterClass={setFilterClass}
        filterSession={filterSession} setFilterSession={setFilterSession}
        uniqueClasses={uniqueClasses} sessions={sessions}
        onCollect={() => setShowCollect(true)}
        onSendSlips={() => setShowSlips(true)}
        onHome={onHome}
      />

      <SummaryCards
        totalStudents={filteredStudents.length}
        totalFeesYear={totalFeesYear}
        totalCollected={totalCollected}
        totalPending={totalPending}
      />

      <StudentFeeTable
        students={filteredStudents}
        payments={filteredPayments}
        onViewStudent={setViewStudent}
      />

      {/* Modals */}
      {viewStudent && (
        <StudentDetailsPanel
          student={viewStudent}
          payments={allPayments.filter((p) => p.student_fee_id === viewStudent.id)}
          onClose={() => setViewStudent(null)}
        />
      )}
      {showCollect && (
        <CollectFeeModal
          students={students}
          selectedMonth={selectedMonth}
          onClose={() => setShowCollect(false)}
          onSaved={handleSaved}
        />
      )}
      {showSlips && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-white shadow-sm flex-shrink-0">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
              WhatsApp Fee Slips
            </h2>
            <button onClick={() => setShowSlips(false)} className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors">
              Close
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <FeeSlipSender />
          </div>
        </div>
      )}
    </div>
  );
}
