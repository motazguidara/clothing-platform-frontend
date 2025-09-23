import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { z } from "zod";

export const CategorySchema = z.object({ id: z.number(), name: z.string(), slug: z.string().nullable() });
export const VariantSchema = z.object({
  id: z.number(),
  color: z.string().optional(),
  size: z.string().optional(),
  stock: z.number().optional(),
});
export const ProductSchema = z.object({
  id: z.number(),
  slug: z.string().optional(),
  name: z.string(),
  price: z.number(), // current price
  compare_at_price: z.number().optional(),
  is_on_sale: z.boolean().optional(),
  sale_price: z.number().nullable().optional(),
  is_featured: z.boolean().optional(),
  gender: z.string().optional(),
  short_description: z.string().optional(),
  description: z.string().optional(),
  material: z.string().optional(),
  care_instructions: z.string().optional(),
  avg_rating: z.number().optional(),
  review_count: z.number().optional(),
  images: z.array(z.string()).optional(),
  variants: z.array(z.object({
    id: z.number(),
    sku: z.string(),
    size: z.string().optional(),
    color: z.string().optional(),
    price_adjustment: z.number(),
    is_active: z.boolean(),
    inventory: z.object({
      quantity: z.number(),
      status: z.string(),
      is_in_stock: z.boolean(),
      is_low_stock: z.boolean(),
    }).optional(),
  })).optional(),
  reviews: z.array(z.object({
    id: z.number(),
    rating: z.number(),
    title: z.string(),
    comment: z.string(),
    user_name: z.string(),
    created_at: z.string(),
  })).optional(),
  available_sizes: z.array(z.string()).optional(),
  available_colors: z.array(z.string()).optional(),
});

export type Category = z.infer<typeof CategorySchema>;
export type Product = z.infer<typeof ProductSchema>;
export type Variant = z.infer<typeof VariantSchema>;
export type ProductList = { results: Product[]; count: number };
export const CouponSchema = z.object({ code: z.string(), discount: z.number(), valid_until: z.string().optional() });
export type Coupon = z.infer<typeof CouponSchema>;

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => {
      const res = await api.get("/catalog/categories/");
      return z.array(CategorySchema).parse(res.data);
    },
  });
}

export function useProducts(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["products", params || {}],
    queryFn: async (): Promise<ProductList> => {
      // Translate UI params to DRF params
      const p: Record<string, any> = { ...(params || {}) };
      if (p.limit != null) {
        p.page_size = p.limit;
        delete p.limit;
      }
      const res = await api.get("/catalog/products/", { params: p });
      const data = res.data as any;
      const items = Array.isArray(data.results) ? data.results : [];
      // Map Django ProductListSerializer -> UI Product shape
      const mapped: Product[] = items.map((it: any) => ({
        id: Number(it.id),
        slug: typeof it.slug === "string" ? it.slug : undefined,
        name: String(it.name ?? ""),
        price: typeof it.current_price === "number" ? it.current_price : Number(it.price ?? 0),
        compare_at_price: it.compare_at_price ? Number(it.compare_at_price) : undefined,
        is_on_sale: !!it.is_on_sale,
        sale_price: it.sale_price != null ? Number(it.sale_price) : null,
        is_featured: !!it.is_featured,
        gender: it.gender,
        short_description: it.short_description,
        description: it.description,
        material: it.material,
        care_instructions: it.care_instructions,
        avg_rating: it.avg_rating ? Number(it.avg_rating) : undefined,
        review_count: it.review_count ? Number(it.review_count) : undefined,
        images: Array.isArray(it.images) ? it.images.map((im: any) => im?.image).filter(Boolean) : [],
        variants: Array.isArray(it.variants) ? it.variants.map((v: any) => ({
          id: Number(v.id),
          sku: v.sku,
          size: v.size,
          color: v.color,
          price_adjustment: Number(v.price_adjustment || 0),
          is_active: !!v.is_active,
          inventory: v.inventory ? {
            quantity: Number(v.inventory.quantity || 0),
            status: v.inventory.status,
            is_in_stock: !!v.inventory.is_in_stock,
            is_low_stock: !!v.inventory.is_low_stock,
          } : undefined,
        })) : [],
        available_sizes: Array.isArray(it.available_sizes) ? it.available_sizes : [],
        available_colors: Array.isArray(it.available_colors) ? it.available_colors : [],
        reviews: Array.isArray(it.reviews) ? it.reviews.map((r: any) => ({
          id: Number(r.id),
          rating: Number(r.rating),
          title: r.title,
          comment: r.comment,
          user_name: r.user_name,
          created_at: r.created_at,
        })) : [],
      }));
      return { results: z.array(ProductSchema).parse(mapped), count: Number(data.count ?? mapped.length) };
    },
  });
}

export function useProduct(slug?: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async (): Promise<Product> => {
      if (!slug) throw new Error("Missing slug");
      const res = await api.get(`/catalog/products/${slug}/`);
      const it: any = res.data;
      const mapped: Product = {
        id: Number(it.id),
        slug: typeof it.slug === "string" ? it.slug : undefined,
        name: String(it.name ?? ""),
        price: typeof it.current_price === "number" ? it.current_price : Number(it.price ?? 0),
        compare_at_price: it.compare_at_price ? Number(it.compare_at_price) : undefined,
        is_on_sale: !!it.is_on_sale,
        sale_price: it.sale_price != null ? Number(it.sale_price) : null,
        is_featured: !!it.is_featured,
        gender: it.gender,
        short_description: it.short_description,
        description: it.description,
        material: it.material,
        care_instructions: it.care_instructions,
        avg_rating: it.avg_rating ? Number(it.avg_rating) : undefined,
        review_count: it.review_count ? Number(it.review_count) : undefined,
        images: Array.isArray(it.images) ? it.images.map((im: any) => im?.image).filter(Boolean) : [],
        variants: Array.isArray(it.variants) ? it.variants.map((v: any) => ({
          id: Number(v.id),
          sku: v.sku,
          size: v.size,
          color: v.color,
          price_adjustment: Number(v.price_adjustment || 0),
          is_active: !!v.is_active,
          inventory: v.inventory ? {
            quantity: Number(v.inventory.quantity || 0),
            status: v.inventory.status,
            is_in_stock: !!v.inventory.is_in_stock,
            is_low_stock: !!v.inventory.is_low_stock,
          } : undefined,
        })) : [],
        available_sizes: Array.isArray(it.available_sizes) ? it.available_sizes : [],
        available_colors: Array.isArray(it.available_colors) ? it.available_colors : [],
        reviews: Array.isArray(it.reviews) ? it.reviews.map((r: any) => ({
          id: Number(r.id),
          rating: Number(r.rating),
          title: r.title,
          comment: r.comment,
          user_name: r.user_name,
          created_at: r.created_at,
        })) : [],
      };
      return ProductSchema.parse(mapped);
    },
    enabled: !!slug,
  });
}

export function useCoupon(code?: string) {
  return useQuery({
    queryKey: ["coupon", code],
    enabled: !!code,
    queryFn: async () => {
      if (!code) throw new Error("Missing code");
      const res = await api.get(`/catalog/coupons/${code}/`);
      return CouponSchema.parse(res.data);
    },
  });
}
