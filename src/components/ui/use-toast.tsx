"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

export type ToastVariant = "default" | "destructive" | "success" | "warning" | "info";

export interface ToastActionElement {
  label: string;
  onClick: () => void;
}

export interface ToastProps {
  id: string;
  title?: string;
  description?: React.ReactNode;
  action?: ToastActionElement;
  variant?: ToastVariant;
  duration?: number;
  onOpenChange?: (open: boolean) => void;
}

export interface ToastOptions extends Omit<ToastProps, "id"> {
  id?: string;
}

export interface ToastReturn {
  id: string;
  dismiss: () => void;
  update: (props: ToastProps) => void;
}

export interface ToastContextProps {
  toasts: ToastProps[];
  toast: (props: ToastOptions) => ToastReturn;
  dismiss: (toastId?: string) => void;
}

type ToastAction =
  | { type: "ADD"; toast: ToastProps }
  | { type: "UPDATE"; toast: ToastProps }
  | { type: "DISMISS"; toastId?: string };

const listeners = new Set<(action: ToastAction) => void>();
const toastTimeouts = new Map<string, number>();

const ToastContext = React.createContext<ToastContextProps | null>(null);

function dispatch(action: ToastAction) {
  listeners.forEach((listener) => listener(action));
}

function generateId() {
  return `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function dismiss(toastId?: string) {
  if (toastId) {
    clearToastTimeout(toastId);
  } else {
    toastTimeouts.forEach((timeoutId) => {
      if (typeof window !== "undefined") {
        window.clearTimeout(timeoutId);
      }
    });
    toastTimeouts.clear();
  }
  dispatch(toastId ? { type: "DISMISS", toastId } : { type: "DISMISS" });
}

export function toast(options: ToastOptions): ToastReturn {
  const id = options.id ?? generateId();
  const payload: ToastProps = {
    id,
    variant: options.variant ?? "default",
    ...options,
  };

  dispatch({ type: "ADD", toast: payload });
  payload.onOpenChange?.(true);
  scheduleAutoDismiss(payload);

  const update = (next: ToastProps) => {
    const updated: ToastProps = { ...payload, ...next, id };
    dispatch({ type: "UPDATE", toast: updated });
    scheduleAutoDismiss(updated);
  };

  return {
    id,
    dismiss: () => dismiss(id),
    update,
  };
}

function scheduleAutoDismiss(toast: ToastProps) {
  const duration = toast.duration ?? 4000;
  if (duration === Infinity || duration === 0) {
    clearToastTimeout(toast.id);
    return;
  }

  if (typeof window === "undefined") {
    return;
  }

  clearToastTimeout(toast.id);
  const timeoutId = window.setTimeout(() => {
    toast.onOpenChange?.(false);
    dismiss(toast.id);
  }, duration);
  toastTimeouts.set(toast.id, timeoutId);
}

function clearToastTimeout(toastId: string) {
  if (typeof window === "undefined") {
    return;
  }
  const timeoutId = toastTimeouts.get(toastId);
  if (timeoutId) {
    window.clearTimeout(timeoutId);
    toastTimeouts.delete(toastId);
  }
}

function toastReducer(state: ToastProps[], action: ToastAction): ToastProps[] {
  switch (action.type) {
    case "ADD": {
      const next = state.filter((toast) => toast.id !== action.toast.id);
      next.push(action.toast);
      return next.slice(-6);
    }
    case "UPDATE": {
      return state.map((toast) => (toast.id === action.toast.id ? { ...toast, ...action.toast } : toast));
    }
    case "DISMISS": {
      if (!action.toastId) {
        return [];
      }
      return state.filter((toast) => toast.id !== action.toastId);
    }
    default:
      return state;
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useReducer(toastReducer, []);

  React.useEffect(() => {
    const listener = (action: ToastAction) => {
      setToasts(action);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const contextValue = React.useMemo<ToastContextProps>(
    () => ({
      toasts,
      toast,
      dismiss,
    }),
    [toasts]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextProps {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

type ToastViewportProps = {
  toasts: ToastProps[];
  onDismiss: (toastId: string) => void;
};

function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[110] flex flex-col items-end justify-end gap-3 px-4 py-6 sm:items-end sm:justify-end sm:px-6">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={toastContainerClassName(toast.variant)}
          >
            <div className="flex w-full flex-1 flex-col gap-1">
              {toast.title ? <p className="text-sm font-semibold leading-tight">{toast.title}</p> : null}
              {toast.description ? (
                <div className="text-sm leading-normal text-gray-600">{toast.description}</div>
              ) : null}
            </div>
            {toast.action ? (
              <button
                type="button"
                onClick={() => {
                  toast.action?.onClick();
                  onDismiss(toast.id);
                }}
                className="mt-3 inline-flex w-fit items-center justify-center rounded-md border border-transparent bg-black px-3 py-1 text-sm font-medium text-white shadow-sm transition-colors hover:bg-black/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 sm:mt-0 sm:ml-4"
              >
                {toast.action.label}
              </button>
            ) : null}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function toastContainerClassName(variant: ToastVariant = "default") {
  const base =
    "pointer-events-auto flex w-full max-w-sm flex-col rounded-lg border bg-white p-4 shadow-lg ring-1 ring-black/5 sm:flex-row sm:items-start";
  switch (variant) {
    case "destructive":
      return `${base} border-red-200 bg-red-50 text-red-800`;
    case "success":
      return `${base} border-emerald-200 bg-emerald-50 text-emerald-800`;
    case "warning":
      return `${base} border-amber-200 bg-amber-50 text-amber-900`;
    case "info":
      return `${base} border-sky-200 bg-sky-50 text-sky-800`;
    default:
      return `${base} border-gray-200 text-gray-900`;
  }
}
