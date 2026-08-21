"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { initialState, type PaperState, type PaperProject, type PaperAction } from "@/types/paper";
import { getTemplate } from "@/lib/paperFormat";

const STORAGE_KEY = "paper-maker-state";
const PAPERS_KEY = "paper-maker-projects";

function loadState(): PaperState {
  if (typeof window === "undefined") return initialState;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...initialState, ...parsed };
    }
  } catch { /* ignore */ }
  return initialState;
}

function loadPapers(): PaperProject[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(PAPERS_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return [];
}

function paperReducer(state: PaperState, action: PaperAction): PaperState {
  switch (action.type) {
    case "SET_SCHOOL_NAME":
      return { ...state, schoolName: action.payload };
    case "SET_SCHOOL_ADDRESS":
      return { ...state, schoolAddress: action.payload };
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
        paperTemplate: tpl.id,
        studentNameLabel: tpl.studentNameLabel,
        fatherNameLabel: tpl.fatherNameLabel,
      };
    }
    case "SET_PAPER_TEMPLATE": {
      const tpl = getTemplate(action.payload);
      return {
        ...state,
        paperTemplate: action.payload,
        paperLanguage: tpl.lang,
        studentNameLabel: tpl.studentNameLabel,
        fatherNameLabel: tpl.fatherNameLabel,
      };
    }
    case "SET_SHOW_LOGO_WATERMARK":
      return { ...state, showLogoWatermark: action.payload };
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
    case "UPDATE_QUESTION_OPTIONS":
      return {
        ...state,
        questions: state.questions.map((q) =>
          q.id === action.payload.id ? { ...q, options: action.payload.options } : q
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
    case "LOAD_PAPER": {
      const papers = loadPapers();
      const found = papers.find((p) => p.id === action.payload);
      return found ? { ...found.state } : state;
    }
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
  papers: PaperProject[];
  activePaperId: string | null;
  savePaper: (name: string) => void;
  updateSavedPaper: () => void;
  deletePaper: (id: string) => void;
  renamePaper: (id: string, name: string) => void;
  loadPaperById: (id: string) => void;
  newPaper: () => void;
}

const PaperContext = createContext<PaperContextType | undefined>(undefined);

export function PaperProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(paperReducer, initialState);
  const [papers, setPapers] = useState<PaperProject[]>([]);
  const [activePaperId, setActivePaperId] = useState<string | null>(null);
  const isFirstRender = useRef(true);
  const prevState = useRef(state);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      const saved = loadState();
      if (saved !== initialState) {
        dispatch({ type: "HYDRATE", payload: saved });
      }
      setPapers(loadPapers());
    }
  }, []);

  useEffect(() => {
    if (prevState.current === state) return;
    prevState.current = state;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch { /* ignore */ }
  }, [state]);

  const savePapers = (updated: PaperProject[]) => {
    setPapers(updated);
    try { localStorage.setItem(PAPERS_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
  };

  const savePaper = (name: string) => {
    const id = activePaperId || crypto.randomUUID();
    const now = new Date().toISOString();
    const project: PaperProject = {
      id,
      name: name || state.paperTitle || state.subject || "Untitled Paper",
      createdAt: papers.find((p) => p.id === id)?.createdAt || now,
      updatedAt: now,
      state: { ...state },
    };
    const exists = papers.findIndex((p) => p.id === id);
    const updated = exists >= 0 ? papers.map((p) => (p.id === id ? project : p)) : [...papers, project];
    savePapers(updated);
    setActivePaperId(id);
    try { localStorage.setItem("paper-maker-active-id", id); } catch { /* ignore */ }
  };

  const updateSavedPaper = () => {
    if (!activePaperId) return;
    const now = new Date().toISOString();
    const updated = papers.map((p) =>
      p.id === activePaperId ? { ...p, state: { ...state }, updatedAt: now, name: p.name || state.paperTitle || state.subject || "Untitled" } : p
    );
    savePapers(updated);
  };

  const deletePaper = (id: string) => {
    const updated = papers.filter((p) => p.id !== id);
    savePapers(updated);
    if (activePaperId === id) {
      setActivePaperId(null);
      dispatch({ type: "RESET" });
      try { localStorage.removeItem("paper-maker-active-id"); } catch { /* ignore */ }
    }
  };

  const renamePaper = (id: string, name: string) => {
    const updated = papers.map((p) => (p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p));
    savePapers(updated);
  };

  const loadPaperById = (id: string) => {
    const found = papers.find((p) => p.id === id);
    if (found) {
      dispatch({ type: "HYDRATE", payload: found.state });
      setActivePaperId(id);
      try { localStorage.setItem("paper-maker-active-id", id); } catch { /* ignore */ }
    }
  };

  const newPaper = () => {
    setActivePaperId(null);
    dispatch({ type: "RESET" });
    try { localStorage.removeItem("paper-maker-active-id"); } catch { /* ignore */ }
  };

  return (
    <PaperContext.Provider value={{
      state, dispatch, papers, activePaperId,
      savePaper, updateSavedPaper, deletePaper, renamePaper, loadPaperById, newPaper,
    }}>
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
