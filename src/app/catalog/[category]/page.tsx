"use client";

import React from "react";
import ProductCard from "@/components/product-card";
import { useProducts } from "@/hooks/useCatalog";

type Props = { params: { category: string } };

export default function CategoryPage({ params }: Props) {
  const category = decodeURIComponent(params.category);
  const { data, isLoading, isError } = useProducts({ category, limit: 24 });

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight uppercase">Category: {category}</h1>
      <p className="text-muted mt-2">Browse products in this category.</p>

      {isLoading && (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-80 rounded-md bg-subtle animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="mt-8 text-sm text-red-600">Failed to load products. Please try again.</div>
      )}

      {!isLoading && !isError && (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {data?.results?.map((p: any) => (
            <ProductCard key={p.id} product={p} />
          ))}
          {(!data || data.results?.length === 0) && (
            <div className="col-span-full text-sm text-muted">No products found.</div>
          )}
        </div>
      )}
    </section>
  );
}



