import { resultReducer } from "../src/context/ResultContext";
import { DEFAULT_GRADE_SCALE, DEFAULT_THEME, DEFAULT_SUBJECTS } from "../src/types/result";
import type { Exam, StudentMark } from "../src/types/result";

let pass = 0, fail = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { pass++; console.log(`  ok: ${name}`); }
  else { fail++; console.log(`  FAIL: ${name} ${detail}`); }
}

function initialState() {
  return {
    exams: [] as Exam[],
    currentExam: null as Exam | null,
    students: [] as StudentMark[],
    results: [],
    classStats: null,
    gradeScale: DEFAULT_GRADE_SCALE,
    schoolName: "",
    schoolLogo: "",
    reportCardRollNo: "",
    reportCardRemarks: "",
    themeColors: DEFAULT_THEME,
  };
}

function makeExam(name = "Final Term", over: Partial<Exam> = {}): Exam {
  const base = DEFAULT_SUBJECTS;
  return {
    id: `exam-${Math.random().toString(36).slice(2, 8)}`,
    name,
    session: "2025-2026",
    className: "Class 5",
    section: "A",
    date: "2026-03-01",
    subjects: base.map((s, i) => ({ ...s, id: `s${i}` })),
    assessmentConfig: { written: true, oral: false, practical: false, activity: false, skills: false },
    ...over,
  };
}

const stu = (rollNo: string, marks: Record<string, number>): StudentMark => ({
  rollNo, studentName: "S" + rollNo, fatherName: "F", subjectMarks: marks,
});

console.log("== CREATE_EXAM ==");
let s = resultReducer(initialState(), { type: "CREATE_EXAM", payload: makeExam() });
check("exam added", s.exams.length === 1);
check("currentExam set", s.currentExam !== null);
check("students empty", s.students.length === 0);

console.log("== ADD_STUDENT snapshots into exam ==");
s = resultReducer(s, { type: "ADD_STUDENT", payload: stu("1", { English: 80, Urdu: 80, Mathematics: 80, Science: 80, "Social Studies": 80, Islamiat: 80, Drawing: 40, "English Grammar": 40, "Urdu Grammar": 40 }) });
check("student added", s.students.length === 1);
check("snapshot in currentExam.students", s.currentExam?.students?.length === 1);

console.log("== SET_CURRENT_EXAM restores snapshot ==");
s = resultReducer(s, { type: "SET_CURRENT_EXAM", payload: s.currentExam });
check("students restored", s.students.length === 1);
check("results restored (empty)", s.results.length === 0);

console.log("== CALCULATE_RESULTS ==");
s = resultReducer(s, { type: "CALCULATE_RESULTS" });
check("results length 1", s.results.length === 1);
check("result grade A", s.results[0].grade === "A");
check("classStats set", s.classStats !== null && s.classStats.totalStudents === 1);
check("exam snapshot has results", s.currentExam?.results?.length === 1);
check("snapshot students also 1", s.currentExam?.students?.length === 1);

console.log("== UPDATE_STUDENT_RESULT flag semantics ==");
s = resultReducer(s, { type: "UPDATE_STUDENT_RESULT", payload: { rollNo: "1", position: 5, overridden: true } });
check("results position 5", s.results[0].position === 5);
check("student position 5", s.students[0].position === 5);
check("student flag true", s.students[0].positionOverridden === true);
s = resultReducer(s, { type: "UPDATE_STUDENT_RESULT", payload: { rollNo: "1", position: 0, overridden: false } });
check("student flag cleared", s.students[0].positionOverridden === false);
check("student position undefined", s.students[0].position === undefined);

console.log("== RESET_POSITIONS ==");
s = resultReducer(s, { type: "UPDATE_STUDENT_RESULT", payload: { rollNo: "1", position: 2, overridden: true } });
s = resultReducer(s, { type: "RESET_POSITIONS" });
check("position cleared", s.students[0].position === undefined);
check("flag cleared", s.students[0].positionOverridden === false);
check("results position 0", s.results[0].position === 0);
check("exam snapshot position cleared", s.exams[0].students?.[0]?.position === undefined);
check("currentExam snapshot position cleared", s.currentExam?.students?.[0]?.position === undefined);

console.log("== SET_SUBJECTS preserves snapshot ==");
s = resultReducer(s, { type: "SET_SUBJECTS", payload: s.exams[0].subjects.slice(0, 3) });
check("subjects 3", s.currentExam?.subjects.length === 3);
check("snapshot preserved", s.currentExam?.students?.length === 1);
check("exams[] subjects synced", s.exams[0].subjects.length === 3);

console.log("== multi-exam: switch + snapshot isolation ==");
const exam2 = makeExam("1st Term");
const exam3 = makeExam("2nd Term");
s = resultReducer(s, { type: "CREATE_EXAM", payload: exam2 });
s = resultReducer(s, { type: "CREATE_EXAM", payload: exam3 });
check("3 exams", s.exams.length === 3);
check("new exam empty students", s.students.length === 0);
const s2 = stu("9", { English: 50, Urdu: 50, Mathematics: 50, Science: 50, "Social Studies": 50, Islamiat: 50, Drawing: 25, "English Grammar": 25, "Urdu Grammar": 25 });
s = resultReducer(s, { type: "ADD_STUDENT", payload: s2 });
s = resultReducer(s, { type: "CALCULATE_RESULTS" });
check("exam3 results 1", s.results.length === 1);

console.log("== switch back to exam1 ==");
s = resultReducer(s, { type: "SET_CURRENT_EXAM", payload: s.exams[0] });
check("exam1 students restored", s.students.length === 1);
check("exam1 results restored", s.results.length === 1);
check("classStats restored", s.classStats !== null && s.classStats.totalStudents === 1);

console.log("== DELETE_EXAM (non-current) ==");
s = resultReducer(s, { type: "SET_CURRENT_EXAM", payload: s.exams[2] });
const beforeDelete = s.exams.length;
s = resultReducer(s, { type: "DELETE_EXAM", payload: s.exams[0].id });
check("exam removed", s.exams.length === beforeDelete - 1);
check("current exam preserved", s.currentExam?.name === "2nd Term");
check("current students preserved", s.students.length === 1);

console.log("== DELETE_EXAM (current) falls back to last ==");
s = resultReducer(s, { type: "DELETE_EXAM", payload: s.currentExam!.id });
check("falls back to remaining exam", s.currentExam?.name === "1st Term");
check("empty snapshot restores empty students", s.students.length === 0);

console.log("== HYDRATE ==");
const saved = { exams: [makeExam("Final Term")], students: [], results: [], gradeScale: DEFAULT_GRADE_SCALE, currentExam: null as Exam | null, classStats: null, schoolName: "", schoolLogo: "", reportCardRollNo: "", reportCardRemarks: "", themeColors: DEFAULT_THEME };
const hydrated = resultReducer(initialState(), { type: "HYDRATE", payload: saved });
check("exams hydrated", hydrated.exams.length === 1);
check("gradeScale default", hydrated.gradeScale === DEFAULT_GRADE_SCALE);

console.log("\n==== REDUCER RESULT: " + pass + " passed, " + fail + " failed ====");
process.exit(fail > 0 ? 1 : 0);
