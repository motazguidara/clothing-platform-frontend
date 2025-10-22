"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { useProducts } from "@/hooks/useCatalog";
import ProductCard from "@/components/product-card";
import { FilterSidebar, SortSelect } from "@/components/filters/filter-sidebar";

type AllowedKey =
  | "category"
  | "price_min"
  | "price_max"
  | "size"
  | "color"
  | "ordering"
  | "page"
  | "sale"
  | "in_stock";

type KidsPageClientProps = {
  initialSearchParams?: Record<string, string | string[] | undefined>;
};

const allowedKeys: AllowedKey[] = [
  "category",
  "price_min",
  "price_max",
  "size",
  "color",
  "ordering",
  "page",
  "sale",
  "in_stock",
];

function buildInitialSearchParams(initial?: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  if (!initial) return params;
  for (const [key, value] of Object.entries(initial)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      value.forEach((entry) => params.append(key, entry));
    } else {
      params.append(key, value);
    }
  }
  return params;
}

export function KidsPageClient({ initialSearchParams }: KidsPageClientProps) {
  const searchParams = useSearchParams();

  const effectiveSearchParams = React.useMemo(() => {
    if (searchParams && searchParams.size > 0) {
      return searchParams;
    }
    return buildInitialSearchParams(initialSearchParams);
  }, [initialSearchParams, searchParams]);

  const requestParams = React.useMemo(() => {
    const params: Record<string, string> = { gender: "kids" };
    allowedKeys.forEach((key) => {
      const value = effectiveSearchParams.get(key);
      if (value) params[key] = value;
    });
    return params;
  }, [effectiveSearchParams]);

  const { data, isLoading, isError } = useProducts(requestParams);

  const makeHref = React.useCallback(
    (page: number) => {
      const params = new URLSearchParams(effectiveSearchParams.toString());
      params.set("page", String(page));
      const query = params.toString();
      return query.length ? `/kids?${query}` : "/kids";
    },
    [effectiveSearchParams]
  );

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight uppercase">Kids</h1>
          <p className="text-muted mt-2">Discover our kids&apos; collection.</p>
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
          {isError && <p className="text-sm text-red-600">Failed to load products.</p>}
          {isLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="h-80 rounded-md bg-gray-200 animate-pulse" />
              ))}
            </div>
          )}
          {!isLoading && data && (
            <>
              <div className="mb-4 text-sm text-gray-600">
                {data.count} products found
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-4">
                {data.results.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          )}
          {!isLoading && data && data.results.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No products found matching your criteria.</p>
              <a href="/kids" className="mt-2 inline-block text-blue-600 hover:underline">
                Clear filters
              </a>
            </div>
          )}
        </div>
      </div>

      {!isLoading && data && data.count > 20 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          {(() => {
            const totalPages = Math.max(1, Math.ceil((data.count || 0) / 20));
            const currentPage = Number(effectiveSearchParams.get("page") || 1);
            return (
              <>
                <a
                  className={`px-3 py-2 border rounded-md text-sm ${
                    currentPage <= 1 ? "pointer-events-none opacity-50" : "hover:bg-gray-100"
                  }`}
                  href={currentPage > 1 ? makeHref(currentPage - 1) : undefined}
                >
                  Previous
                </a>
                <span className="text-sm px-3">
                  Page {currentPage} of {totalPages}
                </span>
                <a
                  className={`px-3 py-2 border rounded-md text-sm ${
                    currentPage >= totalPages ? "pointer-events-none opacity-50" : "hover:bg-gray-100"
                  }`}
                  href={currentPage < totalPages ? makeHref(currentPage + 1) : undefined}
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
