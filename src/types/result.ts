export interface GradeScale {
  grade: string;
  min: number;
  max: number;
  remark: string;
}

export interface AssessmentConfig {
  written: boolean;
  oral: boolean;
  practical: boolean;
  activity: boolean;
  skills: boolean;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  totalMarks: number;
  passingMarks: number;
}

export interface Exam {
  id: string;
  name: string;
  session: string;
  className: string;
  section: string;
  date: string;
  subjects: Subject[];
  assessmentConfig: AssessmentConfig;
}

export interface StudentMark {
  rollNo: string;
  studentName: string;
  subjectMarks: Record<string, number>;
}

export interface StudentResult {
  rollNo: string;
  studentName: string;
  subjectMarks: Record<string, number>;
  totalObtained: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  remark: string;
  passed: boolean;
  position: number;
}

export interface ClassStats {
  totalStudents: number;
  passed: number;
  failed: number;
  passPercentage: number;
  failPercentage: number;
  average: number;
  highest: number;
  lowest: number;
  topPerformers: StudentResult[];
  weakStudents: StudentResult[];
  gradeDistribution: Record<string, number>;
  subjectStats: SubjectStat[];
}

export interface SubjectStat {
  subject: string;
  average: number;
  highest: number;
  lowest: number;
  passed: number;
  failed: number;
}

export interface ResultState {
  exams: Exam[];
  currentExam: Exam | null;
  students: StudentMark[];
  results: StudentResult[];
  classStats: ClassStats | null;
  gradeScale: GradeScale[];
  schoolName: string;
  schoolLogo: string;
  reportCardRollNo: string;
  reportCardRemarks: string;
  themeColors: ThemeColors;
}

export interface ThemeColors {
  primary: string;
  accent: string;
  text: string;
  highlight: string;
}

export const DEFAULT_THEME: ThemeColors = {
  primary: "#1e40af",
  accent: "#7c1d3b",
  text: "#475569",
  highlight: "#ca8a04",
};

export const THEME_PRESETS: { label: string; colors: ThemeColors }[] = [
  { label: "Blue & Maroon", colors: { primary: "#1e40af", accent: "#7c1d3b", text: "#475569", highlight: "#ca8a04" } },
  { label: "Green & Gold", colors: { primary: "#15803d", accent: "#b45309", text: "#475569", highlight: "#fbbf24" } },
  { label: "Purple & Teal", colors: { primary: "#6d28d9", accent: "#0d9488", text: "#475569", highlight: "#f59e0b" } },
  { label: "Navy & Red", colors: { primary: "#1e3a5f", accent: "#991b1b", text: "#475569", highlight: "#ca8a04" } },
  { label: "University", colors: { primary: "#1e40af", accent: "#831843", text: "#374151", highlight: "#a16207" } },
];

export const DEFAULT_GRADE_SCALE: GradeScale[] = [
  { grade: "A+", min: 90, max: 100, remark: "Excellent Performance" },
  { grade: "A", min: 80, max: 89, remark: "Very Good Progress" },
  { grade: "B", min: 70, max: 79, remark: "Good Performance" },
  { grade: "C", min: 60, max: 69, remark: "Satisfactory" },
  { grade: "D", min: 50, max: 59, remark: "Needs Improvement" },
  { grade: "F", min: 0, max: 49, remark: "Requires More Practice" },
];

export const DEFAULT_SUBJECTS: Omit<Subject, "id">[] = [
  { name: "English", code: "ENG", totalMarks: 100, passingMarks: 33 },
  { name: "English Grammar", code: "EGR", totalMarks: 100, passingMarks: 33 },
  { name: "Urdu", code: "URD", totalMarks: 100, passingMarks: 33 },
  { name: "Urdu Grammar", code: "UGR", totalMarks: 100, passingMarks: 33 },
  { name: "Mathematics", code: "MTH", totalMarks: 100, passingMarks: 33 },
  { name: "Science", code: "SCI", totalMarks: 100, passingMarks: 33 },
  { name: "Social Studies", code: "SST", totalMarks: 100, passingMarks: 33 },
  { name: "Islamiat", code: "ISL", totalMarks: 100, passingMarks: 33 },
  { name: "Drawing", code: "DRW", totalMarks: 50, passingMarks: 17 },
];

export const ASSESSMENT_PRESETS: { label: string; config: AssessmentConfig }[] = [
  {
    label: "Standard Written Exam",
    config: { written: true, oral: false, practical: false, activity: false, skills: false },
  },
  {
    label: "Primary School Assessment",
    config: { written: true, oral: true, practical: false, activity: true, skills: true },
  },
  {
    label: "Science Practical Exam",
    config: { written: true, oral: false, practical: true, activity: false, skills: false },
  },
  {
    label: "Custom",
    config: { written: true, oral: false, practical: false, activity: false, skills: false },
  },
];

export const ASSESSMENT_LABELS: Record<keyof AssessmentConfig, string> = {
  written: "Written Marks",
  oral: "Oral Marks",
  practical: "Practical Marks",
  activity: "Activity Marks",
  skills: "Skills Assessment",
};

export const DEFAULT_ASSESSMENT: AssessmentConfig = {
  written: true,
  oral: false,
  practical: false,
  activity: false,
  skills: false,
};

export type ResultTab =
  | "create-exam"
  | "manage-subjects"
  | "enter-marks"
  | "bulk-upload"
  | "result-sheet"
  | "report-cards"
  | "position"
  | "analytics";
