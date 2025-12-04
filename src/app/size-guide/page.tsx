"use client";

import Link from "next/link";

const ADULT_SIZES = [
  { label: "XS", chest: "84-88 cm", waist: "68-72 cm", hips: "86-90 cm" },
  { label: "S", chest: "88-94 cm", waist: "72-78 cm", hips: "90-96 cm" },
  { label: "M", chest: "94-100 cm", waist: "78-84 cm", hips: "96-102 cm" },
  { label: "L", chest: "100-106 cm", waist: "84-90 cm", hips: "102-108 cm" },
  { label: "XL", chest: "106-112 cm", waist: "90-96 cm", hips: "108-114 cm" },
  { label: "XXL", chest: "112-118 cm", waist: "96-102 cm", hips: "114-120 cm" },
];

const KIDS_SIZES = {
  boys: ["2T", "3T", "4", "5", "6", "7", "8", "10", "12", "14", "16", "18"],
  girls: ["2T", "3T", "4", "5", "6", "6X", "7", "8", "10", "12", "14", "16"],
  unisex: ["2T", "3T", "4", "5", "6", "7", "8", "10", "12", "14", "16"],
};

const KIDS_MEASUREMENTS = [
  { size: "2T", height: "86-92 cm", chest: "52-53 cm", waist: "50-52 cm" },
  { size: "4", height: "98-104 cm", chest: "55-57 cm", waist: "52-54 cm" },
  { size: "6", height: "110-116 cm", chest: "58-60 cm", waist: "54-56 cm" },
  { size: "8", height: "122-128 cm", chest: "61-64 cm", waist: "56-58 cm" },
  { size: "10", height: "134-140 cm", chest: "65-69 cm", waist: "58-61 cm" },
  { size: "12", height: "146-152 cm", chest: "70-74 cm", waist: "61-64 cm" },
  { size: "14", height: "158-164 cm", chest: "75-79 cm", waist: "64-67 cm" },
  { size: "16", height: "170-174 cm", chest: "80-84 cm", waist: "67-70 cm" },
];

export default function SizeGuidePage() {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Sizing</p>
        <h1 className="text-3xl font-extrabold text-gray-900">Size Guide</h1>
        <p className="text-sm text-gray-600">
          Find your perfect fit for adults and kids. Use these measurements as a starting point and check product-specific fit notes when available.
        </p>
      </header>

      <section id="adults" className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Adults (Men & Women)</h2>
        <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-white">
          <div className="grid grid-cols-4 sm:grid-cols-5 bg-gray-50 text-xs font-semibold text-gray-600 px-4 py-3">
            <div>Size</div>
            <div>Chest</div>
            <div>Waist</div>
            <div className="hidden sm:block">Hips</div>
            <div className="sm:hidden">Hips</div>
          </div>
          <div className="divide-y divide-gray-100">
            {ADULT_SIZES.map((row) => (
              <div key={row.label} className="grid grid-cols-4 sm:grid-cols-5 px-4 py-3 text-sm text-gray-800">
                <div className="font-semibold">{row.label}</div>
                <div>{row.chest}</div>
                <div>{row.waist}</div>
                <div className="sm:col-span-2 sm:block">{row.hips}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-600">
          Tip: If you are between sizes, size up for a relaxed fit or down for a closer fit. Refer to the product description for any item-specific notes.
        </p>
      </section>

      <section id="kids" className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Kids</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Unisex", sizes: KIDS_SIZES.unisex },
            { label: "Boys", sizes: KIDS_SIZES.boys },
            { label: "Girls", sizes: KIDS_SIZES.girls },
          ].map((group) => (
            <div key={group.label} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold text-gray-900 mb-2">{group.label}</div>
              <div className="flex flex-wrap gap-2">
                {group.sizes.map((size) => (
                  <span key={size} className="inline-flex items-center rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-800">
                    {size}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-white">
          <div className="grid grid-cols-4 bg-gray-50 text-xs font-semibold text-gray-600 px-4 py-3">
            <div>Size</div>
            <div>Height</div>
            <div>Chest</div>
            <div>Waist</div>
          </div>
          <div className="divide-y divide-gray-100">
            {KIDS_MEASUREMENTS.map((row) => (
              <div key={row.size} className="grid grid-cols-4 px-4 py-3 text-sm text-gray-800">
                <div className="font-semibold">{row.size}</div>
                <div>{row.height}</div>
                <div>{row.chest}</div>
                <div>{row.waist}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-600">
          Kids size tips: choose the size that matches height first. If your child is between sizes or has a broader build, size up for comfort.
        </p>
      </section>
    </main>
  );
}
