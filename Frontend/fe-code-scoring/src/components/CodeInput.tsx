"use client";

import { useMemo, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { useAppState } from "@/state/appState";
import type { RubricCategory } from "@/types/api";
import type { Action } from "@/state/appState";
import { useAlert } from "./Alert";

function generateId(prefix: string) {
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const timestamp = Date.now().toString(36);
  return `${prefix}_${timestamp}_${randomSuffix}`;
}

type SingleModeViewProps = {
  singleName: string;
  setSingleName: (name: string) => void;
  singleLanguage: string;
  setSingleLanguage: (lang: string) => void;
  singleCode: string;
  setSingleCode: (code: string) => void;
  extensions: ReturnType<typeof python>[];
  addSubmission: (params: { name: string; language: string; code: string }) => void;
  dispatch: React.Dispatch<Action>;
};

function SingleModeView({
  singleName,
  setSingleName,
  singleLanguage,
  setSingleLanguage,
  singleCode,
  setSingleCode,
  extensions,
  addSubmission,
  dispatch,
}: SingleModeViewProps) {
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
                  onChange={(e) => setSingleName(e.target.value)} 
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
                  onChange={(e) => setSingleLanguage(e.target.value)}
                >
                  <option value="c++">C++</option>
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
            onChange={setSingleCode} 
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
            if (!singleCode.trim()) {
              await alert({ title: "Code Required", message: "Please paste code before evaluating.", tone: "warning" });
              return;
            }
            addSubmission({ name: singleName.trim() || "Student", language: singleLanguage, code: singleCode });
            dispatch({ type: "codeInput/updateSingle", update: { code: "", name: "" } });
            dispatch({ type: "ui/setStep", step: 4 });
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Evaluate Code
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function CodeInput() {
  const { state, dispatch } = useAppState();
  const alert = useAlert();
  
  // Use persisted state from global app state
  const tab = state.codeInput.activeTab;
  const singleName = state.codeInput.singleSubmission.name;
  const singleLanguage = state.codeInput.singleSubmission.language;
  const singleCode = state.codeInput.singleSubmission.code;
  const batchLanguage = state.codeInput.batchLanguage;
  const uploadedFiles = state.codeInput.uploadedFiles || [];
  
  // Local UI state (doesn't need persistence)
  const [isDragging, setIsDragging] = useState(false);

  const extensions = useMemo(() => {
    switch (singleLanguage) {
      case "python":
        return [python()];
      case "javascript":
        return [javascript({ jsx: true, typescript: true })];
      case "c++":
        return [cpp()];
      case "auto":
      default:
        return [javascript({ jsx: true, typescript: true })];
    }
  }, [singleLanguage]);

  function sum(values: number[]) {
    return values.reduce((acc, n) => acc + (Number(n) || 0), 0);
  }

  function addSubmission({ name, language, code }: { name: string; language: string; code: string }) {
    const id = generateId("sub");
    const normalizedLanguage = language === "auto" ? autoDetectLanguage(code) : language;
    const rubricScores = computeAutoScoresForCode(code, normalizedLanguage, state.rubric.categories);
    const autoScore = sum(Object.values(rubricScores));
    const manualAdjustment = 0;
    const finalScore = autoScore + manualAdjustment;
    dispatch({
      type: "submissions/add",
      submission: { id, name, language: normalizedLanguage, code, rubricScores, autoScore, manualAdjustment, finalScore, comments: "" },
    });
  }

  function autoDetectLanguage(code: string) {
    const snippet = code.slice(0, 500).toLowerCase();
    if (/(def\s+\w+\(|import\s+\w+|#:)/.test(snippet)) return "python";
    if (/(function\s+\w+\(|=>|console\.log)/.test(snippet)) return "javascript";
    if (/(public\s+class|System\.out\.println|static\s+void\s+main)/i.test(code)) return "java";
    if (/#include\s+<|std::|int\s+main\s*\(/.test(code)) return "c++";
    return "javascript";
  }

  function computeAutoScoresForCode(code: string, language: string, criteria: RubricCategory[]) {
    const scoresByCriterionId: Record<string, number> = {};
    criteria.forEach((c) => {
      if (!c.automated) {
        scoresByCriterionId[c.id] = 0;
        return;
      }
      const maxPts = Number(c.max_points) || 0;
      const nameLower = (c.name || "").toLowerCase();
      let score = 0;
      if (nameLower.includes("readability")) score = scoreReadability(code, language, maxPts);
      else if (nameLower.includes("documentation") || nameLower.includes("comments")) score = scoreDocumentation(code, language, maxPts);
      else if (nameLower.includes("efficiency") || nameLower.includes("performance")) score = scoreEfficiency(code, language, maxPts);
      else if (nameLower.includes("naming") || nameLower.includes("formatting") || nameLower.includes("style")) score = scoreStyle(code, language, maxPts);
      else score = Math.round(maxPts * 0.5);
      scoresByCriterionId[c.id] = clamp(score, 0, maxPts);
    });
    return scoresByCriterionId;
  }

  function scoreReadability(code: string, _language: string, maxPts: number) {
    const numLines = code.split(/\r?\n/).length;
    const avgLineLength = code.split(/\r?\n/).map((l) => l.length).reduce((a, b) => a + b, 0) / Math.max(1, numLines);
    let score = maxPts * 0.4;
    if (avgLineLength < 80) score += maxPts * 0.25;
    if (!/(\t| {2,})\S/.test(code)) score -= maxPts * 0.1;
    if (/(\b[a-z]{2,}\d{1,}\b)/.test(code)) score += maxPts * 0.05;
    if (/(\b([A-Z][a-z]+){2,}\b)/.test(code)) score += maxPts * 0.1;
    return Math.round(clamp(score, 0, maxPts));
  }

  function scoreDocumentation(code: string, _language: string, maxPts: number) {
    let score = 0;
    const hasBlockComment = /\/\*[\s\S]*?\*\//.test(code) || /"""[\s\S]*?"""|'''[\s\S]*?'''/.test(code);
    const hasLineComments = /(\s+|^)\/(\/|\*)|#\s|--\s/.test(code);
    if (hasBlockComment) score += maxPts * 0.6;
    if (hasLineComments) score += maxPts * 0.3;
    if (/TODO|FIXME|NOTE\s*:/.test(code)) score -= maxPts * 0.15;
    return Math.round(clamp(score, 0, maxPts));
  }

  function scoreEfficiency(code: string, _language: string, maxPts: number) {
    const hasNestedLoops = /(for|while)[\s\S]*?(for|while)/.test(code);
    const hasInefficientPatterns = /Array\.from\(new\s+Array\(|\.sort\(\)\s*;/.test(code);
    let score = maxPts * 0.7;
    if (hasNestedLoops) score -= maxPts * 0.3;
    if (hasInefficientPatterns) score -= maxPts * 0.15;
    return Math.round(clamp(score, 0, maxPts));
  }

  function scoreStyle(code: string, _language: string, maxPts: number) {
    let score = maxPts * 0.5;
    if (/(\bconst\b|\blet\b|;\s*$)/.test(code)) score += maxPts * 0.1;
    if (/^[\t ]{2,}\S/m.test(code)) score += maxPts * 0.15;
    if (!/eval\(/.test(code) && !/global\s+/.test(code)) score += maxPts * 0.15;
    return Math.round(clamp(score, 0, maxPts));
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter((f) => f.name.endsWith(".txt"));

    if (files.length === 0) {
      await alert({ title: "Invalid File Type", message: "Please drop .txt files only", tone: "error" });
      return;
    }

    await processTextFiles(files);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files).filter((f) => f.name.endsWith(".txt"));

    if (fileArray.length === 0) {
      await alert({ title: "Invalid File Type", message: "Please select .txt files only", tone: "error" });
      return;
    }

    await processTextFiles(fileArray);
    e.target.value = ""; // reset
  }

  async function processTextFiles(files: File[]) {
    const fileStatuses: Array<{ name: string; size: number; status: "pending" | "success" | "error" }> = 
      files.map((f) => ({ name: f.name, size: f.size, status: "pending" }));
    dispatch({ type: "codeInput/setUploadedFiles", files: fileStatuses });

    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const text = await file.text();
        const nameWithoutExt = file.name.replace(/\.txt$/, "");
        
        addSubmission({ 
          name: nameWithoutExt || "Student", 
          language: batchLanguage, 
          code: text 
        });
        
        fileStatuses[i].status = "success";
        successCount++;
      } catch {
        fileStatuses[i].status = "error";
      }
      dispatch({ type: "codeInput/setUploadedFiles", files: [...fileStatuses] });
    }

    setTimeout(async () => {
      await alert({ 
        title: "Upload Complete", 
        message: `Successfully uploaded ${successCount} of ${files.length} files.`,
        tone: successCount === files.length ? "success" : "warning"
      });
    }, 500);
  }

  return (
    <div className="space-y-0">
      {/* Tab Navigation */}
      <div className="relative mb-[-2px]">
        <nav className="flex gap-2 relative z-10" aria-label="Code input modes" role="tablist">
          <button 
            id="single-tab"
            role="tab"
            aria-selected={tab === "single" ? "true" : "false"}
            aria-controls="single-panel"
            className={`px-6 py-3 font-semibold text-sm transition-all rounded-t-lg border-t-2 border-l-2 border-r-2 border-b-2 ${
              tab === "single" 
                ? "text-teal-700 bg-white border-teal-500 border-b-white" 
                : "text-neutral-500 bg-neutral-50 border-neutral-200 border-b-purple-500 hover:text-neutral-700 hover:bg-neutral-100"
            }`}
            onClick={() => dispatch({ type: "codeInput/setTab", tab: "single" })}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Single Submission
            </span>
          </button>
          <button 
            id="batch-tab"
            role="tab"
            aria-selected={tab === "batch" ? "true" : "false"}
            aria-controls="batch-panel"
            className={`px-6 py-3 font-semibold text-sm transition-all rounded-t-lg border-t-2 border-l-2 border-r-2 border-b-2 ${
              tab === "batch" 
                ? "text-purple-700 bg-white border-purple-500 border-b-white" 
                : "text-neutral-500 bg-neutral-50 border-neutral-200 border-b-teal-500 hover:text-neutral-700 hover:bg-neutral-100"
            }`}
            onClick={() => dispatch({ type: "codeInput/setTab", tab: "batch" })}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Batch Upload
            </span>
          </button>
        </nav>
      </div>

      {tab === "single" ? (
        <div id="single-panel" role="tabpanel" aria-labelledby="single-tab" className="border-2 border-teal-500 rounded-b-lg rounded-tr-lg bg-white p-6">
        <SingleModeView 
          singleName={singleName}
          setSingleName={(name: string) => dispatch({ type: "codeInput/updateSingle", update: { name } })}
          singleLanguage={singleLanguage}
          setSingleLanguage={(language: string) => dispatch({ type: "codeInput/updateSingle", update: { language } })}
          singleCode={singleCode}
          setSingleCode={(code: string) => dispatch({ type: "codeInput/updateSingle", update: { code } })}
          extensions={extensions}
          addSubmission={addSubmission}
          dispatch={dispatch}
        />
        </div>
        ) : (
          <div id="batch-panel" className="border-2 border-purple-500 rounded-b-lg rounded-tr-lg bg-white p-6" role="tabpanel" aria-labelledby="batch-tab">
            <div className="max-w-5xl mx-auto space-y-6">
            {/* Language Selector */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="max-w-md mx-auto">
                <label className="block text-sm font-semibold text-neutral-700 mb-2" htmlFor="batch-language">
                  Programming Language for All Files
                </label>
                <select 
                  id="batch-language" 
                  aria-label="Choose programming language for batch upload" 
                  className="w-full rounded-xl border-2 border-neutral-200 px-4 py-3 bg-white text-neutral-900 font-medium transition-all focus:border-purple-500 focus:ring-4 focus:ring-purple-100" 
                  value={batchLanguage} 
                  onChange={(e) => dispatch({ type: "codeInput/setBatchLanguage", language: e.target.value })}
                >
                  <option value="c++">C++</option>
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="java">Java</option>
                </select>
                <p className="text-xs text-neutral-500 mt-2">All uploaded files will be evaluated using this language</p>
              </div>
            </div>

            {/* Drag and Drop Zone */}
            <div 
              className={`rounded-2xl border-2 border-dashed p-16 text-center transition-all ${
                isDragging 
                  ? "border-purple-500 bg-purple-50" 
                  : "border-neutral-300 bg-gradient-to-br from-white to-neutral-50 hover:border-purple-400 hover:bg-purple-50/30"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-neutral-900 mb-3">
                    {isDragging ? "Drop files here" : "Drag & Drop Text Files"}
                  </h3>
                  <p className="text-lg text-neutral-600 mb-2">
                    Drop multiple .txt files here
                  </p>
                  <p className="text-neutral-500">
                    Student name will be extracted from filename
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold">.txt files only</span>
                  <span className="px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold">Language: {batchLanguage}</span>
                </div>
                <div className="mt-6">
                  <label htmlFor="file-upload" className="btn-primary cursor-pointer inline-flex items-center gap-3 px-8 py-4 text-lg font-bold shadow-lg hover:shadow-xl transition-shadow">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Browse Files
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    accept=".txt"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
              </div>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-neutral-900">Uploaded Files</h3>
                  <span className="text-sm text-neutral-600">{uploadedFiles.length} files</span>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 bg-neutral-50">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        file.status === "success" ? "bg-green-100" : 
                        file.status === "error" ? "bg-red-100" : "bg-blue-100"
                      }`}>
                        {file.status === "success" ? (
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : file.status === "error" ? (
                          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-neutral-900 truncate">{file.name}</div>
                        <div className="text-xs text-neutral-500">{(file.size / 1024).toFixed(2)} KB</div>
                      </div>
                      <div className={`text-xs font-semibold px-2 py-1 rounded ${
                        file.status === "success" ? "bg-green-100 text-green-700" : 
                        file.status === "error" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {file.status === "success" ? "Success" : file.status === "error" ? "Failed" : "Processing"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Back Button */}
            <div className="flex justify-start pt-2">
              <button 
                className="btn-secondary flex items-center gap-2 px-5 py-3" 
                onClick={() => dispatch({ type: "ui/setStep", step: 2 })}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Rubric
              </button>
            </div>
            </div>
          </div>
        )}
    </div>
  );
}
