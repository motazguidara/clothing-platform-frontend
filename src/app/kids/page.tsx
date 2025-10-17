"use client";

import React from "react";
import { useProducts } from "@/hooks/useCatalog";
import ProductCard from "@/components/product-card";
import { useSearchParams } from "next/navigation";
import { FilterSidebar, SortSelect } from "@/components/filters/filter-sidebar";

export default function KidsPage() {
  const searchParams = useSearchParams();
  
  // Build params with gender filter
  const params: Record<string, string> = { gender: "kids" };
  const allow = ["category", "price_min", "price_max", "size", "color", "ordering", "page", "sale", "in_stock"];
  for (const key of allow) {
    const v = searchParams.get(key);
    if (v && v.length) params[key] = v;
  }
  
  const { data, isLoading, isError } = useProducts(params);

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight uppercase">Kids</h1>
          <p className="text-muted mt-2">Discover our kids collection.</p>
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
              <a href="/kids" className="mt-2 inline-block text-blue-600 hover:underline">
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

