"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import ProductCard from "@/components/product-card";
import Link from "next/link";
import { recommendationService } from "@/lib/api";

type Props = {
  placement?: string;
};

export function CustomRecommendationBlocks({ placement = "home" }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["recommendations", "blocks", placement],
    queryFn: () => recommendationService.getBlocks(placement),
    staleTime: 60_000,
  });
  const scrollerRefs = React.useRef<Record<number, HTMLDivElement | null>>({});
  const [, force] = React.useReducer((x) => x + 1, 0);

  const updateButtons = React.useCallback((blockId: number) => {
    const el = scrollerRefs.current[blockId];
    if (!el) return;
    force();
  }, []);

  if (isError) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="h-6 w-48 bg-subtle rounded-md animate-pulse mb-4" />
        <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin-horizontal">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 w-64 rounded-md bg-subtle border animate-pulse flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      {data.map((block) => {
        const showViewAll = block.items.length > 16;
        return (
          <section key={block.id} className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight">{block.title}</h2>
              {showViewAll && (
                <Link href="/catalog" className="text-sm font-semibold underline hover:no-underline">
                  View all
                </Link>
              )}
            </div>
            <div className="relative group">
              <button
                type="button"
                aria-label="Scroll left"
                onClick={() => {
                  const el = scrollerRefs.current[block.id];
                  if (el) el.scrollBy({ left: -(el.clientWidth || 600), behavior: "smooth" });
                  setTimeout(() => updateButtons(block.id), 200);
                }}
                className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur border border-border shadow-sm hover:bg-white focus-visible:ring-2 ring-offset-2 ring-black transition-all duration-200 motion-safe:hover:scale-105"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" className="stroke-black/80" aria-hidden="true">
                  <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Scroll right"
                onClick={() => {
                  const el = scrollerRefs.current[block.id];
                  if (el) el.scrollBy({ left: el.clientWidth || 600, behavior: "smooth" });
                  setTimeout(() => updateButtons(block.id), 200);
                }}
                className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur border border-border shadow-sm hover:bg-white focus-visible:ring-2 ring-offset-2 ring-black transition-all duration-200 motion-safe:hover:scale-105"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" className="stroke-black/80" aria-hidden="true">
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div
                ref={(el) => {
                  scrollerRefs.current[block.id] = el;
                }}
                onScroll={() => updateButtons(block.id)}
                className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin-horizontal"
              >
                {block.items.map((item) => (
                  <div key={`${block.id}-${item.product.id}-${item.position}`} className="min-w-[16rem] flex-shrink-0">
                    <ProductCard product={item.product} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
