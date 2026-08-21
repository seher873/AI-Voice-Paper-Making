import type { Exam, StudentResult, StudentMark } from "@/types/result";
import { getSupabase } from "./supabase";

export type MutationAction =
  | { type: "add_marks"; studentName: string | null; rollNo: string | null; subject: string; marks: number }
  | { type: "update_marks"; studentName: string | null; rollNo: string | null; subject: string; marks: number }
  | { type: "delete_student"; studentName: string | null; rollNo: string | null }
  | { type: "add_student"; studentName: string; rollNo: string }
  | { type: "create_exam"; examName: string; className: string; section: string };

interface ParsedQuery {
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

function detectStudentName(text: string, studentNames: string[]): string | null {
  const lower = text.toLowerCase();

  const stopwords = ["ki", "ke", "ka", "ko", "ne", "hai", "h", "hain", "kaun", "kya", "batao", "bata", "kitni", "kitne", "kitna", "mein", "se", "kiya", "wala", "vala", "ahai", "ka", "ki", "ke", "kauns", "kaunsa", "kaunsi", "marks", "grade", "position", "total", "percentage", "percent", "pass", "fail", "status", "result", "number", "roll", "average", "topper", "highest", "lowest", "students", "subject", "remark", "school", "database", "data", "activity", "active", "admin", "all", "kya", "bolo", "sunao", "jano"];

  const words = lower.split(/\s+/).filter(Boolean);

  const potentialNames: string[] = [];
  for (let i = 0; i < words.length; i++) {
    if (words.length > 1 && i < words.length - 1) {
      const bigram = words[i] + " " + words[i + 1];
      if (!stopwords.includes(words[i]) && !stopwords.includes(words[i + 1])) {
        potentialNames.push(bigram);
      }
    }
    if (!stopwords.includes(words[i]) && words[i].length > 1) {
      potentialNames.push(words[i]);
    }
  }

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

function detectMetric(text: string): string {
  const lower = text.toLowerCase();
  if (/kitn[ei]\s+student|total\s+student|student.*count|kitn[ei]\s+bacch[ei]/i.test(lower)) return "studentCount";
  if (/pass\s+kitn[ei]|kitn[ei]\s+pass|pass.*count/i.test(lower)) return "passCount";
  if (/fail\s+kitn[ei]|kitn[ei]\s+fail|fail.*count/i.test(lower)) return "failCount";
  if (/topper|sab\s+se\s+(zyada|ziyada|acha|achi)|highest|sab\s+se\s+behtareen/i.test(lower)) return "topper";
  if (/lowest|sab\s+se\s+(kam|kharab)|worst|sab\s+se\s+kamzor/i.test(lower)) return "lowest";
  if (/average|ausat/i.test(lower)) return "average";
  if (/position|rank|sthaan/i.test(lower)) return "position";
  if (/grade/i.test(lower)) return "grade";
  if (/pass\s+ya\s+fail|result|kya\s+hua|huiya|guzra/i.test(lower)) return "status";
  if (/percentage|percent|fisad/i.test(lower)) return "percentage";
  if (/total.*marks|marks.*total|total|kul/i.test(lower)) return "totalMarks";
  if (/obtained|marks|number|aye|mile|kitn[ei]/i.test(lower)) return "marks";
  if (/remark|note/i.test(lower)) return "remark";
  return "marks";
}

function ordinal(n: number): string {
  if (n === 0) return "";
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
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

  const exam = ctx.currentExam;
  if (!exam || !exam.results || exam.results.length === 0) {
    return "Koi exam data nahi mila. Pehle exam create karein aur marks enter karein.";
  }

  const subjects = exam.subjects?.map((s) => s.name) || [];
  const results = exam.results;
  const studentNames = results.map((r) => r.studentName);
  const text = query.all.toLowerCase();

  const detectedName = detectStudentName(text, studentNames);
  const detectedSubject = detectSubject(text, subjects);

  const metric = query.metric;

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
    const subInfo = detectedSubject
      ? ` ${detectedSubject} mein ${top.subjectMarks[detectedSubject] ?? 0} marks,`
      : "";
    return `${top.studentName} sab se acha perform kar raha hai — ${top.percentage}% marks, ${top.grade} grade, ${ordinal(top.position)} position.${subInfo} Total ${top.totalObtained} out of ${top.totalMarks}.`;
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
    return `Class ka average ${avg.toFixed(1)}% hai. ${passed} out of ${results.length} students pass hue hain.`;
  }

  if (detectedName) {
    const student = results.find((r) => r.studentName === detectedName);
    if (!student) return `${detectedName} ka record nahi mila.`;

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
      return `${student.studentName} ka grade ${student.grade} hai — ${student.percentage}% marks.`;
    }

    if (metric === "percentage" || metric === "totalMarks") {
      return `${student.studentName} ke ${student.totalObtained} marks hain total ${student.totalMarks} mein se — ${student.percentage}%.`;
    }

    if (metric === "status") {
      if (student.passed) {
        return `${student.studentName} pass ho gaya hai! ${student.grade} grade, ${student.percentage}% marks, ${ordinal(student.position)} position.`;
      } else {
        return `${student.studentName} fail ho gaya hai. ${student.grade} grade, ${student.percentage}% marks.`;
      }
    }

    if (metric === "remark") {
      return `${student.studentName} ka remark hai: ${student.remark || "Koi remark nahi"}.`;
    }

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

  if (detectedSubject) {
    const subDef = exam.subjects?.find((s) => s.name === detectedSubject);
    if (!subDef) return `${detectedSubject} ka subject nahi mila.`;

    const marksArr = results.map((r) => r.subjectMarks[detectedSubject] ?? 0);
    const avg = marksArr.reduce((a, b) => a + b, 0) / marksArr.length;
    const high = Math.max(...marksArr);
    const low = Math.min(...marksArr);
    const topStudent = results.find((r) => (r.subjectMarks[detectedSubject] ?? 0) === high);
    const passedCount = results.filter((r) => (r.subjectMarks[detectedSubject] ?? 0) >= subDef.passingMarks).length;

    return `${detectedSubject} mein: average ${avg.toFixed(1)}, highest ${high} (${topStudent?.studentName || "?"}), lowest ${low}. Total ${results.length} students, ${passedCount} pass, ${results.length - passedCount} fail. Total marks ${subDef.totalMarks}, passing ${subDef.passingMarks}.`;
  }

  const avg = results.reduce((sum, r) => sum + r.percentage, 0) / results.length;
  const passed = results.filter((r) => r.passed).length;
  const sorted = [...results].sort((a, b) => b.percentage - a.percentage);
  const top = sorted[0];

  return `${exam.name} mein total ${results.length} students hain. ${passed} pass, ${results.length - passed} fail. Average ${avg.toFixed(1)}%. Topper: ${top?.studentName || "?"} ${top?.percentage || 0}%. Batayein kis student ya subject ka detail chahiye.`;
}

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

const MUTATION_ADD_MARKS = /(?:add|give|set|put|enter|daalo|dalo|jodo|plus|bayeen|lagao)\s+(?:.*?\s+)?(\d+)\s*(?:marks|number|numbers)?/i;
const MUTATION_UPDATE_MARKS = /(?:update|change|correct|fix|alter|badlo|set|dusra|modify|theek|sudharo)\s+(?:.*?\s+)?(?:marks?\s*(?:to|se|=|ko)\s*)?(\d+)/i;
const MUTATION_DELETE = /(?:delete|remove|hatao|hatado|khatam|remove karo|discard|drop)\s+(?:.*?\s+)?(?:student|roll|banda|bacha|pupil)?/i;
const MUTATION_ADD_STUDENT = /(?:add|insert|naya|naye|new)\s+(?:student|roll|banda|bacha|pupil)/i;
const MUTATION_CREATE_EXAM = /(?:create|make|new|naya|banayein|banao|start|shuru|setup)\s+(?:.*?\s+)?(?:exam|test|paper|imtihan|pariksha)/i;

export function parseMutation(text: string, subjects: string[]): MutationAction | null {
  const lower = text.toLowerCase();
  const marks = extractNumber(text);
  const rollNo = extractRollNo(text);

  const detectedSubject = detectSubject(text, subjects);
  let studentName: string | null = null;
  const nameMatch = text.match(/(?:for|of|ka|ke|ki|ko|name)\s+(.+?)(?:\s+(?:in|mein|subject|ka|ke|ki|marks|roll|number|\d+))/i);
  if (nameMatch) {
    studentName = nameMatch[1].trim();
  }

  if (MUTATION_ADD_MARKS.test(lower) && marks !== null) {
    const subject = detectedSubject || subjects[0] || "Unknown";
    return { type: "add_marks", studentName, rollNo, subject, marks };
  }

  if (MUTATION_UPDATE_MARKS.test(lower) && marks !== null) {
    const subject = detectedSubject || subjects[0] || "Unknown";
    return { type: "update_marks", studentName, rollNo, subject, marks };
  }

  if (MUTATION_DELETE.test(lower)) {
    const nameOnly = text.replace(/(?:delete|remove|hatao|hatado|khatam|remove karo|discard|drop)\s*/i, "").trim();
    const nameWords = nameOnly.split(/\s+/).filter(w => !["student", "roll", "number", "banda", "bacha", "pupil"].includes(w.toLowerCase()));
    return { type: "delete_student", studentName: nameWords.join(" ") || null, rollNo };
  }

  if (MUTATION_ADD_STUDENT.test(lower)) {
    const nameMatch2 = text.match(/(?:add|insert|naya|naye|new)\s+(?:student|roll|banda|bacha|pupil)\s+(.+?)(?:\s+roll|\s+number|\s+as|\s+called|\s+naam|$)/i);
    const name = nameMatch2?.[1]?.trim() || "Student";
    return { type: "add_student", studentName: name, rollNo: rollNo || String(Math.floor(Math.random() * 1000) + 1) };
  }

  if (MUTATION_CREATE_EXAM.test(lower)) {
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
    case "add_marks":
      return `Add ${action.marks} marks in ${action.subject}${action.studentName ? ` for ${action.studentName}` : ""}${action.rollNo ? ` (roll ${action.rollNo})` : ""}?`;
    case "update_marks":
      return `Update ${action.subject} marks to ${action.marks}${action.studentName ? ` for ${action.studentName}` : ""}${action.rollNo ? ` (roll ${action.rollNo})` : ""}?`;
    case "delete_student":
      return `Delete ${action.studentName || `roll ${action.rollNo || "?"}`} from current exam?`;
    case "add_student":
      return `Add student "${action.studentName}" with roll number ${action.rollNo}?`;
    case "create_exam":
      return `Create exam "${action.examName}"${action.className ? ` class ${action.className}` : ""}${action.section ? ` section ${action.section}` : ""}?`;
  }
}
