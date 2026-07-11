import type { PaperTemplate } from "@/lib/paperFormat";

export type QuestionType = "descriptive" | "mcq" | "fillblanks" | "truefalse" | "maths";

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
}

export interface PaperState {
  schoolName: string;
  schoolLogo: string | null;
  time: string;
  totalMarks: string;
  obtainedMarks: string;
  className: string;
  subject: string;
  paperTitle: string;
  date: string;
  teacherSignature: string;
  principalSignature: string;
  studentNameLabel: string;
  fatherNameLabel: string;
  paperLanguage: "en" | "ur" | "sd";
  paperTemplate: PaperTemplate;
  questions: Question[];
}

export type PaperAction =
  | { type: "SET_SCHOOL_NAME"; payload: string }
  | { type: "SET_SCHOOL_LOGO"; payload: string | null }
  | { type: "SET_TIME"; payload: string }
  | { type: "SET_TOTAL_MARKS"; payload: string }
  | { type: "SET_OBTAINED_MARKS"; payload: string }
  | { type: "SET_CLASS"; payload: string }
  | { type: "SET_SUBJECT"; payload: string }
  | { type: "SET_PAPER_TITLE"; payload: string }
  | { type: "SET_DATE"; payload: string }
  | { type: "SET_TEACHER_SIGNATURE"; payload: string }
  | { type: "SET_PRINCIPAL_SIGNATURE"; payload: string }
  | { type: "SET_STUDENT_NAME_LABEL"; payload: string }
  | { type: "SET_FATHER_NAME_LABEL"; payload: string }
  | { type: "SET_PAPER_LANGUAGE"; payload: "en" | "ur" | "sd" }
  | { type: "SET_PAPER_TEMPLATE"; payload: PaperTemplate }
  | { type: "ADD_QUESTION"; payload: Question }
  | { type: "UPDATE_QUESTION"; payload: { id: string; text: string } }
  | { type: "UPDATE_QUESTION_TYPE"; payload: { id: string; type: QuestionType } }
  | { type: "DELETE_QUESTION"; payload: string }
  | { type: "REORDER_QUESTIONS"; payload: Question[] }
  | { type: "HYDRATE"; payload: PaperState }
  | { type: "RESET" };

export const initialState: PaperState = {
  schoolName: "",
  schoolLogo: null,
  time: "3 Hours",
  totalMarks: "",
  obtainedMarks: "",
  className: "",
  subject: "",
  paperTitle: "",
  date: "",
  teacherSignature: "",
  principalSignature: "",
  studentNameLabel: "Student Name",
  fatherNameLabel: "Father's Name",
  paperLanguage: "en",
  paperTemplate: "english",
  questions: [],
};

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  descriptive: "Descriptive",
  mcq: "Multiple Choice",
  fillblanks: "Fill in the Blanks",
  truefalse: "True / False",
  maths: "Maths Question",
};
