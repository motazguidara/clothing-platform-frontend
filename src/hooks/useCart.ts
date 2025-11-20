"use client";

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
  id: z.coerce.number().optional(),
  product_id: z.coerce.number(),
  variant_id: z.coerce.number().nullable().optional(),
  quantity: z.coerce.number(),
  price: z.coerce.number(),
  product_title: z.string().optional(),
  product_name: z.string().optional(), // backend alias
  sku: z.string().nullable().optional(),
  currency: z.string().optional(),
});

const TotalsSchema = z.object({
  subtotal: z.coerce.number(),
  tax: z.coerce.number(),
  shipping: z.coerce.number(),
  total: z.coerce.number(),
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

  const query = useQuery<Cart, Error>(queryOptions);

  // Dev logging of cart data and errors
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && query.data) {
      // eslint-disable-next-line no-console
      console.log('[useCart] fetched', {
        id: query.data.id,
        itemsCount: Array.isArray(query.data.items) ? query.data.items.length : 0,
        items: query.data.items,
        totals: query.data.totals,
      });
    }
  }, [query.data]);

  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && query.error) {
      // eslint-disable-next-line no-console
      console.error('[useCart] error', query.error);
    }
  }, [query.error]);

  return query;
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
    onSuccess: async (data) => {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('[useAddToCart] success, invalidating cart', { items: data?.items });
      }
      // Optimistically update cache with server response
      qc.setQueryData(cartKeys.all, data);
      // Invalidate and refetch to ensure freshness
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
  const CartItemUpdateResponseSchema = z.object({
    ok: z.boolean().optional(),
    item: CartItemSchema,
    totals: TotalsSchema.optional(),
  });

  return useMutation<{ ok?: boolean; item: CartItem; totals?: Cart['totals'] }, Error, { item_id: number; quantity: number }>({
    mutationFn: async ({ item_id, quantity }) => {
      const response = await apiClient.request<{ ok?: boolean; item: CartItem; totals?: Cart['totals'] }>(`/orders/cart/items/${item_id}/`, {
        method: 'PATCH',
        body: { quantity },
        responseSchema: CartItemUpdateResponseSchema,
      });
      return response;
    },
    onMutate: async ({ item_id, quantity }) => {
      // Optimistically update cache
      const prev = qc.getQueryData<Cart>(cartKeys.all);
      if (prev) {
        const next: Cart = {
          ...prev,
          items: prev.items.map((it) => it.id === item_id ? { ...it, quantity } : it),
        };
        qc.setQueryData(cartKeys.all, next);
      }
    },
    onSuccess: (data) => {
      // Merge server-confirmed item fields if present
      const prev = qc.getQueryData<Cart>(cartKeys.all);
      if (prev && data?.item?.id != null) {
        const itemId = Number(data.item.id);
        const totals = data.totals ?? prev.totals;
        const base: Cart = {
          ...prev,
          items: prev.items.map((it) => it.id === itemId ? { ...it, ...data.item } : it),
        } as Cart;
        const next = totals ? { ...base, totals } as Cart : base;
        qc.setQueryData(cartKeys.all, next);
      }
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
const generateClientReferenceId = () => {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `ref_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

export interface CheckoutPayload {
  email: string;
  first_name?: string;
  last_name?: string;
}

export function useCheckout() {
  const qc = useQueryClient();
  return useMutation<any, Error, CheckoutPayload>({
    mutationFn: async (payload) => {
      const clientReferenceId = generateClientReferenceId();
      const response = await apiClient.request<any>('/orders/checkout/', {
        method: 'POST',
        body: {
          client_reference_id: clientReferenceId,
          ...payload,
        },
      });
      return response;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}
