"use client";

import { create } from "zustand";

export type FiltersState = {
  categories: string[];
  sizes: string[];
  colors: string[];
  priceMin: number | null;
  priceMax: number | null;
  setCategory: (slug: string, checked: boolean) => void;
  setSize: (size: string, checked: boolean) => void;
  setColor: (hex: string, checked: boolean) => void;
  setPrice: (min: number | null, max: number | null) => void;
  clear: () => void;
};

export const useFilters = create<FiltersState>((set) => ({
  categories: [],
  sizes: [],
  colors: [],
  priceMin: null,
  priceMax: null,
  setCategory: (slug, checked) => set((s) => ({ categories: checked ? Array.from(new Set([...s.categories, slug])) : s.categories.filter((c) => c !== slug) })),
  setSize: (size, checked) => set((s) => ({ sizes: checked ? Array.from(new Set([...s.sizes, size])) : s.sizes.filter((c) => c !== size) })),
  setColor: (hex, checked) => set((s) => ({ colors: checked ? Array.from(new Set([...s.colors, hex])) : s.colors.filter((c) => c !== hex) })),
  setPrice: (min, max) => set({ priceMin: min, priceMax: max }),
  clear: () => set({ categories: [], sizes: [], colors: [], priceMin: null, priceMax: null }),
}));
