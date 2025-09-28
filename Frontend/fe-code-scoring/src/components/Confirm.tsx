"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type ConfirmOptions = {
  title?: string;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  tone?: "danger" | "primary";
};

type ConfirmContextType = {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextType | null>(null);

type Pending = ConfirmOptions & { resolve: (v: boolean) => void };

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...opts, resolve });
    });
  }, []);

  const onClose = useCallback(() => {
    if (pending) pending.resolve(false);
    setPending(null);
  }, [pending]);

  const onConfirm = useCallback(() => {
    if (pending) pending.resolve(true);
    setPending(null);
  }, [pending]);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {pending && (
        <ConfirmCard
          title={pending.title}
          message={pending.message}
          cancelText={pending.cancelText}
          confirmText={pending.confirmText}
          tone={pending.tone}
          onCancel={onClose}
          onConfirm={onConfirm}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx.confirm;
}

function ConfirmCard({
  title,
  message,
  cancelText,
  confirmText,
  tone,
  onCancel,
  onConfirm,
}: ConfirmOptions & { onCancel: () => void; onConfirm: () => void }) {
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    confirmBtnRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel, onConfirm]);

  const chipClass = tone === "danger"
    ? "bg-red-100 text-red-600"
    : "bg-emerald-100 text-emerald-600";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay" onClick={onCancel}>
      <div
        className="modal-card w-[min(520px,95vw)] rounded-2xl border border-neutral-200 bg-white shadow-2xl relative"
        role="dialog"
        aria-modal="true"
        aria-label={title || "Confirm"}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="icon-btn absolute top-3 right-3" aria-label="Close" onClick={onCancel}>✕</button>
        <div className="px-5 pt-5 pb-2 flex items-start gap-3">
          <div className={`h-9 w-9 rounded-full flex items-center justify-center ${chipClass}`}>!</div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-neutral-900 truncate-1">{title || "Are you sure?"}</h3>
            <div className="mt-1 text-neutral-600 text-sm">{message || "This action cannot be undone."}</div>
          </div>
        </div>
        <div className="px-5 py-4 flex items-center justify-end gap-2">
          <button className="btn-secondary" onClick={onCancel}>{cancelText || "Cancel"}</button>
          <button
            ref={confirmBtnRef}
            className={tone === "danger" ? "btn-danger" : "btn-primary"}
            onClick={onConfirm}
          >
            {confirmText || (tone === "danger" ? "Delete" : "Confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}


