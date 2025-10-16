"use client";

import { useAppState } from "@/state/appState";
import { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { gradeSubmission, isGradingError } from "@/services/gradingService";

export function Results() {
  const { state, dispatch } = useAppState();
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [regradingIds, setRegradingIds] = useState<Set<string>>(new Set());

  const selectedResult = selectedSubmissionId
    ? state.gradingResults.find(r => r.submissionId === selectedSubmissionId)
    : null;

  const selectedSubmission = selectedSubmissionId
    ? state.submissions.find(s => s.id === selectedSubmissionId)
    : null;

  // Handle regrade
  const handleRegrade = async (submissionId: string) => {
    const submission = state.submissions.find(s => s.id === submissionId);
    if (!submission) return;

    setRegradingIds(prev => new Set(prev).add(submissionId));
    dispatch({ type: "grading/updateStatus", submissionId, status: "grading" });

    try {
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
          submissionId,
          error: result.detail || result.error,
        });
      } else {
        dispatch({
          type: "grading/setResult",
          submissionId,
          result,
        });
      }
    } catch (error) {
      dispatch({
        type: "grading/setError",
        submissionId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setRegradingIds(prev => {
        const next = new Set(prev);
        next.delete(submissionId);
        return next;
      });
    }
  };

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
      case "java":
        return [cpp()]; // Fallback to cpp for java
      default:
        return [javascript({ jsx: true, typescript: true })];
    }
  };

  // Get score color based on percentage (0-100)
  const getScoreColor = (score: number, maxScore: number = 10) => {
    const percentage = (score / maxScore) * 100;
    
    if (percentage >= 80) {
      return {
        bg: "from-emerald-500 to-green-500",
        text: "text-emerald-50",
        border: "border-emerald-200",
        badge: "bg-emerald-100 text-emerald-700",
      };
    } else if (percentage >= 60) {
      return {
        bg: "from-blue-500 to-cyan-500",
        text: "text-blue-50",
        border: "border-blue-200",
        badge: "bg-blue-100 text-blue-700",
      };
    } else if (percentage >= 40) {
      return {
        bg: "from-amber-500 to-orange-500",
        text: "text-amber-50",
        border: "border-amber-200",
        badge: "bg-amber-100 text-amber-700",
      };
    } else {
      return {
        bg: "from-red-500 to-rose-500",
        text: "text-red-50",
        border: "border-red-200",
        badge: "bg-red-100 text-red-700",
      };
    }
  };

  // Calculate overall statistics
  const totalSubmissions = state.gradingResults.length;
  const completedCount = state.gradingResults.filter(r => r.status === "completed").length;
  const gradingCount = state.gradingResults.filter(r => r.status === "grading").length;
  const errorCount = state.gradingResults.filter(r => r.status === "error").length;
  const pendingCount = state.gradingResults.filter(r => r.status === "pending").length;

  const allCompleted = completedCount === totalSubmissions && totalSubmissions > 0;
  const hasErrors = errorCount > 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-neutral-900">Grading Results</h2>
        <p className="text-neutral-600">
          {allCompleted
            ? "All submissions have been graded"
            : `Grading in progress... ${completedCount} of ${totalSubmissions} completed`}
        </p>
      </div>

      {/* Progress Overview */}
      <div className="rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Completed */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-700">{completedCount}</div>
              <div className="text-sm text-green-600">Completed</div>
            </div>
          </div>

          {/* Grading */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
              {gradingCount > 0 ? (
                <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-700">{gradingCount}</div>
              <div className="text-sm text-blue-600">Grading</div>
            </div>
          </div>

          {/* Pending */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-700">{pendingCount}</div>
              <div className="text-sm text-amber-600">Pending</div>
            </div>
          </div>

          {/* Errors */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
            <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-700">{errorCount}</div>
              <div className="text-sm text-red-600">Errors</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {!allCompleted && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-neutral-700">Overall Progress</span>
              <span className="text-sm font-semibold text-neutral-700">
                {Math.round((completedCount / totalSubmissions) * 100)}%
              </span>
            </div>
            <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${(completedCount / totalSubmissions) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Submissions List */}
      <div className="rounded-2xl border-2 border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-200 bg-neutral-50">
          <h3 className="text-lg font-bold text-neutral-900">Submissions</h3>
        </div>
        <div className="divide-y divide-neutral-200">
          {state.gradingResults.map((result) => {
            const submission = state.submissions.find(s => s.id === result.submissionId);
            if (!submission) return null;

            return (
              <div
                key={result.submissionId}
                className="p-6 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-neutral-900">{submission.name}</h4>
                      <span className="text-sm text-neutral-500 px-2 py-1 rounded bg-neutral-100">
                        {submission.language}
                      </span>
                    </div>

                    {/* Status Indicator */}
                    {result.status === "pending" && (
                      <div className="flex items-center gap-2 text-amber-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium">Waiting to start...</span>
                      </div>
                    )}

                    {result.status === "grading" && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm font-medium">Grading in progress...</span>
                      </div>
                    )}

                    {result.status === "completed" && result.result && (
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-green-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm font-medium">Completed</span>
                        </div>
                        <div className="text-2xl font-bold text-neutral-900">
                          {result.result.total_score.toFixed(2)}/10
                        </div>
                      </div>
                    )}

                    {result.status === "error" && (
                      <div className="flex items-center gap-2 text-red-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="text-sm font-medium">Error: {result.error}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    {result.status === "completed" && result.result && (
                      <>
                        <button
                          onClick={() => setSelectedSubmissionId(result.submissionId)}
                          className="btn-primary px-4 py-2 text-sm"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleRegrade(result.submissionId)}
                          disabled={regradingIds.has(result.submissionId)}
                          className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          {regradingIds.has(result.submissionId) ? (
                            <>
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Regrading...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Regrade
                            </>
                          )}
                        </button>
                      </>
                    )}
                    {result.status === "error" && (
                      <>
                        <button
                          onClick={() => setSelectedSubmissionId(result.submissionId)}
                          className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          View Error
                        </button>
                        <button
                          onClick={() => handleRegrade(result.submissionId)}
                          disabled={regradingIds.has(result.submissionId)}
                          className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          {regradingIds.has(result.submissionId) ? (
                            <>
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Regrading...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Retry
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Detail Modal */}
      {selectedResult && selectedSubmission && selectedResult.status === "error" && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedSubmissionId(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Error Header */}
            <div className="bg-gradient-to-br from-red-600 via-red-500 to-rose-600 p-8 text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
              </div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="text-3xl font-bold">Grading Failed</h3>
                    </div>
                    <p className="text-red-100">{selectedSubmission.name}</p>
                  </div>
                  <button
                    onClick={() => setSelectedSubmissionId(null)}
                    className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                    aria-label="Close modal"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Error Content */}
            <div className="p-8 space-y-6">
              <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-red-900 mb-2">Error Details</h4>
                    <p className="text-sm text-red-800 whitespace-pre-wrap leading-relaxed font-mono">
                      {selectedResult.error}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200">
                <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wide mb-4">Submission Info</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Student:</span>
                    <span className="font-semibold text-neutral-900">{selectedSubmission.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Language:</span>
                    <span className="font-semibold text-neutral-900">{selectedSubmission.language}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
                <p className="text-sm text-neutral-600">You can retry grading this submission</p>
                <button
                  onClick={() => {
                    setSelectedSubmissionId(null);
                    handleRegrade(selectedResult.submissionId);
                  }}
                  className="btn-primary px-6 py-2 text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Retry Grading
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Detail Modal */}
      {selectedResult && selectedSubmission && selectedResult.result && (() => {
        const percentage = (selectedResult.result.total_score / 10) * 100;
        const scoreColors = getScoreColor(selectedResult.result.total_score);
        
        return (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedSubmissionId(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header with Score - Modern SaaS Style */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white relative overflow-hidden">
                {/* Subtle pattern overlay */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-3xl font-bold">{selectedSubmission.name}</h3>
                        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-white/10 backdrop-blur-sm border border-white/20">
                          {selectedSubmission.language}
                        </span>
                      </div>
                      <p className="text-slate-300">Grading Report</p>
                    </div>
                    <button
                      onClick={() => setSelectedSubmissionId(null)}
                      className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                      aria-label="Close modal"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Score Display */}
                  <div className="flex items-end gap-6">
                    <div className="flex items-baseline gap-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Final Score</div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-7xl font-bold">{selectedResult.result.total_score.toFixed(1)}</span>
                          <span className="text-3xl font-semibold text-slate-400">/10</span>
                        </div>
                      </div>
                      {/* Score badge with dynamic color */}
                      <div className={`px-4 py-2 rounded-full text-sm font-bold ${scoreColors.badge} mb-3`}>
                        {percentage >= 80 ? "Excellent" : percentage >= 60 ? "Good" : percentage >= 40 ? "Fair" : "Needs Work"}
                      </div>
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="h-3 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${scoreColors.bg}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-xs font-medium mt-2 text-slate-400">{percentage.toFixed(0)}% Performance</div>
                    </div>
                  </div>
                </div>
              </div>

            {/* Modal Content - Scrollable */}
            <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="p-8 space-y-6">
                {/* Problem Details */}
                {state.question.title && (
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-100">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h4 className="text-sm font-bold text-indigo-900 uppercase tracking-wide">Problem</h4>
                    </div>
                    <div className="text-lg font-semibold text-indigo-900 mb-2">{state.question.title}</div>
                    {state.question.prompt && (
                      <div className="text-sm text-indigo-700 whitespace-pre-wrap leading-relaxed">{state.question.prompt}</div>
                    )}
                  </div>
                )}

                {/* Student Code */}
                <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wide">Student Code</h4>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-neutral-300 shadow-sm">
                    <CodeMirror
                      value={selectedSubmission.code}
                      extensions={getLanguageExtensions(selectedSubmission.language)}
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

                {/* Feedback */}
                {selectedResult.result.feedback && (
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      <h4 className="text-sm font-bold text-blue-900 uppercase tracking-wide">Overall Feedback</h4>
                    </div>
                    <p className="text-sm text-blue-800 whitespace-pre-wrap leading-relaxed">{selectedResult.result.feedback}</p>
                  </div>
                )}

                {/* Category Results */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wide">Category Breakdown</h4>
                  </div>
                  {selectedResult.result.category_results.map((cat, idx) => (
                    <div key={idx} className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="text-lg font-semibold text-neutral-900 capitalize">{cat.category_name}</h5>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-neutral-900">{cat.raw_score.toFixed(1)}<span className="text-lg text-neutral-500">/10</span></div>
                          <div className="text-xs text-neutral-500 font-medium">Weight: {(cat.weight * 100).toFixed(0)}%</div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                          <div className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-2">Band Description</div>
                          <div className="text-sm text-neutral-900 leading-relaxed">{cat.band_decision.description}</div>
                          <div className="text-xs text-neutral-400 mt-2 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Score range: {cat.band_decision.min_score}-{cat.band_decision.max_score}
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                          <div className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">Rationale</div>
                          <div className="text-sm text-amber-900 whitespace-pre-wrap leading-relaxed">{cat.band_decision.rationale}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Penalties */}
                {selectedResult.result.penalties_applied.length > 0 && (
                  <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-6 border border-red-100">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <h4 className="text-sm font-bold text-red-900 uppercase tracking-wide">Penalties Applied</h4>
                    </div>
                    <div className="space-y-2">
                      {selectedResult.result.penalties_applied.map((penalty, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-white border border-red-100">
                          <div>
                            <div className="font-semibold text-red-900">{penalty.code}</div>
                            <div className="text-sm text-red-700">{penalty.description}</div>
                          </div>
                          <div className="text-xl font-bold text-red-600">{penalty.points} pts</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Provider Info */}
                <div className="text-center text-sm text-neutral-500 pt-4 border-t border-neutral-200">
                  Graded by: {selectedResult.result.provider_used}
                </div>
              </div>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}
