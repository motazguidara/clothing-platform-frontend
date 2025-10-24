"use client";

import React from "react";
import { useProducts, useCatalogFacets } from "@/hooks/useCatalog";
import ProductCard from "@/components/product-card";
import { useSearchParams } from "next/navigation";
import { FilterSidebar, SortSelect } from "@/components/filters/filter-sidebar";
import { buildDefaultFilters } from "@/components/filters/default-filter-presets";

export default function MenPage() {
  const searchParams = useSearchParams();
  
  // Build params with gender filter
  const params: Record<string, string> = { gender: "men" };
  const allow = ["category", "price_min", "price_max", "size", "color", "ordering", "page", "sale", "in_stock"];
  for (const key of allow) {
    const v = searchParams.get(key);
    if (v && v.length) params[key] = v;
  }
  
  const { data, isLoading, isError } = useProducts(params);
  const { data: facets, isLoading: facetsLoading, isError: facetsError } = useCatalogFacets(params);

  const serializedSearch = searchParams.toString();

  const fallbackFilters = React.useMemo(() => {
    const sp = new URLSearchParams(serializedSearch);
    return buildDefaultFilters({
      gender: "men",
      price_min: sp.get("price_min") ?? undefined,
      price_max: sp.get("price_max") ?? undefined,
      size: sp.get("size") ?? undefined,
      color: sp.get("color") ?? undefined,
      sale: sp.get("sale") ?? undefined,
      in_stock: sp.get("in_stock") ?? undefined,
    });
  }, [serializedSearch]);

  const createFilterHref = React.useCallback(
    (overrides: Record<string, string | null | undefined>) => {
      const sp = new URLSearchParams(serializedSearch);
      sp.delete("page");
      Object.entries(overrides).forEach(([key, value]) => {
        if (value == null || value === "") {
          sp.delete(key);
        } else {
          sp.set(key, value);
        }
      });
      const query = sp.toString();
      return `/men${query ? `?${query}` : ""}`;
    },
    [serializedSearch]
  );

  const quickFilters = React.useMemo(
    () => [
      { label: "New Arrivals", href: createFilterHref({ ordering: "-created_at" }) },
      { label: "Best Sellers", href: createFilterHref({ ordering: "-bestseller" }) },
      { label: "On Sale", href: createFilterHref({ sale: "1" }) },
      { label: "In Stock", href: createFilterHref({ in_stock: "1" }) },
      { label: "Under $50", href: createFilterHref({ price_max: "50", price_min: null }) },
    ],
    [createFilterHref]
  );

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight uppercase">Men</h1>
          <p className="text-muted mt-2">Discover our men's collection.</p>
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
              filters={facets?.filters}
              isLoading={facetsLoading}
              error={facetsError ?? false}
              fallbackFilters={fallbackFilters}
            />
          </div>
        </div>
        <div className="lg:col-span-9 min-h-[50vh]">
          {isError && <p className="text-sm text-red-600">Failed to load products.</p>}
          {isLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-80 rounded-md bg-gray-200 animate-pulse" />
              ))}
            </div>
          )}
          {!isLoading && data && (
            <>
              <div className="mb-4 text-sm text-gray-600">
                {data.count} products found
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-4">
                {data.results.map((p: any) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </>
          )}
          {!isLoading && data && data.results.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No products found matching your criteria.</p>
              <a href="/men" className="mt-2 inline-block text-blue-600 hover:underline">
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
            const current = Number(params["page"] || 1);
            const makeHref = (page: number) => {
              const url = new URL(window.location.href);
              url.searchParams.set("page", String(page));
              return url.toString();
            };
            return (
              <>
                <a 
                  className={`px-3 py-2 border rounded-md text-sm ${current <= 1 ? 'pointer-events-none opacity-50' : 'hover:bg-gray-100'}`} 
                  href={current > 1 ? makeHref(current - 1) : undefined}
                >
                  Previous
                </a>
                <span className="text-sm px-3">Page {current} of {total}</span>
                <a 
                  className={`px-3 py-2 border rounded-md text-sm ${current >= total ? 'pointer-events-none opacity-50' : 'hover:bg-gray-100'}`} 
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

