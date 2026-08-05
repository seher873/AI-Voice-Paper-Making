import type { PaperState } from "@/types/paper";
import type { Exam, StudentMark, StudentResult, GradeScale, ResultState } from "@/types/result";
import { DEFAULT_GRADE_SCALE } from "@/types/result";
import { initialState as initialPaperState } from "@/types/paper";

const RESULT_KEY = "paper-maker-results-state";
const PAPER_KEY = "paper-maker-state";

export interface SchoolBackup {
  version: 1;
  exportedAt: string;
  schoolName: string;
  exams: Exam[];
  students: StudentMark[];
  results: StudentResult[];
  gradeScales: GradeScale[];
  papers: PaperState[];
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

function resultStateToBackup(state: Partial<ResultState>): { exams: Exam[]; students: StudentMark[]; results: StudentResult[]; gradeScales: GradeScale[] } {
  return {
    exams: state.exams || [],
    students: state.students || [],
    results: state.results || [],
    gradeScales: state.gradeScale || DEFAULT_GRADE_SCALE,
  };
}

export async function exportSchoolData(): Promise<SchoolBackup> {
  const result = readJSON<Partial<ResultState>>(RESULT_KEY, {});
  const paper: PaperState = { ...initialPaperState, ...readJSON<Partial<PaperState>>(PAPER_KEY, {}) };
  const { exams, students, results, gradeScales } = resultStateToBackup(result);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    schoolName: paper.schoolName || result.schoolName || "My School",
    exams,
    students,
    results,
    gradeScales,
    papers: [paper],
  };
}

export async function importSchoolData(backup: SchoolBackup): Promise<{ success: boolean; message: string }> {
  if (!backup || backup.version !== 1) throw new Error("Invalid backup file");

  const result: Partial<ResultState> = {
    exams: backup.exams || [],
    students: backup.students || [],
    results: backup.results || [],
    gradeScale: backup.gradeScales && backup.gradeScales.length > 0 ? backup.gradeScales : DEFAULT_GRADE_SCALE,
    schoolName: backup.schoolName,
    currentExam: backup.exams && backup.exams.length > 0 ? backup.exams[backup.exams.length - 1] : null,
  };
  writeJSON(RESULT_KEY, result);

  const paper: Partial<PaperState> = backup.papers && backup.papers.length > 0 ? backup.papers[0] : {};
  writeJSON(PAPER_KEY, paper);

  const count = (backup.exams?.length || 0) + (backup.students?.length || 0) + (backup.results?.length || 0);
  return { success: true, message: `${count} records restored successfully!` };
}
