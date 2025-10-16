"use client";

import { useAppState } from "@/state/appState";
import type { LlmModelName } from "@/types/api";

export function GradingSettings() {
  const { state, dispatch } = useAppState();

  const models: Array<{ value: LlmModelName; label: string; description: string }> = [
    { value: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite", description: "Fast and efficient (default)" },
    { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash", description: "Previous generation" },
    { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", description: "Faster, lighter" },
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", description: "Balanced performance" },
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro", description: "Most capable, slower" },
  ];

  const languages = [
    { value: "Vietnamese", label: "Vietnamese (Tiếng Việt)" },
    { value: "English", label: "English" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-neutral-900">Grading Configuration</h2>
        <p className="text-neutral-600">Choose your AI model and output language preferences</p>
      </div>

      {/* Model Selection */}
      <div className="rounded-2xl border-2 border-neutral-200 bg-white p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900">AI Model</h3>
            <p className="text-sm text-neutral-500">Select the model to grade submissions</p>
          </div>
        </div>

        <div className="space-y-3">
          {models.map((model) => (
            <label
              key={model.value}
              className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                state.ui.model === model.value
                  ? "border-purple-500 bg-purple-50"
                  : "border-neutral-200 hover:border-purple-300 hover:bg-neutral-50"
              }`}
            >
              <input
                type="radio"
                name="model"
                value={model.value}
                checked={state.ui.model === model.value}
                onChange={(e) => dispatch({ type: "ui/setModel", model: e.target.value as LlmModelName })}
                className="mt-1 w-5 h-5 text-purple-600 focus:ring-purple-500"
              />
              <div className="flex-1">
                <div className="font-semibold text-neutral-900">{model.label}</div>
                <div className="text-sm text-neutral-600">{model.description}</div>
              </div>
              {state.ui.model === model.value && (
                <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Language Selection */}
      <div className="rounded-2xl border-2 border-neutral-200 bg-white p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900">Output Language</h3>
            <p className="text-sm text-neutral-500">Language for feedback and comments</p>
          </div>
        </div>

        <div className="space-y-3">
          {languages.map((lang) => (
            <label
              key={lang.value}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                state.ui.outputLanguage === lang.value
                  ? "border-teal-500 bg-teal-50"
                  : "border-neutral-200 hover:border-teal-300 hover:bg-neutral-50"
              }`}
            >
              <input
                type="radio"
                name="language"
                value={lang.value}
                checked={state.ui.outputLanguage === lang.value}
                onChange={(e) => dispatch({ type: "ui/setOutputLanguage", value: e.target.value })}
                className="w-5 h-5 text-teal-600 focus:ring-teal-500"
              />
              <div className="flex-1 font-semibold text-neutral-900">{lang.label}</div>
              {state.ui.outputLanguage === lang.value && (
                <svg className="w-6 h-6 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4">
        <button
          className="btn-secondary flex items-center gap-2 px-6 py-3"
          onClick={() => dispatch({ type: "ui/setStep", step: 3 })}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Code Input
        </button>
        <button
          className="btn-primary flex items-center gap-2 px-8 py-3 text-base font-bold shadow-lg hover:shadow-xl transition-shadow"
          onClick={() => dispatch({ type: "ui/setStep", step: 5 })}
        >
          Continue to Review
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
