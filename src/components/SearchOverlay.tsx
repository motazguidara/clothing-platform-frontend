"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/store/ui";

// Search suggestions interface
interface SearchSuggestion {
  id: string;
  text: string;
  type: 'product' | 'category' | 'brand';
  count?: number;
}

// Optimized debounce hook
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function SearchOverlay() {
  const router = useRouter();
  const isOpen = useUIStore((s) => s.isSearchOpen);
  const close = useUIStore((s) => s.closeSearch);
  
  // State management
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  // Refs
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Capture the header trigger to return focus on close
    triggerRef.current = document.getElementById("header-search-trigger") as HTMLElement | null;
  }, []);

  // Enhanced keyboard navigation
  useEffect(() => {
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
      
      // Handle escape
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      
      // Handle arrow navigation
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
      }
      
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => prev > -1 ? prev - 1 : -1);
      }
      
      // Handle enter
      if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        } else if (q.trim()) {
          handleSearch(q.trim());
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close, selectedIndex, q, suggestions]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // focus input soon after paint
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      document.body.style.overflow = "";
      // return focus to header trigger if available
      triggerRef.current?.focus?.();
      setQ("");
      setSuggestions([]);
      setSelectedIndex(-1);
      setError(null);
    }
  }, [isOpen]);

  // Search handlers
  const handleSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    
    close();
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    
    // Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'search', {
        search_term: query.trim(),
      });
    }
  }, [close, router]);

  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    close();
    
    switch (suggestion.type) {
      case 'product':
        router.push(`/products/${suggestion.id}`);
        break;
      case 'category':
        router.push(`/catalog?category=${suggestion.id}`);
        break;
      case 'brand':
        router.push(`/catalog?brand=${suggestion.id}`);
        break;
      default:
        router.push(`/search?q=${encodeURIComponent(suggestion.text)}`);
    }
  }, [close, router]);

  // Debounced search query
  const debouncedQuery = useDebouncedValue(q, 300);

  // Fetch suggestions
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      // Mock suggestions for now - replace with actual API call
      const mockSuggestions: SearchSuggestion[] = [
        { id: '1', text: `${query} shirts`, type: 'product' },
        { id: '2', text: `${query} category`, type: 'category' },
        { id: '3', text: `${query} brand`, type: 'brand' },
      ];
      
      if (!abortControllerRef.current.signal.aborted) {
        setSuggestions(mockSuggestions);
        setSelectedIndex(-1);
      }
    } catch (err: unknown) {
      if (!abortControllerRef.current.signal.aborted) {
        setError('Failed to load suggestions');
        setSuggestions([]);
      }
    } finally {
      if (!abortControllerRef.current.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  // Effect to fetch suggestions when debounced query changes
  useEffect(() => {
    if (debouncedQuery && isOpen) {
      fetchSuggestions(debouncedQuery);
    }
  }, [debouncedQuery, isOpen, fetchSuggestions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && q.trim()) handleSearch(q.trim()); }}
                placeholder="Search products..."
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-500"
                aria-label="Search products"
                autoComplete="off"
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

        {/* Search Suggestions */}
        {suggestions.length > 0 && (
          <div className="mt-4 bg-white rounded-lg shadow-lg border border-gray-200 max-h-64 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 ${
                  index === selectedIndex ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                }`}
                onClick={() => handleSuggestionSelect(suggestion)}
              >
                <div className="flex-shrink-0">
                  {suggestion.type === 'product' && (
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  )}
                  {suggestion.type === 'category' && (
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  )}
                  {suggestion.type === 'brand' && (
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{suggestion.text}</div>
                  <div className="text-xs text-gray-500 capitalize">{suggestion.type}</div>
                </div>
                {suggestion.count && (
                  <div className="text-xs text-gray-400">{suggestion.count} results</div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Popular Search Terms - Show when no suggestions */}
        {!suggestions.length && !isLoading && (
          <div className="mt-4">
            <div className="text-xs font-semibold uppercase tracking-tight text-gray-600">Popular Search Terms</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {chips.map((c) => (
                <button
                  key={c}
                  className="px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-sm font-semibold transition active:scale-95"
                  onClick={() => handleSearch(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="mt-4 flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            <span className="ml-2 text-sm text-gray-600">Searching...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
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
