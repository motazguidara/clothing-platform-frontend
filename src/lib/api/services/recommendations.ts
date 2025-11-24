import { apiClient } from '../client';
import type { Product } from '@/types';

export type RecommendationProduct = Product & {
  promotion?: string | null;
};

export type RecommendationBlock = {
  id: number;
  key: string;
  title: string;
  items: Array<{
    position: number;
    product: RecommendationProduct;
  }>;
};

export class RecommendationService {
  async getBestsellers(limit = 8): Promise<RecommendationProduct[]> {
    const res = await apiClient.get<{ results: any[] }>(`/catalog/recommendations/bestsellers/?limit=${limit}`);
    return (res?.results ?? []).map(this.toProduct);
  }

  async getBlocks(placement = 'home'): Promise<RecommendationBlock[]> {
    const res = await apiClient.get<{ results: any[] }>(`/catalog/recommendations/blocks/?placement=${encodeURIComponent(placement)}`);
    return (res?.results ?? []).map((block: any) => ({
      id: Number(block.id),
      key: String(block.key ?? ''),
      title: String(block.title ?? 'Recommended'),
      items: Array.isArray(block.items)
        ? block.items.map((item: any) => ({
            position: Number(item.position ?? 0),
            product: this.toProduct(item.product),
          }))
        : [],
    }));
  }

  async getCartPromotions(opts?: { exclude?: number[]; limit?: number }): Promise<RecommendationProduct[]> {
    const params = new URLSearchParams();
    if (opts?.limit) params.set('limit', String(opts.limit));
    (opts?.exclude ?? []).forEach((id) => params.append('exclude', String(id)));
    const res = await apiClient.get<{ results: any[] }>(`/catalog/recommendations/cart-promotions/?${params.toString()}`);
    return (res?.results ?? []).map((p: any) => this.toProduct(p));
  }

  private toProduct = (raw: any): RecommendationProduct => ({
    id: Number(raw?.id ?? 0),
    name: String(raw?.name ?? 'Product'),
    slug: raw?.slug,
    price: Number(raw?.price ?? 0),
    image: raw?.image ?? raw?.thumbnail ?? null,
    in_stock: true,
    category: raw?.category ?? '',
    brand: raw?.brand ?? raw?.brand_name,
    promotion: raw?.promotion ?? null,
  });
}

export const recommendationService = new RecommendationService();
