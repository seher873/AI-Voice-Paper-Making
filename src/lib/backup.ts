import type { PaperState } from "@/types/paper";
import type { Exam, StudentMark, StudentResult, GradeScale, ResultState } from "@/types/result";
import { DEFAULT_GRADE_SCALE } from "@/types/result";
import { initialState as initialPaperState } from "@/types/paper";
import type { StudentFee, FeeStructure, FeePayment } from "@/types/fee";
import { getSupabase, getSchoolId } from "@/lib/supabase";

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
