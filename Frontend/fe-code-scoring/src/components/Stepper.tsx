"use client";

import { clsx } from "clsx";

type Step = {
  id: number;
  label: string;
};

export function Stepper({ steps, active, onSelect }: { steps: Step[]; active: number; onSelect: (id: number) => void }) {
  return (
    <nav className="stepper flex items-center gap-2" aria-label="Wizard Progress">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center gap-2">
          <button
            className={clsx(
              "stepper-btn",
              "px-3 py-1.5 rounded-xl border text-sm",
              active === s.id
                ? "border-transparent text-white bg-gradient-to-r from-teal-500 to-emerald-500 shadow"
                : "border-neutral-300 text-neutral-800 bg-white"
            )}
            aria-current={active === s.id ? "step" : undefined}
            onClick={() => onSelect(s.id)}
          >
            {s.id}. {s.label}
          </button>
          {i < steps.length - 1 && <span className="w-8 h-px bg-neutral-300" aria-hidden />}
        </div>
      ))}
    </nav>
  );
}


