import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";

// Types
export interface CartItem {
  id: number;
  product_id: number;
  variant_id?: number;
  quantity: number;
  price: string;
  total_price: string;
  product_name: string;
  product_image?: string;
  variant_name?: string;
}

export interface Cart {
  id: number;
  items: CartItem[];
  total_items: number;
  total_price: string;
  created_at: string;
  updated_at: string;
}

// Schema for API response validation
const CartItemSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  variant_id: z.number().optional(),
  quantity: z.number(),
  price: z.string(),
  total_price: z.string(),
  product_name: z.string(),
  product_image: z.string().optional(),
  variant_name: z.string().optional(),
});

const CartSchema = z.object({
  id: z.number(),
  items: z.array(CartItemSchema),
  total_items: z.number(),
  total_price: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

type AddToCartPayload = { 
  product_id: number; 
  variant_id?: number; 
  quantity: number;
};

// Cache keys
const cartKeys = {
  all: ['cart'] as const,
  detail: (id: number) => [...cartKeys.all, id] as const,
};

export function useCart() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const queryOptions: UseQueryOptions<Cart, Error> = {
    queryKey: cartKeys.all,
    queryFn: async () => {
      if (!isAuthenticated) {
        throw new Error('User not authenticated');
      }
      
      const response = await apiClient.request<Cart>('/orders/cart/', {
        method: 'GET',
        responseSchema: CartSchema,
      });
      return response;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry if unauthorized (401) or not found (404)
      if (error instanceof Error && error.message.includes('401') || 
          error instanceof Error && error.message.includes('404')) {
        return false;
      }
      return failureCount < 3; // Retry up to 3 times for other errors
    },
  };

  const result = useQuery<Cart, Error>(queryOptions);

  // Handle errors in an effect
  React.useEffect(() => {
    if (result.error) {
      if (result.error.message.includes('401')) {
        router.push('/login');
      }
    }
  }, [result.error, router]);

  return result;
}

export function useAddToCart() {
  const qc = useQueryClient();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  return useMutation<CartItem, Error, AddToCartPayload>({
    mutationFn: async (payload) => {
      if (!isAuthenticated) {
        throw new Error('User not authenticated');
      }

      const response = await apiClient.request<CartItem>('/orders/cart/add/', {
        method: 'POST',
        body: payload,
        responseSchema: CartItemSchema,
      });
      return response;
    },
    onSuccess: () => {
      // Invalidate cart query to refetch updated cart
      qc.invalidateQueries({ queryKey: cartKeys.all });
    },
    onError: (error) => {
      if (error instanceof Error && error.message.includes('401')) {
        router.push('/login');
      }
    },
  });
}

export function useRemoveFromCart() {
  const qc = useQueryClient();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  return useMutation<void, Error, number>({
    mutationFn: async (itemId) => {
      if (!isAuthenticated) {
        throw new Error('User not authenticated');
      }

      await apiClient.request(`/orders/cart/remove/${itemId}/`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cartKeys.all });
    },
    onError: (error) => {
      if (error instanceof Error && error.message.includes('401')) {
        router.push('/login');
      }
    },
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  return useMutation<CartItem, Error, { item_id: number; quantity: number }>({
    mutationFn: async ({ item_id, quantity }) => {
      if (!isAuthenticated) {
        throw new Error('User not authenticated');
      }

      const response = await apiClient.request<CartItem>(`/orders/cart/items/${item_id}/`, {
        method: 'PATCH',
        body: { quantity },
        responseSchema: CartItemSchema,
      });
      return response;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cartKeys.all });
    },
    onError: (error) => {
      if (error instanceof Error && error.message.includes('401')) {
        router.push('/login');
      }
    },
  });
}

export function useCheckout() {
  const qc = useQueryClient();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  return useMutation<{ id: number }, Error, void>({
    mutationFn: async () => {
      if (!isAuthenticated) {
        throw new Error('User not authenticated');
      }

      const response = await apiClient.request<{ id: number }>('/orders/checkout/', {
        method: 'POST',
        body: {},
        responseSchema: z.object({ id: z.number() }),
      });
      return response;
    },
    onSuccess: (data) => {
      // Invalidate cart and orders queries
      qc.invalidateQueries({ queryKey: cartKeys.all });
      qc.invalidateQueries({ queryKey: ['orders'] });
      
      // Redirect to order confirmation
      router.push(`/orders/${data.id}/confirmation`);
    },
    onError: (error) => {
      if (error instanceof Error && error.message.includes('401')) {
        router.push('/login');
      }
    },
  });
}

export function useClearCart() {
  const qc = useQueryClient();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      if (!isAuthenticated) {
        throw new Error('User not authenticated');
      }

      await apiClient.request('/orders/cart/clear/', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      qc.setQueryData(cartKeys.all, {
        id: 0,
        items: [],
        total_items: 0,
        total_price: '0.00',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    },
    onError: (error) => {
      if (error instanceof Error && error.message.includes('401')) {
        router.push('/login');
      }
    },
  });
}
