"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";

export type Toast = { id: number; title: string; description?: string; variant?: "default" | "success" | "error" };

type ToastContextType = {
  show: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = React.createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const idRef = React.useRef(1);

  const show = React.useCallback((t: Omit<Toast, "id">) => {
    const id = idRef.current++;
    const toast: Toast = { id, ...t };
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 2500);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`rounded-md border px-4 py-3 shadow-sm bg-white ${
                t.variant === "success" ? "border-green-600" : t.variant === "error" ? "border-red-600" : "border-border"
              }`}
            >
              <div className="text-sm font-semibold">{t.title}</div>
              {t.description ? <div className="text-xs text-muted mt-1">{t.description}</div> : null}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
