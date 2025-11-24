"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import ProductCard from "@/components/product-card";
import Link from "next/link";
import { recommendationService } from "@/lib/api";

type Props = {
  title?: string;
  limit?: number;
};

export function BestsellerRail({ title = "Bestsellers", limit = 8 }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["recommendations", "bestsellers", limit],
    queryFn: () => recommendationService.getBestsellers(limit),
    staleTime: 60_000,
  });
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const [showLeft, setShowLeft] = React.useState(false);
  const [showRight, setShowRight] = React.useState(false);

  const updateButtons = React.useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setShowLeft(scrollLeft > 0);
    setShowRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  const scrollBy = (delta: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: "smooth" });
    setTimeout(updateButtons, 200);
  };

  const showViewAll = (data?.length ?? 0) > 16;

  return (
    <section className="py-10 sm:py-12">
      <div className="max-w-7xl mx-auto px-6 space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight">{title}</h2>
          {showViewAll && (
            <Link href="/catalog?ordering=-bestseller" className="text-sm font-semibold underline hover:no-underline">
              View all
            </Link>
          )}
        </div>

        {isError && <p className="text-sm text-red-600">Failed to load recommendations.</p>}

        {isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin-horizontal">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="h-72 w-64 rounded-md bg-subtle border animate-pulse flex-shrink-0" />
            ))}
          </div>
        ) : null}

        {!isLoading && (data?.length ?? 0) === 0 && (
          <p className="text-sm text-muted">No bestseller recommendations available.</p>
        )}

        {!isLoading && data && data.length > 0 && (
          <div className="relative group">
            <button
              type="button"
              aria-label="Scroll left"
              onClick={() => scrollBy(-(scrollerRef.current?.clientWidth || 600))}
              className={`hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur border border-border shadow-sm hover:bg-white focus-visible:ring-2 ring-offset-2 ring-black transition-all duration-200 motion-safe:hover:scale-105 ${
                showLeft ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" className="stroke-black/80" aria-hidden="true">
                <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Scroll right"
              onClick={() => scrollBy(scrollerRef.current?.clientWidth || 600)}
              className={`hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur border border-border shadow-sm hover:bg-white focus-visible:ring-2 ring-offset-2 ring-black transition-all duration-200 motion-safe:hover:scale-105 ${
                showRight ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" className="stroke-black/80" aria-hidden="true">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div
              ref={scrollerRef}
              onScroll={updateButtons}
              onLoad={updateButtons}
              className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin-horizontal"
            >
              {data.map((product) => (
                <div key={product.id} className="min-w-[16rem] flex-shrink-0">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
