"use client";

import { createContext, useContext, useReducer, useCallback, useMemo, type ReactNode } from "react";
import type { ResultState, Exam, Subject, StudentMark, StudentResult, GradeScale, ResultTab, ThemeColors } from "@/types/result";
import { DEFAULT_GRADE_SCALE, DEFAULT_THEME } from "@/types/result";
import { calculateResults, calculateClassStats } from "@/lib/resultEngine";

type ResultAction =
  | { type: "CREATE_EXAM"; payload: Exam }
  | { type: "DELETE_EXAM"; payload: string }
  | { type: "SET_CURRENT_EXAM"; payload: Exam | null }
  | { type: "SET_SUBJECTS"; payload: Subject[] }
  | { type: "SET_STUDENTS"; payload: StudentMark[] }
  | { type: "ADD_STUDENTS"; payload: StudentMark[] }
  | { type: "UPDATE_STUDENT"; payload: StudentMark }
  | { type: "ADD_STUDENT"; payload: StudentMark }
  | { type: "REMOVE_STUDENT"; payload: string }
  | { type: "SET_GRADE_SCALE"; payload: GradeScale[] }
  | { type: "SET_SCHOOL_INFO"; payload: { name: string; logo: string; address?: string } }
  | { type: "SET_REPORT_CARD_STATE"; payload: { rollNo: string; remarks: string } }
  | { type: "SET_THEME_COLORS"; payload: ThemeColors }
  | { type: "SET_WATERMARK"; payload: boolean }
  | { type: "SET_WATERMARK_COLOR"; payload: boolean }
  | { type: "CALCULATE_RESULTS" }
  | { type: "UPDATE_STUDENT_RESULT"; payload: { rollNo: string; position: number; overridden: boolean } }
  | { type: "RESET_POSITIONS" }
  | { type: "HYDRATE"; payload: Partial<ResultState> }
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
  schoolAddress: "",
  reportCardRollNo: "",
  reportCardRemarks: "",
  themeColors: DEFAULT_THEME,
  reportCardWatermark: true,
  reportCardWatermarkColor: false,
};

export function resultReducer(state: ResultState, action: ResultAction): ResultState {
  const snapshotExam = (students: StudentMark[], results: StudentResult[]): ResultState => {
    const currentExam = state.currentExam ? { ...state.currentExam, students, results } : null;
    return {
      ...state,
      students,
      results,
      currentExam,
      exams: currentExam ? state.exams.map((e) => (e.id === currentExam.id ? currentExam : e)) : state.exams,
    };
  };
  switch (action.type) {
    case "CREATE_EXAM":
      return { ...state, exams: [...state.exams, action.payload], currentExam: action.payload, students: [], results: [], classStats: null };
    case "DELETE_EXAM": {
      const remaining = state.exams.filter((e) => e.id !== action.payload);
      const wasCurrent = state.currentExam?.id === action.payload;
      if (!wasCurrent) return { ...state, exams: remaining };
      const next = remaining[remaining.length - 1] || null;
      return {
        ...state,
        exams: remaining,
        currentExam: next,
        students: next?.students || [],
        results: next?.results || [],
        classStats: next?.results?.length ? calculateClassStats(next.results, next.subjects) : null,
      };
    }
    case "SET_CURRENT_EXAM":
      return {
        ...state,
        currentExam: action.payload,
        students: action.payload?.students || [],
        results: action.payload?.results || [],
        classStats: action.payload?.results?.length
          ? calculateClassStats(action.payload.results, action.payload.subjects)
          : null,
      };
    case "SET_SUBJECTS": {
      const currentExam = state.currentExam ? { ...state.currentExam, subjects: action.payload } : null;
      return {
        ...state,
        currentExam,
        exams: currentExam ? state.exams.map((e) => (e.id === currentExam.id ? currentExam : e)) : state.exams,
      };
    }
    case "SET_STUDENTS":
      return snapshotExam(action.payload, state.results);
    case "ADD_STUDENTS": {
      const merged = [...state.students];
      for (const student of action.payload) {
        const idx = merged.findIndex((s) => s.rollNo === student.rollNo);
        if (idx === -1) {
          merged.push(student);
        } else {
          merged[idx] = student;
        }
      }
      return snapshotExam(merged, state.results);
    }
    case "UPDATE_STUDENT":
      return snapshotExam(
        state.students.map((s) => (s.rollNo === action.payload.rollNo ? { ...action.payload } : s)),
        state.results
      );
    case "ADD_STUDENT":
      return snapshotExam([...state.students, action.payload], state.results);
    case "REMOVE_STUDENT":
      return snapshotExam(
        state.students.filter((s) => s.rollNo !== action.payload),
        state.results
      );
    case "SET_GRADE_SCALE":
      return { ...state, gradeScale: action.payload };
    case "SET_SCHOOL_INFO":
      return { ...state, schoolName: action.payload.name, schoolLogo: action.payload.logo, schoolAddress: action.payload.address ?? state.schoolAddress };
    case "SET_THEME_COLORS":
      return { ...state, themeColors: action.payload };
    case "SET_WATERMARK":
      return { ...state, reportCardWatermark: action.payload };
    case "SET_WATERMARK_COLOR":
      return { ...state, reportCardWatermarkColor: action.payload };
    case "SET_REPORT_CARD_STATE":
      return { ...state, reportCardRollNo: action.payload.rollNo, reportCardRemarks: action.payload.remarks };
    case "UPDATE_STUDENT_RESULT":
      return snapshotExam(
        state.students.map((s) =>
          s.rollNo === action.payload.rollNo
            ? { ...s, position: action.payload.overridden ? action.payload.position : undefined, positionOverridden: action.payload.overridden }
            : s
        ),
        state.results.map((r) => (r.rollNo === action.payload.rollNo ? { ...r, position: action.payload.position } : r))
      );
    case "CALCULATE_RESULTS": {
      const subjects = state.currentExam?.subjects || [];
      const results = calculateResults(state.students, subjects, state.gradeScale);
      const classStats = calculateClassStats(results, subjects);
      return { ...snapshotExam(state.students, results), classStats };
    }
    case "RESET_POSITIONS":
      return snapshotExam(
        state.students.map((s) => ({ ...s, position: undefined, positionOverridden: false })),
        state.results.map((r) => ({ ...r, position: 0 }))
      );
    case "HYDRATE":
      return {
        ...initialState,
        ...action.payload,
        exams: action.payload.exams || [],
        students: action.payload.students || [],
        results: action.payload.results || [],
        gradeScale: action.payload.gradeScale || DEFAULT_GRADE_SCALE,
      };
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
