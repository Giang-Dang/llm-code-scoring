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
        <div className="flex items-center gap-2 text-sm">
          <label className="text-neutral-800">Provider</label>
          <select
            aria-label="Select LLM Provider"
            className="rounded-lg border border-neutral-300 px-2 py-1 bg-white text-neutral-900"
            value={state.ui.provider}
            onChange={(e) => dispatch({ type: "ui/setProvider", provider: e.target.value as (typeof state.ui.provider) })}
          >
            <option value="gemini">Gemini</option>
            <option value="lmstudio">LM Studio</option>
            <option value="deepseek" hidden>DeepSeek</option>
            <option value="openai" hidden>OpenAI</option>
            <option value="grok" hidden>Grok</option>
            <option value="ollama" hidden>Ollama</option>
          </select>
          <label className="text-neutral-800">Output Language</label>
          <select
            aria-label="Select output language"
            className="rounded-lg border border-neutral-300 px-2 py-1 bg-white text-neutral-900"
            value={state.ui.outputLanguage}
            onChange={(e) => dispatch({ type: "ui/setOutputLanguage", value: e.target.value })}
          >
            <option>Vietnamese</option>
            <option>English</option>
          </select>
        </div>
      </div>
    </header>
  );
}


