export type LlmModelName =
  | "gemini-2.5-pro"
  | "gemini-2.5-flash"
  | "gemini-2.5-flash-lite"
  | "gemini-2.0-flash"
  | "gemini-2.0-flash-lite";

export type RubricBand = {
  min_score: number;
  max_score: number;
  description: string;
};

export type RubricCategory = {
  // UI fields
  id: string;
  automated?: boolean;
  description?: string;

  // Backend fields
  name: string;
  max_points: number; // 0..10
  weight: number; // 0..1
  bands: RubricBand[];
};

export type PenaltyRule = {
  code: string;
  description: string;
  points: number; // negative for deduction
};

export type Rubric = {
  categories: RubricCategory[];
  penalties: PenaltyRule[];
};

// Types used for backend request payload
export type RubricCategoryRequest = {
  name: string;
  max_points: number;
  weight: number;
  bands: RubricBand[];
};

export type RubricRequest = {
  categories: RubricCategoryRequest[];
  penalties: PenaltyRule[];
};

export type ScoringRequest = {
  llm_provider: LlmModelName;
  problem_description: string;
  student_code: string;
  programming_language: "cpp"; // backend currently supports only cpp
  rubric: RubricRequest;
  language: string; // output language for feedback
};

export type CategoryBandDecision = {
  min_score: number;
  max_score: number;
  description: string;
  rationale: string;
};

export type CategoryResult = {
  category_name: string;
  raw_score: number; // 0..10
  weight: number; // 0..1
  band_decision: CategoryBandDecision;
};

export type PenaltyApplied = {
  code: string;
  points: number;
  reason?: string | null;
};

export type ScoringResponse = {
  category_results: CategoryResult[];
  penalties_applied: PenaltyApplied[];
  provider_used: LlmModelName;
  feedback?: string | null;
  total_score: number; // 0..10
};


