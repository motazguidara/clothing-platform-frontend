import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/auth/useAuth";
import { useWishlistStore } from "@/lib/wishlist";

export function useWishlistIds() {
  const { isAuthenticated } = useAuth();
  const items = useWishlistStore((state) => state.items);
  const isLoading = useWishlistStore((state) => state.isLoading);
  const error = useWishlistStore((state) => state.error);

  return {
    data: { ids: items.map((item) => item.productId) },
    isLoading: isAuthenticated ? isLoading : false,
    error,
  } as const;
}

export function useToggleWishlist() {
  const toggle = useWishlistStore((state) => state.toggleItem);
  const hasItem = useWishlistStore((state) => state.hasItem);

  return useMutation<{ added: boolean; product_id: number }, Error, { product_id: number; variant_id?: number }>({
    mutationFn: async ({ product_id, variant_id }) => {
      await toggle(product_id, variant_id);
      const added = hasItem(product_id, variant_id);
      return { added, product_id };
    },
  });
}
