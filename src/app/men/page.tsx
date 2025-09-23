"use client";

import React from "react";
import { useProducts } from "@/hooks/useCatalog";
import ProductCard from "@/components/product-card";
import { useUIStore } from "@/store/ui";
import { useSearchParams } from "next/navigation";

export default function MenPage() {
  const openFilter = useUIStore((s) => s.openFilter);
  const searchParams = useSearchParams();
  
  // Build params with gender filter
  const params: Record<string, string> = { gender: "men" };
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
          <h1 className="text-3xl font-semibold tracking-tight uppercase">Men</h1>
          <p className="text-muted mt-2">Discover our men's collection.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openFilter} className="px-3 py-2 border rounded-md text-sm">
            Filters
          </button>
          <select 
            className="px-3 py-2 border rounded-md text-sm" 
            defaultValue={params.ordering || "-created_at"}
            onChange={(e) => {
              const v = e.target.value;
              const url = new URL(window.location.href);
              if (v) url.searchParams.set("ordering", v); 
              else url.searchParams.delete("ordering");
              url.searchParams.delete("page");
              window.location.href = url.toString();
            }}
          >
            <option value="-created_at">Newest</option>
            <option value="-bestseller">Best Sellers</option>
            <option value="price">Price: Low to High</option>
            <option value="-price">Price: High to Low</option>
            <option value="-rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Quick filters */}
      <div className="mt-6 flex flex-wrap gap-2">
        <a 
          href="/men?sale=1" 
          className="px-3 py-1 rounded-full border text-sm hover:bg-gray-100"
        >
          Sale
        </a>
        <a 
          href="/men?category=shirts" 
          className="px-3 py-1 rounded-full border text-sm hover:bg-gray-100"
        >
          Shirts
        </a>
        <a 
          href="/men?category=pants" 
          className="px-3 py-1 rounded-full border text-sm hover:bg-gray-100"
        >
          Pants
        </a>
        <a 
          href="/men?category=outerwear" 
          className="px-3 py-1 rounded-full border text-sm hover:bg-gray-100"
        >
          Outerwear
        </a>
      </div>

      <div className="mt-8">
        {isError && <p className="text-sm text-red-600">Failed to load products.</p>}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {data.results.map((p) => (
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

      {/* Pagination */}
      {!isLoading && data && data.count > 20 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          {(() => {
            const total = Math.max(1, Math.ceil((data.count || 0) / 20));
            const current = Number(params.page || 1);
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
