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
    { code: "io_handling", description: "Thiếu kiểm tra input / sai định dạng I/O", points: -2 },
    { code: "runtime_error", description: "Lỗi runtime trên input cơ bản", points: -3 },
    { code: "plagiarism", description: "Sao chép mã / nghi ngờ gian lận", points: -10 },
    { code: "style_violation", description: "Vi phạm style nghiêm trọng (indent/format)", points: -1 },
    { code: "no_comments", description: "Thiếu chú thích/docstring tối thiểu", points: -1 },
  ];

  function addCategory() {
    const c: RubricCategory = {
      id: generateId("crit"),
      name: "New category",
      description: "",
      max_points: 10,
      weight: 0.5,
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
        description: "Điểm từ 0 đến 10, cách nhau 1 điểm",
        max_points: 10,
        weight: 0.5,
        bands: [
          { min_score: 0, max_score: 2, description: "Logic sai hoàn toàn, không có tiến trình rõ ràng để giải quyết vấn đề." },
          { min_score: 3, max_score: 4, description: "Có ý tưởng nhưng triển khai lộn xộn; thiếu nhiều bước quan trọng." },
          { min_score: 5, max_score: 6, description: "Logic cơ bản hợp lý; có thể giải quyết được một phần bài toán nhưng còn thiếu/nhầm một vài bước." },
          { min_score: 7, max_score: 8, description: "Logic rõ ràng, gần đúng hoàn toàn; chỉ còn một số chi tiết nhỏ hoặc edge case bị bỏ sót." },
          { min_score: 9, max_score: 10, description: "Logic hoàn chỉnh, mạch lạc; thể hiện tư duy giải quyết bài toán từ đầu đến cuối." },
        ],
      },
      {
        id: generateId("crit"),
        name: "readability",
        description: "Điểm từ 0 đến 10, cách nhau 1 điểm",
        max_points: 10,
        weight: 0.5,
        bands: [
          { min_score: 0, max_score: 2, description: "Code rối, không indent chuẩn, khó đọc." },
          { min_score: 3, max_score: 4, description: "Có format cơ bản nhưng thiếu nhất quán; tên biến/hàm không rõ nghĩa." },
          { min_score: 5, max_score: 6, description: "Format ổn; tên biến/hàm chấp nhận được; code đọc được nhưng chưa thực sự mạch lạc." },
          { min_score: 7, max_score: 8, description: "Code rõ ràng; đặt tên biến/hàm hợp lý; có comment/docstring cơ bản; chia nhỏ thành hàm/module ở mức vừa phải." },
          { min_score: 9, max_score: 10, description: "Code sáng sủa, rất dễ hiểu; tuân theo convention; có docstring/comment hợp lý; cấu trúc tốt, dễ bảo trì và mở rộng." },
        ],
      },
    ];
    const penalties = [
      { code: "io_handling", description: "I/O Handling sai", points: -2 },
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
          <div key={c.id} className="rounded-xl border border-neutral-200 bg-white p-3 space-y-2">
            <div className="flex items-center gap-2">
              <input
                className="rounded-lg border border-neutral-300 px-2 py-1 bg-white flex-1"
                value={c.name}
                onChange={(e) => dispatch({ type: "rubric/updateCategory", id: c.id, update: { name: e.target.value } })}
                aria-label="Category name"
              />
              <input
                type="number"
                min={0}
                max={10}
                className="w-20 rounded-lg border border-neutral-300 px-2 py-1 bg-white text-right"
                value={c.max_points}
                onChange={(e) => dispatch({ type: "rubric/updateCategory", id: c.id, update: { max_points: clamp(Number(e.target.value), 0, 10) } })}
                aria-label="Max points"
                title="Max points"
              />
              <input
                type="number"
                step="0.05"
                min={0}
                max={1}
                className="w-20 rounded-lg border border-neutral-300 px-2 py-1 bg-white text-right"
                value={c.weight}
                onChange={(e) => dispatch({ type: "rubric/updateCategory", id: c.id, update: { weight: clamp(Number(e.target.value), 0, 1) } })}
                aria-label="Weight"
                title="Weight"
              />
              <div className="flex-1" />
              <button className="icon-btn" aria-label="Move up" onClick={() => dispatch({ type: "rubric/reorder", from: cIdx, to: Math.max(0, cIdx - 1) })}>↑</button>
              <button className="icon-btn" aria-label="Move down" onClick={() => dispatch({ type: "rubric/reorder", from: cIdx, to: Math.min(rubric.categories.length - 1, cIdx + 1) })}>↓</button>
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
            <div className="text-xs text-neutral-600">Điểm từ 0 đến {c.max_points}, cách nhau 1 điểm</div>

            <div className="space-y-3">
              {c.bands.map((b, i) => (
                <div key={i} className="grid grid-cols-[160px_1fr_36px] items-start gap-3">
                  <div className="flex items-center gap-2">
                    <input type="number" className="w-14 rounded-lg border border-neutral-300 px-2 py-1 bg-white text-right" value={b.min_score}
                      onChange={(e) => updateBand(c.id, i, { min_score: Number(e.target.value) })} aria-label="Min score" />
                    <span className="text-neutral-500">–</span>
                    <input type="number" className="w-14 rounded-lg border border-neutral-300 px-2 py-1 bg-white text-right" value={b.max_score}
                      onChange={(e) => updateBand(c.id, i, { max_score: Number(e.target.value) })} aria-label="Max score" />
                  </div>
                  <textarea rows={2} title={b.description} placeholder="Mô tả band (ngắn gọn)…" className="rounded-lg border border-neutral-300 px-2 py-1 bg-white resize-y min-h-[44px]" value={b.description}
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
        <p className="text-sm text-neutral-600">Tùy chọn. Dùng để trừ điểm cho lỗi chung (không thuộc tiêu chí nào). Sử dụng số âm cho <em>points</em>. Ví dụ: code <code className="px-1 rounded bg-neutral-100">io_handling</code>, description <em>Thiếu kiểm tra input</em>, points <code className="px-1 rounded bg-neutral-100">-2</code>.</p>
        <div className="flex items-center gap-2">
          <label className="text-sm text-neutral-600">Thêm nhanh</label>
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
              <input placeholder="e.g., Thiếu kiểm tra input / sai format" className="rounded-lg border border-neutral-300 px-2 py-1 bg-white" value={p.description} onChange={(e) => {
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


