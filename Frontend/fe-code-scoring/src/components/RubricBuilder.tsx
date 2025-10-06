"use client";

import { useAppState } from "@/state/appState";
import { useConfirm } from "@/components/Confirm";
import type { RubricBand, RubricCategory } from "@/types/api";
// no-op

function generateId(prefix: string) {
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const timestamp = Date.now().toString(36);
  return `${prefix}_${timestamp}_${randomSuffix}`;
}

export function RubricBuilder() {
  const { state, dispatch } = useAppState();
  const { rubric } = state;
  const confirm = useConfirm();
  const commonPenalties: Array<{ code: string; description: string; points: number }> = [
    { code: "io_handling", description: "Missing input validation / incorrect I/O format", points: -2 },
    { code: "runtime_error", description: "Runtime error on basic inputs", points: -3 },
    { code: "plagiarism", description: "Plagiarism / suspected cheating", points: -10 },
    { code: "style_violation", description: "Severe style violations (indentation/format)", points: -1 },
    { code: "no_comments", description: "Missing minimum comments/docstring", points: -1 },
  ];

  function addCategory() {
    const c: RubricCategory = {
      id: generateId("crit"),
      name: "New category",
      description: "",
      max_points: 10,
      weight: 0,
      bands: defaultVNbands(),
    };
    dispatch({ type: "rubric/addCategory", category: c });
  }

  function addBand(categoryId: string) {
    const cat = rubric.categories.find((c) => c.id === categoryId);
    if (!cat) return;
    const lastMax = cat.bands.length ? cat.bands[cat.bands.length - 1].max_score : 0;
    const newBand: RubricBand = { min_score: lastMax + 1, max_score: lastMax + 1, description: "" };
    const updated = { ...cat, bands: [...cat.bands, newBand] };
    dispatch({ type: "rubric/updateCategory", id: categoryId, update: updated });
  }

  function updateBand(categoryId: string, idx: number, update: Partial<RubricBand>) {
    const cat = rubric.categories.find((c) => c.id === categoryId);
    if (!cat) return;
    const bands = cat.bands.map((b, i) => (i === idx ? { ...b, ...update } : b));
    dispatch({ type: "rubric/updateCategory", id: categoryId, update: { bands } });
  }

  function deleteBand(categoryId: string, idx: number) {
    const cat = rubric.categories.find((c) => c.id === categoryId);
    if (!cat) return;
    const bands = cat.bands.filter((_, i) => i !== idx);
    dispatch({ type: "rubric/updateCategory", id: categoryId, update: { bands } });
  }

  function applyVNSample() {
    const categories: RubricCategory[] = [
      {
        id: generateId("crit"),
        name: "correctness",
        description: "Scores from 0 to 10, in 1-point steps",
        max_points: 10,
        weight: 0,
        bands: [
          { min_score: 0, max_score: 2, description: "Completely incorrect logic; no clear approach to solve the task." },
          { min_score: 3, max_score: 4, description: "Some ideas present but messy execution; many key steps missing." },
          { min_score: 5, max_score: 6, description: "Basic logic is reasonable; partially solves the task but misses some steps/cases." },
          { min_score: 7, max_score: 8, description: "Clear logic, nearly complete; only minor details or edge cases missing." },
          { min_score: 9, max_score: 10, description: "Fully correct, coherent solution from start to finish." },
        ],
      },
      {
        id: generateId("crit"),
        name: "readability",
        description: "Scores from 0 to 10, in 1-point steps",
        max_points: 10,
        weight: 0,
        bands: [
          { min_score: 0, max_score: 2, description: "Messy code, poor indentation, hard to read." },
          { min_score: 3, max_score: 4, description: "Basic formatting but inconsistent; variable/function names unclear." },
          { min_score: 5, max_score: 6, description: "Acceptable formatting and naming; readable but not very cohesive." },
          { min_score: 7, max_score: 8, description: "Clear code; good naming; reasonable comments/docstrings; some structure." },
          { min_score: 9, max_score: 10, description: "Very clear, easy to follow; follows conventions; good docs; well-structured and maintainable." },
        ],
      },
    ];
    const penalties = [
      { code: "io_handling", description: "Incorrect I/O handling", points: -2 },
    ];
    dispatch({ type: "rubric/set", rubric: { categories, penalties } });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button className="btn-secondary" onClick={applyVNSample}>Sample (VN: Correctness + Readability)</button>
        <button className="btn-secondary" onClick={addCategory}>+ Add Category</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rubric.categories.map((c, cIdx) => (
          <div key={c.id} className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3">
            <div className="grid grid-cols-[1fr_140px_140px_auto] items-end gap-3">
              <div>
                <label className="block text-xs text-neutral-600 mb-1">Category name</label>
                <input
                  className="w-full rounded-lg border border-neutral-300 px-2 py-2 bg-white"
                  value={c.name}
                  onChange={(e) => dispatch({ type: "rubric/updateCategory", id: c.id, update: { name: e.target.value } })}
                  aria-label="Category name"
                  placeholder="e.g., correctness"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-600 mb-1">Max points (0–10)</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  className="w-full rounded-lg border border-neutral-300 px-2 py-2 bg-white text-right"
                  value={c.max_points}
                  onChange={(e) => dispatch({ type: "rubric/updateCategory", id: c.id, update: { max_points: clamp(Number(e.target.value), 0, 10) } })}
                  aria-label="Max points"
                  placeholder="10"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-600 mb-1">Weight (0–1)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.05"
                    min={0}
                    max={1}
                    className="w-full rounded-lg border border-neutral-300 px-2 py-2 bg-white text-right"
                    value={c.weight}
                    onChange={(e) => dispatch({ type: "rubric/updateCategory", id: c.id, update: { weight: clamp(Number(e.target.value), 0, 1) } })}
                    aria-label="Weight"
                    placeholder="0.5"
                  />
                  <div className="absolute -bottom-5 left-0 text-xs text-neutral-500">{Math.round(c.weight * 100)}%</div>
                </div>
              </div>
              <div className="justify-self-end flex items-center gap-2">
                <button className="icon-btn" aria-label="Move up" title="Move up" onClick={() => dispatch({ type: "rubric/reorder", from: cIdx, to: Math.max(0, cIdx - 1) })}>↑</button>
                <button className="icon-btn" aria-label="Move down" title="Move down" onClick={() => dispatch({ type: "rubric/reorder", from: cIdx, to: Math.min(rubric.categories.length - 1, cIdx + 1) })}>↓</button>
                <button
                className="icon-danger"
                aria-label="Delete category"
                title="Delete category"
                onClick={async () => {
                  const ok = await confirm({
                    title: "Delete category",
                    message: (
                      <div>
                        Are you sure you want to delete <strong>{c.name || "(unnamed)"}</strong>?
                      </div>
                    ),
                    confirmText: "Delete",
                    tone: "danger",
                  });
                  if (ok) dispatch({ type: "rubric/deleteCategory", id: c.id });
                }}
              >
                ✕
              </button>
              </div>
            </div>
            <div className="text-xs text-neutral-600">Scores from 0 to {c.max_points}, step 1</div>

            <div className="space-y-3">
              <div className="grid grid-cols-[160px_1fr_36px] items-center gap-3 text-xs text-neutral-500">
                <div>Score range</div>
                <div>Description</div>
                <div></div>
              </div>
              {c.bands.map((b, i) => (
                <div key={i} className="grid grid-cols-[160px_1fr_36px] items-start gap-3">
                  <div className="flex items-center gap-2">
                    <input type="number" className="w-14 rounded-lg border border-neutral-300 px-2 py-1 bg-white text-right" value={b.min_score}
                      onChange={(e) => updateBand(c.id, i, { min_score: Number(e.target.value) })} aria-label="Min score" />
                    <span className="text-neutral-500">–</span>
                    <input type="number" className="w-14 rounded-lg border border-neutral-300 px-2 py-1 bg-white text-right" value={b.max_score}
                      onChange={(e) => updateBand(c.id, i, { max_score: Number(e.target.value) })} aria-label="Max score" />
                  </div>
                  <textarea rows={2} title={b.description} placeholder="Band description (brief)…" className="rounded-lg border border-neutral-300 px-2 py-1 bg-white resize-y min-h-[44px]" value={b.description}
                    onChange={(e) => updateBand(c.id, i, { description: e.target.value })} aria-label="Band description" />
                  <button
                    className="icon-danger"
                    aria-label="Delete band"
                    title="Delete band"
                    onClick={async () => {
                      const ok = await confirm({ title: "Delete band", tone: "danger" });
                      if (ok) deleteBand(c.id, i);
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div>
                <button className="btn-secondary" onClick={() => addBand(c.id)}>+ Add band</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-3 space-y-2">
        <h3 className="font-medium">Penalties</h3>
        <p className="text-sm text-neutral-600">Optional. Used to deduct points for common errors (not belonging to any criteria). Use negative numbers for <em>points</em>. Example: code <code className="px-1 rounded bg-neutral-100">io_handling</code>, description <em>Missing input validation</em>, points <code className="px-1 rounded bg-neutral-100">-2</code>.</p>
        <div className="flex items-center gap-2">
          <label className="text-sm text-neutral-600">Quick add</label>
          <select className="rounded-lg border border-neutral-300 px-2 py-1 bg-white" aria-label="Add common penalty" onChange={(e) => {
            const idx = Number(e.target.value);
            if (!Number.isNaN(idx) && commonPenalties[idx]) {
              const penalties = [...rubric.penalties, commonPenalties[idx]];
              dispatch({ type: "rubric/set", rubric: { ...rubric, penalties } });
            }
            e.currentTarget.value = "";
          }}>
            <option value="">Add common…</option>
            {commonPenalties.map((p, i) => (
              <option key={p.code} value={i}>{`${p.code} (${p.points})`}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          {rubric.penalties.map((p, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_2fr_120px_36px] gap-2 items-center">
              <input placeholder="e.g., io_handling" className="rounded-lg border border-neutral-300 px-2 py-1 bg-white" value={p.code} onChange={(e) => {
                const penalties = rubric.penalties.slice();
                penalties[idx] = { ...penalties[idx], code: e.target.value };
                dispatch({ type: "rubric/set", rubric: { ...rubric, penalties } });
              }} aria-label="Penalty code" />
              <input placeholder="e.g., Missing input validation / incorrect format" className="rounded-lg border border-neutral-300 px-2 py-1 bg-white" value={p.description} onChange={(e) => {
                const penalties = rubric.penalties.slice();
                penalties[idx] = { ...penalties[idx], description: e.target.value };
                dispatch({ type: "rubric/set", rubric: { ...rubric, penalties } });
              }} aria-label="Penalty description" />
              <input type="number" step="0.5" placeholder="-2" className="rounded-lg border border-neutral-300 px-2 py-1 bg-white text-right" value={p.points} onChange={(e) => {
                const penalties = rubric.penalties.slice();
                penalties[idx] = { ...penalties[idx], points: Number(e.target.value) };
                dispatch({ type: "rubric/set", rubric: { ...rubric, penalties } });
              }} aria-label="Penalty points" />
              <button className="icon-danger" aria-label="Delete penalty" title="Delete penalty" onClick={async () => {
                const ok = await confirm({ title: "Delete penalty", tone: "danger" });
                if (!ok) return;
                const penalties = rubric.penalties.filter((_, i) => i !== idx);
                dispatch({ type: "rubric/set", rubric: { ...rubric, penalties } });
              }}>✕</button>
            </div>
          ))}
          <button className="btn-secondary" onClick={() => {
            const penalties = [...rubric.penalties, { code: "", description: "", points: -1 }];
            dispatch({ type: "rubric/set", rubric: { ...rubric, penalties } });
          }}>+ Add penalty</button>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button className="btn-secondary" onClick={() => dispatch({ type: "ui/setStep", step: 1 })}>← Back</button>
        <button className="btn-primary" onClick={() => dispatch({ type: "ui/setStep", step: 3 })}>Next: Code →</button>
      </div>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function defaultVNbands(): RubricBand[] {
  return [
    { min_score: 0, max_score: 2, description: "" },
    { min_score: 3, max_score: 4, description: "" },
    { min_score: 5, max_score: 6, description: "" },
    { min_score: 7, max_score: 8, description: "" },
    { min_score: 9, max_score: 10, description: "" },
  ];
}

export function RubricToolbar() {
  return null;
}


