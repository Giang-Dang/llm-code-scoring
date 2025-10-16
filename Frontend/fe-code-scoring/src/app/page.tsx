"use client";

import { Header } from "@/components/Header";
import { QuestionForm } from "@/components/QuestionForm";
import { RubricBuilder } from "@/components/RubricBuilder";
import { CodeInput } from "@/components/CodeInput";
import { GradingSettings } from "@/components/GradingSettings";
import { ReviewConfirm } from "@/components/ReviewConfirm";
import { Dashboard } from "@/components/Dashboard";
import { AppStateProvider, useAppState } from "@/state/appState";

export default function Home() {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
}

function AppContent() {
  const { state } = useAppState();
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-4 space-y-4">
        <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-sm text-neutral-500">Step</div>
            <div className="text-sm font-medium">{state.ui.step} / 6</div>
          </div>
          <div className="flex-1 mx-4 h-2 rounded-full bg-neutral-200 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-teal-500 to-emerald-500 progress-fill" style={{ width: `${(state.ui.step / 6) * 100}%` }} />
          </div>
          <div className="text-sm text-neutral-600">
            {state.ui.step === 1 && "Define Question"}
            {state.ui.step === 2 && "Define Rubric"}
            {state.ui.step === 3 && "Submit Code"}
            {state.ui.step === 4 && "Grading Settings"}
            {state.ui.step === 5 && "Review & Confirm"}
            {state.ui.step === 6 && "Grading Dashboard"}
          </div>
        </div>
        {state.ui.step === 1 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Define Question</h2>
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <QuestionForm />
            </div>
          </section>
        )}
        {state.ui.step === 2 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Define Rubric</h2>
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <RubricBuilder />
            </div>
          </section>
        )}
        {state.ui.step === 3 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Submit Code</h2>
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <CodeInput />
            </div>
          </section>
        )}
        {state.ui.step === 4 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Grading Settings</h2>
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <GradingSettings />
            </div>
          </section>
        )}
        {state.ui.step === 5 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Review & Confirm</h2>
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <ReviewConfirm />
            </div>
          </section>
        )}
        {state.ui.step === 6 && (
          <section className="space-y-3">
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <Dashboard />
            </div>
          </section>
        )}
      </main>
      <footer className="px-4 py-6 text-center text-neutral-500">Demo MVP • React + Next.js • Teachers’ Code Scoring</footer>
    </div>
  );
}
