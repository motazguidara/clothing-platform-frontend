"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { recommendationService } from "@/lib/api";
import { formatPrice } from "@/lib/utils";

type Props = {
  excludeProductIds?: number[];
  limit?: number;
};

export function CartPromotionRecommendations({ excludeProductIds = [], limit = 6 }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["recommendations", "cart-promotions", excludeProductIds, limit],
    queryFn: () => recommendationService.getCartPromotions({ exclude: excludeProductIds, limit }),
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

  if (isError) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="mt-12 border-t pt-6">
        <div className="h-5 w-40 bg-subtle rounded animate-pulse mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 rounded border bg-subtle animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  const showViewAll = (data?.length ?? 0) > 16;

  return (
    <div className="mt-12 border-t pt-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-lg font-semibold uppercase tracking-tight">On Promotion</h2>
        <div className="text-sm text-muted">Hand-picked deals not in your cart yet.</div>
        {showViewAll && (
          <Link href="/catalog?sale=1" className="text-sm font-semibold underline hover:no-underline">
            View all
          </Link>
        )}
      </div>
      <div className="relative group">
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => {
            const el = scrollerRef.current;
            if (!el) return;
            el.scrollBy({ left: -(el.clientWidth || 600), behavior: "smooth" });
            setTimeout(updateButtons, 200);
          }}
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
          onClick={() => {
            const el = scrollerRef.current;
            if (!el) return;
            el.scrollBy({ left: el.clientWidth || 600, behavior: "smooth" });
            setTimeout(updateButtons, 200);
          }}
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
          className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin-horizontal"
        >
          {data.map((p) => (
            <Link
              key={p.id}
              href={`/product/${p.slug ?? p.id}`}
              className="group border rounded-md p-3 hover:border-black/60 transition flex flex-col gap-2 bg-white min-w-[14rem]"
            >
              <div className="relative w-full h-36 rounded bg-subtle overflow-hidden">
                {p.image ? (
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    sizes="200px"
                    className="object-cover group-hover:scale-105 transition"
                  />
                ) : (
                  <div className="w-full h-full grid place-content-center text-xs text-muted">No image</div>
                )}
                {p.promotion ? (
                  <span className="absolute top-2 left-2 inline-flex items-center rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold px-2 py-1 border border-amber-200">
                    {p.promotion}
                  </span>
                ) : null}
              </div>
              <div className="text-sm font-semibold leading-tight line-clamp-2">{p.name}</div>
              <div className="text-sm text-muted">{formatPrice(p.price, "TND")}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
