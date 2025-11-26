"use client";

import React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useBrands } from "@/hooks/useCatalog";
import type { CatalogFilterGroup, CatalogFilterOption } from "@/types";

type FilterOptionWithSwatch = CatalogFilterGroup["options"][number] & {
  swatchColor?: string;
};

type BrandLike = {
  id?: number;
  name?: string | null;
  slug?: string | null;
};

const normalizeFilterOption = (
  option: CatalogFilterOption,
): CatalogFilterOption | null => {
  if (!option) return null;
  const candidates = [
    typeof option.value === "string" ? option.value : undefined,
    typeof option.slug === "string" ? option.slug : undefined,
    typeof option.label === "string" ? option.label : undefined,
  ];
  let normalizedValue = "";
  for (const candidate of candidates) {
    if (!candidate) continue;
    const trimmed = candidate.trim();
    if (trimmed.length > 0) {
      normalizedValue = trimmed;
      break;
    }
  }
  if (!normalizedValue.length) {
    return null;
  }
  const normalizedLabel =
    typeof option.label === "string" && option.label.trim().length > 0
      ? option.label.trim()
      : normalizedValue;
  const normalizedSlug =
    typeof option.slug === "string" && option.slug.trim().length > 0
      ? option.slug.trim()
      : null;
  return {
    ...option,
    value: normalizedValue,
    label: normalizedLabel,
    slug: normalizedSlug,
  };
};

const mergeBrandOptions = (
  current: CatalogFilterOption[] = [],
  fallback: CatalogFilterOption[] = [],
): CatalogFilterOption[] => {
  const map = new Map<string, CatalogFilterOption>();

  current.forEach((option) => {
    const normalized = normalizeFilterOption(option);
    if (!normalized) return;
    map.set(normalized.value.toLowerCase(), normalized);
  });

  fallback.forEach((option) => {
    const normalized = normalizeFilterOption(option);
    if (!normalized) return;
    const key = normalized.value.toLowerCase();
    if (!map.has(key)) {
      map.set(key, normalized);
    }
  });

  return Array.from(map.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
};

const mapBrandsToFilterOptions = (
  brands?: BrandLike[] | null,
): CatalogFilterOption[] => {
  if (!Array.isArray(brands)) {
    return [];
  }

  return brands
    .map((brand) => {
      if (!brand) return null;
      const name =
        typeof brand.name === "string" ? brand.name.trim() : "";
      const slug =
        typeof brand.slug === "string" ? brand.slug.trim() : "";
      const value = slug.length > 0 ? slug : name;
      if (!value.length || !name.length) {
        return null;
      }
      return {
        value,
        label: name,
        slug: slug.length > 0 ? slug : null,
      };
    })
    .filter((option): option is CatalogFilterOption => option !== null);
};

function useUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const buildUrl = React.useCallback(() => {
    const query = sp?.toString();
    return new URL(
      window.location.origin +
        pathname +
        (query && query.length ? `?${query}` : ""),
    );
  }, [pathname, sp]);

  const setParams = React.useCallback(
    (updates: Array<{ key: string; value: string | string[] | null | undefined }>) => {
      const url = buildUrl();
      updates.forEach(({ key, value }) => {
        url.searchParams.delete(key);
        if (value === undefined || value === null) {
          return;
        }
        const values = Array.isArray(value) ? value : [value];
        values
          .map((entry) => entry.trim())
          .filter((entry) => entry.length > 0)
          .forEach((entry) => url.searchParams.append(key, entry));
      });
      url.searchParams.delete("page");
      router.push(`${url.pathname}${url.search}`);
    },
    [buildUrl, router],
  );

  const setParam = React.useCallback(
    (key: string, value?: string | string[] | null) => {
      setParams([{ key, value }]);
    },
    [setParams],
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
    [filters],
  );

  const safeFallbackFilters = React.useMemo(
    () => (Array.isArray(fallbackFilters) ? fallbackFilters : []),
    [fallbackFilters],
  );

  const filtersSource =
    safeFilters.length > 0 ? safeFilters : safeFallbackFilters;

  const serializedParams = sp?.toString() ?? "";

  const selectedValuesByParam = React.useMemo(() => {
    const map = new Map<string, Set<string>>();
    if (sp) {
      sp.forEach((value, key) => {
        const trimmed = value.trim();
        if (!trimmed.length) {
          return;
        }
        if (!map.has(key)) {
          map.set(key, new Set());
        }
        map.get(key)!.add(trimmed);
      });
    }
    return map;
  }, [serializedParams, sp]);

  const hasBrandGroup = React.useMemo(
    () => filtersSource.some((group) => group.id === "brand"),
    [filtersSource],
  );

  const selectedBrandCount = selectedValuesByParam.get("brand")?.size ?? 0;
  const shouldLoadBrandOptions = hasBrandGroup || selectedBrandCount > 0;

  const { data: catalogBrands } = useBrands({
    enabled: shouldLoadBrandOptions,
  });

  const fallbackBrandOptions = React.useMemo(
    () => mapBrandsToFilterOptions(catalogBrands),
    [catalogBrands],
  );

  const priceGroup = React.useMemo(
    () => filtersSource.find((group) => group.id === "price"),
    [filtersSource],
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
    [setParams],
  );

  const isPresetActive = React.useCallback(
    (min?: number | null, max?: number | null) => {
      const currentMin = priceGroup?.range?.active_min ?? null;
      const currentMax = priceGroup?.range?.active_max ?? null;
      const targetMin = min ?? null;
      const targetMax = max ?? null;
      return currentMin === targetMin && currentMax === targetMax;
    },
    [priceGroup],
  );

  const renderGroupLabel = (label: string, group: CatalogFilterGroup) => {
    const urlSelected = group.param
      ? selectedValuesByParam.get(group.param)
      : undefined;
    const urlSelectedCount = urlSelected?.size ?? 0;
    const fallbackSelectedCount = group.selected?.filter(Boolean).length ?? 0;
    const selectedCount =
      urlSelectedCount > 0 ? urlSelectedCount : fallbackSelectedCount;
    const rangeActive =
      group.selection === "range" &&
      (group.range?.active_min != null || group.range?.active_max != null);
    const totalActive = selectedCount + (rangeActive ? 1 : 0);
    return totalActive ? `${label} (${totalActive})` : label;
  };

  const filtersToRender = filtersSource.filter(
    (group) => group.options.length > 0 || group.selection === "range",
  );

  const filtersSignature = React.useMemo(
    () => filtersToRender.map((group) => group.id).join("|"),
    [filtersToRender],
  );

  React.useEffect(() => {
    setOpenState((prev) => {
      const next: Record<string, boolean> = {};
      let changed = Object.keys(prev).length !== filtersToRender.length;

      filtersToRender.forEach((group) => {
        const hadPrev = Object.prototype.hasOwnProperty.call(prev, group.id);
        const prevValue = hadPrev ? prev[group.id] : defaultOpen;
        next[group.id] = prevValue ?? defaultOpen;
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
    <aside
      className={`rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm ${className}`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Filters</h2>
          <p className="text-xs text-slate-500">Refine products in one place</p>
        </div>
        <button
          onClick={() => setShow((s) => !s)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition"
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>

      {show && (
        <div className="space-y-6">
          {isLoading && filtersSource.length === 0 && (
            <div className="space-y-4 animate-pulse">
              <div>
                <div className="font-medium mb-2">
                  <div className="h-4 w-24 rounded bg-slate-200" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-20 rounded bg-slate-200" />
                  <div className="h-3 w-28 rounded bg-slate-200" />
                  <div className="h-3 w-16 rounded bg-slate-200" />
                </div>
              </div>
              <div>
                <div className="font-medium mb-2">
                  <div className="h-4 w-28 rounded bg-slate-200" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-6 w-12 rounded bg-slate-200" />
                  ))}
                </div>
              </div>
            </div>
          )}

          {!isLoading && filtersToRender.length === 0 && !error && (
            <p className="text-sm text-slate-500">
              No filters available for this view.
            </p>
          )}

          {!isLoading && error && (
            <p className="text-sm text-red-600">
              Unable to load filters right now.
            </p>
          )}

          {filtersToRender.map((group, groupIndex) => {
            const label = renderGroupLabel(group.label, group);
            const isOpen = openState[group.id] ?? false;
            let content: React.ReactNode = null;

            const paramKey = group.param;
            const urlSelectedSet = paramKey
              ? selectedValuesByParam.get(paramKey)
              : undefined;
            const fallbackSelected = (group.selected ?? []).filter(
              (entry): entry is string =>
                typeof entry === "string" && entry.trim().length > 0,
            );
            const selectedValues =
              urlSelectedSet && urlSelectedSet.size > 0
                ? Array.from(urlSelectedSet)
                : fallbackSelected;
            const selectedSet = new Set(selectedValues);

            if (group.id === "gender") {
              content = (
                <div className="space-y-1">
                  {group.options.map((option) => {
                    const rawValue = option.value ?? "";
                    const value = rawValue.trim();
                    if (!value.length) {
                      return null;
                    }
                    const isChecked = selectedSet.has(value);
                    return (
                      <label
                        key={value}
                        className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-slate-50"
                      >
                        <input
                          type="radio"
                          name={paramKey}
                          value={value}
                          checked={isChecked}
                          onChange={() => setParam(paramKey, value)}
                          className="h-4 w-4 border-slate-300 text-slate-900 focus:ring-slate-900"
                        />
                        <span>
                          {option.count != null
                            ? formatCountLabel(option.label, option.count)
                            : option.label}
                        </span>
                      </label>
                    );
                  })}
                  {selectedSet.size > 0 && (
                    <button
                      className="text-xs text-slate-600 hover:underline mt-1"
                      onClick={() => setParam(paramKey, undefined)}
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
                          ? "font-semibold text-slate-900"
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
                    className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-slate-400 focus:outline-none"
                    onBlur={(e) =>
                      setParam(
                        "price_min",
                        e.target.value ? e.target.value : undefined,
                      )
                    }
                  />
                  <span className="text-slate-500">-</span>
                  <input
                    placeholder="Max"
                    defaultValue={activePriceMax}
                    className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-slate-400 focus:outline-none"
                    onBlur={(e) =>
                      setParam(
                        "price_max",
                        e.target.value ? e.target.value : undefined,
                      )
                      }
                    />
                  </div>
                  {(activePriceMin || activePriceMax) && (
                    <button
                      className="text-xs text-slate-600 hover:underline mt-1"
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
              content = (
                <>
                  {group.options.map((option) => {
                    const rawValue = option.value ?? "";
                    const value = rawValue.trim();
                    if (!value.length) {
                      return null;
                    }
                    const isChecked = selectedSet.has(value);
                    return (
                      <label
                        key={value}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const nextValues = e.target.checked
                              ? Array.from(new Set([...selectedValues, value]))
                              : selectedValues.filter(
                                  (entry) => entry !== value,
                                );
                            setParam(
                              paramKey,
                              nextValues.length > 0 ? nextValues : undefined,
                            );
                          }}
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
              content = (
                <>
                  <div className="flex flex-wrap gap-2">
                    {group.options.map((option) => {
                      const rawValue = option.value ?? option.label ?? "";
                      const value = rawValue.trim();
                      if (!value.length) {
                        return null;
                      }
                      const isActive = selectedSet.has(value);
                      return (
                        <button
                          key={value}
                          type="button"
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                            isActive
                              ? "bg-slate-900 text-white shadow-sm"
                              : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                          onClick={() => {
                            const nextValues = isActive
                              ? selectedValues.filter(
                                  (entry) => entry !== value,
                                )
                              : [...selectedValues, value];
                            setParam(
                              paramKey,
                              nextValues.length > 0 ? nextValues : undefined,
                            );
                          }}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                  {selectedSet.size > 0 && (
                    <button
                      className="text-xs text-slate-600 hover:underline mt-1"
                      onClick={() => setParam(paramKey, undefined)}
                    >
                      Clear
                    </button>
                  )}
                </>
              );
            } else if (group.id === "color") {
              content = (
                <>
                  <div className="flex flex-wrap gap-3">
                    {group.options.map((option) => {
                      const rawValue =
                        option.value ?? option.slug ?? option.label ?? "";
                      const value = rawValue.trim();
                      if (!value.length) {
                        return null;
                      }
                      const isActive = selectedSet.has(value);
                      const swatchSource =
                        (option as FilterOptionWithSwatch).swatchColor ??
                        value.replace(/-/g, " ");
                      const swatchColor =
                        swatchSource && swatchSource.length > 0
                          ? swatchSource
                          : undefined;
                      return (
                        <button
                          key={value}
                          type="button"
                          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black ${
                            isActive
                              ? "border-black bg-gray-50 shadow-sm"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                          onClick={() => {
                            const nextValues = isActive
                              ? selectedValues.filter(
                                  (entry) => entry !== value,
                                )
                              : [...selectedValues, value];
                            setParam(
                              paramKey,
                              nextValues.length > 0 ? nextValues : undefined,
                            );
                          }}
                          title={option.label}
                          aria-pressed={isActive}
                        >
                          <span
                            className="h-5 w-5 rounded-full border border-white shadow-inner"
                            style={
                              swatchColor
                                ? { backgroundColor: swatchColor }
                                : undefined
                            }
                          />
                          <span className="text-xs font-medium text-slate-700">
                            {option.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {selectedSet.size > 0 && (
                    <button
                      className="text-xs text-slate-600 hover:underline mt-2"
                      onClick={() => setParam(paramKey, undefined)}
                    >
                      Clear
                    </button>
                  )}
                </>
              );
            } else if (group.id === "brand") {
              const brandOptions = mergeBrandOptions(
                group.options,
                fallbackBrandOptions,
              );
              content = (
                <>
                  <div className="space-y-2">
                    {brandOptions.map((option) => {
                      const value = option.value.trim();
                      if (!value.length) {
                        return null;
                      }
                      const isActive = selectedSet.has(value);
                      return (
                        <label
                          key={value}
                          className="flex items-center justify-between gap-3 rounded-md px-2 py-1 hover:bg-slate-50"
                        >
                          <span className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-slate-300 text-black focus:ring-black"
                              checked={isActive}
                              onChange={(e) => {
                                const nextValues = e.target.checked
                                  ? Array.from(
                                      new Set([...selectedValues, value]),
                                    )
                                  : selectedValues.filter(
                                      (entry) => entry !== value,
                                    );
                                setParam(
                                  paramKey,
                                  nextValues.length > 0
                                    ? nextValues
                                    : undefined,
                                );
                              }}
                            />
                            <span
                              className={`text-sm ${isActive ? "font-semibold text-slate-900" : "text-slate-700"}`}
                            >
                              {option.label}
                            </span>
                          </span>
                          {option.count != null && (
                            <span className="text-xs text-slate-500">
                              {option.count}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                  {selectedSet.size > 0 && (
                    <button
                      className="text-xs text-slate-600 hover:underline mt-1"
                      onClick={() => setParam(paramKey, undefined)}
                    >
                      Clear
                    </button>
                  )}
                </>
              );
            } else if (group.selection === "multi") {
              content = (
                <>
                  <div className="flex flex-wrap gap-2">
                    {group.options.map((option) => {
                      const rawValue =
                        option.value ?? option.slug ?? option.label ?? "";
                      const value = rawValue.trim();
                      if (!value.length) {
                        return null;
                      }
                      const isActive = selectedSet.has(value);
                    return (
                      <button
                        key={value}
                        type="button"
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                          isActive
                            ? "bg-slate-900 text-white shadow-sm"
                            : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                        onClick={() => {
                          const nextValues = isActive
                            ? selectedValues.filter(
                                (entry) => entry !== value,
                              )
                              : [...selectedValues, value];
                            setParam(
                              paramKey,
                              nextValues.length > 0 ? nextValues : undefined,
                            );
                          }}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                  {selectedSet.size > 0 && (
                    <button
                      className="text-xs text-slate-600 hover:underline mt-1"
                      onClick={() => setParam(paramKey, undefined)}
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
                    const rawValue =
                      option.value ?? option.slug ?? option.label ?? "";
                    const value = rawValue.trim();
                    if (!value.length) {
                      return null;
                    }
                    const isActive = selectedSet.has(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                        isActive
                          ? "bg-slate-900 text-white shadow-sm"
                          : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                      onClick={() =>
                        setParam(paramKey, isActive ? undefined : value)
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
                className={`border-t border-slate-200 ${groupIndex === 0 ? "pt-0 border-t-0" : "pt-4"}`}
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <span className="font-medium">{label}</span>
                  <svg
                    className={`h-4 w-4 text-slate-600 transition-transform ${
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
      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none"
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

