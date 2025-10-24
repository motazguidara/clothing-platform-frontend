import { apiClient, ApiError } from '../client';
import * as schemas from '../schemas';
import type { CatalogFacetsResponse } from '@/types';

type Primitive = string | number | boolean;
type CatalogProductRequest = Record<string, Primitive>;

export class CatalogService {
  // Products
  async getProducts(params?: CatalogProductRequest): Promise<schemas.PaginatedProductList> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        // Map friendly flags to backend fields
        const mappedKey =
          key === 'featured' ? 'is_featured' :
          key === 'on_sale' ? 'is_on_sale' :
          key;
        searchParams.append(mappedKey, String(value));
      });
    }

    const endpoint = `/catalog/products/${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

    try {
      return await apiClient.get<schemas.PaginatedProductList>(endpoint);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return {
          count: 0,
          next: null,
          previous: null,
          results: [],
        } as schemas.PaginatedProductList;
      }
      throw error;
    }
  }

  async getProduct(id: number): Promise<schemas.Product> {
    return apiClient.get<schemas.Product>(`/catalog/products/${id}/`, {
      responseSchema: schemas.ProductSchema,
    });
  }

  async getCatalogFacets(params?: Record<string, unknown>): Promise<CatalogFacetsResponse> {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (Array.isArray(value)) {
          value.forEach((entry) => searchParams.append(key, String(entry)));
        } else {
          searchParams.append(key, String(value));
        }
      });
    }

    const endpoint = `/catalog/products/facets/${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return apiClient.get<CatalogFacetsResponse>(endpoint);
  }

  // Categories
  async getCategories(): Promise<schemas.Category[]> {
    return apiClient.get<schemas.Category[]>('/catalog/categories/', {
      responseSchema: schemas.CategorySchema.array(),
    });
  }

  // Brands
  async getBrands(): Promise<schemas.Brand[]> {
    return apiClient.get<schemas.Brand[]>('/catalog/brands/', {
      responseSchema: schemas.BrandSchema.array(),
    });
  }

  // Wishlist
  async getWishlist(): Promise<schemas.WishlistItem[]> {
    return apiClient.get<schemas.WishlistItem[]>('/catalog/wishlist/', {
      responseSchema: schemas.WishlistItemSchema.array(),
    });
  }

  async getWishlistIds(): Promise<schemas.WishlistIds> {
    return apiClient.get<schemas.WishlistIds>('/catalog/wishlist/ids/', {
      responseSchema: schemas.WishlistIdsSchema,
    });
  }

  async addToWishlist(productId: number): Promise<schemas.WishlistItem> {
    return apiClient.post<schemas.WishlistItem>('/catalog/wishlist/', 
      { product_id: productId },
      { responseSchema: schemas.WishlistItemSchema }
    );
  }

  async removeFromWishlist(id: number): Promise<void> {
    return apiClient.delete<void>(`/catalog/wishlist/${id}/`);
  }

  // Home data
  async getHomeData(): Promise<{
    featured_products: schemas.Product[];
    categories: schemas.Category[];
    brands: schemas.Brand[];
  }> {
    try {
      return await apiClient.get('/catalog/home/');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return {
          featured_products: [],
          categories: [],
          brands: [],
        };
      }
      throw error;
    }
  }

  // Coupons
  async getCoupon(code: string): Promise<{
    id: number;
    code: string;
    discount_type: 'percentage' | 'fixed_amount';
    discount_value: number;
    minimum_amount: number | null;
    maximum_discount: number | null;
    valid_from: string;
    valid_until: string;
    is_active: boolean;
    usage_limit: number | null;
    used_count: number;
  }> {
    return apiClient.get(`/catalog/coupons/${code}/`);
  }
}

export const catalogService = new CatalogService();

