"use client";

import { Stepper } from "./Stepper";
import { useAppState } from "@/state/appState";

export function Header() {
  const { state, dispatch } = useAppState();
  const steps = [
    { id: 1, label: "Question" },
    { id: 2, label: "Rubric" },
    { id: 3, label: "Code" },
    { id: 4, label: "Dashboard" },
  ];
  return (
    <header className="sticky top-0 z-10 border-b bg-white/70 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-500">RubricScore</div>
          <Stepper steps={steps} active={state.ui.step} onSelect={(id) => dispatch({ type: "ui/setStep", step: id as 1 | 2 | 3 | 4 })} />
        </div>
        <div className="flex items-center gap-4 text-sm">
          {/* <div className="hidden md:flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-1.5 text-neutral-700">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Output</span>
            <span className="font-medium text-neutral-900">{state.ui.outputLanguage}</span>
          </div>
          <div className="relative">
            <select
              aria-label="Change output language"
              className="appearance-none rounded-full border border-neutral-200 bg-white py-1.5 pl-4 pr-8 text-neutral-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/60"
              value={state.ui.outputLanguage}
              onChange={(e) => dispatch({ type: "ui/setOutputLanguage", value: e.target.value })}
            >
              <option>Vietnamese</option>
              <option>English</option>
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-neutral-500">▾</span>
          </div> */}
        </div>
      </div>
    </header>
  );
}


