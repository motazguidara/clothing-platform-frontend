import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/auth/useAuth";

export function useWishlistIds() {
  const { isAuthenticated } = useAuth();
  return useQuery<{ ids: number[] }>({
    queryKey: ["wishlist", "ids"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<{ ids: number[] }>("/catalog/wishlist/ids/");
        return { ids: Array.isArray((res as any)?.ids) ? (res as any).ids.map((x: any) => Number(x)) : [] };
      } catch {
        // If unauthenticated or any error, treat as empty wishlist for UI simplicity
        return { ids: [] };
      }
    },
    enabled: !!isAuthenticated,
    retry: false,
  });
}

export function useToggleWishlist() {
  const qc = useQueryClient();
  return useMutation<{ added: boolean; product_id: number }, Error, { product_id: number}>(
  {
    mutationFn: async ({ product_id }) => {
      const res = await apiClient.post("/catalog/wishlist/toggle/", { product_id });
      return res as any;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wishlist", "ids"] });
    }
  });
}
