"use client";

import React from "react";
import ProductCard from "@/components/product-card";
import { useAddToCart } from "@/hooks/useCart";
import { useUIStore } from "@/store/ui";
import { useToast } from "@/providers/toast-provider";
import { useToggleWishlist, useWishlistIds } from "@/hooks/useWishlist";
import { useWishlist } from "@/lib/wishlist";
import { useAuth } from "@/auth/useAuth";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

function WishlistItem({ id }: { id: number }) {
  // Fetch product by numeric ID endpoint
  const { data, isLoading, isError } = useQuery({
    queryKey: ["wishlist", "product", id],
    queryFn: async () => {
      return apiClient.get(`/catalog/products/${id}/`);
    },
  });
  const add = useAddToCart();
  const openCart = useUIStore((s) => s.openCart);
  const { show } = useToast();

  if (isLoading) return <div className="h-80 rounded-md bg-subtle animate-pulse" />;
  if (isError || !data) return null;

  return (
    <div className="relative">
      <ProductCard product={data as any} />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          className="px-3 py-2 border rounded-md text-sm hover:bg-gray-100 transition-colors"
          onClick={() => {
            add.mutate(
              { product_id: id, delta_qty: 1 },
              {
                onSuccess: () => {
                  show({ title: "Added to bag", variant: "success" });
                  openCart();
                },
                onError: () => {
                  show({ title: "Failed to add to bag", variant: "error" });
                }
              }
            );
          }}
        >
          Add to Bag
        </button>
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const { isAuthenticated } = useAuth();
  const { data: wishlist, isLoading } = useWishlistIds();
  const local = useWishlist();
  const toggle = useToggleWishlist();
  const items = React.useMemo(() => {
    if (isAuthenticated) return wishlist?.ids ?? [];
    // Fallback to local store for anonymous users
    return (local.items ?? []).map((it) => it.productId);
  }, [isAuthenticated, wishlist?.ids, local.items]);

  // Real-time count display
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
              if (isAuthenticated) {
                for (const id of items) {
                  await toggle.mutateAsync({ product_id: id });
                }
              } else {
                await local.clearWishlist();
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
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
          {items.map((id) => (
            <WishlistItem key={id} id={id} />
          ))}
        </div>
      )}
    </section>
  );
}
