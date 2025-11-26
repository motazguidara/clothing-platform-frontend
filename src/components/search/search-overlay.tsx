"use client";

import React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function SearchOverlay({ isOpen, onClose }: Props) {
  const [query, setQuery] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const barRef = React.useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const prevOverflowRef = React.useRef<string>("");
  const searchParamsString = React.useMemo(() => sp?.toString() ?? "", [sp]);
  const lastLocationRef = React.useRef<string>("");

  const mockSuggestions = React.useMemo(
    () => [
      "t-shirt",
      "dress",
      "jeans",
      "hoodie",
      "sneakers",
      "jacket",
      "polo shirt",
      "sweater",
      "shorts",
      "skirt",
      "boots",
      "sandals",
    ],
    []
  );

  const popularTerms = React.useMemo(
    () => [
      "football boots",
      "p6000",
      "air force 1",
      "air max 95",
      "air max",
      "jordan 4",
      "jordan",
      "socks",
    ],
    []
  );

  // Close on escape and set scroll lock
  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    prevOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflowRef.current || "";
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  // Auto-close when navigation occurs while the overlay is open.
  React.useEffect(() => {
    const currentLocation = `${pathname ?? ""}?${searchParamsString}`;

    if (!isOpen) {
      lastLocationRef.current = currentLocation;
      return;
    }

    if (lastLocationRef.current && lastLocationRef.current !== currentLocation) {
      onClose();
    }

    lastLocationRef.current = currentLocation;
  }, [isOpen, pathname, searchParamsString, onClose]);

  // Outside click closes suggestions (not overlay)
  React.useEffect(() => {
    if (!isOpen) return;
    const handleDocClick = (e: MouseEvent) => {
      if (!barRef.current) return;
      if (!barRef.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener("click", handleDocClick);
    return () => document.removeEventListener("click", handleDocClick);
  }, [isOpen]);

  // Suggestions
  React.useEffect(() => {
    if (!isOpen) return;
    if (query.length > 1) {
      const filtered = mockSuggestions
        .filter((s: string) => s.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query, isOpen, mockSuggestions]);

  const submit = (value: string) => {
    const q = value.trim();
    if (!q) return;
    onClose();
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="search-overlay-title">
      {/* Dim overlay */}
      <button
        aria-label="Dismiss search"
        className="absolute inset-0 bg-black/20 animate-fade-in z-50"
        onClick={onClose}
      />

      {/* Bar container covering header (top-0) */}
      <div className="absolute inset-x-0 top-0 bg-white/95 backdrop-blur border-b border-slate-200 z-50 animate-fade-in shadow-md">
        <div ref={barRef} className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center gap-5">
            <div className="relative flex-1">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit(query);
                }}
                onFocus={() => query.length > 1 && setShowSuggestions(true)}
                placeholder="Search"
                className="w-full rounded-full border border-slate-200 bg-white/90 px-5 py-3.5 pl-12 pr-12 text-base shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" />
                  <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeLinecap="round" />
                </svg>
              </div>
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white/95 border border-slate-200 rounded-2xl shadow-xl z-10 backdrop-blur">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => submit(s)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-800 hover:bg-slate-50 first:rounded-t-2xl last:rounded-b-2xl"
                    >
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span>{s}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => submit(query)}
              className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
              aria-label="Submit search"
            >
              Search
            </button>
            <button onClick={onClose} className="text-sm text-slate-600 hover:text-slate-900" aria-label="Cancel">
              Cancel
            </button>
          </div>

          <div className="mt-5">
            <div className="text-xs text-slate-500 mb-2">Popular Search Terms</div>
            <div className="flex flex-wrap gap-2">
              {popularTerms.map((term) => (
                <button
                  key={term}
                  onClick={() => submit(term)}
                  className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-800 transition hover:bg-slate-200"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
