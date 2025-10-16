"use client";

import { useAppState } from "@/state/appState";
import type { RubricCategory } from "@/types/api";
import { useAlert } from "./Alert";
import { SingleSubmission } from "./SingleSubmission";
import { BatchUpload } from "./BatchUpload";

function generateId(prefix: string) {
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const timestamp = Date.now().toString(36);
  return `${prefix}_${timestamp}_${randomSuffix}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function CodeInput() {
  const { state, dispatch } = useAppState();
  const alertModal = useAlert();
  
  // Use persisted state from global app state
  const tab = state.codeInput.activeTab;
  const singleName = state.codeInput.singleSubmission.name;
  const singleLanguage = state.codeInput.singleSubmission.language;
  const singleCode = state.codeInput.singleSubmission.code;
  const batchLanguage = state.codeInput.batchLanguage;
  const uploadedFiles = state.codeInput.uploadedFiles || [];

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
    if (/#include\s+<|std::|int\s+main\s*\(/.test(code)) return "cpp";
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

  async function processTextFiles(files: File[]) {
    const newFileStatuses: Array<{ name: string; size: number; status: "pending" | "success" | "error"; code?: string; submissionId?: string }> = 
      files.map((f) => ({ name: f.name, size: f.size, status: "pending" }));
    
    // Append new files to existing ones
    const allFiles = [...uploadedFiles, ...newFileStatuses];
    dispatch({ type: "codeInput/setUploadedFiles", files: allFiles });

    let successCount = 0;
    const startIndex = uploadedFiles.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const text = await file.text();
        const nameWithoutExt = file.name.replace(/\.txt$/, "");
        
        const submissionId = generateId("sub");
        const normalizedLanguage = batchLanguage === "auto" ? autoDetectLanguage(text) : batchLanguage;
        const rubricScores = computeAutoScoresForCode(text, normalizedLanguage, state.rubric.categories);
        const autoScore = sum(Object.values(rubricScores));
        const manualAdjustment = 0;
        const finalScore = autoScore + manualAdjustment;
        
        dispatch({
          type: "submissions/add",
          submission: { 
            id: submissionId, 
            name: nameWithoutExt || "Student", 
            language: normalizedLanguage, 
            code: text, 
            rubricScores, 
            autoScore, 
            manualAdjustment, 
            finalScore, 
            comments: "" 
          },
        });
        
        allFiles[startIndex + i].status = "success";
        allFiles[startIndex + i].code = text; // Store code for viewing
        allFiles[startIndex + i].submissionId = submissionId; // Track submission ID
        successCount++;
      } catch {
        allFiles[startIndex + i].status = "error";
      }
      dispatch({ type: "codeInput/setUploadedFiles", files: [...allFiles] });
    }
  }

  return (
    <div className="space-y-0">
      {/* Tab Navigation */}
      <div className="relative mb-[-2px]">
        <nav className="flex gap-2 relative z-10" aria-label="Code input modes" role="tablist">
          <button 
            id="single-tab"
            role="tab"
            aria-selected={tab === "single"}
            aria-controls="single-panel"
            className={`px-6 py-3 font-semibold text-sm transition-all rounded-t-lg border-t-2 border-l-2 border-r-2 border-b-2 ${
              tab === "single" 
                ? "text-teal-700 bg-white border-teal-500 border-b-white" 
                : "text-neutral-500 bg-neutral-50 border-neutral-200 border-b-purple-500 hover:text-neutral-700 hover:bg-neutral-100"
            }`}
            onClick={() => {
              dispatch({ type: "codeInput/setTab", tab: "single" });
              // Clear batch data when switching to single
              // Remove all submissions from batch uploads
              uploadedFiles.forEach(file => {
                if (file.submissionId) {
                  dispatch({ type: "submissions/delete", id: file.submissionId });
                }
              });
              dispatch({ type: "codeInput/setUploadedFiles", files: [] });
              // Clear all submissions to start fresh
              dispatch({ type: "submissions/set", submissions: [] });
            }}
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
            aria-selected={tab === "batch"}
            aria-controls="batch-panel"
            className={`px-6 py-3 font-semibold text-sm transition-all rounded-t-lg border-t-2 border-l-2 border-r-2 border-b-2 ${
              tab === "batch" 
                ? "text-purple-700 bg-white border-purple-500 border-b-white" 
                : "text-neutral-500 bg-neutral-50 border-neutral-200 border-b-teal-500 hover:text-neutral-700 hover:bg-neutral-100"
            }`}
            onClick={() => {
              dispatch({ type: "codeInput/setTab", tab: "batch" });
              // Clear single submission data when switching to batch
              dispatch({ type: "codeInput/updateSingle", update: { name: "", code: "" } });
              // Clear all submissions to start fresh
              dispatch({ type: "submissions/set", submissions: [] });
            }}
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
          <SingleSubmission 
            singleName={singleName}
            singleLanguage={singleLanguage}
            singleCode={singleCode}
            onNameChange={(name: string) => dispatch({ type: "codeInput/updateSingle", update: { name } })}
            onLanguageChange={(language: string) => dispatch({ type: "codeInput/updateSingle", update: { language } })}
            onCodeChange={(code: string) => dispatch({ type: "codeInput/updateSingle", update: { code } })}
            onAddSubmission={addSubmission}
            dispatch={dispatch}
            alertModal={alertModal}
          />
        </div>
      ) : (
        <div id="batch-panel" className="border-2 border-purple-500 rounded-b-lg rounded-tr-lg bg-white p-6" role="tabpanel" aria-labelledby="batch-tab">
          <BatchUpload 
            batchLanguage={batchLanguage}
            uploadedFiles={uploadedFiles}
            onLanguageChange={(language: string) => dispatch({ type: "codeInput/setBatchLanguage", language })}
            onFilesUpload={processTextFiles}
            dispatch={dispatch}
            alertModal={alertModal}
          />
        </div>
      )}
    </div>
  );
}
