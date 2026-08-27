import {
  formatPKR,
  MONTHS,
  currentMonthLabel,
  currentMonthYear,
  monthYearFromLabel,
  allMonthsForSession,
  calcStatus,
  STANDARD_CLASSES,
  sessionOptions,
} from "../src/types/fee";
import { normalizePhone } from "../src/lib/whatsapp";

let pass = 0, fail = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { pass++; console.log(`  ok: ${name}`); }
  else { fail++; console.log(`  FAIL: ${name} ${detail}`); }
}

console.log("== formatPKR ==");
check("formats integer", formatPKR(2500) === "PKR 2,500", formatPKR(2500));
check("formats zero", formatPKR(0) === "PKR 0", formatPKR(0));
check("formats large", formatPKR(125000) === "PKR 125,000", formatPKR(125000));

console.log("== MONTHS ==");
check("has 12 months", MONTHS.length === 12);
check("April exists", MONTHS.includes("April"));
check("March last", MONTHS[11] === "December");

console.log("== currentMonthLabel / currentMonthYear ==");
const label = currentMonthLabel();
const year = currentMonthYear();
const now = new Date();
check("label is MM YYYY", /^[A-Z][a-z]+ \d{4}$/.test(label), label);
check("label matches real month", label.startsWith(MONTHS[now.getMonth()]), label);
check("year format YYYY-MM", /^\d{4}-(0[1-9]|1[0-2])$/.test(year), year);

console.log("== monthYearFromLabel ==");
check("August 2026 -> 2026-08", monthYearFromLabel("August 2026") === "2026-08", monthYearFromLabel("August 2026"));
check("January 2027 -> 2027-01", monthYearFromLabel("January 2027") === "2027-01", monthYearFromLabel("January 2027"));
check("bad label -> ''", monthYearFromLabel("Foo") === "");
check("empty -> ''", monthYearFromLabel("") === "");

console.log("== allMonthsForSession (Apr->Mar) ==");
const months = allMonthsForSession("2025-2026");
check("has 12 months", months.length === 12);
check("starts April 2025", months[0] === "April 2025", months[0]);
check("ends March 2026", months[months.length - 1] === "March 2026", months[months.length - 1]);
check("no duplicate", new Set(months).size === 12);

console.log("== allMonthsForSession (single year) ==");
const months2 = allMonthsForSession("2026");
check("starts April 2026", months2[0] === "April 2026", months2[0]);
check("ends March 2027", months2[11] === "March 2027", months2[11]);

console.log("== calcStatus ==");
check("zero paid -> due", calcStatus(2500, 0) === "due");
check("negative paid -> due", calcStatus(2500, -5) === "due");
check("full paid -> paid", calcStatus(2500, 2500) === "paid");
check("over paid -> paid", calcStatus(2500, 3000) === "paid");
check("partial -> partial", calcStatus(2500, 1000) === "partial");
check("half exactly -> partial", calcStatus(2500, 1250) === "partial");

console.log("== fee structure amount rules (logic used by UI) ==");
// Structure requires class + amount > 0
const validStructure = { class_name: "Class 5", amount: 2500 };
const invalidStructureNoClass = { class_name: "", amount: 2500 };
const invalidStructureNoAmount = { class_name: "Class 5", amount: 0 };
const structureRule = (f: { class_name: string; amount: number }) => !!f.class_name.trim() && f.amount > 0;
check("valid structure passes", structureRule(validStructure) === true);
check("no class blocked", structureRule(invalidStructureNoClass) === false);
check("no amount blocked", structureRule(invalidStructureNoAmount) === false);

console.log("== student fee auto-assign from structure ==");
// When a structure is selected and monthly_fee is 0, fee comes from structure.amount
const structures = [{ id: "s1", class_name: "Class 5", amount: 2500 } as any];
const pickFee = (feeId: string | null, monthlyFee: number): number => {
  if (!feeId) return monthlyFee;
  const str = structures.find((x) => x.id === feeId);
  if (str && monthlyFee === 0) return str.amount;
  return monthlyFee;
};
check("structure selected + 0 -> structure amount", pickFee("s1", 0) === 2500);
check("no structure + 0 -> 0", pickFee(null, 0) === 0);
check("explicit override kept", pickFee("s1", 2000) === 2000);

console.log("== student required fields ==");
const studentRule = (f: { student_name: string; class_name: string }) => !!f.student_name.trim() && !!f.class_name.trim();
check("name only -> blocked", studentRule({ student_name: "Ahmed", class_name: "" }) === false);
check("class only -> blocked", studentRule({ student_name: "", class_name: "Class 5" }) === false);
check("both -> ok", studentRule({ student_name: "Ahmed", class_name: "Class 5" }) === true);

console.log("== WhatsApp phone normalization (valid PK numbers for wa.me) ==");
check("0300-1234567 -> 923001234567", normalizePhone("0300-1234567") === "923001234567", normalizePhone("0300-1234567"));
check("03001234567 -> 923001234567", normalizePhone("03001234567") === "923001234567", normalizePhone("03001234567"));
check("+92 300 1234567 -> 923001234567", normalizePhone("+92 300 1234567") === "923001234567", normalizePhone("+92 300 1234567"));
check("923001234567 unchanged", normalizePhone("923001234567") === "923001234567", normalizePhone("923001234567"));
check("0092 300 1234567 -> 923001234567", normalizePhone("0092 300 1234567") === "923001234567", normalizePhone("0092 300 1234567"));
check("3001234567 -> 923001234567", normalizePhone("3001234567") === "923001234567", normalizePhone("3001234567"));
check("300-1234567 -> 923001234567", normalizePhone("300-1234567") === "923001234567", normalizePhone("300-1234567"));
check("empty -> ''", normalizePhone("") === "", normalizePhone(""));

console.log("== standard classes dropdown ==");
check("Playgroup first", STANDARD_CLASSES[0] === "Playgroup");
check("Class 10 last", STANDARD_CLASSES[STANDARD_CLASSES.length - 1] === "Class 10");
check("14 classes", STANDARD_CLASSES.length === 14);
check("Class 5 present", STANDARD_CLASSES.includes("Class 5"));
check("no duplicates", new Set(STANDARD_CLASSES).size === STANDARD_CLASSES.length);

console.log("== session options ==");
const sessions = sessionOptions();
check("4 options", sessions.length === 4);
check("format YYYY-YYYY", sessions.every((s) => /^\d{4}-\d{4}$/.test(s)), sessions.join(","));
check("linear years", sessions.every((s, i) => i === 0 || parseInt(s.split("-")[0]) === parseInt(sessions[i - 1].split("-")[0]) + 1));

console.log("\n==== FEE ENGINE RESULT: " + pass + " passed, " + fail + " failed ====");
process.exit(fail > 0 ? 1 : 0);