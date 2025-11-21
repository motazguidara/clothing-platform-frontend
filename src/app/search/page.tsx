"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useProducts, useCatalogFacets } from "@/hooks/useCatalog";
import ProductCard from "@/components/product-card";
import { useFilters } from "@/store/filters";
import { FilterSidebar, SortSelect } from "@/components/filters/filter-sidebar";
import {
  buildDefaultFilters,
  type BuildDefaultFiltersOptions,
} from "@/components/filters/default-filter-presets";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const filters = useFilters();
  const [searchQuery, setSearchQuery] = React.useState(
    searchParams.get("q") || "",
  );
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [bannerActive, setBannerActive] = React.useState(
    () => !Boolean(searchParams.get("q")),
  );
  const barRef = React.useRef<HTMLDivElement | null>(null);

  const requestParams = React.useMemo(() => {
    const params: Record<string, string | string[]> = {};
    const allowedKeys = [
      "q",
      "category",
      "gender",
      "price_min",
      "price_max",
      "size",
      "color",
      "brand",
      "ordering",
      "page",
      "sale",
      "in_stock",
    ] as const;

    allowedKeys.forEach((key) => {
      const values = searchParams
        .getAll(key)
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);

      if (values.length > 1) {
        params[key] = values;
        return;
      }

      const [firstValue] = values;
      if (firstValue) {
        params[key] = firstValue;
        return;
      }

      const value = searchParams.get(key);
      const trimmed = value?.trim() ?? "";
      if (trimmed.length > 0) {
        params[key] = trimmed;
      }
    });

    return params;
  }, [searchParams]);

  const serializedSearch = searchParams.toString();

  const activeFilterMap = React.useMemo(() => {
    const map = new Map<string, string[]>();
    const sp = new URLSearchParams(serializedSearch);
    sp.forEach((value, key) => {
      const trimmed = value.trim();
      if (!trimmed.length) return;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(trimmed);
    });
    return map;
  }, [serializedSearch]);

  const activeFilterChips = React.useMemo(() => {
    const chips: Array<{ key: string; value: string }> = [];
    activeFilterMap.forEach((values, key) => {
      if (key === "page" || key === "ordering") return;
      values.forEach((value) => {
        if (value.length > 0) {
          chips.push({ key, value });
        }
      });
    });
    return chips;
  }, [activeFilterMap]);

  const hasFilterKey = React.useCallback(
    (key: string) => (activeFilterMap.get(key)?.length ?? 0) > 0,
    [activeFilterMap],
  );

  const hasFilterValue = React.useCallback(
    (key: string, value: string) => {
      const values = activeFilterMap.get(key);
      if (!values || values.length === 0) return false;
      return values.includes(value);
    },
    [activeFilterMap],
  );

  const hasNonQueryFilters = React.useMemo(
    () => activeFilterChips.some((chip) => chip.key !== "q"),
    [activeFilterChips],
  );

  const fallbackFilters = React.useMemo(() => {
    const sp = new URLSearchParams(serializedSearch);
    const options: BuildDefaultFiltersOptions = {};

    const gender = sp.get("gender");
    if (gender && gender.trim().length > 0) {
      options.gender = gender.trim();
    }

    const priceMin = sp.get("price_min");
    if (priceMin && priceMin.trim().length > 0) {
      options.price_min = priceMin.trim();
    }

    const priceMax = sp.get("price_max");
    if (priceMax && priceMax.trim().length > 0) {
      options.price_max = priceMax.trim();
    }

    const sizeValues = sp
      .getAll("size")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
    if (sizeValues.length > 0) {
      options.size = sizeValues;
    }

    const categoryValues = sp
      .getAll("category")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
    if (categoryValues.length > 1) {
      options.category = categoryValues;
    } else if (categoryValues.length === 1) {
      options.category = categoryValues[0];
    }

    const colorValues = sp
      .getAll("color")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
    if (colorValues.length > 0) {
      options.color = colorValues;
    }

    const brandValues = sp
      .getAll("brand")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
    if (brandValues.length > 0) {
      options.brand = brandValues;
    }

    const sale = sp.get("sale");
    if (sale && sale.trim().length > 0) {
      options.sale = sale.trim();
    }

    const inStock = sp.get("in_stock");
    if (inStock && inStock.trim().length > 0) {
      options.in_stock = inStock.trim();
    }

    return buildDefaultFilters(options);
  }, [serializedSearch]);

  const { data, isLoading, isError } = useProducts(requestParams);
  const {
    data: facets,
    isLoading: facetsLoading,
    isError: facetsError,
  } = useCatalogFacets(requestParams);

  // Mock suggestions - in a real app, this would be an API call
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
    [],
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
    [],
  );

  // Handle search input changes with debounced suggestions
  React.useEffect(() => {
    if (searchQuery.length > 1) {
      const filtered = mockSuggestions.filter((item) =>
        item.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, mockSuggestions]);

  const handleSearch = (query: string) => {
    const url = new URL(window.location.href);
    if (query.trim()) {
      url.searchParams.set("q", query.trim());
    } else {
      url.searchParams.delete("q");
    }
    url.searchParams.delete("page");
    router.push(url.toString());
    setShowSuggestions(false);
    setBannerActive(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    handleSearch(suggestion);
  };

  const clearSearch = () => {
    setSearchQuery("");
    const url = new URL(window.location.href);
    url.searchParams.delete("q");
    url.searchParams.delete("page");
    router.push(url.toString());
  };

  const currentQuery = searchParams.get("q") || "";
  const resultCount = data?.count || 0;

  // Hide suggestions on outside click, and allow overlay click to navigate back
  React.useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      if (!barRef.current) return;
      if (!barRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("click", handleDocClick);
    return () => document.removeEventListener("click", handleDocClick);
  }, []);

  // Prevent background scroll while banner is active
  React.useEffect(() => {
    const original = document.body.style.overflow;
    if (bannerActive) document.body.style.overflow = "hidden";
    else document.body.style.overflow = original || "";
    return () => {
      document.body.style.overflow = original || "";
    };
  }, [bannerActive]);

  // Close banner when a query is present; do NOT auto-open when cleared
  React.useEffect(() => {
    const hasQ = Boolean(searchParams.get("q"));
    if (hasQ && bannerActive) setBannerActive(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams?.toString()]);

  return (
    <section className="max-w-7xl mx-auto px-6 pb-16 pt-36">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight uppercase">
          Search
        </h1>
        <p className="text-muted mt-2">Find exactly what you're looking for</p>
      </div>

      {/* Fixed Top Search Bar (covers header) */}
      {bannerActive && (
        <div className="fixed inset-x-0 top-0 z-50 bg-white/95 backdrop-blur border-b">
          <div ref={barRef} className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch(searchQuery);
                    if (e.key === "Escape") setShowSuggestions(false);
                  }}
                  onFocus={() => {
                    setBannerActive(true);
                    if (searchQuery.length > 1) setShowSuggestions(true);
                  }}
                  placeholder="Search"
                  className="w-full px-4 py-3 pl-10 pr-10 rounded-full bg-gray-100 shadow-inner focus:outline-none focus:ring-2 ring-black"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <svg
                    className="w-5 h-5 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="11" cy="11" r="7" stroke="currentColor" />
                    <path
                      d="M20 20l-3.5-3.5"
                      stroke="currentColor"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}

                {/* Suggestions dropdown below input */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg flex items-center gap-3"
                      >
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                        <span className="text-sm">{suggestion}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setBannerActive(false);
                  setShowSuggestions(false);
                }}
                className="text-sm text-gray-600 hover:text-black"
                aria-label="Cancel"
              >
                Cancel
              </button>
            </div>

            {/* Popular Search Terms */}
            <div className="mt-4">
              <div className="text-xs text-gray-500 mb-2">
                Popular Search Terms
              </div>
              <div className="flex flex-wrap gap-2">
                {popularTerms.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleSearch(term)}
                    className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dimming overlay under the fixed search bar (no redirect on close) */}
      {bannerActive && (
        <button
          aria-label="Dismiss search"
          onClick={() => {
            setBannerActive(false);
            setShowSuggestions(false);
          }}
          className="fixed inset-0 top-0 bg-black/20 animate-fade-in z-40"
        />
      )}

      {/* Search Results Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          {currentQuery ? (
            <div>
              <h2 className="text-xl font-semibold">
                Search results for "{currentQuery}"
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {resultCount} {resultCount === 1 ? "product" : "products"} found
              </p>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold">Products</h2>
              <p className="text-sm text-gray-600 mt-1">
                {resultCount} {resultCount === 1 ? "product" : "products"}
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <SortSelect />
        </div>
      </div>

      {/* Grid: Left sticky filters / Right results */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-3 lg:sticky lg:top-24 lg:self-start max-lg:order-2">
          <div className="lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto pr-1">
            <FilterSidebar
              filters={facets?.filters ?? []}
              isLoading={facetsLoading}
              error={facetsError ?? false}
              fallbackFilters={fallbackFilters}
            />
          </div>
        </div>
        <div className="lg:col-span-9 min-h-[50vh]">
          {/* Quick Filter Tags */}
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set("sale", "1");
                url.searchParams.delete("page");
                router.push(url.toString());
              }}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                hasFilterKey("sale")
                  ? "bg-black text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              On Sale
            </button>
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set("in_stock", "1");
                url.searchParams.delete("page");
                router.push(url.toString());
              }}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                hasFilterKey("in_stock")
                  ? "bg-black text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              In Stock
            </button>
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set("gender", "women");
                url.searchParams.delete("page");
                router.push(url.toString());
              }}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                hasFilterValue("gender", "women")
                  ? "bg-black text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              Women
            </button>
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set("gender", "men");
                url.searchParams.delete("page");
                router.push(url.toString());
              }}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                hasFilterValue("gender", "men")
                  ? "bg-black text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              Men
            </button>
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set("gender", "kids");
                url.searchParams.delete("page");
                router.push(url.toString());
              }}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                hasFilterValue("gender", "kids")
                  ? "bg-black text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              Kids
            </button>
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                const q = url.searchParams.get("q");
                // Clear common filters
                [
                  "sale",
                  "in_stock",
                  "gender",
                  "category",
                  "size",
                  "color",
                  "price_min",
                  "price_max",
                  "ordering",
                  "page",
                ].forEach((k) => url.searchParams.delete(k));
                // Preserve the query param if present
                url.search = q ? `?q=${encodeURIComponent(q)}` : "";
                router.push(url.toString());
              }}
              className="ml-2 px-3 py-1 rounded-full text-sm border hover:bg-gray-100"
              aria-label="Clear filters"
            >
              Clear filters
            </button>
          </div>

          {/* Active Filters */}
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {activeFilterChips.map(({ key, value }) => (
              <div
                key={`${key}-${value}`}
                className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs"
              >
                <span className="capitalize">
                  {key}: {value}
                </span>
                <button
                  onClick={() => {
                    const url = new URL(window.location.href);
                    const existing = url.searchParams.getAll(key);
                    url.searchParams.delete(key);
                    existing
                      .filter((entry) => entry !== value)
                      .forEach((entry) => url.searchParams.append(key, entry));
                    url.searchParams.delete("page");
                    router.push(url.toString());
                  }}
                  className="ml-1 text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            ))}
            {activeFilterChips.length > 0 && (
              <button
                onClick={() => {
                  const url = new URL(window.location.href);
                  const query = url.searchParams.get("q");
                  url.search = "";
                  if (query) {
                    url.searchParams.set("q", query);
                  }
                  router.push(url.toString());
                }}
                className="ml-2 px-3 py-1 text-xs border rounded-md hover:bg-gray-100"
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Search Results */}
          <div className="mt-8">
            {isError && (
              <div className="text-center py-12">
                <p className="text-red-600">Failed to load search results.</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 text-blue-600 hover:underline"
                >
                  Try again
                </button>
              </div>
            )}

            {isLoading && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-80 rounded-md bg-gray-200 animate-pulse"
                  />
                ))}
              </div>
            )}

            {!isLoading && data && (
              <>
                {data.results.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mb-4">
                      <svg
                        className="w-16 h-16 text-gray-300 mx-auto"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No products found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {currentQuery
                        ? `We couldn't find any products matching "${currentQuery}"`
                        : "No products match your current filters"}
                    </p>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">Try:</p>
                      <ul className="text-sm text-gray-500 space-y-1">
                        <li>â€¢ Checking your spelling</li>
                        <li>â€¢ Using fewer or different keywords</li>
                        <li>â€¢ Removing some filters</li>
                      </ul>
                    </div>
                    {(currentQuery || hasNonQueryFilters) && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          router.push("/search");
                        }}
                        className="mt-4 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition"
                      >
                        Clear search and filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-4">
                    {data.results.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Pagination */}
          {!isLoading && data && data.count > 20 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              {(() => {
                const total = Math.max(1, Math.ceil((data.count || 0) / 20));
                const current = Number(searchParams.get("page") || 1);
                const makeHref = (page: number) => {
                  const url = new URL(
                    window.location.href || "http://localhost:3000",
                  );
                  url.searchParams.set("page", String(page));
                  return url.toString();
                };
                return (
                  <>
                    <button
                      onClick={() =>
                        current > 1 && router.push(makeHref(current - 1))
                      }
                      disabled={current <= 1}
                      className={`px-3 py-2 border rounded-md text-sm ${
                        current <= 1
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      Previous
                    </button>
                    <span className="text-sm px-3">
                      Page {current} of {total}
                    </span>
                    <button
                      onClick={() =>
                        current < total && router.push(makeHref(current + 1))
                      }
                      disabled={current >= total}
                      className={`px-3 py-2 border rounded-md text-sm ${
                        current >= total
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      Next
                    </button>
                  </>
                );
              })()}
            </div>
          )}

          {/* Popular Searches */}
          {!currentQuery && !isLoading && (
            <div className="mt-16 border-t pt-8">
              <h3 className="text-lg font-semibold mb-4">Popular Searches</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "dress",
                  "jeans",
                  "sneakers",
                  "hoodie",
                  "t-shirt",
                  "jacket",
                ].map((term) => (
                  <button
                    key={term}
                    onClick={() => handleSearch(term)}
                    className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* right column end */}
      </div>
      {/* grid end */}
    </section>
  );
}
