"use client";

import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
} from "react";
import { initialState, type PaperState, type PaperAction } from "@/types/paper";

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
    case "ADD_QUESTION":
      return { ...state, questions: [...state.questions, action.payload] };
    case "UPDATE_QUESTION":
      return {
        ...state,
        questions: state.questions.map((q) =>
          q.id === action.payload.id ? { ...q, text: action.payload.text } : q
        ),
      };
    case "DELETE_QUESTION":
      return {
        ...state,
        questions: state.questions.filter((q) => q.id !== action.payload),
      };
    case "REORDER_QUESTIONS":
      return { ...state, questions: action.payload };
    case "RESET":
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
