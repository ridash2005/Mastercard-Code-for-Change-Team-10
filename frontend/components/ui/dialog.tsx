"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function Dialog({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-navy/40" aria-label="Close dialog" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="relative z-10 max-h-[min(34rem,calc(100vh-2rem))] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-card p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="dialog-title" className="font-serif text-2xl text-plum">
            {title}
          </h2>
          <button ref={closeRef} type="button" onClick={onClose} className="rounded-full px-2 py-1 text-sm text-muted hover:bg-ivory">
            Close
          </button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}
