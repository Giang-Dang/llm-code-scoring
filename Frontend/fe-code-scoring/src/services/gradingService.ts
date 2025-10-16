import type { Rubric, Submission } from "@/types/api";

// API Configuration
const API_BASE_URL = process.env.BACKEND_PUBLIC_API_URL || "http://localhost:8000";

// Backend Rubric Types (without UI fields)
type BackendRubricCategory = {
  name: string;
  max_points: number;
  weight: number;
  bands: Array<{
    min_score: number;
    max_score: number;
    description: string;
  }>;
};

type BackendRubric = {
  categories: BackendRubricCategory[];
  penalties: Array<{
    code: string;
    description: string;
    points: number;
  }>;
};

// Request Types
export type ScoreRequest = {
  llm_provider: "openai" | "gemini" | "deepseek" | "grok" | "lmstudio" | "ollama";
  problem_description: string;
  student_code: string;
  programming_language: string;
  rubric: BackendRubric;
  language: string;
  model: string;
};

// Response Types
export type BandDecision = {
  min_score: number;
  max_score: number;
  description: string;
  rationale: string;
};

export type CategoryResult = {
  category_name: string;
  raw_score: number;
  weight: number;
  band_decision: BandDecision;
};

export type PenaltyApplied = {
  code: string;
  description: string;
  points: number;
};

export type ScoreResponse = {
  category_results: CategoryResult[];
  penalties_applied: PenaltyApplied[];
  provider_used: string;
  feedback: string;
  total_score: number;
};

export type GradingError = {
  error: string;
  detail?: string;
  status?: number;
};

/**
 * Grade a single submission using the backend /score API
 */
export async function gradeSubmission(
  submission: Submission,
  problemDescription: string,
  rubric: Rubric,
  options: {
    model: string;
    llmProvider: "openai" | "gemini" | "deepseek" | "grok" | "lmstudio" | "ollama";
    outputLanguage: string;
  }
): Promise<ScoreResponse> {
  // Transform rubric to remove UI-only fields (id, description, automated)
  const backendRubric = {
    categories: rubric.categories.map(cat => ({
      name: cat.name,
      max_points: cat.max_points,
      weight: cat.weight,
      bands: cat.bands,
    })),
    penalties: rubric.penalties,
  };

  // Map frontend language to backend format
  const programmingLanguage = submission.language;

  const requestBody: ScoreRequest = {
    llm_provider: options.llmProvider,
    problem_description: problemDescription,
    student_code: submission.code,
    programming_language: programmingLanguage,
    rubric: backendRubric,
    language: options.outputLanguage,
    model: options.model,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/score`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        detail: errorData.detail || errorData.message,
        status: response.status,
      } as GradingError;
    }

    const data: ScoreResponse = await response.json();
    return data;
  } catch (error) {
    // Network or parsing errors
    if ((error as GradingError).error) {
      throw error;
    }

    throw {
      error: "Network error",
      detail: error instanceof Error ? error.message : "Failed to connect to grading service",
      status: 0,
    } as GradingError;
  }
}

/**
 * Grade multiple submissions sequentially
 * Returns results as they complete via callback
 */
export async function gradeSubmissions(
  submissions: Submission[],
  problemDescription: string,
  rubric: Rubric,
  options: {
    model: string;
    llmProvider: "openai" | "gemini" | "deepseek" | "grok" | "lmstudio" | "ollama";
    outputLanguage: string;
    onProgress?: (completed: number, total: number, result: ScoreResponse | GradingError) => void;
  }
): Promise<Array<{ submission: Submission; result: ScoreResponse | GradingError }>> {
  const results: Array<{ submission: Submission; result: ScoreResponse | GradingError }> = [];
  const total = submissions.length;

  for (let i = 0; i < submissions.length; i++) {
    const submission = submissions[i];
    
    try {
      const result = await gradeSubmission(submission, problemDescription, rubric, {
        model: options.model,
        llmProvider: options.llmProvider,
        outputLanguage: options.outputLanguage,
      });
      results.push({ submission, result });
      
      if (options.onProgress) {
        options.onProgress(i + 1, total, result);
      }
    } catch (error) {
      const gradingError = error as GradingError;
      results.push({ submission, result: gradingError });
      
      if (options.onProgress) {
        options.onProgress(i + 1, total, gradingError);
      }
    }
  }

  return results;
}

/**
 * Check if result is an error
 */
export function isGradingError(result: ScoreResponse | GradingError): result is GradingError {
  return "error" in result;
}
