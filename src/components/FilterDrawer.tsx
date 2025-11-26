"use client";

import React from "react";
import { useUIStore } from "@/store/ui";
import { useFilters } from "@/store/filters";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function FilterDrawer() {
  const isOpen = useUIStore((s) => s.isFilterOpen);
  const close = useUIStore((s) => s.closeFilter);
  const filters = useFilters();

  function applyAndClose() {
    const url = new URL(window.location.href);
    // categories as repeated query params or comma
    if (filters.categories.length) url.searchParams.set("category", filters.categories.join(","));
    else url.searchParams.delete("category");
    if (filters.sizes.length) url.searchParams.set("size", filters.sizes.join(","));
    else url.searchParams.delete("size");
    if (filters.colors.length) url.searchParams.set("color", filters.colors.join(","));
    else url.searchParams.delete("color");
    if (typeof filters.priceMin === "number") url.searchParams.set("price_min", String(filters.priceMin));
    else url.searchParams.delete("price_min");
    if (typeof filters.priceMax === "number") url.searchParams.set("price_max", String(filters.priceMax));
    else url.searchParams.delete("price_max");
    close();
    window.location.href = url.toString();
  }

  return (
    <Sheet open={isOpen} onOpenChange={(v) => (v ? null : close())}>
      <SheetContent
        side="right"
        className="w-[380px] bg-slate-50 text-slate-900 border-border z-[60]"
      >
        <SheetHeader>
          <SheetTitle className="text-lg font-semibold">Filters</SheetTitle>
        </SheetHeader>
        <div className="py-5 px-3 sm:px-4 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Category</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {["men", "women", "kids"].map((slug) => (
                <label
                  key={slug}
                  className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    checked={filters.categories.includes(slug)}
                    onChange={(e) => filters.setCategory(slug, e.target.checked)}
                  />
                  <span className="font-semibold text-slate-800">{slug.toUpperCase()}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Size</div>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {["XS", "S", "M", "L", "XL"].map((s) => (
                <label
                  key={s}
                  className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    checked={filters.sizes.includes(s)}
                    onChange={(e) => filters.setSize(s, e.target.checked)}
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Color</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {["#111", "#f00", "#0f0", "#00f", "#aaa"].map((hex) => (
                <button
                  key={hex}
                  className={`h-7 w-7 rounded-full border border-slate-200 shadow-inner transition ${
                    filters.colors.includes(hex) ? "ring-2 ring-offset-2 ring-slate-900" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: hex }}
                  aria-pressed={filters.colors.includes(hex)}
                  aria-label={`Color ${hex}`}
                  onClick={() => filters.setColor(hex, !filters.colors.includes(hex))}
                />
              ))}
            </div>
          </div>

          <div className="pt-1 grid grid-cols-2 gap-2">
            <Button variant="secondary" className="rounded-full" onClick={() => filters.clear()}>
              Clear
            </Button>
            <Button className="rounded-full" onClick={applyAndClose}>
              Apply
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
