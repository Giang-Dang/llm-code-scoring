"use client";

import { useAppState } from "@/state/appState";

export function ReviewConfirm() {
  const { state, dispatch } = useAppState();

  const modelLabels: Record<string, string> = {
    "gemini-2.0-flash-lite": "Gemini 2.0 Flash Lite",
    "gemini-2.0-flash": "Gemini 2.0 Flash",
    "gemini-2.5-flash-lite": "Gemini 2.5 Flash Lite",
    "gemini-2.5-flash": "Gemini 2.5 Flash",
    "gemini-2.5-pro": "Gemini 2.5 Pro",
  };

  const totalWeight = state.rubric.categories.reduce((sum, cat) => sum + cat.weight, 0);
  const isWeightValid = Math.abs(totalWeight - 1) < 0.01;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-neutral-900">Review & Confirm</h2>
        <p className="text-neutral-600">Please review all your configurations before starting the evaluation</p>
      </div>

      {/* Question Summary */}
      <div className="rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
        <div className="space-y-3">
          <div>
            <div className="text-sm font-semibold text-neutral-700 mb-1">Title</div>
            <div className="text-neutral-900">{state.question.title || <span className="text-neutral-400 italic">Not set</span>}</div>
          </div>
          {state.question.prompt && (
            <div>
              <div className="text-sm font-semibold text-neutral-700 mb-1">Prompt</div>
              <div className="text-neutral-900 text-sm line-clamp-3">{state.question.prompt}</div>
            </div>
          )}
        </div>
      </div>

      {/* Rubric Summary */}
      <div className="rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
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
            <div className="text-sm text-red-600 font-semibold">⚠ Weights don&apos;t sum to 1.0</div>
          )}
        </div>
        <div className="space-y-2">
          {state.rubric.categories.length === 0 ? (
            <div className="text-neutral-400 italic text-sm">No categories defined</div>
          ) : (
            state.rubric.categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg bg-neutral-50">
                <div className="flex-1">
                  <div className="font-semibold text-neutral-900">{cat.name}</div>
                  <div className="text-xs text-neutral-600">Max: {cat.max_points} points</div>
                </div>
                <div className="text-sm font-semibold text-neutral-700">Weight: {(cat.weight * 100).toFixed(0)}%</div>
              </div>
            ))
          )}
          {state.rubric.penalties.length > 0 && (
            <div className="mt-3 pt-3 border-t border-neutral-200">
              <div className="text-sm font-semibold text-neutral-700 mb-2">Penalties: {state.rubric.penalties.length}</div>
            </div>
          )}
        </div>
      </div>

      {/* Submissions Summary */}
      <div className="rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900">Code Submissions</h3>
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
            <div className="text-neutral-400 italic text-sm">No submissions added</div>
          ) : (
            <>
              <div className="text-sm font-semibold text-neutral-700 mb-2">
                {state.submissions.length} submission{state.submissions.length !== 1 ? "s" : ""} ready for grading
              </div>
              <div className="space-y-2">
                {[...state.submissions]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .slice(0, 5)
                  .map((sub) => (
                    <div key={sub.id} className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-neutral-900">{sub.name}</div>
                        <div className="text-xs text-neutral-600">{sub.language}</div>
                      </div>
                      <div className="text-xs text-neutral-500">{sub.code.length} chars</div>
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
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900">Grading Settings</h3>
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
            <div className="text-sm font-semibold text-neutral-700 mb-1">AI Model</div>
            <div className="text-neutral-900">{modelLabels[state.ui.model] || state.ui.model}</div>
          </div>
          <div>
            <div className="text-sm font-semibold text-neutral-700 mb-1">Output Language</div>
            <div className="text-neutral-900">{state.ui.outputLanguage}</div>
          </div>
        </div>
      </div>

      {/* Validation Warnings */}
      {(state.submissions.length === 0 || state.rubric.categories.length === 0 || !isWeightValid) && (
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <div className="font-semibold text-amber-900 mb-2">Please address the following issues:</div>
              <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                {state.submissions.length === 0 && <li>No code submissions added</li>}
                {state.rubric.categories.length === 0 && <li>No rubric categories defined</li>}
                {!isWeightValid && <li>Rubric category weights must sum to 1.0 (currently {totalWeight.toFixed(2)})</li>}
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
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Settings
        </button>
        <button
          className="btn-primary flex items-center gap-2 px-8 py-3 text-base font-bold shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => dispatch({ type: "ui/setStep", step: 6 })}
          disabled={state.submissions.length === 0 || state.rubric.categories.length === 0 || !isWeightValid}
        >
          Start Grading
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
