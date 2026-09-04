// ─── Fee System Types ────────────────────────────────────────────────────────

export interface FeeStructure {
  id: string;
  school_id: string;
  class_name: string;
  fee_type: "monthly" | "exams" | "admission" | "annual" | "other";
  amount: number;
  description: string;
  created_at: string;
}

export interface StudentFee {
  id: string;
  school_id: string;
  student_name: string;
  father_name: string;
  class_name: string;
  section: string;
  roll_no: string;
  parent_phone: string;
  fee_structure_id: string | null;
  monthly_fee: number;
  session: string;
  admission_date?: string;
  is_active: boolean;
  created_at: string;
}

export interface FeePayment {
  id: string;
  school_id: string;
  student_fee_id: string;
  month_label: string;   // "August 2026"
  month_year: string;    // "2026-08"
  amount_due: number;
  amount_paid: number;
  status: "paid" | "partial" | "due";
  payment_date: string;
  received_by: string;
  remarks: string;
  created_at: string;
  updated_at: string;
  // Joined fields (from query)
  student?: StudentFee;
}

export type FeeTab = "students" | "collect" | "report" | "slips" | "calendar";

// ─── PKR Formatter ───────────────────────────────────────────────────────────

export function formatPKR(amount: number): string {
  return `PKR ${amount.toLocaleString("en-PK")}`;
}

// ─── Standard Classes (PK schools) ───────────────────────────────────────────

export const STANDARD_CLASSES = [
  "Playgroup", "Nursery", "Prep", "KG",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
];

// ─── Academic Sessions ────────────────────────────────────────────────────────

export function sessionOptions(): string[] {
  const start = new Date().getFullYear() - 1;
  const out: string[] = [];
  for (let i = 0; i < 4; i++) {
    const y = start + i;
    out.push(`${y}-${y + 1}`);
  }
  return out;
}

// ─── Month Helpers ────────────────────────────────────────────────────────────

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function currentMonthLabel(): string {
  const now = new Date();
  return `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
}

export function currentMonthYear(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${mm}`;
}

export function monthYearFromLabel(label: string): string {
  const parts = label.split(" ");
  const month = MONTHS.indexOf(parts[0]);
  const year = parts[1];
  if (month === -1 || !year) return "";
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export function allMonthsForSession(session: string): string[] {
  // session like "2025-2026" or "2026"
  const year = parseInt(session.split("-")[0]) || new Date().getFullYear();
  return [
    ...MONTHS.slice(3).map((m) => `${m} ${year}`),     // April–December
    ...MONTHS.slice(0, 3).map((m) => `${m} ${year + 1}`), // Jan–March
  ];
}

// ─── Status Helpers ───────────────────────────────────────────────────────────

export function calcStatus(amountDue: number, amountPaid: number): "paid" | "partial" | "due" {
  if (amountPaid <= 0) return "due";
  if (amountPaid >= amountDue) return "paid";
  return "partial";
}

export const STATUS_LABELS: Record<string, string> = {
  paid: "Paid ✅",
  partial: "Partial ⚠️",
  due: "Due ❌",
};

export const STATUS_COLORS: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  partial: "bg-yellow-100 text-yellow-700",
  due: "bg-red-100 text-red-700",
};
