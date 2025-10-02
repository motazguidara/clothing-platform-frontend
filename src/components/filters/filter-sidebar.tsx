"use client";

import React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

type Option = { label: string; value: string };

const genders: Option[] = [
  { label: "Men", value: "men" },
  { label: "Women", value: "women" },
  { label: "Kids", value: "kids" },
];

const colors: Option[] = [
  { label: "Black", value: "black" },
  { label: "White", value: "white" },
  { label: "Blue", value: "blue" },
  { label: "Red", value: "red" },
  { label: "Green", value: "green" },
  { label: "Grey", value: "grey" },
];

const sizes: Option[] = [
  { label: "XS", value: "XS" },
  { label: "S", value: "S" },
  { label: "M", value: "M" },
  { label: "L", value: "L" },
  { label: "XL", value: "XL" },
];

const pricePresets: { label: string; min?: number; max?: number }[] = [
  { label: "Under $25", max: 25 },
  { label: "$25 - $50", min: 25, max: 50 },
  { label: "$50 - $100", min: 50, max: 100 },
  { label: "$100+", min: 100 },
];

function useUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const setParam = React.useCallback((key: string, value?: string) => {
    const url = new URL(window.location.origin + pathname + (sp?.size ? `?${sp.toString()}` : ""));
    if (value && value.length) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
    url.searchParams.delete("page");
    router.push(url.toString());
  }, [router, pathname, sp]);
  return { setParam, sp };
}

export function FilterSidebar({ className = "" }: { className?: string }) {
  const { sp, setParam } = useUrl();
  const [show, setShow] = React.useState(true);

  const gender = sp.get("gender") || "";
  const sale = sp.get("sale") || "";
  const inStock = sp.get("in_stock") || "";
  const size = sp.get("size") || "";
  const color = sp.get("color") || "";
  const priceMin = sp.get("price_min") || "";
  const priceMax = sp.get("price_max") || "";

  return (
    <aside className={`${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">Filters</h2>
        <button onClick={() => setShow((s) => !s)} className="text-sm text-gray-600 hover:underline">
          {show ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      {show && (
        <div className="space-y-6">
          {/* Gender */}
          <div>
            <div className="font-medium mb-2">Gender</div>
            <div className="space-y-1">
              {genders.map((g) => (
                <label key={g.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="gender"
                    checked={gender === g.value}
                    onChange={() => setParam("gender", g.value)}
                  />
                  <span>{g.label}</span>
                </label>
              ))}
              <button
                className="text-xs text-gray-600 hover:underline mt-1"
                onClick={() => setParam("gender", undefined)}
              >
                Clear
              </button>
            </div>
          </div>

          {/* Shop By Price */}
          <div>
            <div className="font-medium mb-2">Shop By Price</div>
            <div className="space-y-1">
              {pricePresets.map((p) => (
                <button
                  key={p.label}
                  className="block w-full text-left text-sm hover:underline"
                  onClick={() => {
                    setParam("price_min", p.min != null ? String(p.min) : undefined);
                    setParam("price_max", p.max != null ? String(p.max) : undefined);
                  }}
                >
                  {p.label}
                </button>
              ))}
              <div className="mt-2 flex items-center gap-2">
                <input
                  placeholder="Min"
                  defaultValue={priceMin}
                  className="w-20 px-2 py-1 border rounded"
                  onBlur={(e) => setParam("price_min", e.target.value || undefined)}
                />
                <span className="text-gray-500">-</span>
                <input
                  placeholder="Max"
                  defaultValue={priceMax}
                  className="w-20 px-2 py-1 border rounded"
                  onBlur={(e) => setParam("price_max", e.target.value || undefined)}
                />
              </div>
              {(priceMin || priceMax) && (
                <button className="text-xs text-gray-600 hover:underline mt-1" onClick={() => { setParam("price_min", undefined); setParam("price_max", undefined); }}>
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Sale & Offers */}
          <div>
            <div className="font-medium mb-2">Sale & Offers</div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={sale === "1"}
                onChange={(e) => setParam("sale", e.target.checked ? "1" : undefined)}
              />
              <span>On Sale</span>
            </label>
          </div>

          {/* Availability */}
          <div>
            <div className="font-medium mb-2">Availability</div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={inStock === "1"}
                onChange={(e) => setParam("in_stock", e.target.checked ? "1" : undefined)}
              />
              <span>In Stock</span>
            </label>
          </div>

          {/* Size */}
          <div>
            <div className="font-medium mb-2">Size</div>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => (
                <button
                  key={s.value}
                  className={`px-2 py-1 border rounded text-xs ${size === s.value ? "bg-black text-white" : "hover:bg-gray-100"}`}
                  onClick={() => setParam("size", size === s.value ? undefined : s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {size && (
              <button className="text-xs text-gray-600 hover:underline mt-1" onClick={() => setParam("size", undefined)}>
                Clear
              </button>
            )}
          </div>

          {/* Colour */}
          <div>
            <div className="font-medium mb-2">Colour</div>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c.value}
                  className={`px-2 py-1 border rounded text-xs ${color === c.value ? "bg-black text-white" : "hover:bg-gray-100"}`}
                  onClick={() => setParam("color", color === c.value ? undefined : c.value)}
                >
                  {c.label}
                </button>
              ))}
            </div>
            {color && (
              <button className="text-xs text-gray-600 hover:underline mt-1" onClick={() => setParam("color", undefined)}>
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}

export function SortSelect() {
  const { sp, setParam } = useUrl();
  const current = sp.get("ordering") || "-created_at";
  return (
    <select
      className="px-3 py-2 border rounded-md text-sm"
      defaultValue={current}
      onChange={(e) => setParam("ordering", e.target.value || undefined)}
      aria-label="Sort by"
    >
      <option value="-created_at">Newest</option>
      <option value="-bestseller">Best Sellers</option>
      <option value="price">Price: Low to High</option>
      <option value="-price">Price: High to Low</option>
      <option value="-rating">Highest Rated</option>
      <option value="name">Name A-Z</option>
    </select>
  );
}
