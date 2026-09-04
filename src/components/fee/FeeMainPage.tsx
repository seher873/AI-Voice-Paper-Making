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

interface PaymentRow extends FeePayment {
  student: StudentFee;
}

export default function FeeMainPage() {
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
    </div>
  );
}
