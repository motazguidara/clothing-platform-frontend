"use client";

import React from "react";
import Link from "next/link";
import { useProducts } from "@/hooks/useCatalog";
import ProductCard from "@/components/product-card";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/components/motion";

type Props = {
  title: string;
  params?: Record<string, any>;
  href?: string;
};

export default function CollectionRail({ title, params = {}, href }: Props) {
  const { data, isLoading, isError } = useProducts({ limit: 12, ...params });
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);

  function scrollBy(delta: number) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: "smooth" });
  }

  return (
    <section className="py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight">{title}</h2>
          {href ? (
            <Link href={href} className="text-sm font-semibold underline hover:no-underline">View all</Link>
          ) : null}
        </div>

        {isError && (
          <p role="status" className="text-sm text-red-600">Failed to load products.</p>
        )}

        <div className="relative group">
          {/* Desktop nav buttons */}
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => scrollBy(- (scrollerRef.current?.clientWidth || 600))}
            className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur border border-border shadow-sm hover:bg-white focus-visible:ring-2 ring-offset-2 ring-black transition-all duration-200 motion-safe:hover:scale-105 opacity-0 group-hover:opacity-100"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" className="stroke-black/80" aria-hidden="true">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => scrollBy(scrollerRef.current?.clientWidth || 600)}
            className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur border border-border shadow-sm hover:bg-white focus-visible:ring-2 ring-offset-2 ring-black transition-all duration-200 motion-safe:hover:scale-105 opacity-0 group-hover:opacity-100"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" className="stroke-black/80" aria-hidden="true">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <motion.div
            ref={scrollerRef}
            className="flex gap-4 overflow-x-auto overflow-y-hidden snap-x snap-mandatory pb-3 scroll-smooth scrollbar-thin-horizontal"
            role="region"
            aria-label={`${title} products`}
            variants={staggerContainer(0.06)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
          {isLoading && (
            <div className="grid grid-flow-col auto-cols-[16rem] gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-64 h-80 rounded-md bg-subtle animate-pulse" />
              ))}
            </div>
          )}
          {!isLoading && data?.results?.length === 0 && (
            <p className="text-sm text-muted">No products found.</p>
          )}
          {!isLoading && data?.results?.map((p: any) => (
            <motion.div key={p.id} className="snap-start" variants={fadeInUp}>
              <ProductCard product={p} />
            </motion.div>
          ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
