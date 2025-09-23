import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { z } from "zod";

const CartSchema = z.object({ id: z.number(), items: z.array(z.any()) });

export type AddToCartPayload = { product_id: number; variant_id?: number; quantity: number };

export function useCart() {
  return useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const res = await api.get("/orders/cart/");
      return CartSchema.parse(res.data);
    },
  });
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation<any, Error, AddToCartPayload>({
    mutationFn: async (payload: AddToCartPayload) => {
      const res = await api.post("/orders/cart/add/", payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useRemoveFromCart() {
  const qc = useQueryClient();
  return useMutation<any, Error, number>({
    mutationFn: async (item_id: number) => {
      const res = await api.delete(`/orders/cart/remove/${item_id}/`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useCheckout() {
  const qc = useQueryClient();
  return useMutation<{ id: number }, Error, void>({
    mutationFn: async () => {
      const res = await api.post("/orders/checkout/");
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation<any, Error, { item_id: number; quantity: number }>({
    mutationFn: async ({ item_id, quantity }) => {
      const res = await api.patch(`/orders/cart/item/${item_id}/`, { quantity });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}
