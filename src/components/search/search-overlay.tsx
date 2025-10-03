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

  // Auto-close on any route or query change (prevents lingering overlay/dim)
  React.useEffect(() => {
    if (!isOpen) return;
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, sp?.toString()]);

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
      <div className="absolute inset-x-0 top-0 bg-white/95 backdrop-blur border-b z-50 animate-fade-in shadow-sm">
        <div ref={barRef} className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center gap-6">
            <div className="relative flex-1">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit(query);
                }}
                onFocus={() => query.length > 1 && setShowSuggestions(true)}
                placeholder="Search"
                className="w-full px-5 py-3.5 pl-12 pr-12 rounded-full bg-gray-100 shadow-inner focus:outline-none focus:ring-2 ring-black text-base"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" />
                  <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeLinecap="round" />
                </svg>
              </div>
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => submit(s)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg flex items-center gap-3"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span className="text-sm">{s}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => submit(query)}
              className="px-5 py-3 rounded-full bg-black text-white text-sm hover:bg-gray-900 transition-soft"
              aria-label="Submit search"
            >
              Search
            </button>
            <button onClick={onClose} className="text-sm text-gray-600 hover:text-black" aria-label="Cancel">
              Cancel
            </button>
          </div>

          <div className="mt-5">
            <div className="text-xs text-gray-500 mb-2">Popular Search Terms</div>
            <div className="flex flex-wrap gap-2">
              {popularTerms.map((term) => (
                <button
                  key={term}
                  onClick={() => submit(term)}
                  className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200 transition-colors"
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
