"use client";

import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import type { Action } from "@/state/appState";

type SingleSubmissionProps = {
  singleName: string;
  singleLanguage: string;
  singleCode: string;
  onNameChange: (name: string) => void;
  onLanguageChange: (language: string) => void;
  onCodeChange: (code: string) => void;
  onAddSubmission: (params: { name: string; language: string; code: string }) => void;
  dispatch: React.Dispatch<Action>;
  alertModal: (opts: { title?: string; message?: string; tone?: "success" | "error" | "info" | "warning" }) => Promise<void>;
};

export function SingleSubmission({
  singleName,
  singleLanguage,
  singleCode,
  onNameChange,
  onLanguageChange,
  onCodeChange,
  onAddSubmission,
  dispatch,
  alertModal,
}: SingleSubmissionProps) {
  const extensions = (() => {
    switch (singleLanguage) {
      case "python":
        return [python()];
      case "javascript":
        return [javascript({ jsx: true, typescript: true })];
      case "cpp":
        return [cpp()];
      case "auto":
      default:
        return [javascript({ jsx: true, typescript: true })];
    }
  })();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header with Student Info */}
      <div className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-white via-neutral-50 to-teal-50/30 p-8 shadow-sm">
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
              {singleName.charAt(0).toUpperCase() || "S"}
            </div>
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-1">Student Code Submission</h2>
              <p className="text-sm text-neutral-600">Enter student details and paste their code for evaluation</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2" htmlFor="single-name">
                  Student Name
                </label>
                <input 
                  id="single-name" 
                  className="w-full rounded-xl border-2 border-neutral-200 px-4 py-3 bg-white text-neutral-900 font-medium placeholder:text-neutral-400 transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-100" 
                  value={singleName} 
                  onChange={(e) => onNameChange(e.target.value)} 
                  placeholder="e.g., Nguyen Van A" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2" htmlFor="single-language">
                  Programming Language
                </label>
                <select 
                  id="single-language" 
                  aria-label="Choose code language" 
                  className="w-full rounded-xl border-2 border-neutral-200 px-4 py-3 bg-white text-neutral-900 font-medium transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-100" 
                  value={singleLanguage} 
                  onChange={(e) => onLanguageChange(e.target.value)}
                >
                  <option value="cpp">C++</option>
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="java">Java</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Code Editor - Full Width */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">Code Editor</h3>
            <p className="text-sm text-neutral-600 mt-1">Paste or type the student&apos;s code below</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-semibold text-emerald-700">Ready</span>
          </div>
        </div>
        <div className="rounded-xl overflow-hidden border-2 border-neutral-200 shadow-sm">
          <CodeMirror 
            value={singleCode} 
            height="500px" 
            extensions={extensions} 
            onChange={onCodeChange} 
            basicSetup={{ lineNumbers: true }} 
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button 
          className="btn-secondary flex items-center gap-2 px-5 py-3" 
          onClick={() => dispatch({ type: "ui/setStep", step: 2 })}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Rubric
        </button>
        <button
          className="btn-primary flex items-center gap-2 px-8 py-3 text-base font-bold shadow-lg hover:shadow-xl transition-shadow"
          onClick={async () => {
            if (!singleName.trim()) {
              await alertModal({ title: "Student Name Required", message: "Please enter a student name before proceeding.", tone: "warning" });
              return;
            }
            if (!singleCode.trim()) {
              await alertModal({ title: "Code Required", message: "Please paste code before evaluating.", tone: "warning" });
              return;
            }
            onAddSubmission({ name: singleName.trim(), language: singleLanguage, code: singleCode });
            dispatch({ type: "codeInput/updateSingle", update: { code: "", name: "" } });
            dispatch({ type: "ui/setStep", step: 4 });
          }}
        >
          Settings
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
