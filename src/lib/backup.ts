import type { PaperState } from "@/types/paper";
import type { Exam, StudentMark, StudentResult, GradeScale, ResultState } from "@/types/result";
import { DEFAULT_GRADE_SCALE } from "@/types/result";
import { initialState as initialPaperState } from "@/types/paper";
import type { StudentFee, FeeStructure, FeePayment } from "@/types/fee";
import { getSupabase, getSchoolId } from "@/lib/supabase";
import * as XLSX from "xlsx";

const RESULT_KEY = "paper-maker-results-state";
const PAPER_KEY = "paper-maker-state";

export interface SchoolBackup {
  version: 1;
  exportedAt: string;
  schoolName: string;
  exams: Exam[];
  students?: StudentMark[];
  results?: StudentResult[];
  gradeScales: GradeScale[];
  papers: PaperState[];
  feeStructures?: FeeStructure[];
  feeStudents?: StudentFee[];
  feePayments?: FeePayment[];
}

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export async function exportSchoolData(): Promise<SchoolBackup> {
  const result = readJSON<Partial<ResultState>>(RESULT_KEY, {});
  const paper: PaperState = { ...initialPaperState, ...readJSON<Partial<PaperState>>(PAPER_KEY, {}) };

  let feeStructures: FeeStructure[] | undefined = undefined;
  let feeStudents: StudentFee[] | undefined = undefined;
  let feePayments: FeePayment[] | undefined = undefined;
  try {
    const sb = getSupabase();
    const schoolId = await getSchoolId();
    if (schoolId) {
      const [sRes, sfRes, pRes] = await Promise.all([
        sb.from("fee_structures").select("*").eq("school_id", schoolId),
        sb.from("student_fees").select("*").eq("school_id", schoolId),
        sb.from("fee_payments").select("*").eq("school_id", schoolId),
      ]);
      if (sRes.data) feeStructures = sRes.data as FeeStructure[];
      if (sfRes.data) feeStudents = sfRes.data as StudentFee[];
      if (pRes.data) feePayments = pRes.data as FeePayment[];
    }
  } catch (e) {
    console.error("Backup fee export error:", e);
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    schoolName: paper.schoolName || result.schoolName || "My School",
    exams: result.exams || [],
    gradeScales: result.gradeScale || DEFAULT_GRADE_SCALE,
    papers: [paper],
    feeStructures,
    feeStudents,
    feePayments,
  };
}

export async function importSchoolData(backup: SchoolBackup): Promise<{ success: boolean; message: string }> {
  if (!backup || backup.version !== 1) throw new Error("Invalid backup file");

  const exams: Exam[] = backup.exams || [];
  const currentExam = exams.length > 0 ? exams[exams.length - 1] : null;

  const result: Partial<ResultState> = {
    exams,
    students: currentExam?.students || backup.students || [],
    results: currentExam?.results || backup.results || [],
    gradeScale: backup.gradeScales && backup.gradeScales.length > 0 ? backup.gradeScales : DEFAULT_GRADE_SCALE,
    schoolName: backup.schoolName,
    currentExam,
  };
  writeJSON(RESULT_KEY, result);

  const paper: Partial<PaperState> = backup.papers && backup.papers.length > 0 ? backup.papers[0] : {};
  writeJSON(PAPER_KEY, paper);

  let feeMsg = "";
  try {
    const sb = getSupabase();
    const schoolId = await getSchoolId();
    if (schoolId) {
      let restored = 0;
      if (backup.feeStructures?.length) {
        const { error } = await sb.from("fee_structures").upsert(
          backup.feeStructures.map((s) => ({ ...s, school_id: schoolId }))
        );
        if (error) throw new Error(error.message);
        restored += backup.feeStructures.length;
      }
      if (backup.feeStudents?.length) {
        const { error } = await sb.from("student_fees").upsert(
          backup.feeStudents.map((s) => ({ ...s, school_id: schoolId }))
        );
        if (error) throw new Error(error.message);
        restored += backup.feeStudents.length;
      }
      if (backup.feePayments?.length) {
        const { error } = await sb.from("fee_payments").upsert(
          backup.feePayments.map((p) => ({ ...p, school_id: schoolId }))
        );
        if (error) throw new Error(error.message);
        restored += backup.feePayments.length;
      }
      if (restored > 0) feeMsg = ` + ${restored} fee record`;
    }
  } catch (e) {
    feeMsg = ` (fee restore failed: ${e instanceof Error ? e.message : "error"})`;
  }

  const count = exams.length + (result.students?.length || 0);
  return { success: true, message: `${count} records restored successfully!${feeMsg}` };
}

export function buildBackupExcel(data: SchoolBackup): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Info
  const infoRows = [
    { Field: "School Name", Value: data.schoolName },
    { Field: "Export Date", Value: new Date(data.exportedAt).toLocaleString() },
    { Field: "Exams", Value: data.exams?.length || 0 },
    { Field: "Fee Students", Value: data.feeStudents?.length || 0 },
    { Field: "Fee Payments", Value: data.feePayments?.length || 0 },
    { Field: "Fee Structures", Value: data.feeStructures?.length || 0 },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(infoRows), "Info");

  // Sheet 2: Fee Students
  if (data.feeStudents?.length) {
    const rows = data.feeStudents.map((s) => ({
      "Student Name": s.student_name,
      "Father Name": s.father_name || "",
      Class: s.class_name,
      Section: s.section || "",
      "Roll No": s.roll_no || "",
      "Parent Phone": s.parent_phone || "",
      "Monthly Fee": s.monthly_fee,
      Session: s.session,
      "Admission Date": s.admission_date || "",
      Active: s.is_active ? "Yes" : "No",
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Fee Students");
  }

  // Sheet 3: Fee Payments
  if (data.feePayments?.length) {
    const studMap: Record<string, string> = {};
    data.feeStudents?.forEach((s) => { studMap[s.id] = s.student_name; });
    const rows = data.feePayments.map((p) => ({
      Student: studMap[p.student_fee_id] || p.student_fee_id,
      "Month/Year": p.month_year,
      "Amount Due": p.amount_due,
      "Amount Paid": p.amount_paid,
      Status: p.status,
      "Payment Date": p.payment_date || "",
      "Received By": p.received_by || "",
      Remarks: p.remarks || "",
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Fee Payments");
  }

  // Sheet 4: Fee Structures
  if (data.feeStructures?.length) {
    const rows = data.feeStructures.map((s) => ({
      Class: s.class_name || "",
      "Fee Type": s.fee_type || "",
      Amount: s.amount,
      Description: s.description || "",
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Fee Structures");
  }

  // Sheet 5: Exams
  if (data.exams?.length) {
    const rows = data.exams.map((e) => ({
      "Exam Name": e.name,
      Session: e.session,
      Class: e.className,
      Section: e.section,
      Date: e.date,
      Subjects: (e.subjects || []).map((s) => `${s.name} (${s.totalMarks})`).join(", "),
      Students: e.students?.length || 0,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Exams");
  }

  // Sheet 6: Results (latest exam results if available)
  const latestExam = data.exams?.length ? data.exams[data.exams.length - 1] : null;
  if (latestExam?.results?.length) {
    const subjectNames = (latestExam.subjects || []).map((s) => s.name);
    const rows = latestExam.results.map((r) => {
      const row: Record<string, string | number> = {
        "Roll No": r.rollNo,
        "Student Name": r.studentName,
        "Father Name": r.fatherName || "",
      };
      subjectNames.forEach((sn) => { row[sn] = r.subjectMarks[sn] ?? ""; });
      row["Total Obtained"] = r.totalObtained;
      row["Total Marks"] = r.totalMarks;
      row["Percentage"] = r.percentage;
      row["Grade"] = r.grade;
      row["Position"] = r.position;
      row["Remark"] = r.remark;
      return row;
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Results");
  }

  return wb;
}

export function downloadBackupExcel(data: SchoolBackup) {
  const wb = buildBackupExcel(data);
  const fileName = `backup-${data.schoolName.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function downloadBackupJson(data: SchoolBackup) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `backup-${data.schoolName.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
