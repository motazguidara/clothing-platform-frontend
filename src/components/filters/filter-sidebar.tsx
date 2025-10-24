"use client";

import React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { CatalogFilterGroup } from "@/types";

function useUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const buildUrl = React.useCallback(() => {
    const query = sp?.toString();
    return new URL(
      window.location.origin +
        pathname +
        (query && query.length ? `?${query}` : "")
    );
  }, [pathname, sp]);

  const setParams = React.useCallback(
    (updates: Array<{ key: string; value?: string | null }>) => {
      const url = buildUrl();
      updates.forEach(({ key, value }) => {
        if (value != null && String(value).length > 0) {
          url.searchParams.set(key, String(value));
        } else {
          url.searchParams.delete(key);
        }
      });
      url.searchParams.delete("page");
      router.push(`${url.pathname}${url.search}`);
    },
    [buildUrl, router]
  );

  const setParam = React.useCallback(
    (key: string, value?: string | null) => {
      setParams([{ key, value: value ?? undefined }]);
    },
    [setParams]
  );

  return { setParam, setParams, sp };
}

type FilterSidebarProps = {
  filters?: CatalogFilterGroup[];
  className?: string;
  isLoading?: boolean;
  error?: boolean;
  fallbackFilters?: CatalogFilterGroup[];
  defaultOpen?: boolean;
};

function formatCountLabel(label: string, count: number) {
  if (!count) return label;
  return `${label} (${count})`;
}

export function FilterSidebar({
  filters = [],
  className = "",
  isLoading = false,
  error = false,
  fallbackFilters = [],
  defaultOpen = false,
}: FilterSidebarProps) {
  const { sp, setParam, setParams } = useUrl();
  const [show, setShow] = React.useState(true);
  const [openState, setOpenState] = React.useState<Record<string, boolean>>({});

  const safeFilters = React.useMemo(
    () => (Array.isArray(filters) ? filters : []),
    [filters]
  );

  const safeFallbackFilters = React.useMemo(
    () => (Array.isArray(fallbackFilters) ? fallbackFilters : []),
    [fallbackFilters]
  );

  const filtersSource =
    safeFilters.length > 0 ? safeFilters : safeFallbackFilters;

  const priceGroup = React.useMemo(
    () => filtersSource.find((group) => group.id === "price"),
    [filtersSource]
  );

  const activePriceMin =
    priceGroup?.range?.active_min != null
      ? String(priceGroup.range.active_min)
      : "";
  const activePriceMax =
    priceGroup?.range?.active_max != null
      ? String(priceGroup.range.active_max)
      : "";

  const handlePresetClick = React.useCallback(
    (min?: number | null, max?: number | null) => {
      setParams([
        { key: "price_min", value: min != null ? String(min) : undefined },
        { key: "price_max", value: max != null ? String(max) : undefined },
      ]);
    },
    [setParams]
  );

  const isPresetActive = React.useCallback(
    (min?: number | null, max?: number | null) => {
      const currentMin = priceGroup?.range?.active_min ?? null;
      const currentMax = priceGroup?.range?.active_max ?? null;
      const targetMin = min ?? null;
      const targetMax = max ?? null;
      return currentMin === targetMin && currentMax === targetMax;
    },
    [priceGroup]
  );

  const renderGroupLabel = (label: string, group: CatalogFilterGroup) => {
    const selectedCount = group.selected?.filter(Boolean).length ?? 0;
    const rangeActive =
      group.selection === "range" &&
      (group.range?.active_min != null || group.range?.active_max != null);
    const totalActive = selectedCount + (rangeActive ? 1 : 0);
    return totalActive ? `${label} (${totalActive})` : label;
  };

  const filtersToRender = filtersSource.filter(
    (group) => group.options.length > 0 || group.selection === "range"
  );

  const filtersSignature = React.useMemo(
    () => filtersToRender.map((group) => group.id).join("|"),
    [filtersToRender]
  );

  React.useEffect(() => {
    setOpenState((prev) => {
      const next: Record<string, boolean> = {};
      let changed = Object.keys(prev).length !== filtersToRender.length;

      filtersToRender.forEach((group) => {
        const hadPrev = Object.prototype.hasOwnProperty.call(prev, group.id);
        const prevValue = hadPrev ? prev[group.id] : defaultOpen;
        next[group.id] = prevValue;
        if (!hadPrev) {
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [filtersSignature, filtersToRender, defaultOpen]);

  const toggleGroup = React.useCallback((id: string) => {
    setOpenState((prev) => ({
      ...prev,
      [id]: !(prev[id] ?? false),
    }));
  }, []);

  return (
    <aside className={`${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">Filters</h2>
        <button onClick={() => setShow((s) => !s)} className="text-sm text-gray-600 hover:underline">
          {show ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      {show && (
        <div className="space-y-6">
          {isLoading && filtersSource.length === 0 && (
            <div className="space-y-4 animate-pulse">
              <div>
                <div className="h-4 w-24 rounded bg-gray-200" />
                <div className="mt-3 space-y-2">
                  <div className="h-3 w-20 rounded bg-gray-200" />
                  <div className="h-3 w-28 rounded bg-gray-200" />
                  <div className="h-3 w-16 rounded bg-gray-200" />
                </div>
              </div>
              <div>
                <div className="h-4 w-28 rounded bg-gray-200" />
                <div className="mt-3 flex flex-wrap gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-6 w-12 rounded bg-gray-200" />
                  ))}
                </div>
              </div>
            </div>
          )}

          {!isLoading && filtersToRender.length === 0 && !error && (
            <p className="text-sm text-gray-500">No filters available for this view.</p>
          )}

          {!isLoading && error && (
            <p className="text-sm text-red-600">Unable to load filters right now.</p>
          )}

          {filtersToRender.map((group, groupIndex) => {
            const label = renderGroupLabel(group.label, group);
            const isOpen = openState[group.id] ?? false;
            let content: React.ReactNode = null;

            if (group.id === "gender") {
              content = (
                <div className="space-y-1">
                  {group.options.map((option) => {
                    const isChecked = group.selected?.includes(option.value) ?? false;
                    return (
                      <label key={option.value} className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="gender"
                          checked={isChecked}
                          onChange={() => setParam("gender", option.value)}
                        />
                        <span>
                          {option.count != null
                            ? formatCountLabel(option.label, option.count)
                            : option.label}
                        </span>
                      </label>
                    );
                  })}
                  {(group.selected?.length ?? 0) > 0 && (
                    <button
                      className="text-xs text-gray-600 hover:underline mt-1"
                      onClick={() => setParam("gender", undefined)}
                    >
                      Clear
                    </button>
                  )}
                </div>
              );
            } else if (group.id === "price" && priceGroup) {
              content = (
                <div className="space-y-1">
                  {group.options.map((option) => (
                    <button
                      key={option.value ?? option.label}
                      className={`block w-full text-left text-sm ${
                        isPresetActive(option.min, option.max)
                          ? "font-semibold text-gray-900"
                          : "hover:underline"
                      }`}
                      onClick={() => handlePresetClick(option.min, option.max)}
                    >
                      {option.label}
                      {option.count != null ? ` (${option.count})` : ""}
                    </button>
                  ))}
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      placeholder="Min"
                      defaultValue={activePriceMin}
                      className="w-20 px-2 py-1 border rounded"
                      onBlur={(e) =>
                        setParam("price_min", e.target.value ? e.target.value : undefined)
                      }
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      placeholder="Max"
                      defaultValue={activePriceMax}
                      className="w-20 px-2 py-1 border rounded"
                      onBlur={(e) =>
                        setParam("price_max", e.target.value ? e.target.value : undefined)
                      }
                    />
                  </div>
                  {(activePriceMin || activePriceMax) && (
                    <button
                      className="text-xs text-gray-600 hover:underline mt-1"
                      onClick={() =>
                        setParams([
                          { key: "price_min", value: undefined },
                          { key: "price_max", value: undefined },
                        ])
                      }
                    >
                      Clear
                    </button>
                  )}
                </div>
              );
            } else if (group.selection === "toggle") {
              const paramKey = group.param;
              content = (
                <>
                  {group.options.map((option) => {
                    const isChecked = group.selected?.includes(option.value) ?? false;
                    return (
                      <label key={option.value} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            setParam(paramKey, e.target.checked ? option.value : undefined)
                          }
                        />
                        <span>
                          {option.count != null
                            ? formatCountLabel(option.label, option.count)
                            : option.label}
                        </span>
                      </label>
                    );
                  })}
                </>
              );
            } else if (group.id === "size") {
              const current = group.selected?.[0];
              content = (
                <>
                  <div className="flex flex-wrap gap-2">
                    {group.options.map((option) => {
                      const isActive = current === option.value;
                      return (
                        <button
                          key={option.value}
                          className={`px-2 py-1 border rounded text-xs ${
                            isActive ? "bg-black text-white" : "hover:bg-gray-100"
                          }`}
                          onClick={() =>
                            setParam("size", isActive ? undefined : option.value)
                          }
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                  {current && (
                    <button
                      className="text-xs text-gray-600 hover:underline mt-1"
                      onClick={() => setParam("size", undefined)}
                    >
                      Clear
                    </button>
                  )}
                </>
              );
            } else if (group.id === "color") {
              const current = group.selected?.[0];
              content = (
                <>
                  <div className="flex flex-wrap gap-2">
                    {group.options.map((option) => {
                      const isActive = current === option.value;
                      return (
                        <button
                          key={option.value}
                          className={`px-2 py-1 border rounded text-xs ${
                            isActive ? "bg-black text-white" : "hover:bg-gray-100"
                          }`}
                          onClick={() =>
                            setParam("color", isActive ? undefined : option.value)
                          }
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                  {current && (
                    <button
                      className="text-xs text-gray-600 hover:underline mt-1"
                      onClick={() => setParam("color", undefined)}
                    >
                      Clear
                    </button>
                  )}
                </>
              );
            } else if (group.id === "brand") {
              const current = group.selected?.[0];
              content = (
                <>
                  <div className="space-y-1">
                    {group.options.map((option) => {
                      const value = (option.slug ?? option.value) ?? "";
                      const isActive = current === value;
                      return (
                        <button
                          key={value}
                          className={`block w-full text-left text-sm ${
                            isActive ? "font-semibold text-gray-900" : "hover:underline"
                          }`}
                          onClick={() => setParam("brand", isActive ? undefined : value)}
                        >
                          {option.label}
                          {option.count != null ? ` (${option.count})` : ""}
                        </button>
                      );
                    })}
                  </div>
                  {current && (
                    <button
                      className="text-xs text-gray-600 hover:underline mt-1"
                      onClick={() => setParam("brand", undefined)}
                    >
                      Clear
                    </button>
                  )}
                </>
              );
            } else {
              content = (
                <div className="flex flex-wrap gap-2">
                  {group.options.map((option) => {
                    const isActive = group.selected?.includes(option.value) ?? false;
                    return (
                      <button
                        key={option.value}
                        className={`px-2 py-1 border rounded text-xs ${
                          isActive ? "bg-black text-white" : "hover:bg-gray-100"
                        }`}
                        onClick={() =>
                          setParam(group.param, isActive ? undefined : option.value)
                        }
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              );
            }

            return (
              <div
                key={group.id}
                className={`border-t border-gray-200 ${groupIndex === 0 ? "pt-0 border-t-0" : "pt-4"}`}
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <span className="font-medium">{label}</span>
                  <svg
                    className={`h-4 w-4 text-gray-600 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 8L10 12L14 8"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                {isOpen && <div className="mt-3">{content}</div>}
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}

export function SortSelect() {
  const { sp, setParam } = useUrl();
  const current = sp.get("ordering") || "-created_at";
  return (
    <select
      className="px-3 py-2 border rounded-md text-sm"
      defaultValue={current}
      onChange={(e) => setParam("ordering", e.target.value || undefined)}
      aria-label="Sort by"
    >
      <option value="-created_at">Newest</option>
      <option value="-bestseller">Best Sellers</option>
      <option value="price">Price: Low to High</option>
      <option value="-price">Price: High to Low</option>
      <option value="-rating">Highest Rated</option>
      <option value="name">Name A-Z</option>
    </select>
  );
}
