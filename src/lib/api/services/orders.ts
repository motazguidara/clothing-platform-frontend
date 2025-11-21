import { apiClient } from '../client';
import * as schemas from '../schemas';

export class OrdersService {
  // Cart management
  async getCart(): Promise<schemas.Cart> {
    return apiClient.get<schemas.Cart>('/orders/cart/', {
      responseSchema: schemas.CartSchema,
    });
  }

  async addToCart(data: schemas.AddToCartRequest): Promise<schemas.CartItem> {
    // Validate input
    const validatedData = schemas.AddToCartRequestSchema.parse(data);
    
    return apiClient.post<schemas.CartItem>('/orders/cart/add/', validatedData, {
      responseSchema: schemas.CartItemSchema,
    });
  }

  async updateCartItem(itemId: number, data: schemas.UpdateCartItemRequest): Promise<schemas.CartItem> {
    // Validate input
    const validatedData = schemas.UpdateCartItemRequestSchema.parse(data);
    
    return apiClient.put<schemas.CartItem>(`/orders/cart/item/${itemId}/`, validatedData, {
      responseSchema: schemas.CartItemSchema,
    });
  }

  async removeFromCart(itemId: number): Promise<void> {
    return apiClient.delete<void>(`/orders/cart/remove/${itemId}/`);
  }

  async clearCart(): Promise<void> {
    // This might need to be implemented on the backend
    const cart = await this.getCart();
    await Promise.all(
      cart.items.map(item => this.removeFromCart(item.id))
    );
  }

  // Checkout
  async checkout(data: schemas.CheckoutRequest): Promise<schemas.Order> {
    // Validate input
    const validatedData = schemas.CheckoutRequestSchema.parse(data);
    
    return apiClient.post<schemas.Order>('/orders/checkout/', validatedData, {
      responseSchema: schemas.OrderSchema,
    });
  }

  // Order management
  async getOrders(params?: {
    page?: number;
    page_size?: number;
    status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  }): Promise<schemas.PaginatedOrderList> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }

    const endpoint = `/orders/orders/${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    
    return apiClient.get<schemas.PaginatedOrderList>(endpoint, {
      responseSchema: schemas.PaginatedOrderListSchema,
    });
  }

  async getOrder(id: string): Promise<schemas.Order> {
    return apiClient.get<schemas.Order>(`/orders/orders/${id}/`, {
      responseSchema: schemas.OrderSchema,
    });
  }

  async cancelOrder(id: string): Promise<schemas.Order> {
    return apiClient.post<schemas.Order>(`/orders/orders/${id}/cancel/`, undefined, {
      responseSchema: schemas.OrderSchema,
    });
  }

  async createOrder(data: {
    items: Array<{
      product_id: number;
      quantity: number;
      size?: string | null;
      color?: string | null;
    }>;
    shipping_address_id: number;
    billing_address_id?: number | null;
    payment_method: 'credit_card' | 'debit_card' | 'paypal' | 'stripe' | 'bank_transfer';
    payment_details: Record<string, unknown>;
    coupon_code?: string | null;
    notes?: string | null;
  }): Promise<schemas.Order> {
    return apiClient.post<schemas.Order>('/orders/orders/', data, {
      responseSchema: schemas.OrderSchema,
    });
  }

  // Order tracking
  async trackOrder(trackingNumber: string): Promise<{
    order_number: string;
    tracking_number: string;
    status: string;
    estimated_delivery: string | null;
    tracking_events: Array<{
      status: string;
      description: string;
      location: string | null;
      timestamp: string;
    }>;
  }> {
    return apiClient.get(`/orders/track/?tracking_number=${encodeURIComponent(trackingNumber)}`);
  }

  // Order statistics
  async getOrderStats(): Promise<{
    total_orders: number;
    total_spent: number;
    orders_by_status: Record<string, number>;
    recent_orders: schemas.Order[];
  }> {
    return apiClient.get('/orders/stats/');
  }

  // Utility methods
  async getCartItemCount(): Promise<number> {
    try {
      const cart = await this.getCart();
      return cart.total_items;
    } catch (error) {
      console.warn('Failed to get cart item count:', error);
      return 0;
    }
  }

  async getCartTotal(): Promise<number> {
    try {
      const cart = await this.getCart();
      return cart.total_amount;
    } catch (error) {
      console.warn('Failed to get cart total:', error);
      return 0;
    }
  }

  // Bulk operations
  async addMultipleToCart(items: schemas.AddToCartRequest[]): Promise<schemas.CartItem[]> {
    const results = await Promise.allSettled(
      items.map(item => this.addToCart(item))
    );

    const successful: schemas.CartItem[] = [];
    const failed: Array<{ item: schemas.AddToCartRequest; error: unknown }> = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        failed.push({ item: items[index]!, error: result.reason });
      }
    });

    if (failed.length > 0) {
      console.warn('Some items failed to add to cart:', failed);
    }

    return successful;
  }

  async updateMultipleCartItems(
    updates: Array<{ itemId: number; data: schemas.UpdateCartItemRequest }>
  ): Promise<schemas.CartItem[]> {
    const results = await Promise.allSettled(
      updates.map(({ itemId, data }) => this.updateCartItem(itemId, data))
    );

    const successful: schemas.CartItem[] = [];
    const failed: Array<{ update: typeof updates[0]; error: unknown }> = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        failed.push({ update: updates[index]!, error: result.reason });
      }
    });

    if (failed.length > 0) {
      console.warn('Some cart items failed to update:', failed);
    }

    return successful;
  }

  // Cart persistence for guest users
  saveCartToStorage(cart: schemas.Cart): void {
    try {
      localStorage.setItem('guest_cart', JSON.stringify(cart));
    } catch (error) {
      console.warn('Failed to save cart to storage:', error);
    }
  }

  getCartFromStorage(): schemas.Cart | null {
    try {
      const cartData = localStorage.getItem('guest_cart');
      if (cartData) {
        const parsed = JSON.parse(cartData);
        return schemas.CartSchema.parse(parsed);
      }
    } catch (error) {
      console.warn('Failed to parse stored cart data:', error);
    }
    return null;
  }

  clearStoredCart(): void {
    try {
      localStorage.removeItem('guest_cart');
    } catch (error) {
      console.warn('Failed to clear stored cart:', error);
    }
  }
}

export const ordersService = new OrdersService();
