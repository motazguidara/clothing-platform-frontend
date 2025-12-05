"use client";

import React from "react";
import { useProducts, useCatalogFacets } from "@/hooks/useCatalog";
import ProductCard from "@/components/product-card";
import { useSearchParams } from "next/navigation";
import { FilterSidebar, SortSelect } from "@/components/filters/filter-sidebar";
import {
  buildDefaultFilters,
  type BuildDefaultFiltersOptions,
} from "@/components/filters/default-filter-presets";

const ALLOWED_KEYS = [
  "category",
  "price_min",
  "price_max",
  "size",
  "color",
  "brand",
  "ordering",
  "page",
  "sale",
  "in_stock",
  "free_shipping",
] as const;

export default function WomenPage() {
  const searchParams = useSearchParams();

  const requestParams = React.useMemo(() => {
    const params: Record<string, string | string[]> = { gender: "women" };
    ALLOWED_KEYS.forEach((key) => {
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
      const singleValue = searchParams.get(key);
      const trimmed = singleValue?.trim() ?? "";
      if (trimmed.length > 0) {
        params[key] = trimmed;
      }
    });
    if (!("category" in params)) {
      params.category = "women";
    }
    return params;
  }, [searchParams]);

  const { data, isLoading, isError } = useProducts(requestParams);
  const {
    data: facets,
    isLoading: facetsLoading,
    isError: facetsError,
  } = useCatalogFacets(requestParams);

  const serializedSearch = searchParams.toString();

  const fallbackFilters = React.useMemo(() => {
    const sp = new URLSearchParams(serializedSearch);
    const options: BuildDefaultFiltersOptions = { gender: "women" };

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

  const createFilterHref = React.useCallback(
    (overrides: Record<string, string | string[] | null | undefined>) => {
      const sp = new URLSearchParams(serializedSearch);
      sp.delete("page");
      Object.entries(overrides).forEach(([key, value]) => {
        if (value === undefined) {
          return;
        }
        sp.delete(key);
        if (value === null) {
          return;
        }
        const normalized = (Array.isArray(value) ? value : [value])
          .map((entry) => entry.trim())
          .filter((entry) => entry.length > 0);
        normalized.forEach((entry) => sp.append(key, entry));
      });
      const query = sp.toString();
      return `/women${query ? `?${query}` : ""}`;
    },
    [serializedSearch],
  );

  const quickFilters = React.useMemo(
    () => [
      {
        label: "New Arrivals",
        href: createFilterHref({ ordering: "-created_at" }),
      },
      {
        label: "Best Sellers",
        href: createFilterHref({ ordering: "-bestseller" }),
      },
      { label: "On Sale", href: createFilterHref({ sale: "1" }) },
      { label: "In Stock", href: createFilterHref({ in_stock: "1" }) },
      {
        label: "Under 300 TND",
        href: createFilterHref({ price_max: "300", price_min: null }),
      },
      { label: "Black Styles", href: createFilterHref({ color: "black" }) },
    ],
    [createFilterHref],
  );

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight uppercase">
            Women
          </h1>
          <p className="text-muted mt-2">Discover our women's collection.</p>
        </div>
        <SortSelect />
      </div>

      {quickFilters.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {quickFilters.map((filter) => (
            <a
              key={filter.label}
              href={filter.href}
              className="px-3 py-1.5 border border-gray-200 rounded-full text-sm hover:bg-gray-100 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
            >
              {filter.label}
            </a>
          ))}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-3 lg:sticky lg:top-24 lg:self-start max-lg:order-2">
          <div className="lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto pr-1">
            <FilterSidebar
              filters={React.useMemo(() => {
                const base = facets?.filters ?? [];
                const hasFree = base.some((f) => f?.param === "free_shipping");
                if (hasFree) return base;
                return [
                  ...base,
                  {
                    id: "free_shipping",
                    label: "Free Shipping",
                    param: "free_shipping",
                    selection: "toggle",
                    options: [{ label: "Free Shipping", value: "true" }],
                  },
                ];
              }, [facets?.filters])}
              isLoading={facetsLoading}
              error={facetsError ?? false}
              fallbackFilters={fallbackFilters}
            />
          </div>
        </div>
        <div className="lg:col-span-9 min-h-[50vh]">
          {isError && (
            <p className="text-sm text-red-600">Failed to load products.</p>
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
              <div className="mb-4 text-sm text-gray-600">
                {data.count} products found
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-4">
                {data.results.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </>
          )}
          {!isLoading && data && data.results.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                No products found matching your criteria.
              </p>
              <a
                href="/women"
                className="mt-2 inline-block text-blue-600 hover:underline"
              >
                Clear filters
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {!isLoading && data && data.count > 20 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          {(() => {
            const total = Math.max(1, Math.ceil((data.count || 0) / 20));
            const current = Number(searchParams.get("page") || 1);
            const makeHref = (page: number) => {
              const url = new URLSearchParams(serializedSearch);
              url.set("page", String(page));
              const query = url.toString();
              return query.length ? `/women?${query}` : "/women";
            };
            return (
              <>
                <a
                  className={`px-3 py-2 border rounded-md text-sm ${current <= 1 ? "pointer-events-none opacity-50" : "hover:bg-gray-100"}`}
                  href={current > 1 ? makeHref(current - 1) : undefined}
                >
                  Previous
                </a>
                <span className="text-sm px-3">
                  Page {current} of {total}
                </span>
                <a
                  className={`px-3 py-2 border rounded-md text-sm ${current >= total ? "pointer-events-none opacity-50" : "hover:bg-gray-100"}`}
                  href={current < total ? makeHref(current + 1) : undefined}
                >
                  Next
                </a>
              </>
            );
          })()}
        </div>
      )}
    </section>
  );
}
