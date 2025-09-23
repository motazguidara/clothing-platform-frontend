"use client";

import React from "react";
import { useUIStore } from "@/store/ui";

function useDebouncedCallback<A extends unknown[]>(cb: (...args: A) => void, delay = 300) {
  const ref = React.useRef(cb);
  React.useEffect(() => { ref.current = cb; }, [cb]);
  return React.useMemo(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    return (...args: A) => {
      clearTimeout(t);
      t = setTimeout(() => ref.current(...args), delay);
    };
  }, [delay]);
}

export default function SearchOverlay() {
  const isOpen = useUIStore((s) => s.isSearchOpen);
  const close = useUIStore((s) => s.closeSearch);
  const [q, setQ] = React.useState("");
  const overlayRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const triggerRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    // Capture the header trigger to return focus on close
    triggerRef.current = document.getElementById("header-search-trigger") as HTMLElement | null;
  }, []);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Global '/' to open
      if (e.key === "/" && !isOpen) {
        const target = e.target as HTMLElement;
        const isTyping = ["INPUT", "TEXTAREA"].includes(target?.tagName || "");
        if (!isTyping) {
          e.preventDefault();
          useUIStore.getState().openSearch();
        }
      }
      if (!isOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // focus input soon after paint
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      document.body.style.overflow = "";
      // return focus to header trigger if available
      triggerRef.current?.focus?.();
      setQ("");
    }
  }, [isOpen]);

  const onSearch = React.useCallback((query: string) => {
    if (process.env.NODE_ENV !== "production") {
      // placeholder behavior for now
      console.log("search:", query);
    }
    close();
  }, [close]);

  const debouncedChange = useDebouncedCallback((value: string) => {
    if (process.env.NODE_ENV !== "production") {
      // For future suggestions
      console.log("suggestions for:", value);
    }
  }, 300);

  if (!isOpen) return null;

  function onBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current) {
      close();
    }
  }

  const chips = [
    "p6000",
    "metcon 10",
    "air max",
    "jordan",
    "jordan 4",
    "air forces",
    "dunks",
    "soccer cleats",
  ];

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-input"
      className="fixed inset-0 z-30"
      onMouseDown={onBackdropClick}
    >
      {/* Backdrop under header */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn" />

      {/* Panel under header, keep header visible (z-40) */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-[88px] sm:pt-[96px] animate-slideDown">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="rounded-full bg-gray-100 shadow-inner px-4 py-2 flex items-center gap-2 focus-within:ring-2 ring-offset-2 ring-black">
              <svg width="18" height="18" viewBox="0 0 24 24" className="stroke-gray-500" fill="none" strokeWidth="1.5">
                <circle cx="11" cy="11" r="7" stroke="currentColor" />
                <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeLinecap="round" />
              </svg>
              <input
                id="search-input"
                ref={inputRef}
                value={q}
                onChange={(e) => { setQ(e.target.value); debouncedChange(e.target.value); }}
                onKeyDown={(e) => { if (e.key === "Enter") onSearch(q.trim()); }}
                placeholder="Search"
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-500"
                aria-label="Search products"
              />
            </div>
          </div>
          <button
            onClick={close}
            className="px-3 py-2 text-sm font-semibold hover:opacity-80"
          >
            Cancel
          </button>
        </div>

        <div className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-tight text-gray-600">Popular Search Terms</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {chips.map((c) => (
              <button
                key={c}
                className="px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-sm font-semibold transition active:scale-95"
                onClick={() => onSearch(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .animate-fadeIn { animation: fadeIn 200ms ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-slideDown { animation: slideDown 200ms ease-out; }
        @keyframes slideDown { from { transform: translateY(-6px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}
