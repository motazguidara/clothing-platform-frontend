"use client";

import React from "react";
import ProductCard from "@/components/product-card";
import { useProduct } from "@/hooks/useCatalog";
import { useAddToCart } from "@/hooks/useCart";
import { useToast } from "@/providers/toast-provider";
import { useToggleWishlist, useWishlistIds } from "@/hooks/useWishlist";

function WishlistItem({ id }: { id: number }) {
  const { data, isLoading, isError } = useProduct(String(id));
  const add = useAddToCart();
  const { show } = useToast();

  if (isLoading) return <div className="h-80 rounded-md bg-subtle animate-pulse" />;
  if (isError || !data) return null;

  return (
    <div className="relative">
      <ProductCard product={data as any} />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          className="px-3 py-2 border rounded-md text-sm"
          onClick={() => {
            add.mutate({ product_id: id, quantity: 1 });
            show({ title: "Added to bag", variant: "success" });
          }}
        >
          Add to Bag
        </button>
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const { data: wishlist, isLoading } = useWishlistIds();
  const toggle = useToggleWishlist();
  const items = wishlist?.ids ?? [];

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight uppercase">Wishlist</h1>
          <p className="text-muted mt-2">Your saved items for later.</p>
        </div>
        {items.length > 0 && (
          <button
            className="px-3 py-2 border rounded-md text-sm"
            onClick={async () => {
              for (const id of items) {
                await toggle.mutateAsync({ product_id: id });
              }
            }}
          >
            Clear all
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="mt-10 text-sm text-muted">Loading…</div>
      ) : items.length === 0 ? (
        <div className="mt-10 text-sm text-muted">No items yet. Explore the catalog and add favorites ♥</div>
      ) : (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((id) => (
            <WishlistItem key={id} id={id} />
          ))}
        </div>
      )}
    </section>
  );
}
