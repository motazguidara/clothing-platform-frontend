// src/hooks/useSearch.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { ProductSchema, CatalogResponse, CatalogResponseSchema } from '@/lib/api/contracts';

// Query keys
export const searchKeys = {
  all: ['search'] as const,
  query: (query: string) => ['search', 'query', query] as const,
  results: (query: string, page?: number) => ['search', 'results', query, page] as const,
};

// Search hook
export interface SearchParams {
  q: string;
  category?: string;
  brand?: string;
  min_price?: number;
  max_price?: number;
  page?: number;
  limit?: number;
}

export function useSearch(params: SearchParams) {
  const queryOptions = {
    queryKey: searchKeys.results(params.q, params.page),
    queryFn: async (): Promise<CatalogResponse> => {
      const searchParams = {
        q: params.q,
        ...(params.category && { category: params.category }),
        ...(params.brand && { brand: params.brand }),
        ...(params.min_price && { min_price: params.min_price }),
        ...(params.max_price && { max_price: params.max_price }),
        ...(params.page && { page: params.page }),
        ...(params.limit && { limit: params.limit }),
      };

      const response = await apiClient.get<CatalogResponse>('/catalog/search/', {
        params: searchParams,
        responseSchema: CatalogResponseSchema,
      });
      return response;
    },
    enabled: !!params.q && params.q.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount: number, error: Error) => {
      // Don't retry if not found (404) or bad request (400)
      if (error.message.includes('404') || error.message.includes('400')) {
        return false;
      }
      return failureCount < 2;
    },
  };

  return useQuery(queryOptions);
}

// Search suggestions hook
export function useSearchSuggestions(query: string, limit = 5) {
  const queryOptions = {
    queryKey: searchKeys.query(query),
    queryFn: async (): Promise<string[]> => {
      if (!query || query.length < 2) {
        return [];
      }

      const response = await apiClient.get<string[]>('/catalog/search/suggestions/', {
        params: { q: query, limit },
        responseSchema: z.array(z.string()),
      });
      return response;
    },
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  };

  return useQuery(queryOptions);
}

// Popular searches hook
export function usePopularSearches() {
  const queryOptions = {
    queryKey: ['search', 'popular'],
    queryFn: async (): Promise<string[]> => {
      const response = await apiClient.get<string[]>('/catalog/search/popular/', {
        responseSchema: z.array(z.string()),
      });
      return response;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  };

  return useQuery(queryOptions);
}
