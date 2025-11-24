"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import Promotions from "@/components/home/Promotions";
import ProductCard from "@/components/product-card";
import { recommendationService } from "@/lib/api";
import Link from "next/link";

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

async function fetchPromotions() {
  const res = await fetch(`${apiBase.replace(/\/$/, "")}/catalog/promotions/?active=true`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error("Failed to load promotions");
  }
  const data = await res.json();
  return Array.isArray(data?.results) ? data.results : data;
}

export default function PromotionsPage() {
  const promoQuery = useQuery({
    queryKey: ["promotions", "active"],
    queryFn: fetchPromotions,
    staleTime: 60_000,
  });

  const productsQuery = useQuery({
    queryKey: ["promotions", "products"],
    queryFn: () => recommendationService.getCartPromotions({ limit: 16 }),
    staleTime: 60_000,
  });

  return (
    <section className="max-w-7xl mx-auto px-6 py-14 space-y-10">
      <div className="mb-2">
        <h1 className="text-3xl font-semibold tracking-tight uppercase">Promotions</h1>
        <p className="text-muted mt-2">Latest offers and featured campaigns.</p>
      </div>

      {/* Hero-style promo blocks */}
      {promoQuery.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 rounded-lg border bg-subtle animate-pulse" />
          ))}
        </div>
      ) : null}
      {promoQuery.isError && <div className="text-sm text-red-600">Failed to load promotions.</div>}
      {!promoQuery.isLoading && !promoQuery.isError && Array.isArray(promoQuery.data) && promoQuery.data.filter(Boolean).length > 0 && (
        <Promotions items={promoQuery.data.map((p: any) => ({ ...(p || {}), href: p?.href || "/catalog" }))} />
      )}
      {!promoQuery.isLoading && !promoQuery.isError && (!promoQuery.data || !Array.isArray(promoQuery.data) || promoQuery.data.filter(Boolean).length === 0) && (
        <div className="text-sm text-muted">No active promotions right now.</div>
      )}

      {/* Products on promotion / sale */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight">On promotion</h2>
            <p className="text-sm text-muted">Items currently under offers or sale pricing.</p>
          </div>
          <Link href="/catalog?sale=1" className="text-sm font-semibold underline hover:no-underline">
            View all sale
          </Link>
        </div>

        {productsQuery.isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-72 rounded-md border bg-subtle animate-pulse" />
            ))}
          </div>
        ) : null}

        {productsQuery.isError && <div className="text-sm text-red-600">Failed to load promotion products.</div>}

        {!productsQuery.isLoading && !productsQuery.isError && productsQuery.data && productsQuery.data.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {productsQuery.data.map((p) => (
              <ProductCard key={p.id ?? `${p.slug || "item"}`} product={p} />
            ))}
          </div>
        )}

        {!productsQuery.isLoading && !productsQuery.isError && (!productsQuery.data || productsQuery.data.length === 0) && (
          <div className="text-sm text-muted">No promotion products available right now.</div>
        )}
      </div>
    </section>
  );
}
