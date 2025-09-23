import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export function useWishlistIds() {
  return useQuery<{ ids: number[] }>({
    queryKey: ["wishlist", "ids"],
    queryFn: async () => {
      try {
        const res = await api.get("/catalog/wishlist/ids/");
        // Expecting { ids: number[] }
        return { ids: Array.isArray(res.data?.ids) ? res.data.ids.map((x: any) => Number(x)) : [] };
      } catch (e: any) {
        // If unauthenticated or any error, treat as empty wishlist for UI simplicity
        return { ids: [] };
      }
    },
  });
}

export function useToggleWishlist() {
  const qc = useQueryClient();
  return useMutation<{ added: boolean; product_id: number }, Error, { product_id: number}>({
    mutationFn: async ({ product_id }) => {
      const res = await api.post("/catalog/wishlist/toggle/", { product_id });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wishlist", "ids"] });
    }
  });
}
