"use client";

import { create } from "zustand";

type WishlistState = {
  items: number[];
  toggle: (id: number) => void;
  has: (id: number) => boolean;
  clear: () => void;
};

function load(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("wishlist");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(items: number[]) {
  try {
    localStorage.setItem("wishlist", JSON.stringify(items));
  } catch {}
}

export const useWishlist = create<WishlistState>((set, get) => ({
  items: load(),
  toggle: (id) => {
    const items = get().items.includes(id)
      ? get().items.filter((x) => x !== id)
      : [...get().items, id];
    set({ items });
    save(items);
  },
  has: (id) => get().items.includes(id),
  clear: () => {
    set({ items: [] });
    save([]);
  },
}));
