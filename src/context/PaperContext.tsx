"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { initialState, type PaperState, type PaperAction } from "@/types/paper";
import { getTemplate } from "@/lib/paperFormat";

const STORAGE_KEY = "paper-maker-state";

function loadState(): PaperState {
  if (typeof window === "undefined") return initialState;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...initialState, ...parsed };
    }
  } catch {
    // ignore
  }
  return initialState;
}

function paperReducer(state: PaperState, action: PaperAction): PaperState {
  switch (action.type) {
    case "SET_SCHOOL_NAME":
      return { ...state, schoolName: action.payload };
    case "SET_SCHOOL_LOGO":
      return { ...state, schoolLogo: action.payload };
    case "SET_TIME":
      return { ...state, time: action.payload };
    case "SET_TOTAL_MARKS":
      return { ...state, totalMarks: action.payload };
    case "SET_OBTAINED_MARKS":
      return { ...state, obtainedMarks: action.payload };
    case "SET_CLASS":
      return { ...state, className: action.payload };
    case "SET_SUBJECT":
      return { ...state, subject: action.payload };
    case "SET_PAPER_TITLE":
      return { ...state, paperTitle: action.payload };
    case "SET_DATE":
      return { ...state, date: action.payload };
    case "SET_TEACHER_SIGNATURE":
      return { ...state, teacherSignature: action.payload };
    case "SET_PRINCIPAL_SIGNATURE":
      return { ...state, principalSignature: action.payload };
    case "SET_STUDENT_NAME_LABEL":
      return { ...state, studentNameLabel: action.payload };
    case "SET_FATHER_NAME_LABEL":
      return { ...state, fatherNameLabel: action.payload };
    case "SET_PAPER_LANGUAGE": {
      const tpl = getTemplate(action.payload === "ur" ? "urdu" : action.payload === "sd" ? "sindhi" : "english");
      return {
        ...state,
        paperLanguage: action.payload,
        studentNameLabel: tpl.studentNameLabel,
        fatherNameLabel: tpl.fatherNameLabel,
      };
    }
    case "ADD_QUESTION":
      return { ...state, questions: [...state.questions, action.payload] };
    case "UPDATE_QUESTION":
      return {
        ...state,
        questions: state.questions.map((q) =>
          q.id === action.payload.id ? { ...q, text: action.payload.text } : q
        ),
      };
    case "UPDATE_QUESTION_TYPE":
      return {
        ...state,
        questions: state.questions.map((q) =>
          q.id === action.payload.id ? { ...q, type: action.payload.type } : q
        ),
      };
    case "DELETE_QUESTION":
      return {
        ...state,
        questions: state.questions.filter((q) => q.id !== action.payload),
      };
    case "REORDER_QUESTIONS":
      return { ...state, questions: action.payload };
    case "HYDRATE":
      return { ...action.payload, questions: action.payload.questions || [] };
    case "RESET":
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
      return initialState;
    default:
      return state;
  }
}

interface PaperContextType {
  state: PaperState;
  dispatch: React.Dispatch<PaperAction>;
}

const PaperContext = createContext<PaperContextType | undefined>(undefined);

export function PaperProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(paperReducer, initialState);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      const saved = loadState();
      if (saved !== initialState) {
        dispatch({ type: "HYDRATE", payload: saved });
      }
    }
  }, []);

  const prevState = useRef(state);
  useEffect(() => {
    if (prevState.current === state) return;
    prevState.current = state;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  return (
    <PaperContext.Provider value={{ state, dispatch }}>
      {children}
    </PaperContext.Provider>
  );
}

export function usePaper() {
  const context = useContext(PaperContext);
  if (!context) {
    throw new Error("usePaper must be used within a PaperProvider");
  }
  return context;
}
