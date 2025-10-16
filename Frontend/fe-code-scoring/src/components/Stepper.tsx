"use client";

import { clsx } from "clsx";

type Step = {
  id: number;
  label: string;
  isValid?: boolean;
};

export function Stepper({ steps, active, onSelect }: { steps: Step[]; active: number; onSelect: (id: number) => void }) {
  return (
    <nav className="stepper flex items-center gap-2" aria-label="Wizard Progress">
      {steps.map((s, i) => {
        const isDisabled = s.isValid === false;
        const isActive = active === s.id;
        const isCompleted = s.id < active;
        
        return (
          <div key={s.id} className="flex items-center gap-2">
            <button
              className={clsx(
                "stepper-btn",
                "px-3 py-1.5 rounded-xl border text-sm font-medium transition-all",
                isActive && "border-transparent text-white bg-gradient-to-r from-teal-500 to-emerald-500 shadow-md",
                !isActive && isCompleted && "border-teal-300 text-teal-700 bg-teal-50",
                !isActive && !isCompleted && !isDisabled && "border-neutral-300 text-neutral-800 bg-white hover:border-teal-400 hover:bg-teal-50",
                isDisabled && "border-neutral-200 text-neutral-400 bg-neutral-50 cursor-not-allowed opacity-60"
              )}
              aria-current={isActive ? "step" : undefined}
              aria-disabled={isDisabled ? true : undefined}
              onClick={() => onSelect(s.id)}
              disabled={isDisabled}
              title={isDisabled ? "Complete previous steps first" : undefined}
            >
              {s.id}. {s.label}
            </button>
            {i < steps.length - 1 && <span className="w-8 h-px bg-neutral-300" aria-hidden />}
          </div>
        );
      })}
    </nav>
  );
}


