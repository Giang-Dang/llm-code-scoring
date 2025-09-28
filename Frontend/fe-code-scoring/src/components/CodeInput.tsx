"use client";

import { useMemo, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import Papa from "papaparse";
import type { ParseResult } from "papaparse";
import { useAppState } from "@/state/appState";
import type { RubricCategory } from "@/types/api";

function generateId(prefix: string) {
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const timestamp = Date.now().toString(36);
  return `${prefix}_${timestamp}_${randomSuffix}`;
}

export function CodeInput() {
  const { state, dispatch } = useAppState();
  const [tab, setTab] = useState<"single" | "batch">("single");
  const [singleName, setSingleName] = useState("");
  const [singleLanguage, setSingleLanguage] = useState("auto");
  const [singleCode, setSingleCode] = useState("");
  const [bulkText, setBulkText] = useState("");

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

  function onParseBulk() {
    const blocks = bulkText.split(/\n-{3,}\n/);
    const added: number[] = [];
    blocks.forEach((block) => {
      const lines = block.split(/\n/);
      let name = "Student";
      let language = "auto";
      const codeLines: string[] = [];
      lines.forEach((ln) => {
        const nameMatch = ln.match(/^\s*Name:\s*(.+)$/i);
        const langMatch = ln.match(/^\s*Language:\s*(.+)$/i);
        if (nameMatch) name = nameMatch[1].trim();
        else if (langMatch) language = langMatch[1].trim().toLowerCase();
        else codeLines.push(ln);
      });
      const code = codeLines.join("\n").trim();
      if (code) {
        addSubmission({ name, language, code });
        added.push(1);
      }
    });
    if (added.length) setBulkText("");
    alert(added.length ? `Added ${added.length} submissions.` : "No valid entries found.");
  }

  function onUploadCsv(file: File) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res: ParseResult<Record<string, string>>) => {
        let count = 0;
        res.data.forEach((r) => {
          const code = String(r.code || "");
          if (code) {
            addSubmission({ name: String(r.name || "Student"), language: String(r.language || "auto").toLowerCase(), code });
            count += 1;
          }
        });
        alert(`Added ${count} submissions.`);
      },
      error: () => alert("CSV parse error."),
    });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-2 space-y-3">
        <div className="inline-flex gap-2" aria-label="Code input modes">
          <button className={tabBtn(tab === "single")} onClick={() => setTab("single")}>
            Single
          </button>
          <button className={tabBtn(tab === "batch")} onClick={() => setTab("batch")}>
            Batch
          </button>
        </div>

        {tab === "single" ? (
          <div className="space-y-3" role="tabpanel" aria-label="Single Submission">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-neutral-500" htmlFor="single-name">Student Name</label>
                <input id="single-name" className="w-full mt-1 rounded-lg border border-neutral-300 px-3 py-2 bg-white" value={singleName} onChange={(e) => setSingleName(e.target.value)} placeholder="e.g., Ada Lovelace" />
              </div>
              <div>
                <label className="block text-sm text-neutral-500" htmlFor="single-language">Language</label>
                <select id="single-language" aria-label="Choose code language" className="w-full mt-1 rounded-lg border border-neutral-300 px-3 py-2 bg-white" value={singleLanguage} onChange={(e) => setSingleLanguage(e.target.value)}>
                  <option value="auto">Auto-detect</option>
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="java">Java</option>
                  <option value="c++">C++</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-neutral-500">Code</label>
              <div className="mt-1 rounded-xl overflow-hidden border border-neutral-300">
                <CodeMirror value={singleCode} height="260px" extensions={extensions} onChange={setSingleCode} basicSetup={{ lineNumbers: true }} />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="btn-primary"
                onClick={() => {
                  if (!singleCode.trim()) return alert("Please paste code.");
                  addSubmission({ name: singleName.trim() || "Student", language: singleLanguage, code: singleCode });
                  setSingleCode("");
                }}
              >
                Add to Submissions
              </button>
              <button className="btn-secondary" onClick={() => dispatch({ type: "ui/setStep", step: 4 })}>Go to Dashboard</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4" role="tabpanel" aria-label="Batch Submission">
            <div className="grid md:grid-cols-2 gap-3">
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                <h3 className="font-medium">Bulk Paste</h3>
                <p className="text-sm text-neutral-600">Use this format, separated by --- lines:</p>
                <pre className="text-sm text-neutral-600 bg-white rounded-lg border border-neutral-200 p-2 whitespace-pre-wrap">Name: Ada Lovelace
Language: python
&lt;code here&gt;
---
Name: Alan Turing
Language: javascript
&lt;code here&gt;</pre>
                <textarea className="w-full mt-2 rounded-lg border border-neutral-300 px-3 py-2 bg-white" rows={10} value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder="Paste bulk entries here…" />
                <div className="pt-2">
                  <button className="btn-primary" onClick={onParseBulk}>Parse & Add</button>
                </div>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                <h3 className="font-medium">CSV Upload</h3>
                <p className="text-sm text-neutral-600">Headers: name,language,code</p>
                <label className="block text-sm text-neutral-500" htmlFor="csv-file">CSV File</label>
                <input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  aria-label="Upload CSV with name, language, and code columns"
                  onChange={(e) => {
                    const f = e.target.files && e.target.files[0];
                    if (!f) return alert("Choose a CSV file first.");
                    onUploadCsv(f);
                    e.currentTarget.value = ""; // reset
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button className="btn-secondary" onClick={() => dispatch({ type: "ui/setStep", step: 2 })}>← Back</button>
          <button className="btn-primary" onClick={() => dispatch({ type: "ui/setStep", step: 4 })}>Go to Dashboard →</button>
        </div>
      </div>

      <aside className="space-y-2">
        <h3 className="font-medium">Submissions Preview</h3>
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 min-h-[200px] space-y-2">
          {state.submissions.length === 0 ? (
            <div className="text-neutral-500">No submissions yet.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {state.submissions.slice(-5).map((s) => {
                const totalMax = state.rubric.categories.reduce((acc, c) => acc + (Number(c.max_points) || 0), 0);
                const pct = totalMax ? Math.round((s.finalScore / totalMax) * 100) : 0;
                return (
                  <div key={s.id} className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-neutral-200 bg-white">
                    <div className="min-w-[140px]">{s.name}</div>
                    <div className="flex-1 h-2 rounded bg-neutral-200 overflow-hidden">
                      <div className="h-2 bg-blue-500" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-sm text-neutral-600">{pct}%</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function tabBtn(active: boolean) {
  return `px-3 py-1.5 rounded-full border ${active ? "border-blue-500 text-blue-600" : "border-neutral-300 text-neutral-600"}`;
}


