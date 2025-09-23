"use client";

import React from "react";
import { useProducts } from "@/hooks/useCatalog";
import ProductCard from "@/components/product-card";
import { useUIStore } from "@/store/ui";
import { useFilters } from "@/store/filters";
import { useSearchParams } from "next/navigation";

export default function CatalogPage() {
  const openFilter = useUIStore((s) => s.openFilter);
  const filters = useFilters();
  const searchParams = useSearchParams();
  const params: Record<string, string> = {};
  // Map allowed query params
  const allow = ["category", "gender", "price_min", "price_max", "size", "color", "q", "ordering", "page", "sale", "in_stock"];
  for (const key of allow) {
    const v = searchParams.get(key);
    if (v && v.length) params[key] = v;
  }
  const { data, isLoading, isError } = useProducts(params);

  // Sync URL params into filter store on mount so drawer reflects active chips
  React.useEffect(() => {
    const cat = (searchParams.get("category") || "").split(",").filter(Boolean);
    const size = (searchParams.get("size") || "").split(",").filter(Boolean);
    const color = (searchParams.get("color") || "").split(",").filter(Boolean);
    const priceMinStr = searchParams.get("price_min");
    const priceMaxStr = searchParams.get("price_max");
    const priceMin = priceMinStr ? Number(priceMinStr) : undefined;
    const priceMax = priceMaxStr ? Number(priceMaxStr) : undefined;
    // Set arrays
    cat.forEach((slug) => !filters.categories.includes(slug) && filters.setCategory(slug, true));
    size.forEach((s) => !filters.sizes.includes(s) && filters.setSize(s, true));
    color.forEach((hex) => !filters.colors.includes(hex) && filters.setColor(hex, true));
    // Set price range
    if (priceMin !== undefined || priceMax !== undefined) filters.setPrice(priceMin, priceMax);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight uppercase">Catalog</h1>
          <p className="text-muted mt-2">Explore our latest selection.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openFilter} className="px-3 py-2 border rounded-md text-sm">Filters</button>
          <select className="px-3 py-2 border rounded-md text-sm" defaultValue={params.ordering || "-created_at"}
            onChange={(e) => {
              const v = e.target.value;
              const url = new URL(window.location.href);
              if (v) url.searchParams.set("ordering", v); else url.searchParams.delete("ordering");
              url.searchParams.delete("page");
              window.location.href = url.toString();
            }}
          >
            <option value="-created_at">Newest</option>
            <option value="price">Price: Low to High</option>
            <option value="-price">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Active filter chips */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {filters.categories.map((slug) => (
          <button
            key={`cat-${slug}`}
            className="px-2 py-1 rounded-full border text-xs"
            onClick={() => {
              filters.setCategory(slug, false);
              const url = new URL(window.location.href);
              const list = filters.categories.filter((c) => c !== slug);
              list.length ? url.searchParams.set("category", list.join(",")) : url.searchParams.delete("category");
              url.searchParams.delete("page");
              window.location.href = url.toString();
            }}
          >
            {slug.toUpperCase()} ✕
          </button>
        ))}
        {filters.sizes.map((s) => (
          <button key={`size-${s}`} className="px-2 py-1 rounded-full border text-xs" onClick={() => {
            filters.setSize(s, false);
            const url = new URL(window.location.href);
            const list = filters.sizes.filter((x) => x !== s);
            list.length ? url.searchParams.set("size", list.join(",")) : url.searchParams.delete("size");
            url.searchParams.delete("page");
            window.location.href = url.toString();
          }}>{s} ✕</button>
        ))}
        {filters.colors.map((hex) => (
          <button key={`color-${hex}`} className="px-2 py-1 rounded-full border text-xs" onClick={() => {
            filters.setColor(hex, false);
            const url = new URL(window.location.href);
            const list = filters.colors.filter((x) => x !== hex);
            list.length ? url.searchParams.set("color", list.join(",")) : url.searchParams.delete("color");
            url.searchParams.delete("page");
            window.location.href = url.toString();
          }}>{hex} ✕</button>
        ))}
        {(filters.categories.length || filters.sizes.length || filters.colors.length || params.price_min || params.price_max) ? (
          <button className="ml-2 px-3 py-1 rounded-md border text-xs" onClick={() => {
            filters.clear();
            const url = new URL(window.location.href);
            ["category","size","color","price_min","price_max","page"].forEach((k) => url.searchParams.delete(k));
            window.location.href = url.toString();
          }}>Clear all</button>
        ) : null}

        {/* Price range chips */}
        {typeof filters.priceMin === 'number' && (
          <button
            className="px-2 py-1 rounded-full border text-xs"
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.delete("price_min");
              filters.setPrice(undefined, filters.priceMax);
              url.searchParams.delete("page");
              window.location.href = url.toString();
            }}
          >
            Min: {filters.priceMin} ✕
          </button>
        )}
        {typeof filters.priceMax === 'number' && (
          <button
            className="px-2 py-1 rounded-full border text-xs"
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.delete("price_max");
              filters.setPrice(filters.priceMin, undefined);
              url.searchParams.delete("page");
              window.location.href = url.toString();
            }}
          >
            Max: {filters.priceMax} ✕
          </button>
        )}
      </div>

      <div className="mt-8">
        {isError && <p className="text-sm text-red-600">Failed to load products.</p>}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-80 rounded-md bg-subtle animate-pulse" />
            ))}
          </div>
        )}
        {!isLoading && data && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {data.results.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination with URL-preserved filters */}
      {!isLoading && data && (
        <div className="mt-10 flex items-center justify-center gap-2">
          {(() => {
            const total = Math.max(1, Math.ceil((data.count || 0) / 12));
            const current = Number(params.page || 1);
            const makeHref = (page: number) => {
              const url = new URL(window.location.href);
              url.searchParams.set("page", String(page));
              return url.toString();
            };
            return (
              <>
                <a className={`px-3 py-2 border rounded-md text-sm ${current <= 1 ? 'pointer-events-none opacity-50' : ''}`} href={current > 1 ? makeHref(current - 1) : undefined}>Prev</a>
                <span className="text-xs">Page {current} of {total}</span>
                <a className={`px-3 py-2 border rounded-md text-sm ${current >= total ? 'pointer-events-none opacity-50' : ''}`} href={current < total ? makeHref(current + 1) : undefined}>Next</a>
              </>
            );
          })()}
        </div>
      )}
    </section>
  );
}



