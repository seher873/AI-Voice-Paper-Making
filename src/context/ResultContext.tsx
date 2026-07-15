"use client";

import { createContext, useContext, useReducer, useCallback, useMemo, type ReactNode } from "react";
import type { ResultState, Exam, Subject, StudentMark, GradeScale, ResultTab, ThemeColors } from "@/types/result";
import { DEFAULT_GRADE_SCALE, DEFAULT_THEME } from "@/types/result";
import { calculateResults, calculateClassStats } from "@/lib/resultEngine";

type ResultAction =
  | { type: "CREATE_EXAM"; payload: Exam }
  | { type: "SET_CURRENT_EXAM"; payload: Exam | null }
  | { type: "SET_SUBJECTS"; payload: Subject[] }
  | { type: "SET_STUDENTS"; payload: StudentMark[] }
  | { type: "UPDATE_STUDENT"; payload: { rollNo: string; subjectMarks: Record<string, number> } }
  | { type: "ADD_STUDENT"; payload: StudentMark }
  | { type: "REMOVE_STUDENT"; payload: string }
  | { type: "SET_GRADE_SCALE"; payload: GradeScale[] }
  | { type: "SET_SCHOOL_INFO"; payload: { name: string; logo: string } }
  | { type: "SET_REPORT_CARD_STATE"; payload: { rollNo: string; remarks: string } }
  | { type: "SET_THEME_COLORS"; payload: ThemeColors }
  | { type: "CALCULATE_RESULTS" }
  | { type: "UPDATE_STUDENT_RESULT"; payload: { rollNo: string; position: number } }
  | { type: "RESET" };

const initialState: ResultState = {
  exams: [],
  currentExam: null,
  students: [],
  results: [],
  classStats: null,
  gradeScale: DEFAULT_GRADE_SCALE,
  schoolName: "",
  schoolLogo: "",
  reportCardRollNo: "",
  reportCardRemarks: "",
  themeColors: DEFAULT_THEME,
};

function resultReducer(state: ResultState, action: ResultAction): ResultState {
  switch (action.type) {
    case "CREATE_EXAM":
      return { ...state, exams: [...state.exams, action.payload], currentExam: action.payload, students: [], results: [], classStats: null };
    case "SET_CURRENT_EXAM":
      return { ...state, currentExam: action.payload, students: [], results: [], classStats: null };
    case "SET_SUBJECTS":
      return { ...state, currentExam: state.currentExam ? { ...state.currentExam, subjects: action.payload } : null };
    case "SET_STUDENTS":
      return { ...state, students: action.payload };
    case "UPDATE_STUDENT":
      return {
        ...state,
        students: state.students.map((s) =>
          s.rollNo === action.payload.rollNo ? { ...s, subjectMarks: action.payload.subjectMarks } : s
        ),
      };
    case "ADD_STUDENT":
      return { ...state, students: [...state.students, action.payload] };
    case "REMOVE_STUDENT":
      return { ...state, students: state.students.filter((s) => s.rollNo !== action.payload) };
    case "SET_GRADE_SCALE":
      return { ...state, gradeScale: action.payload };
    case "SET_SCHOOL_INFO":
      return { ...state, schoolName: action.payload.name, schoolLogo: action.payload.logo };
    case "SET_THEME_COLORS":
      return { ...state, themeColors: action.payload };
    case "SET_REPORT_CARD_STATE":
      return { ...state, reportCardRollNo: action.payload.rollNo, reportCardRemarks: action.payload.remarks };
    case "UPDATE_STUDENT_RESULT":
      return {
        ...state,
        results: state.results.map((r) =>
          r.rollNo === action.payload.rollNo ? { ...r, position: action.payload.position } : r
        ),
      };
    case "CALCULATE_RESULTS": {
      const subjects = state.currentExam?.subjects || [];
      const results = calculateResults(state.students, subjects, state.gradeScale);
      const classStats = calculateClassStats(results, subjects);
      return { ...state, results, classStats };
    }
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

interface ResultContextType {
  state: ResultState;
  dispatch: React.Dispatch<ResultAction>;
  activeTab: ResultTab;
  setActiveTab: (tab: ResultTab) => void;
}

const ResultContext = createContext<ResultContextType | undefined>(undefined);

export function ResultProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(resultReducer, initialState);
  const [activeTab, setActiveTabState] = useReducer((_: ResultTab, tab: ResultTab) => tab, "create-exam" as ResultTab);

  const setActiveTab = useCallback((tab: ResultTab) => setActiveTabState(tab), []);

  const value = useMemo(() => ({ state, dispatch, activeTab, setActiveTab }), [state, activeTab, setActiveTab]);

  return (
    <ResultContext.Provider value={value}>
      {children}
    </ResultContext.Provider>
  );
}

export function useResult() {
  const context = useContext(ResultContext);
  if (!context) {
    throw new Error("useResult must be used within a ResultProvider");
  }
  return context;
}
