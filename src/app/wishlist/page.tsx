"use client";

import React from "react";
import ProductCard from "@/components/product-card";
import { useAddToCart } from "@/hooks/useCart";
import { useUIStore } from "@/store/ui";
import { useToast } from "@/providers/toast-provider";
import { useWishlistStore, type WishlistItem } from "@/lib/wishlist";
import { useToggleWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

function WishlistEntry({ item }: { item: WishlistItem }) {
  const productId = item.productId;
  const hasPrefetchedProduct = Boolean(item.product);
  const toggleWishlist = useToggleWishlist();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["wishlist", "product", productId],
    queryFn: async () => apiClient.get(`/catalog/products/${productId}/`),
    enabled: !hasPrefetchedProduct,
  });
  const product = (item.product as any) ?? data;
  const add = useAddToCart();
  const openCart = useUIStore((s) => s.openCart);
  const { toast } = useToast();

  if (!product) {
    if (isLoading) {
      return <div className="h-80 rounded-md bg-subtle animate-pulse" />;
    }
    if (isError) {
      return null;
    }
  }

  return (
    <div className="relative">
      {product ? <ProductCard product={product as any} /> : null}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          className="px-3 py-2 border rounded-md text-sm hover:bg-gray-100 transition-colors"
          onClick={() => {
            add.mutate(
              { product_id: productId, delta_qty: 1 },
              {
                onSuccess: () => {
                  toast({ title: "Added to bag", variant: "success" });
                  openCart();
                },
                onError: () => {
                  toast({ title: "Failed to add to bag", variant: "destructive" });
                },
              }
            );
          }}
        >
          Add to Bag
        </button>
        <button
          type="button"
          className="px-3 py-2 border rounded-md text-sm text-red-600 hover:bg-red-50 transition-colors"
          onClick={() => toggleWishlist.mutate({ product_id: productId, ...(item.variantId != null ? { variant_id: item.variantId } : {}) })}
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const { isAuthenticated } = useAuth();
  const items = useWishlistStore((state) => state.items);
  const isLoading = useWishlistStore((state) => state.isLoading);
  const clearWishlist = useWishlistStore((state) => state.clearWishlist);

  const itemCount = items.length;

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight uppercase">
            Wishlist {itemCount > 0 && <span className="text-lg text-muted">({itemCount})</span>}
          </h1>
          <p className="text-muted mt-2">Your saved items for later.</p>
        </div>
        {items.length > 0 && (
          <button
            className="px-3 py-2 border rounded-md text-sm"
            onClick={async () => {
              await clearWishlist();
            }}
          >
            Clear all
          </button>
        )}
      </div>

      {isAuthenticated && isLoading ? (
        <div className="mt-10 text-sm text-muted">Loading...</div>
      ) : items.length === 0 ? (
        <div className="mt-10 text-sm text-muted">No items yet. Explore the catalog and add favorites &hearts;</div>
      ) : (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
          {items.map((item) => (
            <WishlistEntry
              key={`${item.productId}-${item.variantId ?? "base"}`}
              item={item}
            />
          ))}
        </div>
      )}
    </section>
  );
}
