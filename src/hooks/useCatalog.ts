import { useQuery } from "@tanstack/react-query";
import { catalogService } from "@/lib/api/services/catalog";
import { apiClient } from "@/lib/api/client";
import type { Product, ProductList, Category } from "@/types";

export interface Coupon {
  code: string;
  discount: number;
  valid_until?: string;
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => {
      const apiCategories = await catalogService.getCategories();
      // Transform API categories to legacy format
      return apiCategories.map((cat: { id: number; name: string; slug: string | null }) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        is_active: true, // Default to active since API doesn't provide this
      }));
    },
  });
}

export function useProducts(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["products", params ?? {}],
    queryFn: async (): Promise<ProductList> => {
      // Translate UI params to DRF params
      const p: Record<string, unknown> = { ...(params ?? {}) };
      if ((p as any)["limit"] != null) {
        (p as any)["page_size"] = (p as any)["limit"];
        delete (p as any)["limit"];
      }

      const data: any = await catalogService.getProducts(p as any);
      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
        ? data.results
        : [];
      // Map Django ProductListSerializer -> UI Product shape
      const mapped: Product[] = items.map((it: any) => {
        const product: Product = {
          id: Number(it.id),
          name: String(it.name ?? ""),
          slug: typeof it.slug === "string" ? it.slug : undefined,
          price: typeof it.current_price === "number" ? it.current_price : Number(it.price ?? 0),
          is_on_sale: !!it.is_on_sale,
          is_featured: !!it.is_featured,
          in_stock: it.in_stock !== undefined ? !!it.in_stock : true,
          category: it.category?.name ?? it.category,
          sku: it.sku,
          brand: it.brand,
          description: it.description,
          material: it.material,
          care_instructions: it.care_instructions,
          images: Array.isArray(it.images) ? it.images.map((im: any) => im?.image).filter(Boolean) : [],
          image: it.image,
          available_sizes: Array.isArray(it.available_sizes) ? it.available_sizes : [],
          available_colors: Array.isArray(it.available_colors) ? it.available_colors : [],
          tags: Array.isArray(it.tags) ? it.tags : [],
          seo_title: it.seo_title,
          seo_description: it.seo_description,
          created_at: it.created_at,
          updated_at: it.updated_at,
        };

        // Only add optional properties if they have valid values
        if (it.compare_at_price != null) {
          product.compare_at_price = Number(it.compare_at_price);
        }
        if (it.sale_price != null) {
          product.sale_price = it.sale_price;
        }
        if (it.stock_quantity != null) {
          product.stock_quantity = Number(it.stock_quantity);
        }
        if (it.category?.id != null) {
          product.category_id = Number(it.category.id);
        }
        if (it.gender) {
          product.gender = it.gender;
        }
        if (it.short_description) {
          product.short_description = it.short_description;
        }
        if (it.avg_rating != null) {
          product.avg_rating = Number(it.avg_rating);
        }
        if (it.review_count != null) {
          product.review_count = Number(it.review_count);
        }
        if (it.base_price != null) {
          product.base_price = it.base_price;
        }
        if (Array.isArray(it.variants) && it.variants.length > 0) {
          product.variants = it.variants.map((v: any) => ({
            id: Number(v.id),
            sku: v.sku,
            size: v.size,
            color: v.color,
            price_adjustment: Number(v.price_adjustment ?? 0),
            is_active: !!v.is_active,
            inventory: v.inventory ? {
              quantity: Number(v.inventory.quantity ?? 0),
              status: v.inventory.status,
              is_in_stock: !!v.inventory.is_in_stock,
              is_low_stock: !!v.inventory.is_low_stock,
            } : undefined,
          }));
        }
        if (Array.isArray(it.reviews) && it.reviews.length > 0) {
          product.reviews = it.reviews.map((r: any) => ({
            id: Number(r.id),
            rating: Number(r.rating),
            title: r.title,
            comment: r.comment,
            user_name: r.user_name,
            created_at: r.created_at,
          }));
        }
        if (it.weight != null) {
          product.weight = it.weight;
        }
        if (it.dimensions) {
          product.dimensions = it.dimensions;
        }
        if (it.rating != null) {
          product.rating = it.rating;
        }

        return product;
      });
      const count = typeof data?.count === 'number' ? data.count : mapped.length;

      const heroImagesSource =
        Array.isArray((data as any)?.hero_images)
          ? (data as any).hero_images
          : Array.isArray((data as any)?.heroImages)
          ? (data as any).heroImages
          : Array.isArray((data as any)?.hero?.images)
          ? (data as any).hero.images
          : [];

      const heroImages = heroImagesSource
        .map((image: any) => {
          if (typeof image === 'string') {
            return image.trim();
          }
          if (image && typeof image === 'object') {
            const candidates = ['image', 'url', 'src', 'original', 'large', 'medium'];
            for (const key of candidates) {
              const value = (image as Record<string, unknown>)[key];
              if (typeof value === 'string' && value.trim().length > 0) {
                return value.trim();
              }
            }
          }
          return null;
        })
        .filter((value: string | null): value is string => typeof value === 'string' && value.length > 0);

      const heroTitle =
        typeof (data as any)?.hero_title === 'string'
          ? (data as any).hero_title
          : typeof (data as any)?.hero?.title === 'string'
          ? (data as any).hero.title
          : undefined;

      const heroSubtitle =
        typeof (data as any)?.hero_subtitle === 'string'
          ? (data as any).hero_subtitle
          : typeof (data as any)?.hero?.subtitle === 'string'
          ? (data as any).hero.subtitle
          : undefined;

      const heroCtaRaw =
        (data as any)?.hero_cta ??
        (data as any)?.hero?.cta ??
        undefined;

      const heroCta =
        heroCtaRaw && typeof heroCtaRaw === 'object'
          ? {
              label:
                typeof (heroCtaRaw as any).label === 'string'
                  ? (heroCtaRaw as any).label
                  : typeof (heroCtaRaw as any).text === 'string'
                  ? (heroCtaRaw as any).text
                  : 'View catalog',
              href:
                typeof (heroCtaRaw as any).href === 'string'
                  ? (heroCtaRaw as any).href
                  : typeof (heroCtaRaw as any).url === 'string'
                  ? (heroCtaRaw as any).url
                  : '/admin/products/new',
            }
          : undefined;

      return {
        results: mapped,
        count,
        ...(heroImages.length > 0 ? { heroImages } : {}),
        ...(heroTitle ? { heroTitle } : {}),
        ...(heroSubtitle ? { heroSubtitle } : {}),
        ...(heroCta ? { heroCta } : {}),
      };
    },
  });
}

export function useProduct(slug?: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async (): Promise<Product> => {
      if (!slug) throw new Error("Missing slug");
      const it: any = await apiClient.get(`/catalog/products/${slug}/`);
      const mapped: Product = {
        id: Number(it.id),
        name: String(it.name ?? ""),
        slug: typeof it.slug === "string" ? it.slug : undefined,
        price: typeof it.current_price === "number" ? it.current_price : Number(it.price ?? 0),
        is_on_sale: !!it.is_on_sale,
        is_featured: !!it.is_featured,
        in_stock: it.in_stock !== undefined ? !!it.in_stock : true,
        category: it.category?.name ?? it.category,
        sku: it.sku,
        brand: it.brand,
        description: it.description,
        material: it.material,
        care_instructions: it.care_instructions,
        images: Array.isArray(it.images) ? it.images.map((im: any) => im?.image).filter(Boolean) : [],
        image: it.image,
        available_sizes: Array.isArray(it.available_sizes) ? it.available_sizes : [],
        available_colors: Array.isArray(it.available_colors) ? it.available_colors : [],
        tags: Array.isArray(it.tags) ? it.tags : [],
        seo_title: it.seo_title,
        seo_description: it.seo_description,
        created_at: it.created_at,
        updated_at: it.updated_at,
      };

      // Only add optional properties if they have valid values
      if (it.compare_at_price != null) {
        mapped.compare_at_price = Number(it.compare_at_price);
      }
      if (it.sale_price != null) {
        mapped.sale_price = it.sale_price;
      }
      if (it.stock_quantity != null) {
        mapped.stock_quantity = Number(it.stock_quantity);
      }
      if (it.category?.id != null) {
        mapped.category_id = Number(it.category.id);
      }
      if (it.gender) {
        mapped.gender = it.gender;
      }
      if (it.short_description) {
        mapped.short_description = it.short_description;
      }
      if (it.avg_rating != null) {
        mapped.avg_rating = Number(it.avg_rating);
      }
      if (it.review_count != null) {
        mapped.review_count = Number(it.review_count);
      }
      if (it.base_price != null) {
        mapped.base_price = it.base_price;
      }
      if (Array.isArray(it.variants) && it.variants.length > 0) {
        mapped.variants = it.variants.map((v: any) => ({
          id: Number(v.id),
          sku: v.sku,
          size: v.size,
          color: v.color,
          price_adjustment: Number(v.price_adjustment ?? 0),
          is_active: !!v.is_active,
          inventory: v.inventory ? {
            quantity: Number(v.inventory.quantity ?? 0),
            status: v.inventory.status,
            is_in_stock: !!v.inventory.is_in_stock,
            is_low_stock: !!v.inventory.is_low_stock,
          } : undefined,
        }));
      }
      if (Array.isArray(it.reviews) && it.reviews.length > 0) {
        mapped.reviews = it.reviews.map((r: any) => ({
          id: Number(r.id),
          rating: Number(r.rating),
          title: r.title,
          comment: r.comment,
          user_name: r.user_name,
          created_at: r.created_at,
        }));
      }
      if (it.weight != null) {
        mapped.weight = it.weight;
      }
      if (it.dimensions) {
        mapped.dimensions = it.dimensions;
      }
      if (it.rating != null) {
        mapped.rating = it.rating;
      }

      return mapped;
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
      const c: any = await catalogService.getCoupon(code);
      const coupon: Coupon = {
        code: String(c.code),
        discount: Number(c.discount_value ?? c.discount ?? 0),
        valid_until: c.valid_until ?? undefined,
      };
      return coupon;
    },
  });
}
