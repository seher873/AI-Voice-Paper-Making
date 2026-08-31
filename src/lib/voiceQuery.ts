import type { Exam, StudentResult, StudentMark } from "@/types/result";
import type { PaperState, PaperProject } from "@/types/paper";
import type { StudentFee, FeePayment } from "@/types/fee";
import { formatPKR } from "@/types/fee";
import { getSupabase } from "./supabase";

export type MutationAction =
  | { type: "add_marks"; studentName: string | null; rollNo: string | null; subject: string; marks: number }
  | { type: "update_marks"; studentName: string | null; rollNo: string | null; subject: string; marks: number }
  | { type: "delete_student"; studentName: string | null; rollNo: string | null }
  | { type: "add_student"; studentName: string; rollNo: string }
  | { type: "create_exam"; examName: string; className: string; section: string };

export interface ParsedQuery {
  studentName: string | null;
  subject: string | null;
  metric: string;
  isAdminQuery: boolean;
  adminMetric: string | null;
  all: string;
}

function levenshtein(a: string, b: string): number {
  const la = a.length;
  const lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;
  const m: number[][] = Array.from({ length: la + 1 }, () => Array(lb + 1).fill(0));
  for (let i = 0; i <= la; i++) m[i][0] = i;
  for (let j = 0; j <= lb; j++) m[0][j] = j;
  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + cost);
    }
  }
  return m[la][lb];
}

function fuzzyMatch(input: string, candidates: string[]): string | null {
  const lower = input.toLowerCase().trim();
  for (const c of candidates) {
    if (c.toLowerCase().trim() === lower) return c;
  }
  let best: string | null = null;
  let bestDist = Infinity;
  for (const c of candidates) {
    const cl = c.toLowerCase().trim();
    const dist = levenshtein(lower, cl);
    const threshold = Math.max(1, Math.floor(cl.length * 0.3));
    if (dist <= threshold && dist < bestDist) {
      bestDist = dist;
      best = c;
    }
  }
  return best;
}

function detectSubject(text: string, subjects: string[]): string | null {
  const lower = text.toLowerCase();
  const aliases: Record<string, string[]> = {
    english: ["english", "eng", "angrezi"],
    urdu: ["urdu", "urd"],
    mathematics: ["mathematics", "maths", "math", "riyazi", "ganit"],
    science: ["science", "sci"],
    "social studies": ["social studies", "social", "sst", "samaji"],
    islamiat: ["islamiat", "isl", "deen"],
    drawing: ["drawing", "drw", "tasveer"],
    "english grammar": ["english grammar", "eng grammar", "egr"],
    "urdu grammar": ["urdu grammar", "urd grammar", "ugr"],
  };

  for (const [canonical, aliasesArr] of Object.entries(aliases)) {
    for (const alias of aliasesArr) {
      if (lower.includes(alias)) {
        const match = fuzzyMatch(canonical, subjects);
        if (match) return match;
      }
    }
  }

  for (const s of subjects) {
    if (lower.includes(s.toLowerCase())) return s;
  }

  return fuzzyMatch(lower, subjects);
}

function findStudentInNames(text: string, studentNames: string[]): string | null {
  const lower = text.toLowerCase();

  const stopwords = [
    "ki", "ke", "ka", "ko", "ne", "hai", "hain", "kaun", "kya", "batao", "bata",
    "kitni", "kitne", "kitna", "mein", "se", "kiya", "wala", "vala",
    "kauns", "kaunsa", "kaunsi", "marks", "grade", "position", "total",
    "percentage", "percent", "pass", "fail", "status", "result", "number",
    "roll", "average", "topper", "highest", "lowest", "students", "student",
    "subject", "remark", "school", "database", "data", "activity", "active",
    "admin", "all", "bolo", "sunao", "jano", "do", "de", "dedo", "karo",
    "add", "give", "set", "enter", "put", "delete", "remove", "create",
    "make", "new", "update", "change", "exam", "test", "paper",
    "math", "english", "urdu", "science", "islamiat", "drawing",
    "detail", "details", "info", "kya", "haal", "chale", "chal",
    "bol", "sun", "dekho", "bolo", "suno", "bata", "pata",
    "passing", "passmarks", "passingmarks", "minimum", "threshold",
    "btao", "bataye", "sirf", "konsa", "konsi", "konsae",
  ];

  const words = lower.split(/\s+/).filter(Boolean);
  const potentialNames: string[] = [];

  // Try bigrams
  for (let i = 0; i < words.length - 1; i++) {
    if (!stopwords.includes(words[i]) && !stopwords.includes(words[i + 1]) && words[i].length > 1 && words[i + 1].length > 1) {
      potentialNames.push(words[i] + " " + words[i + 1]);
    }
  }
  // Try single words
  for (const w of words) {
    if (!stopwords.includes(w) && w.length > 2) {
      potentialNames.push(w);
    }
  }

  // Try every possible substring that could be a name
  for (let len = Math.min(4, words.length); len >= 1; len--) {
    for (let i = 0; i <= words.length - len; i++) {
      const slice = words.slice(i, i + len).join(" ");
      if (len <= 2 && words.slice(i, i + len).every(w => stopwords.includes(w))) continue;
      if (words.slice(i, i + len).every(w => w.length <= 1)) continue;
      potentialNames.push(slice);
    }
  }

  // Direct exact match first
  for (const pn of potentialNames) {
    for (const name of studentNames) {
      if (name.toLowerCase() === pn) return name;
    }
  }

  // Then fuzzy
  for (const pn of potentialNames) {
    const match = fuzzyMatch(pn, studentNames);
    if (match) return match;
  }

  return null;
}

const ADMIN_KEYWORDS = [
  "database", "databse", "data base", "school", "schools", "kitne school",
  "school activity", "school activities", "investigation", "investigate",
  "admin", "super admin", "all schools", "sab school", "har school",
  "total school", "total user", "total users", "kitne user", "kitne users",
  "active school", "active users", "inactive school", "last active",
  "system", "platform", "backend", "server", "registered", "signup",
  "kisne signup", "kab signup", "recent", "new school", "naya school",
  "school stats", "overview", "sab kuch", "puri report", "full report",
];

const ADMIN_METRICS: Record<string, string[]> = {
  schoolCount: ["kitne school", "total school", "school kitne", "schools kitne", "total schools"],
  userCount: ["kitne user", "total user", "users kitne", "total users", "kitne account"],
  schoolActivity: ["school activity", "school activities", "active school", "inactive school", "last active", "school status", "school ka status"],
  recentSignups: ["recent", "naya school", "new school", "kab signup", "kisne signup", "recent signup", "abhi signup"],
  fullOverview: ["overview", "sab kuch", "puri report", "full report", "sab data", "databse", "database", "data base"],
  investigation: ["investigation", "investigate", "check", "pata karo", "dekh ke batao"],
};

function detectAdminMetric(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [metric, keywords] of Object.entries(ADMIN_METRICS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return metric;
    }
  }
  return null;
}

function isAdminQuery(text: string): boolean {
  const lower = text.toLowerCase();
  for (const kw of ADMIN_KEYWORDS) {
    if (lower.includes(kw)) return true;
  }
  return detectAdminMetric(text) !== null;
}

export function parseQuery(text: string): ParsedQuery {
  const adminQ = isAdminQuery(text);
  return {
    studentName: null,
    subject: null,
    metric: adminQ ? "admin" : detectMetric(text),
    isAdminQuery: adminQ,
    adminMetric: adminQ ? detectAdminMetric(text) : null,
    all: text,
  };
}

export interface VoiceContext {
  exams: Exam[];
  currentExam: Exam | null;
  students: StudentMark[];
  results: StudentResult[];
  paper?: PaperState | null;
  savedPapers?: PaperProject[];
  feeStudents?: StudentFee[];
  feePayments?: FeePayment[];
  schoolName?: string;
}

export async function answerAdminQuery(adminMetric: string | null, text: string): Promise<string> {
  const supabase = getSupabase();

  if (!adminMetric) {
    if (isAdminQuery(text)) {
      return "Yeh admin-level query hai. Aap kya janna chahte hain: kitne schools hain, kitne users hain, school activities, ya puri overview?";
    }
    return "Yeh sirf admin ke liye hai.";
  }

  try {
    if (adminMetric === "schoolCount") {
      const { count } = await supabase.from("schools").select("*", { count: "exact", head: true });
      return `Platform par total ${count ?? 0} registered schools hain.`;
    }

    if (adminMetric === "userCount") {
      const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      return `Platform par total ${count ?? 0} users hain.`;
    }

    if (adminMetric === "schoolActivity") {
      const { data: schools } = await supabase
        .from("schools")
        .select("id, name, plan, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      if (!schools || schools.length === 0) return "Koi school registered nahi hai.";

      const lines = schools.map(
        (s) => `${s.name} — plan: ${s.plan}, created: ${new Date(s.created_at).toLocaleDateString("en-PK")}`
      );
      return `School activities: ${schools.length} schools. ` + lines.slice(0, 8).join("; ") + (lines.length > 8 ? ` aur ${lines.length - 8} aur...` : "");
    }

    if (adminMetric === "recentSignups") {
      const { data: recent } = await supabase
        .from("schools")
        .select("name, plan, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      if (!recent || recent.length === 0) return "Abhi koi naya signup nahi hua.";

      const lines = recent.map(
        (s) => `${s.name} (${s.plan}) — ${new Date(s.created_at).toLocaleDateString("en-PK")}`
      );
      return `Recent signups: ` + lines.join("; ");
    }

    if (adminMetric === "investigation") {
      const { count: schoolCount } = await supabase.from("schools").select("*", { count: "exact", head: true });
      const { count: userCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      const { count: examCount } = await supabase.from("exams").select("*", { count: "exact", head: true });
      const { count: studentCount } = await supabase.from("students").select("*", { count: "exact", head: true });
      const { count: resultCount } = await supabase.from("results").select("*", { count: "exact", head: true });

      return `Platform Investigation — Schools: ${schoolCount ?? 0}, Users: ${userCount ?? 0}, Exams: ${examCount ?? 0}, Students: ${studentCount ?? 0}, Results: ${resultCount ?? 0}.`;
    }

    if (adminMetric === "fullOverview") {
      const { count: schoolCount } = await supabase.from("schools").select("*", { count: "exact", head: true });
      const { count: userCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      const { count: examCount } = await supabase.from("exams").select("*", { count: "exact", head: true });
      const { count: studentCount } = await supabase.from("students").select("*", { count: "exact", head: true });
      const { count: resultCount } = await supabase.from("results").select("*", { count: "exact", head: true });
      const { count: paperCount } = await supabase.from("papers").select("*", { count: "exact", head: true });

      const { data: schools } = await supabase
        .from("schools")
        .select("name, plan")
        .order("created_at", { ascending: false })
        .limit(10);

      const schoolList = schools?.map((s) => `${s.name}(${s.plan})`).join(", ") || "N/A";

      return `Puri Platform Overview — Schools: ${schoolCount ?? 0} [${schoolList}], Users: ${userCount ?? 0}, Exams: ${examCount ?? 0}, Students Records: ${studentCount ?? 0}, Results: ${resultCount ?? 0}, Papers: ${paperCount ?? 0}.`;
    }

    return "Admin query samajh nahi aaya. Kya aap school count, user count, activity, ya overview janna chahte hain?";
  } catch {
    return "Database se data fetch nahi ho paaya. Supabase connection check karein.";
  }
}

export function answerQuery(query: ParsedQuery, ctx: VoiceContext): string {
  if (query.isAdminQuery) return "";

  const text = query.all.toLowerCase();
  const metric = detectMetric(text);

  // Saved papers list
  if (metric === "savedPapers") {
    const papers = ctx.savedPapers || [];
    if (papers.length === 0) return "Abhi koi saved paper nahi hai. Paper Builder mein paper bana kar Save karein.";
    const list = papers.map((p, i) => `${i + 1}. ${p.name} — ${p.state.questions.length} questions, ${p.state.className || "No class"}, ${p.state.subject || "No subject"}`).join("\n");
    return `${papers.length} saved papers hain:\n${list}\n\nKisi paper ko load karne ka bolo.`;
  }

  // Paper detail queries — work even without exam data
  if (metric === "paperDetails" || metric === "paperSubject" || metric === "paperTime" || metric === "paperClass" || metric === "paperTitle") {
    return answerPaperQuery(metric, text, ctx.paper);
  }

  // ─── FEE QUERIES ───────────────────────────────────────────────────────────
  const feeStudents = ctx.feeStudents || [];
  const feePayments = ctx.feePayments || [];

  if (metric === "feeDetail" || metric === "feeDue" || metric === "feePaid" || metric === "feeList" || metric === "feeReport") {
    return answerFeeQuery(metric, text, feeStudents, feePayments);
  }

  // Also handle fee queries when student name is mentioned alongside fee keywords
  if (feeStudents.length > 0) {
    const feeNames = feeStudents.map((s) => s.student_name);
    const rollMatch = text.match(/roll\s*(?:no|number|#)?\s*(\d+)/i);
    const detectedFeeStudent =
      findStudentInNames(text, feeNames) ||
      (rollMatch ? feeStudents.find((s) => s.roll_no === rollMatch[1])?.student_name || null : null);

    if (detectedFeeStudent && /fee|dues?|baki|baqi|paid|ada|jama|outstanding/i.test(text)) {
      return answerFeeQuery("feeDetail", text, feeStudents, feePayments, detectedFeeStudent);
    }
  }
  // ───────────────────────────────────────────────────────────────────────────

  const exam = ctx.currentExam;
  const allStudents = ctx.students || [];
  const results = exam?.results || ctx.results || [];
  const subjects = exam?.subjects?.map((s) => s.name) || [];

  // Detect student name from available data
  const allNames = results.length > 0
    ? results.map((r) => r.studentName)
    : allStudents.map((s) => s.studentName);
  const detectedName = findStudentInNames(text, allNames);
  const detectedSubject = detectSubject(text, subjects);

  // Passing marks query
  if (metric === "passingMarks") {
    if (!exam) return "Koi exam nahi hai. Pehle exam create karein.";
    if (detectedSubject) {
      const sub = exam.subjects?.find((s) => s.name === detectedSubject);
      if (sub) return `${detectedSubject} mein passing marks ${sub.passingMarks} hain total ${sub.totalMarks} mein se.`;
      return `${detectedSubject} ka subject nahi mila.`;
    }
    if (exam.subjects && exam.subjects.length > 0) {
      const list = exam.subjects.map((s) => `${s.name}: ${s.passingMarks}/${s.totalMarks}`).join(", ");
      return `Har subject ke passing marks:\n${list}`;
    }
    return "Subjects mein passing marks define nahi hue.";
  }

  // No exam at all
  if (!exam && allStudents.length === 0) {
    return "Koi exam ya students nahi hain. Pehle exam create karein aur students add karein.";
  }  // Has students but no results calculated yet
  if (results.length === 0 && allStudents.length > 0) {
    if (detectedName) {
      const student = allStudents.find((s) => s.studentName.toLowerCase() === detectedName.toLowerCase())
        || allStudents.find((s) => s.studentName.toLowerCase().includes(detectedName.toLowerCase()));
      if (student) {
        const marks = Object.entries(student.subjectMarks).map(([sub, m]) => `${sub}: ${m}`).join(", ");
        return `${student.studentName} (roll ${student.rollNo}) ke marks: ${marks || "Abhi koi marks enter nahi hue"}. Results calculate hone ka intezar karein.`;
      }
    }
    if (metric === "studentCount") {
      return `${exam?.name || "Current exam"} mein ${allStudents.length} students add ho chuke hain.`;
    }
    const names = allStudents.slice(0, 10).map((s) => s.studentName).join(", ");
    return `${allStudents.length} students hain (${names}${allStudents.length > 10 ? "..." : ""}). Marks enter karein aur results calculate karein.`;
  }

  // Student-specific queries
  if (detectedName) {
    const student = results.find((r) => r.studentName.toLowerCase() === detectedName.toLowerCase())
      || results.find((r) => r.studentName.toLowerCase().includes(detectedName.toLowerCase()));
    if (!student) return `${detectedName} ka record is exam mein nahi mila.`;
    return answerStudentDetail(student, exam!, detectedSubject, metric, text);
  }

  // Subject-specific queries
  if (detectedSubject) {
    return answerSubjectDetail(detectedSubject, exam!, results);
  }

  // General metrics
  if (metric === "unrecognized") {
    return "Mujhe aapka sawal samajh nahi aaya. Correct your question please — sirf apne paper, exam, results, fees ya students ke baare mein puchiye, phir aapko sahi jawab milega. Misal: \"Kitne students?\", \"English topper?\", \"fee detail do?\", \"paper title kya hai?\".";
  }
  return answerGeneralMetric(metric, exam!, results, text);
}

function answerPaperQuery(metric: string, text: string, paper: PaperState | null | undefined): string {
  if (!paper) return "Paper koi open nahi hai. Pehle Paper Builder mein paper banaein.";

  if (metric === "paperTitle" || metric === "paperDetails") {
    const lines: string[] = [];
    if (paper.paperTitle) lines.push(`Title: ${paper.paperTitle}`);
    if (paper.subject) lines.push(`Subject: ${paper.subject}`);
    if (paper.className) lines.push(`Class: ${paper.className}`);
    if (paper.time) lines.push(`Time: ${paper.time}`);
    if (paper.totalMarks) lines.push(`Total Marks: ${paper.totalMarks}`);
    if (paper.date) lines.push(`Date: ${paper.date}`);
    if (paper.questions.length > 0) {
      lines.push(`Total Questions: ${paper.questions.length}`);
      const typeCounts: Record<string, number> = {};
      paper.questions.forEach((q) => { typeCounts[q.type] = (typeCounts[q.type] || 0) + 1; });
      lines.push(`Types: ${Object.entries(typeCounts).map(([t, c]) => `${c} ${t}`).join(", ")}`);
      lines.push("Questions:");
      paper.questions.forEach((q, i) => {
        lines.push(`  ${i + 1}. [${q.type}] ${q.text}`);
      });
    } else {
      lines.push("Questions: Abhi koi question nahi hai.");
    }
    return lines.length > 0 ? `Paper Details:\n${lines.join("\n")}` : "Paper mein koi data nahi hai.";
  }
  if (metric === "paperSubject") return paper.subject ? `Paper ka subject: ${paper.subject}. Class: ${paper.className || "N/A"}.` : "Subject set nahi hai.";
  if (metric === "paperTime") return paper.time ? `Paper ka time: ${paper.time}. Total Marks: ${paper.totalMarks || "N/A"}.` : "Time set nahi hai.";
  if (metric === "paperClass") return paper.className ? `Paper ki class: ${paper.className}. Subject: ${paper.subject || "N/A"}.` : "Class set nahi hai.";
  return "Paper detail samajh nahi aayi.";
}

function answerFeeQuery(
  metric: string,
  text: string,
  students: StudentFee[],
  payments: FeePayment[],
  preDetectedName?: string | null
): string {
  if (students.length === 0) {
    return "Fee system mein abhi koi student nahi hai. Fee Management mein pehle students add karein.";
  }

  // Helper: get latest payment for a student
  function getLatestPayment(studentId: string): FeePayment | null {
    const sp = payments
      .filter((p) => p.student_fee_id === studentId)
      .sort((a, b) => b.month_year.localeCompare(a.month_year));
    return sp[0] || null;
  }

  // Helper: get all payments for a student
  function getAllPayments(studentId: string): FeePayment[] {
    return payments
      .filter((p) => p.student_fee_id === studentId)
      .sort((a, b) => b.month_year.localeCompare(a.month_year));
  }

  // Detect student by name or roll no from voice text
  const rollMatch = text.match(/roll\s*(?:no|number|#)?\s*(\d+)/i);
  const allNames = students.map((s) => s.student_name);

  let targetStudent: StudentFee | null = null;
  if (preDetectedName) {
    targetStudent = students.find((s) => s.student_name.toLowerCase() === preDetectedName.toLowerCase())
      || students.find((s) => s.student_name.toLowerCase().includes(preDetectedName.toLowerCase())) || null;
  } else if (rollMatch) {
    targetStudent = students.find((s) => s.roll_no === rollMatch[1]) || null;
  } else {
    const detectedName = findStudentInNames(text, allNames);
    if (detectedName) {
      targetStudent = students.find((s) => s.student_name.toLowerCase() === detectedName.toLowerCase())
        || students.find((s) => s.student_name.toLowerCase().includes(detectedName.toLowerCase())) || null;
    }
  }

  // ── Single student detail ──────────────────────────────────────────────────
  if (targetStudent) {
    const s = targetStudent;
    const latestPay = getLatestPayment(s.id);
    const allPay = getAllPayments(s.id);
    const paidMonths = allPay.filter((p) => p.status === "paid").length;
    const dueMonths = allPay.filter((p) => p.status === "due" || p.status === "partial").length;
    const totalPaid = allPay.reduce((acc, p) => acc + p.amount_paid, 0);
    const totalDue = allPay.reduce((acc, p) => acc + (p.amount_due - p.amount_paid), 0);

    let resp = `${s.student_name} (Roll: ${s.roll_no || "N/A"}) — Class ${s.class_name}${s.section ? "-" + s.section : ""}. `;
    if (s.father_name) resp += `Father: ${s.father_name}. `;
    resp += `Monthly Fee: ${formatPKR(s.monthly_fee)}. `;

    if (latestPay) {
      const statusWord = latestPay.status === "paid" ? "PAID ✅" : latestPay.status === "partial" ? "PARTIAL ⚠️" : "DUE ❌";
      const balance = latestPay.amount_due - latestPay.amount_paid;
      resp += `Latest (${latestPay.month_label}): ${statusWord} — Paid: ${formatPKR(latestPay.amount_paid)}, Due: ${formatPKR(latestPay.amount_due)}`;
      if (balance > 0) resp += `, Balance: ${formatPKR(balance)}`;
      resp += ". ";
    } else {
      resp += "Abhi tak koi payment record nahi hai. ";
    }

    if (allPay.length > 0) {
      resp += `Total: ${paidMonths} month paid, ${dueMonths} month pending. `;
      resp += `Kul jama: ${formatPKR(totalPaid)}, Kul baqi: ${formatPKR(totalDue)}.`;
    }
    return resp;
  }

  // ── Fee Report / Summary ───────────────────────────────────────────────────
  if (metric === "feeReport") {
    const totalStudents = students.length;
    const totalMonthlyBill = students.reduce((a, s) => a + s.monthly_fee, 0);
    const totalCollected = payments.reduce((a, p) => a + p.amount_paid, 0);
    const totalOutstanding = payments.reduce((a, p) => a + (p.amount_due - p.amount_paid), 0);
    const paidStudents = new Set(payments.filter((p) => p.status === "paid").map((p) => p.student_fee_id)).size;
    const dueStudents = students.filter((s) => {
      const lp = getLatestPayment(s.id);
      return !lp || lp.status !== "paid";
    }).length;
    return `Fee Report — Total students: ${totalStudents}. Monthly bill: ${formatPKR(totalMonthlyBill)}. Total collected: ${formatPKR(totalCollected)}. Outstanding: ${formatPKR(totalOutstanding)}. ${paidStudents} students paid, ${dueStudents} students ke dues baki hain.`;
  }

  // ── Due list ───────────────────────────────────────────────────────────────
  if (metric === "feeDue") {
    const dueList = students.filter((s) => {
      const lp = getLatestPayment(s.id);
      return !lp || lp.status === "due" || lp.status === "partial";
    });
    if (dueList.length === 0) return "Mashallah! Sab students ki fee paid hai. Koi dues nahi.";
    const lines = dueList.slice(0, 10).map((s) => {
      const lp = getLatestPayment(s.id);
      const bal = lp ? formatPKR(lp.amount_due - lp.amount_paid) : formatPKR(s.monthly_fee);
      const month = lp ? lp.month_label : "No record";
      return `${s.student_name} (Roll: ${s.roll_no || "N/A"}, Class: ${s.class_name}) — ${month} — Baqi: ${bal}`;
    });
    const more = dueList.length > 10 ? ` ...aur ${dueList.length - 10} aur students.` : "";
    return `${dueList.length} students ki fee pending hai:\n${lines.join("\n")}${more}`;
  }

  // ── Paid list ──────────────────────────────────────────────────────────────
  if (metric === "feePaid") {
    const paidList = students.filter((s) => {
      const lp = getLatestPayment(s.id);
      return lp && lp.status === "paid";
    });
    if (paidList.length === 0) return "Abhi kisi student ki fee paid nahi hai is mahine.";
    const lines = paidList.slice(0, 10).map((s) => {
      const lp = getLatestPayment(s.id);
      return `${s.student_name} (Roll: ${s.roll_no || "N/A"}, Class: ${s.class_name}) — ${lp?.month_label} — ${formatPKR(lp?.amount_paid || 0)} ✅`;
    });
    const more = paidList.length > 10 ? ` ...aur ${paidList.length - 10} aur.` : "";
    return `${paidList.length} students paid hain:\n${lines.join("\n")}${more}`;
  }

  // ── Full list ──────────────────────────────────────────────────────────────
  if (metric === "feeList") {
    const lines = students.slice(0, 15).map((s) => {
      const lp = getLatestPayment(s.id);
      const statusIcon = !lp ? "⬜ No record" : lp.status === "paid" ? "✅ Paid" : lp.status === "partial" ? "⚠️ Partial" : "❌ Due";
      return `${s.student_name} (Roll: ${s.roll_no || "N/A"}) — Class ${s.class_name} — ${formatPKR(s.monthly_fee)} — ${statusIcon}`;
    });
    const more = students.length > 15 ? `\n...aur ${students.length - 15} aur students.` : "";
    return `Fee list (${students.length} total):\n${lines.join("\n")}${more}`;
  }

  // ── Default: full detail with names (paid/due) ─────────────────────────────
  const dueCount = students.filter((s) => {
    const lp = getLatestPayment(s.id);
    return !lp || lp.status !== "paid";
  }).length;
  const paidCount = students.length - dueCount;
  const totalCollected = payments.reduce((a, p) => a + p.amount_paid, 0);

  const lines = students.slice(0, 20).map((s) => {
    const lp = getLatestPayment(s.id);
    const statusWord = !lp ? "NO RECORD" : lp.status === "paid" ? "PAID" : lp.status === "partial" ? "PARTIAL" : "DUE";
    const paidAmt = lp ? lp.amount_paid : 0;
    const dueAmt = lp ? lp.amount_due - lp.amount_paid : s.monthly_fee;
    return `${s.student_name} (Roll: ${s.roll_no || "N/A"}, Class: ${s.class_name}) — ${statusWord} — Paid: ${formatPKR(paidAmt)}, Baaki: ${formatPKR(dueAmt)}`;
  });
  const more = students.length > 20 ? ` ...aur ${students.length - 20} aur.` : "";

  return `Fee detail — Total students: ${students.length}. ${paidCount} PAID ✅, ${dueCount} DUE/PENDING ❌. Total collected: ${formatPKR(totalCollected)}.\n${lines.join("\n")}${more}`;
}

function answerStudentDetail(student: StudentResult, exam: Exam, detectedSubject: string | null, metric: string, text: string): string {
  if (detectedSubject) {
    const obtained = student.subjectMarks[detectedSubject] ?? 0;
    const subDef = exam.subjects?.find((s) => s.name === detectedSubject);
    const total = subDef?.totalMarks ?? 0;
    const passing = subDef?.passingMarks ?? 0;
    const passed = obtained >= passing;
    return `${student.studentName} ko ${detectedSubject} mein ${obtained} marks mile hain total ${total} mein se. ${passed ? "Pass" : "Fail"}. Position ${ordinal(student.position)}.`;
  }

  if (metric === "position") {
    return `${student.studentName} ki position ${ordinal(student.position)} hai — ${student.percentage}% marks, ${student.grade} grade.`;
  }
  if (metric === "grade") {
    return `${student.studentName} ka grade ${student.grade} hai — ${student.percentage}% marks, ${ordinal(student.position)} position.`;
  }
  if (metric === "percentage" || metric === "totalMarks") {
    return `${student.studentName} ke ${student.totalObtained} marks hain total ${student.totalMarks} mein se — ${student.percentage}%. ${ordinal(student.position)} position.`;
  }
  if (metric === "status") {
    if (student.passed) {
      return `${student.studentName} pass ho gaya hai! ${student.grade} grade, ${student.percentage}% marks, ${ordinal(student.position)} position.`;
    } else {
      return `${student.studentName} fail ho gaya hai. ${student.grade} grade, ${student.percentage}% marks. Position ${ordinal(student.position)}.`;
    }
  }
  if (metric === "remark") {
    return `${student.studentName} ka remark hai: ${student.remark || "Koi remark nahi"}.`;
  }

  // Default: full subject-wise report
  const subLines: string[] = [];
  if (exam.subjects) {
    for (const sub of exam.subjects) {
      const obtained = student.subjectMarks[sub.name] ?? 0;
      const passed = obtained >= sub.passingMarks;
      subLines.push(`${sub.name}: ${obtained}/${sub.totalMarks} ${passed ? "Pass" : "Fail"}`);
    }
  }
  const summary = `${student.studentName} ke total ${student.totalObtained} marks hain total ${student.totalMarks} mein se. Percentage ${student.percentage}%, Grade ${student.grade}, Position ${ordinal(student.position)}. ${student.passed ? "Pass" : "Fail"}.`;
  if (subLines.length > 0) {
    return summary + " Subject-wise: " + subLines.join("; ") + ".";
  }
  return summary;
}

function answerSubjectDetail(subjectName: string, exam: Exam, results: StudentResult[]): string {
  const subDef = exam.subjects?.find((s) => s.name === subjectName);
  if (!subDef) return `${subjectName} ka subject nahi mila.`;

  const marksArr = results.map((r) => r.subjectMarks[subjectName] ?? 0);
  const avg = marksArr.reduce((a, b) => a + b, 0) / marksArr.length;
  const high = Math.max(...marksArr);
  const low = Math.min(...marksArr);
  const topStudent = results.find((r) => (r.subjectMarks[subjectName] ?? 0) === high);
  const lowStudent = results.find((r) => (r.subjectMarks[subjectName] ?? 0) === low);
  const passedCount = results.filter((r) => (r.subjectMarks[subjectName] ?? 0) >= subDef.passingMarks).length;

  return `${subjectName} mein — total marks: ${subDef.totalMarks}, passing: ${subDef.passingMarks}. Highest: ${high} (${topStudent?.studentName || "?"}), Lowest: ${low} (${lowStudent?.studentName || "?"}). Average: ${avg.toFixed(1)}. ${passedCount} out of ${results.length} students pass.`;
}

function answerGeneralMetric(metric: string, exam: Exam, results: StudentResult[], text: string): string {
  if (metric === "studentCount") {
    return `Is exam "${exam.name}" mein total ${results.length} students hain.`;
  }
  if (metric === "passCount") {
    const passed = results.filter((r) => r.passed).length;
    return `Is exam mein ${passed} students pass hue hain ${results.length} mein se.`;
  }
  if (metric === "failCount") {
    const failed = results.filter((r) => !r.passed).length;
    return `Is exam mein ${failed} students fail hue hain ${results.length} mein se.`;
  }
  if (metric === "topper") {
    const sorted = [...results].sort((a, b) => b.percentage - a.percentage);
    const top = sorted[0];
    if (!top) return "Koi topper nahi mila.";
    const subInfo = exam.subjects?.length
      ? ` Subject-wise: ${exam.subjects.map((s) => `${s.name}: ${top.subjectMarks[s.name] ?? 0}`).join(", ")}.`
      : "";
    return `${top.studentName} sab se acha perform kar raha hai — ${top.percentage}% marks, ${top.grade} grade, ${ordinal(top.position)} position. Total ${top.totalObtained} out of ${top.totalMarks}.${subInfo}`;
  }
  if (metric === "lowest") {
    const sorted = [...results].sort((a, b) => a.percentage - b.percentage);
    const low = sorted[0];
    if (!low) return "Koi student nahi mila.";
    return `${low.studentName} sab se kam marks laya hai — ${low.percentage}% marks, ${low.grade} grade, ${ordinal(low.position)} position. Total ${low.totalObtained} out of ${low.totalMarks}.`;
  }
  if (metric === "average") {
    const avg = results.reduce((sum, r) => sum + r.percentage, 0) / results.length;
    const passed = results.filter((r) => r.passed).length;
    return `Class ka average ${avg.toFixed(1)}% hai. ${passed} out of ${results.length} students pass hue hain. ${results.length - passed} fail.`;
  }
  if (metric === "percentage") {
    const avg = results.reduce((sum, r) => sum + r.percentage, 0) / results.length;
    const sorted = [...results].sort((a, b) => b.percentage - a.percentage);
    const top = sorted[0];
    return `Average percentage: ${avg.toFixed(1)}%. Sab se zyada: ${top?.studentName} ${top?.percentage}%.`;
  }

  // Default: exam summary
  const avg = results.reduce((sum, r) => sum + r.percentage, 0) / results.length;
  const passed = results.filter((r) => r.passed).length;
  const sorted = [...results].sort((a, b) => b.percentage - a.percentage);
  const top = sorted[0];
  const subjects = exam.subjects?.map((s) => s.name).join(", ") || "N/A";
  return `${exam.name} (Class: ${exam.className || "N/A"}) mein total ${results.length} students hain. ${passed} pass, ${results.length - passed} fail. Average ${avg.toFixed(1)}%. Topper: ${top?.studentName || "?"} (${top?.percentage || 0}%). Subjects: ${subjects}. Kis student ya subject ka detail chahiye?`;
}

// --- Metric Detection ---

function detectMetric(text: string): string {
  const lower = text.toLowerCase();

  // Student count
  if (/kitn[ei]\s+student|total\s+student|student.*count|kitn[ei]\s+bacch[ei]/i.test(lower)) return "studentCount";

  // Pass/fail counts
  if (/pass\s+kitn[ei]|kitn[ei]\s+pass|pass.*count|kitne\s+pass/i.test(lower)) return "passCount";
  if (/fail\s+kitn[ei]|kitn[ei]\s+fail|fail.*count|kitne\s+fail/i.test(lower)) return "failCount";

  // Topper / highest
  if (/topper|sab\s+se\s+(zyada|ziyada|acha|achi)|highest|sab\s+se\s+behtareen|best/i.test(lower)) return "topper";

  // Lowest / worst
  if (/lowest|sab\s+se\s+(kam|kharab)|worst|sab\s+se\s+kamzor|weakest/i.test(lower)) return "lowest";

  // Average
  if (/average|ausat|average\s+marks/i.test(lower)) return "average";

  // Position / rank
  if (/position|rank|sthaan|kya\s+position|kitni\s+position/i.test(lower)) return "position";

  // Grade
  if (/grade|kya\s+grade|kitna\s+grade/i.test(lower)) return "grade";

  // Status (pass/fail)
  if (/pass\s+ya\s+fail|result|kya\s+hua|huiya|guzra|pass\s+hua|fail\s+hua/i.test(lower)) return "status";

  // Percentage
  if (/percentage|percent|fisad|kya\s+percentage/i.test(lower)) return "percentage";

  // Total marks
  if (/total.*marks|marks.*total|total|kul/i.test(lower)) return "totalMarks";

  // Passing marks query
  if (/passing\s*marks|pass\s*marks|kitn[ei]?\s*pass|minimum\s*marks|pass\s*kitn[ei]/i.test(lower)) return "passingMarks";

  // Saved papers list
  if (/kitn[ei]?\s*papers?|papers?\s*kitn[ei]|papers?\s*list|sari?\s*papers?|sab\s*papers?|saved\s*papers?|paper\s*list|papers?\s*batao|papers?\s*kitn[ei]|papers?\s*ho/i.test(lower)) return "savedPapers";

  // Paper detail queries
  if (/paper|sawal|question|questions|kitne\s+sawal|sawal.*kitn[ei]|paper.*detail|paper.*info|kya\s+kya\s+hai/i.test(lower)) {
    return "paperDetails";
  }
  if (/subject|paper.*subject|subject.*kya|kons[ae]\s+subject/i.test(lower)) return "paperSubject";
  if (/time|waqt|kitna\s+time|duration/i.test(lower)) return "paperTime";
  if (/class|jamaat|konsi\s+class/i.test(lower)) return "paperClass";
  if (/title|paper.*title|kya\s+naam/i.test(lower)) return "paperTitle";

  // Remark
  if (/remark|note/i.test(lower)) return "remark";

  // Fee / dues queries
  if (/fee.*detail|fee.*status|fee.*paid|fee.*due|fee.*baki|fee.*baqi|fee.*record|fee.*info|fee.*check|fee.*dekho|fee.*batao|fee.*kya|fees?|fee\s+detals|fee.*details|detail.*fee/i.test(lower)) return "feeDetail";
  if (/due.*fee|baki.*fee|baqi.*fee|kitni.*fee|unpaid|outstanding|fee.*nahi.*di|fee.*nahi.*adi/i.test(lower)) return "feeDue";
  if (/paid.*fee|fee.*paid|fee.*ada|fee.*jama|fee.*dedi|fee.*de.*di|fee.*dey.*di/i.test(lower)) return "feePaid";
  if (/fee.*list|sari.*fee|tamam.*fee|all.*fee|fee.*sab|sabki.*fee|poori.*fee/i.test(lower)) return "feeList";
  if (/fee.*report|fee.*summary|total.*fee|fee.*total|kitna.*collect|collect.*fee/i.test(lower)) return "feeReport";

  // Marks (generic — but combined with name detection it gives subject-wise marks)
  if (/marks|number|aye|mile|kitn[ei]|scores?/i.test(lower)) return "marks";

  // Explicit overview / summary request
  if (/overview|summary|batao|batayein|detail|details|poori|sab\s+kuch|kya\s+scene|kya\s+haal|kya\s+hoga|sab\s+batao/i.test(lower)) return "overview";

  // Nothing matched — flag as unrecognized so agent can ask for correction
  return "unrecognized";
}

// --- Mutation Parsing ---

function extractNumber(text: string): number | null {
  const wordMap: Record<string, number> = {
    zero: 0, ek: 1, do: 2, teen: 3, char: 4, chaar: 4, paanch: 5, panch: 5,
    chhe: 6, saat: 7, aath: 8, nau: 9, das: 10, gyarah: 11, barah: 12,
    tera: 13, chaudah: 15, pandrah: 15, solah: 16, satrah: 17, atharah: 18,
    unnis: 19, bees: 20, pachees: 25, tees: 30, paitalis: 40, pachas: 50,
    saath: 60, sattar: 70, assi: 80, nabbe: 90, sau: 100,
  };
  const lower = text.toLowerCase();
  for (const [word, num] of Object.entries(wordMap)) {
    if (lower.includes(word)) return num;
  }
  const match = lower.match(/(\d+)/);
  if (match) return parseInt(match[1], 10);
  return null;
}

function extractRollNo(text: string): string | null {
  const m = text.match(/roll\s*(?:number|no|#|num)?\s*(\d+)/i);
  if (m) return m[1];
  const m2 = text.match(/(\d+)\s*(?:number|roll|sila)/i);
  if (m2) return m2[1];
  return null;
}

export function parseMutation(text: string, subjects: string[]): MutationAction | null {
  const lower = text.toLowerCase();
  const marks = extractNumber(text);
  const rollNo = extractRollNo(lower);

  const detectedSubject = detectSubject(text, subjects);

  // "passing marks" is a query, not a mutation — detect before anything else
  if (/passing\s*marks|pass\s*marks|minimum\s*marks|pass\s*kitn[ei]/i.test(lower)) return null;

  let studentName: string | null = null;
  const namePatterns = [
    /(?:for|of|ka|ke|ki|ko|name|student)\s+([a-zA-Z\u0600-\u06FF]+(?:\s+[a-zA-Z\u0600-\u06FF]+)?)/i,
    /([a-zA-Z\u0600-\u06FF]+)\s+(?:ka|ke|ki|ko|marks|ki marks)/i,
  ];
  for (const pat of namePatterns) {
    const m = text.match(pat);
    if (m) {
      const name = m[1].trim();
      const skip = ["add", "give", "set", "put", "enter", "marks", "in", "mein", "for", "of", "roll", "number", "math", "english", "urdu", "science", "total", "ka", "ki", "ko", "passing", "pass", "btao", "bataye", "sirf"];
      if (!skip.includes(name.toLowerCase())) {
        studentName = name;
        break;
      }
    }
  }

  // Mutation verbs only — NOT just "marks" alone
  const isAdd = /(?:add|give|set|put|enter|daalo|dalo|jodo|plus|lagao|dedo)\s+/i.test(lower);
  const isUpdate = /(?:update|change|correct|fix|alter|badlo|modify|theek|sudharo|replace|edit)\s+/i.test(lower);
  const isDelete = /(?:delete|remove|hatao|hatado|khatam|discard|drop)\s+/i.test(lower);
  const isAddStudent = /(?:add|insert|naya|naye|new)\s+(?:student|banda|bacha|pupil)/i.test(lower);
  const isCreateExam = /(?:create|make|new|naya|banayein|banao|start|shuru|setup)\s*(?:.*?\s*)?(?:exam|test|paper|imtihan|pariksha)/i.test(lower);

  if ((isAdd || isUpdate) && marks !== null) {
    const subject = detectedSubject || subjects[0] || "Unknown";
    const type = isUpdate ? "update_marks" : "add_marks";
    return { type, studentName, rollNo, subject, marks };
  }

  if (isDelete) {
    const nameOnly = lower.replace(/(?:delete|remove|hatao|hatado|khatam|remove karo|discard|drop)\s*/i, "").trim();
    const nameWords = nameOnly.split(/\s+/).filter(w => !["student", "roll", "number", "banda", "bacha", "pupil", "from", "se", "exam"].includes(w));
    return { type: "delete_student", studentName: nameWords.join(" ") || null, rollNo };
  }

  if (isAddStudent) {
    const nameMatch2 = text.match(/(?:add|insert|naya|naye|new)\s+(?:student|roll|banda|bacha|pupil)\s+(.+?)(?:\s+roll|\s+number|\s+as|\s+called|\s+naam|$)/i);
    const name = nameMatch2?.[1]?.trim() || "Student";
    return { type: "add_student", studentName: name, rollNo: rollNo || String(Math.floor(Math.random() * 1000) + 1) };
  }

  if (isCreateExam) {
    const examName = text.match(/(?:exam|test|paper|imtihan)\s+(?:called|named|ka naam|naam)?\s*(.+?)(?:\s+class|\s+section|\s+for|\s+ka|\s+ki|$)/i)?.[1]?.trim()
      || text.match(/(?:create|make|new|naya|banayein|banao|start|shuru|setup)\s+(.+?)(?:\s+exam|\s+test|\s+paper)/i)?.[1]?.trim()
      || "New Exam";
    const className = text.match(/class\s+(\w+)/i)?.[1] || "";
    const section = text.match(/section\s+(\w+)/i)?.[1] || "";
    return { type: "create_exam", examName, className, section };
  }

  return null;
}

export function describeMutation(action: MutationAction): string {
  switch (action.type) {
    case "add_marks": return `${action.studentName || "Student"} ko ${action.subject} mein ${action.marks} marks dena.`;
    case "update_marks": return `${action.studentName || "Student"} ke ${action.subject} marks ${action.marks} karna.`;
    case "delete_student": return `${action.studentName || "Student"} ko exam se hatana.`;
    case "add_student": return `${action.studentName} (roll ${action.rollNo}) ko exam mein add karna.`;
    case "create_exam": return `Naya exam "${action.examName}" create karna.`;
  }
}

function ordinal(n: number): string {
  if (n === 0) return "";
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
