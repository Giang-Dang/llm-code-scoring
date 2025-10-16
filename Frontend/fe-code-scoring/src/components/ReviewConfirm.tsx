"use client";

import { useState } from "react";
import { useAppState } from "@/state/appState";
import { gradeSubmission, isGradingError } from "@/services/gradingService";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";

export function ReviewConfirm() {
  const { state, dispatch } = useAppState();
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [viewingCategory, setViewingCategory] = useState<
    (typeof state.rubric.categories)[0] | null
  >(null);
  const [viewingSubmission, setViewingSubmission] = useState<
    (typeof state.submissions)[0] | null
  >(null);

  const modelLabels: Record<string, string> = {
    "gemini-2.0-flash-lite": "Gemini 2.0 Flash Lite",
    "gemini-2.0-flash": "Gemini 2.0 Flash",
    "gemini-2.5-flash-lite": "Gemini 2.5 Flash Lite",
    "gemini-2.5-flash": "Gemini 2.5 Flash",
    "gemini-2.5-pro": "Gemini 2.5 Pro",
  };

  const totalWeight = state.rubric.categories.reduce(
    (sum, cat) => sum + cat.weight,
    0
  );
  const isWeightValid = Math.abs(totalWeight - 1) < 0.01;

  // Get language extensions for CodeMirror
  const getLanguageExtensions = (language: string) => {
    switch (language.toLowerCase()) {
      case "python":
        return [python()];
      case "javascript":
        return [javascript({ jsx: true, typescript: true })];
      case "cpp":
      case "c++":
        return [cpp()];
      default:
        return [javascript({ jsx: true, typescript: true })];
    }
  };

  const handleStartGrading = () => {
    if (
      state.submissions.length === 0 ||
      state.rubric.categories.length === 0 ||
      !isWeightValid
    ) {
      return;
    }

    // Initialize grading results for all submissions
    const submissionIds = state.submissions.map((s) => s.id);
    dispatch({ type: "grading/initResults", submissionIds });

    // Navigate to Results page immediately
    dispatch({ type: "ui/setStep", step: 6 });

    // Start grading in background
    state.submissions.forEach(async (submission) => {
      try {
        // Update status to grading
        dispatch({
          type: "grading/updateStatus",
          submissionId: submission.id,
          status: "grading",
        });

        const result = await gradeSubmission(
          submission,
          state.question.prompt,
          state.rubric,
          {
            model: state.ui.model,
            llmProvider: "gemini",
            outputLanguage: state.ui.outputLanguage,
          }
        );

        if (isGradingError(result)) {
          dispatch({
            type: "grading/setError",
            submissionId: submission.id,
            error: result.detail || result.error,
          });
        } else {
          dispatch({
            type: "grading/setResult",
            submissionId: submission.id,
            result,
          });
        }
      } catch (error) {
        dispatch({
          type: "grading/setError",
          submissionId: submission.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-neutral-900">
          Review & Confirm
        </h2>
        <p className="text-neutral-600">
          Please review all your configurations before starting the evaluation
        </p>
      </div>

      {/* Question Summary */}
      <div className="rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900">Question</h3>
              <button
                onClick={() => dispatch({ type: "ui/setStep", step: 1 })}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                Edit
              </button>
            </div>
          </div>

          {/* View Button - Aligned with header */}
          <button
            onClick={() => setShowQuestionModal(true)}
            className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all flex items-center gap-2 shadow-sm hover:shadow"
            title="View full question details"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            View
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <div className="text-sm font-semibold text-neutral-700 mb-1">
              Title
            </div>
            <div className="text-neutral-900">
              {state.question.title || (
                <span className="text-neutral-400 italic">Not set</span>
              )}
            </div>
          </div>
          {state.question.prompt && (
            <div>
              <div className="text-sm font-semibold text-neutral-700 mb-1">
                Prompt
              </div>
              <div className="text-neutral-900 text-sm line-clamp-3">
                {state.question.prompt}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rubric Summary */}
      <div className="rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-neutral-900">Rubric</h3>
            <button
              onClick={() => dispatch({ type: "ui/setStep", step: 2 })}
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              Edit
            </button>
          </div>
          {!isWeightValid && (
            <div className="text-sm text-red-600 font-semibold">
              ⚠ Weights don&apos;t sum to 1.0
            </div>
          )}
        </div>
        <div className="space-y-2">
          {state.rubric.categories.length === 0 ? (
            <div className="text-neutral-400 italic text-sm">
              No categories defined
            </div>
          ) : (
            state.rubric.categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-semibold text-neutral-900">
                    {cat.name}
                  </div>
                  <div className="text-xs text-neutral-600">
                    Max: {cat.max_points} points • {cat.bands.length} bands
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-semibold text-neutral-700">
                    Weight: {(cat.weight * 100).toFixed(0)}%
                  </div>
                  <button
                    onClick={() => setViewingCategory(cat)}
                    className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    View
                  </button>
                </div>
              </div>
            ))
          )}
          {state.rubric.penalties.length > 0 && (
            <div className="mt-3 pt-3 border-t border-neutral-200">
              <div className="text-sm font-semibold text-neutral-700 mb-2">
                Penalties: {state.rubric.penalties.length}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submissions Summary */}
      <div className="rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900">
              Code Submissions
            </h3>
            <button
              onClick={() => dispatch({ type: "ui/setStep", step: 3 })}
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              Edit
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {state.submissions.length === 0 ? (
            <div className="text-neutral-400 italic text-sm">
              No submissions added
            </div>
          ) : (
            <>
              <div className="text-sm font-semibold text-neutral-700 mb-2">
                {state.submissions.length} submission
                {state.submissions.length !== 1 ? "s" : ""} ready for grading
              </div>
              <div className="space-y-2">
                {[...state.submissions]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .slice(0, 5)
                  .map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-teal-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-neutral-900">
                          {sub.name}
                        </div>
                        <div className="text-xs text-neutral-600">
                          {sub.language} • {sub.code.length} chars
                        </div>
                      </div>
                      <button
                        onClick={() => setViewingSubmission(sub)}
                        className="px-3 py-1.5 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors flex items-center gap-1.5"
                        title="View code"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        View
                      </button>
                    </div>
                  ))}
                {state.submissions.length > 5 && (
                  <div className="text-sm text-neutral-500 text-center">
                    +{state.submissions.length - 5} more
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Grading Settings Summary */}
      <div className="rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900">
              Grading Settings
            </h3>
            <button
              onClick={() => dispatch({ type: "ui/setStep", step: 4 })}
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              Edit
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-semibold text-neutral-700 mb-1">
              AI Model
            </div>
            <div className="text-neutral-900">
              {modelLabels[state.ui.model] || state.ui.model}
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-neutral-700 mb-1">
              Output Language
            </div>
            <div className="text-neutral-900">{state.ui.outputLanguage}</div>
          </div>
        </div>
      </div>

      {/* Validation Warnings */}
      {(state.submissions.length === 0 ||
        state.rubric.categories.length === 0 ||
        !isWeightValid) && (
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-amber-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-1">
              <div className="font-semibold text-amber-900 mb-2">
                Please address the following issues:
              </div>
              <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                {state.submissions.length === 0 && (
                  <li>No code submissions added</li>
                )}
                {state.rubric.categories.length === 0 && (
                  <li>No rubric categories defined</li>
                )}
                {!isWeightValid && (
                  <li>
                    Rubric category weights must sum to 1.0 (currently{" "}
                    {totalWeight.toFixed(2)})
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4">
        <button
          className="btn-secondary flex items-center gap-2 px-6 py-3"
          onClick={() => dispatch({ type: "ui/setStep", step: 4 })}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Settings
        </button>
        <button
          className="btn-primary flex items-center gap-2 px-8 py-3 text-base font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleStartGrading}
          disabled={
            state.submissions.length === 0 ||
            state.rubric.categories.length === 0 ||
            !isWeightValid
          }
        >
          <span>Start Grading</span>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
            />
          </svg>
        </button>
      </div>

      {/* Submission Code View Modal */}
      {viewingSubmission && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setViewingSubmission(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-600 p-8 text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                    backgroundSize: "32px 32px",
                  }}
                ></div>
              </div>

              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-bold mb-2">
                    {viewingSubmission.name}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium">
                      {viewingSubmission.language}
                    </span>
                    <span className="text-teal-100 text-sm">
                      {viewingSubmission.code.length} characters
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setViewingSubmission(null)}
                  className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                  aria-label="Close modal"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
              <div className="rounded-xl overflow-hidden border border-neutral-300 shadow-sm">
                <CodeMirror
                  value={viewingSubmission.code}
                  extensions={getLanguageExtensions(viewingSubmission.language)}
                  editable={false}
                  basicSetup={{
                    lineNumbers: true,
                    highlightActiveLineGutter: false,
                    highlightActiveLine: false,
                    foldGutter: true,
                  }}
                  style={{ fontSize: "14px" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rubric Category View Modal */}
      {viewingCategory && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setViewingCategory(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-amber-600 via-amber-500 to-orange-600 p-8 text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                    backgroundSize: "32px 32px",
                  }}
                ></div>
              </div>

              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-bold mb-2 capitalize">
                    {viewingCategory.name}
                  </h3>
                  <p className="text-amber-100">Rubric Category Details</p>
                </div>
                <button
                  onClick={() => setViewingCategory(null)}
                  className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                  aria-label="Close modal"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-160px)] space-y-6">
              {/* Category Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200">
                  <div className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">
                    Max Points
                  </div>
                  <div className="text-3xl font-bold text-amber-900">
                    {viewingCategory.max_points}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border border-blue-200">
                  <div className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">
                    Weight
                  </div>
                  <div className="text-3xl font-bold text-blue-900">
                    {(viewingCategory.weight * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Description */}
              {viewingCategory.description && (
                <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200">
                  <div className="text-xs font-bold text-neutral-700 uppercase tracking-wide mb-2">
                    Description
                  </div>
                  <div className="text-sm text-neutral-900">
                    {viewingCategory.description}
                  </div>
                </div>
              )}

              {/* Bands */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <svg
                    className="w-5 h-5 text-neutral-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wide">
                    Score Bands ({viewingCategory.bands.length})
                  </h4>
                </div>
                <div className="space-y-3">
                  {viewingCategory.bands.map((band, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl p-5 border-2 border-neutral-200 hover:border-amber-300 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="px-3 py-1 rounded-full bg-amber-100 border border-amber-300">
                            <span className="text-sm font-bold text-amber-900">
                              {band.min_score} - {band.max_score}
                            </span>
                          </div>
                          <div className="text-xs text-neutral-500">
                            Score Range
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-neutral-900 leading-relaxed">
                        {band.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Empty State */}
              {viewingCategory.bands.length === 0 && (
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 text-neutral-300 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <p className="text-neutral-500 text-lg">
                    No bands defined for this category
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Question View Modal */}
      {showQuestionModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setShowQuestionModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 p-8 text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                    backgroundSize: "32px 32px",
                  }}
                ></div>
              </div>

              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-bold mb-2">Question Details</h3>
                  <p className="text-blue-100">Review the problem statement</p>
                </div>
                <button
                  onClick={() => setShowQuestionModal(false)}
                  className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                  aria-label="Close modal"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-160px)] space-y-6">
              {/* Title */}
              {state.question.title && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                  <div className="text-sm font-bold text-blue-700 uppercase tracking-wide mb-2">
                    Title
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {state.question.title}
                  </div>
                </div>
              )}

              {/* Prompt */}
              {state.question.prompt && (
                <div className="bg-white rounded-2xl p-6 border-2 border-neutral-200">
                  <div className="text-sm font-bold text-neutral-700 uppercase tracking-wide mb-3">
                    Problem Description
                  </div>
                  <div className="text-neutral-900 whitespace-pre-wrap leading-relaxed">
                    {state.question.prompt}
                  </div>
                </div>
              )}

              {/* Constraints */}
              {state.question.constraints && (
                <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
                  <div className="text-sm font-bold text-amber-700 uppercase tracking-wide mb-3">
                    Constraints
                  </div>
                  <div className="text-amber-900 whitespace-pre-wrap leading-relaxed">
                    {state.question.constraints}
                  </div>
                </div>
              )}

              {/* Expected Format */}
              {state.question.expectedFormat && (
                <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
                  <div className="text-sm font-bold text-green-700 uppercase tracking-wide mb-3">
                    Expected Format
                  </div>
                  <div className="text-green-900 whitespace-pre-wrap leading-relaxed">
                    {state.question.expectedFormat}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!state.question.title &&
                !state.question.prompt &&
                !state.question.constraints &&
                !state.question.expectedFormat && (
                  <div className="text-center py-12">
                    <svg
                      className="w-16 h-16 text-neutral-300 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-neutral-500 text-lg">
                      No question details available
                    </p>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
