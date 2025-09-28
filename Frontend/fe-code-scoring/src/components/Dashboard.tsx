"use client";

import { useMemo, useRef, useState } from "react";
import { useAppState } from "@/state/appState";
import { ApiClient } from "@/lib/apiClient";

export function Dashboard() {
  const { state, dispatch } = useAppState();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadingIds, setLoadingIds] = useState<string[]>([]);
  const api = useMemo(() => new ApiClient(), []);
  const abortRef = useRef<AbortController | null>(null);

  const totalMax = state.rubric.categories.reduce((acc, c) => acc + (Number(c.max_points) || 0), 0);

  function toggleAll(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedIds(e.target.checked ? state.submissions.map((s) => s.id) : []);
  }

  function toggleOne(id: string, checked: boolean) {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  }

  async function scoreOne(id: string) {
    const sub = state.submissions.find((s) => s.id === id);
    if (!sub) return;
    if (!state.rubric.categories.length) return alert("Please define the rubric first.");

    setLoadingIds((x) => [...x, id]);
    try {
      const rubricPayload = {
        categories: state.rubric.categories.map((c) => ({
          name: c.name,
          max_points: c.max_points,
          weight: c.weight,
          bands: c.bands,
        })),
        penalties: state.rubric.penalties,
      } as const;

      const res = await api.score({
        llm_provider: state.ui.provider,
        problem_description: state.question.prompt || state.question.title,
        student_code: sub.code,
        programming_language: "cpp",
        rubric: rubricPayload,
        language: state.ui.outputLanguage || "Vietnamese",
      });

      const newAuto = res.category_results.reduce((acc, r) => acc + (Number(r.raw_score) || 0), 0);
      const final = newAuto + sub.manualAdjustment + res.penalties_applied.reduce((acc, p) => acc + (Number(p.points) || 0), 0);
      dispatch({
        type: "submissions/update",
        id,
        update: {
          autoScore: newAuto,
          finalScore: final,
          server: {
            total: res.total_score,
            feedback: res.feedback,
            categoryResults: res.category_results.map((r) => ({ name: r.category_name, raw: r.raw_score, weight: r.weight, rationale: r.band_decision.rationale })),
          },
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      alert(`Scoring failed: ${message}`);
    } finally {
      setLoadingIds((x) => x.filter((xid) => xid !== id));
    }
  }

  function onExportCsv() {
    const headers = ["name", "autoScore", "manualAdjustment", "finalScore", "comments"];
    const rows = state.submissions.map((s) => [s.name, s.autoScore, s.manualAdjustment, s.finalScore, (s.comments || "").replace(/\n/g, " ")]);
    const csv = [headers.join(",")].concat(rows.map((r) => r.join(","))).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scores_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function onBulkComment() {
    const txt = prompt("Comment to apply to selected students:");
    if (!txt) return;
    state.submissions.forEach((s) => {
      if (selectedIds.includes(s.id)) {
        const updated = s.comments ? `${s.comments}\n${txt}` : txt;
        dispatch({ type: "submissions/update", id: s.id, update: { comments: updated } });
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Grading Dashboard</h2>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={onBulkComment}>Apply Comment to Selected</button>
          <button className="btn-primary" onClick={onExportCsv}>Export CSV</button>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 overflow-hidden">
        <div className="grid grid-cols-[48px_1.3fr_140px_140px_140px_220px] gap-2 px-3 py-2 text-sm text-neutral-600 bg-neutral-50 border-b">
          <div>
            <input type="checkbox" onChange={toggleAll} checked={selectedIds.length === state.submissions.length && state.submissions.length > 0} aria-label="Select all" />
          </div>
          <div>Name</div>
          <div className="text-right">Auto Score</div>
          <div className="text-right">Manual Adj.</div>
          <div className="text-right">Final</div>
          <div className="text-right">Actions</div>
        </div>

        <div className="divide-y">
          {state.submissions.map((s) => (
            <DashboardRow
              key={s.id}
              s={s}
              rubricMax={totalMax}
              selected={selectedIds.includes(s.id)}
              onSelect={(v) => toggleOne(s.id, v)}
              onAdjust={(val) => {
                const manualAdjustment = Number(val || 0);
                const finalScore = s.autoScore + manualAdjustment;
                dispatch({ type: "submissions/update", id: s.id, update: { manualAdjustment, finalScore } });
              }}
              onScore={() => scoreOne(s.id)}
              loading={loadingIds.includes(s.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

type RowSubmission = {
  id: string;
  name: string;
  manualAdjustment: number;
  autoScore: number;
  finalScore: number;
  comments?: string;
  rubricScores?: Record<string, number>;
  server?: {
    total?: number;
    feedback?: string | null;
    categoryResults?: Array<{ name: string; raw: number; weight: number; rationale: string }>;
  };
};

function DashboardRow({ s, rubricMax, selected, onSelect, onAdjust, onScore, loading }: {
  s: RowSubmission;
  rubricMax: number;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onAdjust: (val: number) => void;
  onScore: () => void;
  loading: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="px-3 py-2">
      <div className="grid grid-cols-[48px_1.3fr_140px_140px_140px_220px] gap-2 items-center">
        <div>
          <input type="checkbox" checked={selected} onChange={(e) => onSelect(e.target.checked)} aria-label={`Select ${s.name}`} />
        </div>
        <div>{s.name}</div>
        <div className="text-right">{s.autoScore}</div>
        <div className="text-right">
          <input
            type="number"
            step={1}
            className="w-24 rounded-lg border border-neutral-300 px-2 py-1 bg-white text-right"
            value={s.manualAdjustment}
            onChange={(e) => onAdjust(Number(e.target.value || 0))}
            aria-label={`Manual adjustment for ${s.name}`}
            placeholder="0"
          />
        </div>
        <div className="text-right">{s.finalScore}</div>
        <div className="flex justify-end gap-2">
          <button className="icon-btn" onClick={() => setExpanded((v) => !v)} title="Details">▾</button>
          <button className="icon-btn" onClick={onScore} title="Score with LLM" disabled={loading}>{loading ? "…" : "⚡"}</button>
          <button
            className="icon-btn"
            title="Open student report"
            onClick={() => openReportModal(s)}
          >
            📊
          </button>
          <button className="icon-btn" title="Add comment" onClick={() => {
            const txt = prompt("Enter a quick comment:", s.comments || "");
            if (txt !== null) {
              // will be handled by parent via onAdjust? keep consistent with state shape
            }
          }}>💬</button>
        </div>
      </div>

      {expanded && (
        <div className="mt-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
          <h4 className="font-medium mb-2">Rubric Breakdown</h4>
          {s.server?.categoryResults?.map((r, idx: number) => (
            <div key={idx} className="mb-2">
              <div className="flex justify-between text-sm"><div><strong>{r.name}</strong></div><div className="text-neutral-600">{r.raw}</div></div>
              <div className="text-neutral-600 text-sm">{r.rationale}</div>
            </div>
          ))}
          {s.server?.feedback && (
            <div className="mt-2">
              <h5 className="font-medium">Overall Feedback</h5>
              <div className="text-neutral-700 whitespace-pre-wrap text-sm">{s.server.feedback}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function openReportModal(s: RowSubmission) {
  const blob = new Blob([
    `Student: ${s.name}\nFinal: ${s.finalScore}\n\nRubric:\n` +
      Object.entries(s.rubricScores || {})
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n") +
      (s.server?.feedback ? `\n\nFeedback:\n${s.server.feedback}` : ""),
  ], { type: "text/plain;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${s.name.replace(/\s+/g, "_")}_report.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


