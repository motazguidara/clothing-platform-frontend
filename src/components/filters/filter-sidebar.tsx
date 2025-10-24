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
}: FilterSidebarProps) {
  const { sp, setParam, setParams } = useUrl();
  const [show, setShow] = React.useState(true);

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

          {filtersToRender.map((group) => {
            const label = renderGroupLabel(group.label, group);
            if (group.id === "gender") {
              return (
                <div key={group.id}>
                  <div className="font-medium mb-2">{label}</div>
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
                </div>
              );
            }

            if (group.id === "price" && priceGroup) {
              return (
                <div key={group.id}>
                  <div className="font-medium mb-2">{label}</div>
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
                </div>
              );
            }

            if (group.selection === "toggle") {
              const paramKey = group.param;
              return (
                <div key={group.id}>
                  <div className="font-medium mb-2">{label}</div>
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
                </div>
              );
            }

            if (group.id === "size") {
              const current = group.selected?.[0];
              return (
                <div key={group.id}>
                  <div className="font-medium mb-2">{label}</div>
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
                </div>
              );
            }

            if (group.id === "color") {
              const current = group.selected?.[0];
              return (
                <div key={group.id}>
                  <div className="font-medium mb-2">{label}</div>
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
                </div>
              );
            }

            if (group.id === "brand") {
              const current = group.selected?.[0];
              return (
                <div key={group.id}>
                  <div className="font-medium mb-2">{label}</div>
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
                </div>
              );
            }

            // Fallback: render as list of toggle buttons
            return (
              <div key={group.id}>
                <div className="font-medium mb-2">{label}</div>
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
