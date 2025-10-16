"use client";

import { createContext, useContext, useMemo, useReducer } from "react";
import type { LLMProvider, Rubric, RubricCategory } from "@/types/api";

export type Question = {
  title: string;
  prompt: string;
  constraints: string;
  expectedFormat: string;
};

export type Submission = {
  id: string;
  name: string;
  language: string; // user-selected language (not backend programming_language)
  code: string;
  rubricScores: Record<string, number>; // by rubric category id
  autoScore: number;
  manualAdjustment: number;
  finalScore: number;
  comments: string;
  server?: {
    total?: number;
    feedback?: string | null;
    categoryResults?: Array<{
      name: string;
      raw: number;
      weight: number;
      rationale: string;
    }>;
  };
};

export type UIState = {
  step: 1 | 2 | 3 | 4; // 4 = dashboard
  provider: LLMProvider;
  outputLanguage: string; // e.g., Vietnamese, English
};

export type CodeInputState = {
  activeTab: "single" | "batch";
  singleSubmission: {
    name: string;
    language: string;
    code: string;
  };
  batchLanguage: string;
  uploadedFiles: Array<{ name: string; size: number; status: "pending" | "success" | "error" }>;
};

export type AppState = {
  question: Question;
  rubric: Rubric;
  submissions: Submission[];
  ui: UIState;
  codeInput: CodeInputState;
};

export type Action =
  | { type: "ui/setStep"; step: UIState["step"] }
  | { type: "ui/setProvider"; provider: LLMProvider }
  | { type: "ui/setOutputLanguage"; value: string }
  | { type: "question/update"; update: Partial<Question> }
  | { type: "rubric/set"; rubric: Rubric }
  | { type: "rubric/addCategory"; category: RubricCategory }
  | { type: "rubric/updateCategory"; id: string; update: Partial<RubricCategory> }
  | { type: "rubric/reorder"; from: number; to: number }
  | { type: "rubric/deleteCategory"; id: string }
  | { type: "submissions/add"; submission: Submission }
  | { type: "submissions/update"; id: string; update: Partial<Submission> }
  | { type: "submissions/set"; submissions: Submission[] }
  | { type: "codeInput/setTab"; tab: "single" | "batch" }
  | { type: "codeInput/updateSingle"; update: Partial<CodeInputState["singleSubmission"]> }
  | { type: "codeInput/setBatchLanguage"; language: string }
  | { type: "codeInput/setUploadedFiles"; files: CodeInputState["uploadedFiles"] };

const initialState: AppState = {
  question: { title: "", prompt: "", constraints: "", expectedFormat: "" },
  rubric: { categories: [], penalties: [] },
  submissions: [],
  ui: { step: 1, provider: "gemini", outputLanguage: "Vietnamese" },
  codeInput: {
    activeTab: "single",
    singleSubmission: { name: "", language: "c++", code: "" },
    batchLanguage: "c++",
    uploadedFiles: [],
  },
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "ui/setStep":
      return { ...state, ui: { ...state.ui, step: action.step } };
    case "ui/setProvider":
      return { ...state, ui: { ...state.ui, provider: action.provider } };
    case "ui/setOutputLanguage":
      return { ...state, ui: { ...state.ui, outputLanguage: action.value } };
    case "question/update":
      return { ...state, question: { ...state.question, ...action.update } };
    case "rubric/set":
      return { ...state, rubric: action.rubric };
    case "rubric/addCategory":
      return { ...state, rubric: { ...state.rubric, categories: [...state.rubric.categories, action.category] } };
    case "rubric/updateCategory": {
      const categories = state.rubric.categories.map((c) => (c.id === action.id ? { ...c, ...action.update } : c));
      return { ...state, rubric: { ...state.rubric, categories } };
    }
    case "rubric/reorder": {
      const categories = [...state.rubric.categories];
      const [moved] = categories.splice(action.from, 1);
      categories.splice(action.to, 0, moved);
      return { ...state, rubric: { ...state.rubric, categories } };
    }
    case "rubric/deleteCategory": {
      const categories = state.rubric.categories.filter((c) => c.id !== action.id);
      return { ...state, rubric: { ...state.rubric, categories } };
    }
    case "submissions/add":
      return { ...state, submissions: [...state.submissions, action.submission] };
    case "submissions/update":
      return {
        ...state,
        submissions: state.submissions.map((s) => (s.id === action.id ? { ...s, ...action.update } : s)),
      };
    case "submissions/set":
      return { ...state, submissions: action.submissions };
    case "codeInput/setTab":
      return { ...state, codeInput: { ...state.codeInput, activeTab: action.tab } };
    case "codeInput/updateSingle":
      return { ...state, codeInput: { ...state.codeInput, singleSubmission: { ...state.codeInput.singleSubmission, ...action.update } } };
    case "codeInput/setBatchLanguage":
      return { ...state, codeInput: { ...state.codeInput, batchLanguage: action.language } };
    case "codeInput/setUploadedFiles":
      return { ...state, codeInput: { ...state.codeInput, uploadedFiles: action.files } };
    default:
      return state;
  }
}

const AppStateContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}


