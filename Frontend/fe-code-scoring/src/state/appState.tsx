"use client";

import { createContext, useContext, useMemo, useReducer } from "react";
import type { LlmModelName, Rubric, RubricCategory } from "@/types/api";

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
  step: 1 | 2 | 3 | 4 | 5 | 6; // 6 = dashboard
  model: LlmModelName;
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
  uploadedFiles: Array<{ name: string; size: number; status: "pending" | "success" | "error"; code?: string; submissionId?: string }>;
};

export type GradingResult = {
  submissionId: string;
  status: "pending" | "grading" | "completed" | "error";
  result?: {
    category_results: Array<{
      category_name: string;
      raw_score: number;
      weight: number;
      band_decision: {
        min_score: number;
        max_score: number;
        description: string;
        rationale: string;
      };
    }>;
    penalties_applied: Array<{
      code: string;
      description: string;
      points: number;
    }>;
    provider_used: string;
    feedback: string;
    total_score: number;
  };
  error?: string;
};

export type AppState = {
  question: Question;
  rubric: Rubric;
  submissions: Submission[];
  ui: UIState;
  codeInput: CodeInputState;
  gradingResults: GradingResult[];
};

export type Action =
  | { type: "ui/setStep"; step: UIState["step"] }
  | { type: "ui/setModel"; model: LlmModelName }
  | { type: "ui/setOutputLanguage"; value: string }
  | { type: "question/update"; update: Partial<Question> }
  | { type: "rubric/set"; rubric: Rubric }
  | { type: "rubric/addCategory"; category: RubricCategory }
  | { type: "rubric/updateCategory"; id: string; update: Partial<RubricCategory> }
  | { type: "rubric/reorder"; from: number; to: number }
  | { type: "rubric/deleteCategory"; id: string }
  | { type: "submissions/add"; submission: Submission }
  | { type: "submissions/update"; id: string; update: Partial<Submission> }
  | { type: "submissions/delete"; id: string }
  | { type: "submissions/set"; submissions: Submission[] }
  | { type: "codeInput/setTab"; tab: "single" | "batch" }
  | { type: "codeInput/updateSingle"; update: Partial<CodeInputState["singleSubmission"]> }
  | { type: "codeInput/setBatchLanguage"; language: string }
  | { type: "codeInput/setUploadedFiles"; files: CodeInputState["uploadedFiles"] }
  | { type: "grading/initResults"; submissionIds: string[] }
  | { type: "grading/updateStatus"; submissionId: string; status: GradingResult["status"] }
  | { type: "grading/setResult"; submissionId: string; result: GradingResult["result"] }
  | { type: "grading/setError"; submissionId: string; error: string };

const initialState: AppState = {
  question: { title: "", prompt: "", constraints: "", expectedFormat: "" },
  rubric: { categories: [], penalties: [] },
  gradingResults: [],
  submissions: [],
  ui: { step: 1, model: "gemini-2.0-flash-lite", outputLanguage: "Vietnamese" },
  codeInput: {
    activeTab: "single",
    singleSubmission: { name: "", language: "cpp", code: "" },
    batchLanguage: "cpp",
    uploadedFiles: [],
  },
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "ui/setStep":
      return { ...state, ui: { ...state.ui, step: action.step } };
    case "ui/setModel":
      return { ...state, ui: { ...state.ui, model: action.model } };
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
    case "submissions/delete":
      return {
        ...state,
        submissions: state.submissions.filter((s) => s.id !== action.id),
        gradingResults: state.gradingResults.filter((r) => r.submissionId !== action.id),
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
    case "grading/initResults":
      return {
        ...state,
        gradingResults: action.submissionIds.map(id => ({
          submissionId: id,
          status: "pending",
        })),
      };
    case "grading/updateStatus": {
      const gradingResults = state.gradingResults.map(r =>
        r.submissionId === action.submissionId ? { ...r, status: action.status } : r
      );
      return { ...state, gradingResults };
    }
    case "grading/setResult": {
      const gradingResults = state.gradingResults.map(r =>
        r.submissionId === action.submissionId
          ? { ...r, status: "completed" as const, result: action.result }
          : r
      );
      return { ...state, gradingResults };
    }
    case "grading/setError": {
      const gradingResults = state.gradingResults.map(r =>
        r.submissionId === action.submissionId
          ? { ...r, status: "error" as const, error: action.error }
          : r
      );
      return { ...state, gradingResults };
    }
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


