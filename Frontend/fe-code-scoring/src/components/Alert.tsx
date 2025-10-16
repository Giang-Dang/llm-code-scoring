"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type AlertOptions = {
  title?: string;
  message?: React.ReactNode;
  confirmText?: string;
  tone?: "success" | "error" | "info" | "warning";
};

type AlertContextType = {
  alert: (opts: AlertOptions) => Promise<void>;
};

const AlertContext = createContext<AlertContextType | null>(null);

type Pending = AlertOptions & { resolve: () => void };

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);

  const alert = useCallback((opts: AlertOptions) => {
    return new Promise<void>((resolve) => {
      setPending({ ...opts, resolve });
    });
  }, []);

  const onClose = useCallback(() => {
    if (pending) pending.resolve();
    setPending(null);
  }, [pending]);

  const value = useMemo(() => ({ alert }), [alert]);

  return (
    <AlertContext.Provider value={value}>
      {children}
      {pending && (
        <AlertCard
          title={pending.title}
          message={pending.message}
          confirmText={pending.confirmText}
          tone={pending.tone}
          onClose={onClose}
        />
      )}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlert must be used within AlertProvider");
  return ctx.alert;
}

function AlertCard({
  title,
  message,
  confirmText,
  tone = "info",
  onClose,
}: AlertOptions & { onClose: () => void }) {
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    confirmBtnRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" || e.key === "Enter") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const chipClass = 
    tone === "success" ? "bg-green-100 text-green-600" :
    tone === "error" ? "bg-red-100 text-red-600" :
    tone === "warning" ? "bg-amber-100 text-amber-600" :
    "bg-blue-100 text-blue-600";

  const icon = 
    tone === "success" ? "✓" :
    tone === "error" ? "✕" :
    tone === "warning" ? "⚠" :
    "ℹ";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay" onClick={onClose}>
      <div
        className="modal-card w-[min(520px,95vw)] rounded-2xl border border-neutral-200 bg-white shadow-2xl relative"
        role="dialog"
        aria-modal="true"
        aria-label={title || "Alert"}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="icon-btn absolute top-3 right-3" aria-label="Close" onClick={onClose}>✕</button>
        <div className="px-5 pt-5 pb-2 flex items-start gap-3">
          <div className={`h-9 w-9 rounded-full flex items-center justify-center text-lg font-bold ${chipClass}`}>
            {icon}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-neutral-900 truncate-1">{title || "Notification"}</h3>
            <div className="mt-1 text-neutral-600 text-sm">{message}</div>
          </div>
        </div>
        <div className="px-5 py-4 flex items-center justify-end gap-2">
          <button
            ref={confirmBtnRef}
            className="btn-primary"
            onClick={onClose}
          >
            {confirmText || "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}
