"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/product-card";
import { useProducts, useCatalogFacets } from "@/hooks/useCatalog";
import type { Product } from "@/types";
import { FilterSidebar, SortSelect } from "@/components/filters/filter-sidebar";
import {
  buildDefaultFilters,
  type BuildDefaultFiltersOptions,
} from "@/components/filters/default-filter-presets";

type AllowedFilter =
  | "price_min"
  | "price_max"
  | "size"
  | "color"
  | "brand"
  | "ordering"
  | "page"
  | "sale"
  | "in_stock"
  | "gender";

type CategoryPageClientProps = {
  category: string;
  initialSearchParams?: Record<string, string | string[] | undefined>;
};

const allowedFilters: AllowedFilter[] = [
  "price_min",
  "price_max",
  "size",
  "color",
  "brand",
  "ordering",
  "page",
  "sale",
  "in_stock",
  "gender",
];

const SKELETON_CARD_KEYS = Array.from(
  { length: 8 },
  (_, idx) => `catalog-skeleton-${idx}`,
);

function buildInitialParams(
  initial?: Record<string, string | string[] | undefined>,
) {
  const params = new URLSearchParams();
  if (!initial) return params;
  for (const [key, value] of Object.entries(initial)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else {
      params.append(key, value);
    }
  }
  return params;
}

export function CategoryPageClient({
  category,
  initialSearchParams,
}: CategoryPageClientProps) {
  const searchParams = useSearchParams();

  const effectiveSearchParams = React.useMemo(() => {
    if (searchParams && searchParams.size > 0) {
      return searchParams;
    }
    return buildInitialParams(initialSearchParams);
  }, [initialSearchParams, searchParams]);

  const requestFilters = React.useMemo(() => {
    const filters: Record<string, string | string[]> = { category };
    allowedFilters.forEach((key) => {
      const values = effectiveSearchParams
        .getAll(key)
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
      if (values.length > 1) {
        filters[key] = values;
        return;
      }
      const [firstValue] = values;
      if (firstValue) {
        filters[key] = firstValue;
        return;
      }
      const value = effectiveSearchParams.get(key);
      const trimmed = value?.trim() ?? "";
      if (trimmed.length > 0) {
        filters[key] = trimmed;
      }
    });
    return filters;
  }, [category, effectiveSearchParams]);

  const productParams = React.useMemo(
    () => ({ ...requestFilters, limit: 24 }),
    [requestFilters],
  );
  const { data, isLoading, isError } = useProducts(productParams);
  const {
    data: facets,
    isLoading: facetsLoading,
    isError: facetsError,
  } = useCatalogFacets(requestFilters);

  const products: Product[] = data?.results ?? [];
  const serializedSearch = effectiveSearchParams.toString();

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
      return `/catalog/${category}${query ? `?${query}` : ""}`;
    },
    [category, serializedSearch],
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
    ],
    [createFilterHref],
  );

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight uppercase">
            {category}
          </h1>
          <p className="text-muted mt-2">Browse products in this category.</p>
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
              filters={facets?.filters ?? []}
              isLoading={facetsLoading}
              error={facetsError ?? false}
              fallbackFilters={fallbackFilters}
            />
          </div>
        </div>
        <div className="lg:col-span-9 min-h-[50vh]">
          {isError && (
            <div className="mt-2 text-sm text-red-600">
              Failed to load products. Please try again.
            </div>
          )}

          {isLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-10 xl:gap-12">
              {SKELETON_CARD_KEYS.map((skeletonKey) => (
                <div
                  key={skeletonKey}
                  className="h-80 rounded-md bg-subtle animate-pulse"
                />
              ))}
            </div>
          )}

          {!isLoading && !isError && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-10 xl:gap-12">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
              {products.length === 0 && (
                <div className="col-span-full text-sm text-muted">
                  No products found.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
