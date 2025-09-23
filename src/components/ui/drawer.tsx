"use client";

import React from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  children?: React.ReactNode;
};

export default function Drawer({ open, onClose, children }: Props) {
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1" onClick={onClose} />
      <aside className="w-96 bg-background border-l border-border p-6 shadow-xl" role="dialog" aria-modal="true">
        <button className="mb-4" onClick={onClose} aria-label="Close">Close</button>
        {children}
      </aside>
    </div>
  );
}
