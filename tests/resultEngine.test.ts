import { calculateResults, calculateClassStats } from "../src/lib/resultEngine";
import { assignGrade } from "../src/lib/gradeEngine";
import { DEFAULT_GRADE_SCALE } from "../src/types/result";
import type { Subject, StudentMark } from "../src/types/result";

let pass = 0, fail = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { pass++; console.log(`  ok: ${name}`); }
  else { fail++; console.log(`  FAIL: ${name} ${detail}`); }
}

const subs: Subject[] = [
  { id: "a", name: "English", code: "ENG", totalMarks: 100, passingMarks: 33 },
  { id: "b", name: "Math", code: "MTH", totalMarks: 100, passingMarks: 33 },
  { id: "c", name: "Science", code: "SCI", totalMarks: 100, passingMarks: 33 },
];

const mk = (rollNo: string, marks: number[]): StudentMark => ({
  rollNo, studentName: rollNo, fatherName: "x",
  subjectMarks: Object.fromEntries(subs.map((s, i) => [s.name, marks[i] ?? 0])),
});

console.log("== gradeEngine ==");
check("90 => A+", assignGrade(90, DEFAULT_GRADE_SCALE).grade === "A+");
check("85 => A", assignGrade(85, DEFAULT_GRADE_SCALE).grade === "A");
check("49 => F", assignGrade(49, DEFAULT_GRADE_SCALE).grade === "F");
check("empty scale fallback", typeof assignGrade(50, []).grade === "string");

console.log("== calculateResults ==");
const students = [mk("1", [90, 90, 90]), mk("2", [80, 80, 80]), mk("3", [30, 30, 30])];
const results = calculateResults(students, subs, DEFAULT_GRADE_SCALE);
check("3 results", results.length === 3);
const r1 = results.find(r => r.rollNo === "1")!;
const r2 = results.find(r => r.rollNo === "2")!;
const r3 = results.find(r => r.rollNo === "3")!;
check("student1 % = 90", r1.percentage === 90, String(r1.percentage));
check("student1 grade A+", r1.grade === "A+");
check("student1 passed", r1.passed === true);
check("student1 pos 1", r1.position === 1, String(r1.position));
check("student2 pos 2", r2.position === 2, String(r2.position));
check("student3 fail (30 below 33)", r3.passed === false, String(r3.passed));
check("student3 grade F", r3.grade === "F");
check("student3 pos 0 (no override)", r3.position === 0, String(r3.position));

console.log("== pass rule: any subject below passing => FAIL ==");
const failAll = calculateResults([mk("4", [95, 95, 20])], subs, DEFAULT_GRADE_SCALE);
check("95,95,20 => fail", failAll[0].passed === false);

console.log("== manual override respected ==");
const withOverride = [mk("1", [90, 90, 90]), mk("2", [80, 80, 80])];
withOverride[1].position = 1; withOverride[1].positionOverridden = true;
const ov = calculateResults(withOverride, subs, DEFAULT_GRADE_SCALE);
check("student2 keeps manual pos 1", ov.find(r => r.rollNo === "2")!.position === 1, String(ov.find(r => r.rollNo === "2")!.position));
check("student1 auto pos (not overridden)", ov.find(r => r.rollNo === "1")!.position === 2, String(ov.find(r => r.rollNo === "1")!.position));

console.log("== stale position (no flag) ignored ==");
const stale = [mk("1", [90, 90, 90]), mk("2", [80, 80, 80]), mk("3", [70, 70, 70])];
stale.forEach(s => { s.position = 1; }); // old buggy data: everyone 1, no flag
const st = calculateResults(stale, subs, DEFAULT_GRADE_SCALE);
check("student1 -> 1", st.find(r => r.rollNo === "1")!.position === 1);
check("student2 -> 2 (not stuck at 1)", st.find(r => r.rollNo === "2")!.position === 2);
check("student3 -> 3 (not stuck at 1)", st.find(r => r.rollNo === "3")!.position === 3);

console.log("== ties share position, next distinct ==");
const ties = [mk("1", [90, 90, 90]), mk("2", [90, 90, 90]), mk("3", [70, 70, 70])];
const tt = calculateResults(ties, subs, DEFAULT_GRADE_SCALE);
check("tie pos 1", tt.find(r => r.rollNo === "1")!.position === 1);
check("tie pos 1 (same pct)", tt.find(r => r.rollNo === "2")!.position === 1);
check("after tie -> 3rd", tt.find(r => r.rollNo === "3")!.position === 3, String(tt.find(r => r.rollNo === "3")!.position));

console.log("== empty students / subjects ==");
check("empty students", calculateResults([], subs, DEFAULT_GRADE_SCALE).length === 0);
check("empty subjects no crash", calculateResults([mk("1", [])], [], DEFAULT_GRADE_SCALE).length === 1);
const emptySubj = calculateResults([mk("1", [])], [], DEFAULT_GRADE_SCALE);
check("empty subjects % 0", emptySubj[0].percentage === 0);
check("empty subjects not passed", emptySubj[0].passed === false);

console.log("== calculateClassStats ==");
const cs = calculateClassStats(results, subs);
check("totalStudents 3", cs.totalStudents === 3);
check("passed 2", cs.passed === 2);
check("failed 1", cs.failed === 1);
check("average", cs.average === Math.round((90 + 80 + 30) / 3), String(cs.average));
check("highest 90", cs.highest === 90);
check("lowest 30", cs.lowest === 30);
check("subjectStats length", cs.subjectStats.length === 3);
check("subjectStats English avg", cs.subjectStats[0].average === Math.round((90 + 80 + 30) / 3));
check("topPerformers only passed", cs.topPerformers.length === 2 && cs.topPerformers.every(r => r.passed));
check("weakStudents only failed", cs.weakStudents.length === 1 && cs.weakStudents[0].rollNo === "3");
check("top and weak don't overlap", cs.topPerformers.every(t => !cs.weakStudents.some(w => w.rollNo === t.rollNo)));
check("gradeDistribution has A+", cs.gradeDistribution["A+"] === 1);
check("gradeDistribution has F", cs.gradeDistribution["F"] === 1);

console.log("== manual override position collision fixed ==");
const ov2 = [mk("1", [90, 90, 90]), mk("2", [80, 80, 80])];
ov2[1].position = 1; ov2[1].positionOverridden = true;
const ov2r = calculateResults(ov2, subs, DEFAULT_GRADE_SCALE);
check("manual 1 kept", ov2r.find(r => r.rollNo === "2")!.position === 1);
check("auto student skips to 2 (no duplicate)", ov2r.find(r => r.rollNo === "1")!.position === 2);
const dup = ov2r.map(r => r.position);
check("positions unique", new Set(dup).size === dup.length);

console.log("\n==== RESULT ENGINE RESULT: " + pass + " passed, " + fail + " failed ====");
process.exit(fail > 0 ? 1 : 0);
