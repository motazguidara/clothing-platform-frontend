"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/product-card";
import { useProducts } from "@/hooks/useCatalog";
import { FilterSidebar, SortSelect } from "@/components/filters/filter-sidebar";

type AllowedFilter =
  | "price_min"
  | "price_max"
  | "size"
  | "color"
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
  "ordering",
  "page",
  "sale",
  "in_stock",
  "gender",
];

function buildInitialParams(initial?: Record<string, string | string[] | undefined>) {
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

export function CategoryPageClient({ category, initialSearchParams }: CategoryPageClientProps) {
  const searchParams = useSearchParams();

  const effectiveSearchParams = React.useMemo(() => {
    if (searchParams && searchParams.size > 0) {
      return searchParams;
    }
    return buildInitialParams(initialSearchParams);
  }, [initialSearchParams, searchParams]);

  const requestFilters = React.useMemo(() => {
    const filters: Record<string, string> = { category };
    allowedFilters.forEach((key) => {
      const value = effectiveSearchParams.get(key);
      if (value) {
        filters[key] = value;
      }
    });
    return filters;
  }, [category, effectiveSearchParams]);

  const { data, isLoading, isError } = useProducts({ ...requestFilters, limit: 24 });

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight uppercase">{category}</h1>
          <p className="text-muted mt-2">Browse products in this category.</p>
        </div>
        <SortSelect />
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-3 lg:sticky lg:top-24 lg:self-start max-lg:order-2">
          <div className="lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto pr-1">
            <FilterSidebar />
          </div>
        </div>
        <div className="lg:col-span-9 min-h-[50vh]">
          {isError && (
            <div className="mt-2 text-sm text-red-600">Failed to load products. Please try again.</div>
          )}

          {isLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-10 xl:gap-12">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-80 rounded-md bg-subtle animate-pulse" />
              ))}
            </div>
          )}

          {!isLoading && !isError && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-10 xl:gap-12">
              {data?.results?.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
              {(!data || data.results?.length === 0) && (
                <div className="col-span-full text-sm text-muted">No products found.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
