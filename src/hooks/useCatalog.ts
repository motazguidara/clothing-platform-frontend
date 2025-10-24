import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { catalogService } from "@/lib/api/services/catalog";
import { apiClient } from "@/lib/api/client";
import { mapApiProductToProduct } from "@/lib/api/mappers/catalog";
import { prepareCatalogQueryParams } from "@/lib/catalog/query";
import type { Product, ProductList, Category, CatalogFacetsResponse } from "@/types";

export interface Coupon {
  code: string;
  discount: number;
  valid_until?: string;
}

const ApiCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string().nullable().optional(),
});

const ApiCouponSchema = z.object({
  code: z.string(),
  discount_value: z.union([z.number(), z.string()]).nullable().optional(),
  discount: z.union([z.number(), z.string()]).nullable().optional(),
  valid_until: z.string().nullable().optional(),
});

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => {
      const apiCategories = await catalogService.getCategories();

      const unique = new Map<number, Category>();
      apiCategories.forEach((item) => {
        const parsed = ApiCategorySchema.safeParse(item);
        if (!parsed.success) return;
        const { id, name, slug } = parsed.data;
        if (unique.has(id)) return;
        unique.set(id, {
          id,
          name,
          slug: slug ?? null,
          is_active: true,
        });
      });

      return Array.from(unique.values());
    },
  });
}

export function useProducts(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["products", params ?? {}],
    queryFn: async (): Promise<ProductList> => {
      const requestParams = prepareCatalogQueryParams(params);
      const data = await catalogService.getProducts(requestParams);

      const rawItems = Array.isArray(data?.results) ? data.results : [];
      const mapped = rawItems.map((item) => mapApiProductToProduct(item));
      const count =
        typeof data?.count === "number" && Number.isFinite(data.count)
          ? data.count
          : mapped.length;

      return {
        results: mapped,
        count,
      };
    },
  });
}

export function useCatalogFacets(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["catalog-facets", params ?? {}],
    queryFn: async (): Promise<CatalogFacetsResponse> => {
      const requestParams = prepareCatalogQueryParams(params);
      return catalogService.getCatalogFacets(requestParams);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useProduct(slug?: string) {
  return useQuery({
    queryKey: ["product", slug],
    enabled: !!slug,
    queryFn: async (): Promise<Product> => {
      if (!slug) throw new Error("Missing slug");
      const response = await apiClient.get(`/catalog/products/${slug}/`);
      return mapApiProductToProduct(response);
    },
  });
}

export function useCoupon(code?: string) {
  return useQuery({
    queryKey: ["coupon", code],
    enabled: !!code,
    queryFn: async (): Promise<Coupon> => {
      if (!code) throw new Error("Missing code");
      const response = await catalogService.getCoupon(code);
      const parsed = ApiCouponSchema.safeParse(response);
      if (!parsed.success) {
        throw new Error("Invalid coupon payload");
      }
      const data = parsed.data;
      return {
        code: data.code,
        discount: toNumber(data.discount_value) ?? toNumber(data.discount) ?? 0,
        valid_until: data.valid_until ?? undefined,
      };
    },
  });
}

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};
