"use client";

import React from "react";
import ProductCard from "@/components/product-card";
import { useProducts } from "@/hooks/useCatalog";
import { useSearchParams } from "next/navigation";
import { FilterSidebar, SortSelect } from "@/components/filters/filter-sidebar";

type Props = { params: { category: string } };

export default function CategoryPage({ params }: Props) {
  const category = decodeURIComponent(params.category);
  const searchParams = useSearchParams();
  // Allow additional filters via URL
  const allow = ["price_min","price_max","size","color","ordering","page","sale","in_stock","gender"]; 
  const built: Record<string, string> = { category };
  for (const k of allow) {
    const v = searchParams.get(k);
    if (v && v.length) built[k] = v;
  }
  const { data, isLoading, isError } = useProducts({ ...built, limit: 24 });

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
              {data?.results?.map((p: any) => (
                <ProductCard key={p.id} product={p} />
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



