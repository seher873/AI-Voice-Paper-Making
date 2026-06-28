export interface Question {
  id: string;
  text: string;
}

export interface FooterData {
  teacherSignature: string;
  principalSignature: string;
  total: string;
}

export interface PaperState {
  schoolName: string;
  schoolLogo: string | null;
  time: string;
  totalMarks: string;
  className: string;
  subject: string;
  paperTitle: string;
  studentNameLabel: string;
  fatherNameLabel: string;
  questions: Question[];
  footer: FooterData;
}

export type PaperAction =
  | { type: "SET_SCHOOL_NAME"; payload: string }
  | { type: "SET_SCHOOL_LOGO"; payload: string | null }
  | { type: "SET_TIME"; payload: string }
  | { type: "SET_TOTAL_MARKS"; payload: string }
  | { type: "SET_CLASS"; payload: string }
  | { type: "SET_SUBJECT"; payload: string }
  | { type: "SET_PAPER_TITLE"; payload: string }
  | { type: "SET_STUDENT_NAME_LABEL"; payload: string }
  | { type: "SET_FATHER_NAME_LABEL"; payload: string }
  | { type: "ADD_QUESTION"; payload: Question }
  | { type: "UPDATE_QUESTION"; payload: { id: string; text: string } }
  | { type: "DELETE_QUESTION"; payload: string }
  | { type: "REORDER_QUESTIONS"; payload: Question[] }
  | { type: "SET_FOOTER"; payload: Partial<FooterData> }
  | { type: "RESET" };

export const initialState: PaperState = {
  schoolName: "",
  schoolLogo: null,
  time: "3 Hours",
  totalMarks: "100",
  className: "",
  subject: "",
  paperTitle: "",
  studentNameLabel: "Student Name",
  fatherNameLabel: "Father's Name",
  questions: [],
  footer: {
    teacherSignature: "",
    principalSignature: "",
    total: "",
  },
};
