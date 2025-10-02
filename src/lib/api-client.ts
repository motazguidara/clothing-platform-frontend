// Optimized API client with caching, retry logic, and type safety

import { z } from 'zod';
import { SecurityManager } from './security';
import { cacheOptimization } from './performance';

// API Response types
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

// Request configuration
export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  cache?: boolean;
  cacheTTL?: number;
  retry?: number;
  timeout?: number;
  signal?: AbortSignal;
}

// API Client class
export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private cache = new Map<string, { data: any; expires: number }>();
  private retryDelays = [1000, 2000, 4000]; // Exponential backoff

  constructor(baseUrl: string = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:8000/api') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  // Set authentication token
  setAuthToken(token: string) {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Remove authentication token
  removeAuthToken() {
    delete this.defaultHeaders['Authorization'];
  }

  // Generate cache key
  private getCacheKey(url: string, config: RequestConfig): string {
    const method = config.method || 'GET';
    const body = config.body ? JSON.stringify(config.body) : '';
    return `${method}:${url}:${body}`;
  }

  // Check cache
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expires) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  // Set cache
  private setCache(key: string, data: any, ttl: number) {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl,
    });
  }

  // Retry logic with exponential backoff
  private async withRetry<T>(
    operation: () => Promise<T>,
    retries: number = 3
  ): Promise<T> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        if (attempt === retries) throw error;
        
        // Don't retry on client errors (4xx)
        if (error.status >= 400 && error.status < 500) throw error;
        
        const delay = this.retryDelays[attempt] || 4000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Max retries exceeded');
  }

  // Main request method
  async request<T = any>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      cache = method === 'GET',
      cacheTTL = 5 * 60 * 1000, // 5 minutes
      retry = 3,
      timeout = 30000,
      signal,
    } = config;

    const url = `${this.baseUrl}${endpoint}`;
    const cacheKey = this.getCacheKey(url, config);

    // Check cache for GET requests
    if (cache && method === 'GET') {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await this.withRetry(async () => {
        const requestHeaders = {
          ...this.defaultHeaders,
          ...headers,
        };

        // Add CSRF token for non-GET requests
        if (method !== 'GET') {
          const csrfToken = this.getCSRFToken();
          if (csrfToken) {
            requestHeaders['X-CSRFToken'] = csrfToken;
          }
        }

        const fetchOptions: RequestInit = {
          method,
          headers: requestHeaders,
          signal: signal || controller.signal,
          credentials: 'include',
        };

        if (body && method !== 'GET') {
          if (body instanceof FormData) {
            delete requestHeaders['Content-Type']; // Let browser set boundary
            fetchOptions.body = body;
          } else {
            fetchOptions.body = JSON.stringify(body);
          }
        }

        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw {
            message: errorData.message || response.statusText,
            status: response.status,
            code: errorData.code,
            details: errorData,
          } as ApiError;
        }

        return response;
      }, retry);

      clearTimeout(timeoutId);

      const data = await response.json();
      const result: ApiResponse<T> = {
        data: data.data || data,
        success: true,
        message: data.message,
        meta: data.meta,
      };

      // Cache successful GET requests
      if (cache && method === 'GET') {
        this.setCache(cacheKey, result, cacheTTL);
      }

      return result;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw {
          message: 'Request timeout',
          status: 408,
          code: 'TIMEOUT',
        } as ApiError;
      }

      throw error;
    }
  }

  // Convenience methods
  async get<T = any>(endpoint: string, config?: Omit<RequestConfig, 'method'>) {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T = any>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...config, method: 'POST', body });
  }

  async put<T = any>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body });
  }

  async patch<T = any>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body });
  }

  async delete<T = any>(endpoint: string, config?: Omit<RequestConfig, 'method'>) {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  // File upload with progress
  async uploadFile(
    endpoint: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({
              data: response.data || response,
              success: true,
              message: response.message,
            });
          } catch {
            resolve({
              data: xhr.responseText,
              success: true,
            });
          }
        } else {
          reject({
            message: 'Upload failed',
            status: xhr.status,
          });
        }
      });

      xhr.addEventListener('error', () => {
        reject({
          message: 'Network error',
          status: 0,
        });
      });

      xhr.open('POST', `${this.baseUrl}${endpoint}`);
      
      // Add auth header if available
      if (this.defaultHeaders['Authorization']) {
        xhr.setRequestHeader('Authorization', this.defaultHeaders['Authorization']);
      }

      // Add CSRF token
      const csrfToken = this.getCSRFToken();
      if (csrfToken) {
        xhr.setRequestHeader('X-CSRFToken', csrfToken);
      }

      xhr.send(formData);
    });
  }

  // Get CSRF token from cookies or meta tag
  private getCSRFToken(): string | null {
    if (typeof window === 'undefined') return null;

    // Try to get from cookie
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrftoken') {
        return decodeURIComponent(value || '');
      }
    }

    // Try to get from meta tag
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    return metaTag?.getAttribute('content') || null;
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Clear expired cache entries
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now >= value.expires) {
        this.cache.delete(key);
      }
    }
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Typed API endpoints
export const api = {
  // Authentication
  auth: {
    login: (credentials: { email: string; password: string; mfaCode?: string }) =>
      apiClient.post('/accounts/auth/login/', credentials),
    
    register: (userData: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      terms: boolean;
      marketingConsent?: boolean;
    }) => apiClient.post('/accounts/auth/register/', userData),
    
    logout: () => apiClient.post('/accounts/auth/logout/'),
    
    refresh: (refreshToken: string) =>
      apiClient.post('/accounts/auth/refresh/', { refresh: refreshToken }),
    
    verifyEmail: (token: string) =>
      apiClient.post('/accounts/auth/verify-email/', { token }),
    
    requestPasswordReset: (email: string) =>
      apiClient.post('/accounts/auth/password-reset-request/', { email }),
    
    resetPassword: (token: string, password: string, passwordConfirm: string) =>
      apiClient.post('/accounts/auth/password-reset/', {
        token,
        password,
        password_confirm: passwordConfirm,
      }),
  },

  // User profile
  profile: {
    get: () => apiClient.get('/accounts/profile/'),
    
    update: (data: Partial<{
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber: string;
      dateOfBirth: string;
      gender: string;
      company: string;
      jobTitle: string;
      locale: string;
      timezone: string;
      marketingConsent: boolean;
      trackingConsent: boolean;
      emailNotifications: boolean;
      smsNotifications: boolean;
    }>) => apiClient.put('/accounts/profile/', data),
    
    changePassword: (currentPassword: string, newPassword: string, newPasswordConfirm: string) =>
      apiClient.post('/accounts/profile/change-password/', {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      }),
  },

  // Addresses
  addresses: {
    list: () => apiClient.get('/accounts/addresses/'),
    
    create: (address: {
      type: 'billing' | 'shipping' | 'both';
      firstName: string;
      lastName: string;
      company?: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      stateProvince: string;
      postalCode: string;
      country: string;
      phone?: string;
      isDefault?: boolean;
    }) => apiClient.post('/accounts/addresses/', address),
    
    update: (id: number, address: any) =>
      apiClient.put(`/accounts/addresses/${id}/`, address),
    
    delete: (id: number) => apiClient.delete(`/accounts/addresses/${id}/`),
  },

  // Products
  products: {
    list: (params?: {
      page?: number;
      limit?: number;
      search?: string;
      category?: string;
      brand?: string;
      minPrice?: number;
      maxPrice?: number;
      sort?: string;
      gender?: string;
      sale?: boolean;
    }) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, value.toString());
          }
        });
      }
      return apiClient.get(`/catalog/products/?${searchParams.toString()}`);
    },
    
    get: (id: number) => apiClient.get(`/catalog/products/${id}/`),
    
    create: (product: any) => apiClient.post('/catalog/products/', product),
    
    update: (id: number, product: any) =>
      apiClient.put(`/catalog/products/${id}/`, product),
    
    delete: (id: number) => apiClient.delete(`/catalog/products/${id}/`),
  },

  // Orders
  orders: {
    list: (params?: { page?: number; status?: string }) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, value.toString());
          }
        });
      }
      return apiClient.get(`/orders/?${searchParams.toString()}`);
    },
    
    get: (id: string) => apiClient.get(`/orders/${id}/`),
    
    create: (order: any) => apiClient.post('/orders/', order),
    
    update: (id: string, data: any) => apiClient.put(`/orders/${id}/`, data),
  },

  // Cart
  cart: {
    get: () => apiClient.get('/orders/cart/'),
    
    add: (productId: number, quantity: number, variantId?: number) =>
      apiClient.post('/orders/cart/items/', {
        product_id: productId,
        delta_qty: quantity,
        ...(variantId != null ? { variant_id: variantId } : {}),
      }),
    
    update: (itemId: number, quantity: number) =>
      apiClient.put(`/orders/cart/items/${itemId}/`, { quantity }),
    
    remove: (itemId: number) => apiClient.delete(`/orders/cart/items/${itemId}/`),
    
    clear: () => apiClient.delete('/orders/cart/clear/'),
  },

  // Wishlist
  wishlist: {
    get: () => apiClient.get('/catalog/wishlist/'),
    
    add: (productId: number) =>
      apiClient.post('/catalog/wishlist/add/', { product_id: productId }),
    
    remove: (productId: number) =>
      apiClient.delete(`/catalog/wishlist/remove/${productId}/`),
  },

  // Categories
  categories: {
    list: () => apiClient.get('/catalog/categories/'),
    
    get: (id: number) => apiClient.get(`/catalog/categories/${id}/`),
  },

  // Search
  search: {
    products: (query: string, filters?: any) => {
      const params = new URLSearchParams({ q: query });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }
      return apiClient.get(`/catalog/search/?${params.toString()}`);
    },
    
    suggestions: (query: string) =>
      apiClient.get(`/catalog/search/suggestions/?q=${encodeURIComponent(query)}`),
  },
};

// Error handling hook
export const useApiError = () => {
  const handleError = (error: ApiError) => {
    console.error('API Error:', error);
    
    // Handle specific error types
    switch (error.status) {
      case 401:
        // Redirect to login (only on client side)
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        break;
      case 403:
        // Show access denied message
        break;
      case 404:
        // Show not found message
        break;
      case 500:
        // Show server error message
        break;
      default:
        // Show generic error message
        break;
    }
  };

  return { handleError };
};
