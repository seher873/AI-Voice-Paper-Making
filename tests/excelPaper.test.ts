import { parseExcelFile, generateExcelBuffer } from "../src/lib/excelEngine";
import { getTemplate, TEMPLATES } from "../src/lib/paperFormat";
import type { PaperTemplate } from "../src/lib/paperFormat";
import type { Subject } from "../src/types/result";

let pass = 0, fail = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { pass++; console.log(`  ok: ${name}`); }
  else { fail++; console.log(`  FAIL: ${name} ${detail}`); }
}

const subs: Subject[] = [
  { id: "a", name: "English", code: "ENG", totalMarks: 100, passingMarks: 33 },
  { id: "b", name: "Math", code: "MTH", totalMarks: 100, passingMarks: 33 },
];

console.log("== excelEngine: generate + parse round-trip ==");
const buf = generateExcelBuffer(["Roll No", "Student Name", "Father Name", "English", "Math"], [
  [1, "Ali", "Ahmed", 80, 70],
  [2, "Sara", "Khan", 90, 95],
]);
const parsed = parseExcelFile(buf.slice(0), subs);
check("2 students parsed", parsed.students.length === 2, String(parsed.students.length));
check("no errors", parsed.errors.length === 0, parsed.errors.join("; "));
check("Ali english 80", parsed.students[0].subjectMarks["English"] === 80);
check("rollNo is string", parsed.students[0].rollNo === "1");
check("Ali has Math", parsed.students[0].subjectMarks["Math"] === 70);

console.log("== excelEngine: invalid values rejected ==");
const bad = generateExcelBuffer(["Roll No", "Student Name", "Father Name", "English", "Math"], [
  [1, "Ali", "Ahmed", 150, 70],   // exceeds total
  [2, "Sara", "Khan", "abc", 70], // not a number
  [3, "", "X", 50, 50],           // missing name
  [4, "Bilal", "Y", 50],          // missing Math
  [5, "Zara", "Z", 40, -5],       // negative
]);
const badParse = parseExcelFile(bad.slice(0), subs);
check("0 students parsed", badParse.students.length === 0);
check("errors reported", badParse.errors.length >= 5, String(badParse.errors.length));
check("error mentions exceed", badParse.errors.some(e => e.includes("exceed")));
check("error mentions Invalid", badParse.errors.some(e => e.includes("Invalid")));
check("error mentions Missing Roll", badParse.errors.some(e => e.includes("Missing Roll")));
check("error mentions Missing marks", badParse.errors.some(e => e.includes("Missing marks")));

console.log("== excelEngine: mixed valid+invalid row ==");
const mixed = generateExcelBuffer(["Roll No", "Student Name", "Father Name", "English", "Math"], [
  [1, "Ali", "Ahmed", 80, 70],
  [2, "Bad", "X", 200, 70],
]);
const mixedParse = parseExcelFile(mixed.slice(0), subs);
check("valid row kept", mixedParse.students.length === 1);
check("invalid row errored", mixedParse.errors.length === 1);

console.log("== paperFormat templates ==");
check("8 templates", TEMPLATES.length === 8);
check("english numbering Q1", getTemplate("english").numbering(0) === "Q1.");
check("english numbering Q10", getTemplate("english").numbering(9) === "Q10.");
check("urdu numbering س:1", getTemplate("urdu").numbering(0) === "س:1");
check("maths mcq option A", getTemplate("maths").mcqOption(0) === "A)");
check("maths mcq option C", getTemplate("maths").mcqOption(2) === "C)");
check("urdu mcq option (ii)", getTemplate("urdu").mcqOption(1) === "(ii)");
check("urdu mcq fallback", getTemplate("urdu").mcqOption(9) === "(10)");
check("unknown id falls back to english", getTemplate("x" as unknown as PaperTemplate).id === "english");
check("sindhi rtl", getTemplate("sindhi").dir === "rtl");
check("english ltr", getTemplate("english").dir === "ltr");
check("question mark urdu", getTemplate("urdu").questionMark === "؟");

console.log("\n==== EXCEL/PAPER RESULT: " + pass + " passed, " + fail + " failed ====");
process.exit(fail > 0 ? 1 : 0);
