"use client";

import { useAppState } from "@/state/appState";
import { useConfirm } from "@/components/Confirm";
import { useAlert } from "./Alert";
import type { RubricBand, RubricCategory } from "@/types/api";

function generateId(prefix: string) {
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const timestamp = Date.now().toString(36);
  return `${prefix}_${timestamp}_${randomSuffix}`;
}

export function RubricBuilder() {
  const { state, dispatch } = useAppState();
  const { rubric } = state;
  const confirm = useConfirm();
  const alertModal = useAlert();
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
        weight: 0.8,
        bands: [
          { min_score: 0, max_score: 2, description: "Logic sai hoàn toàn, không có tiến trình rõ ràng để giải quyết vấn đề." },
          { min_score: 3, max_score: 4, description: "Có ý tưởng nhưng triển khai lộn xộn; thiếu nhiều bước quan trọng." },
          { min_score: 5, max_score: 6, description: "Logic cơ bản hợp lý; có thể giải quyết được một phần bài toán nhưng còn thiếu/nhầm một vài bước." },
          { min_score: 7, max_score: 8, description: "Logic rõ ràng, gần đúng hoàn toàn; chỉ còn một số chi tiết nhỏ hoặc edge case bị bỏ sót." },
          { min_score: 9, max_score: 10, description: "Logic hoàn chỉnh, mạch lạc; thể hiện rõ tư duy giải quyết bài toán từ đầu đến cuối." },
        ],
      },
      {
        id: generateId("crit"),
        name: "readability",
        description: "Scores from 0 to 10, in 1-point steps",
        max_points: 10,
        weight: 0.2,
        bands: [
          { min_score: 0, max_score: 2, description: "Code rối, không indent chuẩn, khó đọc." },
          { min_score: 3, max_score: 4, description: "Có format cơ bản nhưng thiếu nhất quán; tên biến/hàm không rõ nghĩa." },
          { min_score: 5, max_score: 6, description: "Format ổn; tên biến/hàm chấp nhận được; code đọc được nhưng chưa thực sự mạch lạc" },
          { min_score: 7, max_score: 8, description: "Code rõ ràng; đặt tên biến/hàm hợp lý; có comment/docstring cơ bản; chia nhỏ thành hàm/module ở mức vừa phải." },
          { min_score: 9, max_score: 10, description: "Code sáng sủa, rất dễ hiểu; tuân theo coding convention (naming, indentation); có docstring, comment hợp lý; cấu trúc tốt (chia module, hàm rõ ràng); dễ bảo trì và mở rộng." },
        ],
      },
    ];
    const penalties = [
      { code: "io_handling", description: "Incorrect I/O handling", points: -2 },
    ];
    dispatch({ type: "rubric/set", rubric: { categories, penalties } });
  }

  const totalWeight = rubric.categories.reduce((sum, cat) => sum + cat.weight, 0);
  const isWeightValid = Math.abs(totalWeight - 1) < 0.01;

  return (
    <div className="space-y-6">
      {/* Header with Instructions */}
      <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-blue-900 mb-2">How to Build Your Rubric</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li><strong>Add Categories</strong> - Define grading criteria (e.g., Correctness, Readability)</li>
              <li><strong>Set Weights</strong> - Ensure weights sum to 1.0 (100%)</li>
              <li><strong>Add Penalties</strong> - Optional deductions for common errors</li>
            </ol>
            <div className="mt-3 flex items-center gap-2">
              <button className="btn-secondary text-sm" onClick={applyVNSample}>
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Load Sample Rubric
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Categories Section */}
      <div className="rounded-2xl border-2 border-neutral-200 bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">
              1
            </div>
            <div>
              <h3 className="text-xl font-bold text-neutral-900">Grading Categories</h3>
              <p className="text-sm text-neutral-600">Define what aspects you&apos;ll evaluate</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {rubric.categories.length > 0 && (
              <div className={`text-sm font-semibold px-3 py-1.5 rounded-lg ${
                isWeightValid 
                  ? "bg-green-100 text-green-700" 
                  : "bg-amber-100 text-amber-700"
              }`}>
                {isWeightValid ? "✓ Weights: 100%" : `⚠ Weights: ${(totalWeight * 100).toFixed(0)}%`}
              </div>
            )}
            <button className="btn-primary" onClick={addCategory}>
              <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Category
            </button>
          </div>
        </div>

        {rubric.categories.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-neutral-300 rounded-xl">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-neutral-700 mb-2">No categories yet</h4>
            <p className="text-neutral-600 mb-4">Click &quot;Add Category&quot; to create your first grading criterion</p>
            <button className="btn-primary" onClick={addCategory}>
              <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Your First Category
            </button>
          </div>
        ) : (
          <>
            {/* Quick Overview Summary */}
            <div className="rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 border-2 border-teal-200 p-5">
              <div className="flex items-stretch gap-6">
                {/* Total Count */}
                <div className="flex flex-col justify-center">
                  <div className="text-xs font-bold text-teal-700 uppercase tracking-wide mb-1">Total Categories</div>
                  <div className="text-4xl font-bold text-teal-900">{rubric.categories.length}</div>
                </div>
                
                {/* Divider */}
                <div className="w-px bg-teal-300 self-stretch"></div>
                
                {/* Weight Distribution */}
                <div className="flex-1 flex flex-col justify-center">
                  <div className="text-xs font-bold text-teal-700 uppercase tracking-wide mb-2.5">Weight Distribution</div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {rubric.categories.map((cat) => (
                      <div key={cat.id} className="flex items-center gap-2.5 bg-white rounded-lg px-3.5 py-2 border-2 border-teal-200 shadow-sm">
                        <span className="text-sm font-semibold text-neutral-900 truncate max-w-[140px]">{cat.name || 'Unnamed'}</span>
                        <span className="text-xl font-bold text-teal-700">{Math.round(cat.weight * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Category Cards */}
            <div className="space-y-3">
              {rubric.categories.map((c, cIdx) => (
            <div key={c.id} className="rounded-xl border-2 border-neutral-200 bg-white hover:border-teal-300 transition-colors overflow-hidden">
              {/* Compact Header */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-neutral-50 to-white">
                <div className="flex-1 min-w-0">
                  <input
                    className="w-full border-0 bg-transparent text-lg font-bold text-neutral-900 focus:outline-none focus:ring-0 px-0"
                    value={c.name}
                    onChange={(e) => dispatch({ type: "rubric/updateCategory", id: c.id, update: { name: e.target.value } })}
                    aria-label="Category name"
                    placeholder="Category name"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-xs text-neutral-500 mb-1.5">Max Points</div>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      className="w-16 h-10 text-center rounded-lg border-2 border-neutral-300 px-2 text-base font-bold focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                      value={c.max_points}
                      onChange={(e) => dispatch({ type: "rubric/updateCategory", id: c.id, update: { max_points: clamp(Number(e.target.value), 0, 10) } })}
                      aria-label="Max points"
                    />
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 mb-1.5">Weight</div>
                    <div className="relative">
                      <input
                        type="number"
                        step="5"
                        min={0}
                        max={100}
                        className="w-20 h-10 text-center rounded-lg border-2 border-teal-300 bg-teal-50 pl-3 pr-8 text-base font-bold text-teal-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 focus:bg-white"
                        value={Math.round(c.weight * 100)}
                        onChange={(e) => dispatch({ type: "rubric/updateCategory", id: c.id, update: { weight: clamp(Number(e.target.value) / 100, 0, 1) } })}
                        aria-label="Weight percentage"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-base font-bold text-teal-700 pointer-events-none">%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 border-l border-neutral-200 pl-3">
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
              </div>

            <div className="p-4 space-y-3">
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
          </>
        )}
      </div>

      {/* Step 2: Penalties Section */}
      <div className="rounded-2xl border-2 border-neutral-200 bg-white p-6 space-y-4 hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
            2
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-neutral-900">Penalties (Optional)</h3>
            <p className="text-sm text-neutral-600">Deduct points for common errors not covered by categories</p>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-600 text-sm font-semibold">
            {rubric.penalties.length} {rubric.penalties.length === 1 ? 'penalty' : 'penalties'}
          </div>
        </div>
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

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <button className="btn-secondary flex items-center gap-2 px-6 py-3" onClick={() => dispatch({ type: "ui/setStep", step: 1 })}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Question
        </button>
        <button 
          className="btn-primary flex items-center gap-2 px-8 py-3 text-base font-bold shadow-lg hover:shadow-xl transition-shadow"
          onClick={async () => {
            if (rubric.categories.length === 0) {
              await alertModal({ 
                title: "Categories Required", 
                message: "Please add at least one grading category before proceeding.", 
                tone: "warning" 
              });
              return;
            }
            if (!isWeightValid) {
              await alertModal({ 
                title: "Invalid Weights", 
                message: `Category weights must sum to 1.0 (100%). Current total: ${(totalWeight * 100).toFixed(0)}%`, 
                tone: "warning" 
              });
              return;
            }
            dispatch({ type: "ui/setStep", step: 3 });
          }}
        >
          Continue to Code Input
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


