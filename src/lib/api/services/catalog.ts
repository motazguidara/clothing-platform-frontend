import { apiClient } from '../client';
import * as schemas from '../schemas';

export class CatalogService {
  // Products
  async getProducts(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    category?: string;
    brand?: string;
    gender?: 'men' | 'women' | 'kids' | 'unisex';
    min_price?: number;
    max_price?: number;
    featured?: boolean;
    on_sale?: boolean;
    ordering?: string;
  }): Promise<schemas.PaginatedProductList> {
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
    
    // Allow backend to evolve without breaking the frontend rails; skip strict validation here
    return apiClient.get<schemas.PaginatedProductList>(endpoint);
  }

  async getProduct(id: number): Promise<schemas.Product> {
    return apiClient.get<schemas.Product>(`/catalog/products/${id}/`, {
      responseSchema: schemas.ProductSchema,
    });
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
    return apiClient.get('/catalog/home/');
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
