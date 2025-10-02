import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { z } from "zod";
import { useRouter } from "next/navigation";

// Types
export interface CartItem {
  id?: number;
  product_id: number;
  variant_id?: number;
  quantity: number;
  price: number; // unit price from server
  product_title?: string;
  sku?: string | null;
  currency?: string;
}

export interface Cart {
  id: number;
  items: CartItem[];
  totals?: {
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
  };
}

// Schema for API response validation
const CartItemSchema = z.object({
  id: z.number().optional(),
  product_id: z.number(),
  variant_id: z.number().nullable().optional(),
  quantity: z.number(),
  price: z.number(),
  product_title: z.string().optional(),
  sku: z.string().nullable().optional(),
  currency: z.string().optional(),
});

const TotalsSchema = z.object({
  subtotal: z.number(),
  tax: z.number(),
  shipping: z.number(),
  total: z.number(),
});

const CartSchema = z.object({
  id: z.number(),
  items: z.array(CartItemSchema),
  totals: TotalsSchema.optional(),
});

type UpsertCartPayload = { 
  product_id?: number; 
  variant_id?: number; 
  delta_qty: number;
};

// Cache keys
const cartKeys = {
  all: ['cart'] as const,
  detail: (id: number) => [...cartKeys.all, id] as const,
};

export function useCart() {
  const queryOptions: UseQueryOptions<Cart, Error> = {
    queryKey: cartKeys.all,
    queryFn: async () => {
      const response = await apiClient.request<Cart>('/orders/cart/', {
        method: 'GET',
        responseSchema: CartSchema,
      });
      return response;
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  };

  return useQuery<Cart, Error>(queryOptions);
}

export function useAddToCart() {
  const qc = useQueryClient();

  return useMutation<Cart, Error, UpsertCartPayload>({
    mutationFn: async (payload) => {
      const response = await apiClient.request<Cart>('/orders/cart/items/', {
        method: 'POST',
        body: payload,
        responseSchema: CartSchema,
      });
      return response;
    },
    onSuccess: async () => {
      // Invalidate and immediately refetch to ensure the drawer shows fresh data
      await qc.invalidateQueries({ queryKey: cartKeys.all });
      await qc.refetchQueries({ queryKey: cartKeys.all });
    },
  });
}

export function useRemoveFromCart() {
  const qc = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: async (itemId) => {
      await apiClient.request(`/orders/cart/remove/${itemId}/`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation<Cart, Error, { item_id: number; quantity: number }>({
    mutationFn: async ({ item_id, quantity }) => {
      const response = await apiClient.request<Cart>(`/orders/cart/items/${item_id}/`, {
        method: 'PATCH',
        body: { quantity },
        responseSchema: CartSchema,
      });
      return response;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

export function useClearCart() {
  const qc = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await apiClient.request('/orders/cart/clear/', {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

// Minimal checkout hook used by checkout page
export function useCheckout() {
  return useMutation<any, Error, void>({
    mutationFn: async () => {
      // If your backend expects specific payload, wire it here.
      // This minimal call assumes the backend uses the current cart/session to create an order.
      const response = await apiClient.request<any>('/orders/checkout/', {
        method: 'POST',
      });
      return response;
    },
  });
}
