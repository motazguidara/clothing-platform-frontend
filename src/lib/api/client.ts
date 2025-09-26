// src/lib/api/client.ts
'use client';

import { z } from 'zod';
import { clientConfig, isDevelopment } from '@/lib/client-env';
import { ErrorReporter } from '@/lib/error-reporter';
import * as schemas from './contracts';

// API Client Configuration
interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  headers: Record<string, string>;
}

// Request options
interface RequestOptions<T = unknown> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: T;
  params?: Record<string, string | number | boolean | undefined>;
  timeout?: number;
  retries?: number;
  validateResponse?: boolean;
  responseSchema?: z.ZodSchema;
}

// API Error types
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(
    message: string,
    public fieldErrors?: Record<string, string[]>,
    public nonFieldErrors?: string[]
  ) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NetworkError extends ApiError {
  constructor(message: string, public originalError?: Error) {
    super(message, 0, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

// Circuit breaker for handling repeated failures
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold = 5,
    private timeout = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new ApiError('Circuit breaker is open', 503, 'CIRCUIT_BREAKER_OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }
}

// Main API Client with httpOnly cookie support and CSRF protection
export class ApiClient {
  private config: ApiClientConfig;
  private circuitBreaker = new CircuitBreaker();
  private errorReporter = new ErrorReporter();

  constructor(config?: Partial<ApiClientConfig>) {
    this.config = {
      baseURL: clientConfig.apiUrl,
      timeout: isDevelopment ? 30000 : 10000,
      retries: isDevelopment ? 1 : 3,
      retryDelay: 1000,
      headers: {
        'Content-Type': 'application/json',
      },
      ...config,
    };
  }

  // Core request method with enhanced error handling and CSRF protection
  async request<T = unknown, U = unknown>(
    endpoint: string,
    options: RequestOptions<U> = {}
  ): Promise<T> {
    const {
      method = 'GET',
      headers = {},
      body,
      params,
      timeout = this.config.timeout,
      retries = this.config.retries,
      validateResponse = true,
      responseSchema,
    } = options;

    // Build URL with query parameters
    const url = new URL(`${this.config.baseURL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const requestId = this.generateRequestId();

    const requestHeaders: Record<string, string> = {
      ...this.config.headers,
      ...headers,
      'X-Request-ID': requestId,
    };

    // Add CSRF token for non-GET requests
    if (method !== 'GET' && typeof window !== 'undefined') {
      const csrfToken = this.getCsrfToken();
      if (csrfToken) {
        requestHeaders['X-CSRFToken'] = csrfToken;
      }
    }

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      credentials: 'include', // For httpOnly cookies
    };

    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    return this.circuitBreaker.execute(async () => {
      return this.executeWithRetry(url, requestOptions, {
        timeout,
        retries,
        validateResponse,
        responseSchema: responseSchema as z.ZodSchema<T>,
        requestId,
      });
    });
  }

  private async executeWithRetry<T>(
    url: URL,
    options: RequestInit,
    config: {
      timeout: number;
      retries: number;
      validateResponse: boolean;
      responseSchema?: z.ZodSchema<T>;
      requestId: string;
    },
    isRetry = false
  ): Promise<T> {
    let lastError: Error | null = null;
    let attempt = 0;
    const maxAttempts = Math.max(1, config.retries + 1);

    while (attempt < maxAttempts) {
      try {
        const response = await this.fetchWithTimeout(
          url.toString(),
          options,
          config.timeout
        );

        return await this.handleResponse(response, {
          validateResponse: config.validateResponse,
          responseSchema: config.responseSchema,
        });
      } catch (error) {
        lastError = error as Error;
        attempt++;

        // Don't retry on client errors (4xx) except 401 with refresh token
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          // Handle 401 Unauthorized - try to refresh token
          if (error.status === 401 && !isRetry) {
            try {
              // Try to refresh the token
              await this.refreshToken();
              // Retry the original request with new token
              return this.executeWithRetry(url, options, config, true);
            } catch (refreshError) {
              // If refresh fails, clear auth and rethrow
              this.clearAuth();
              throw new ApiError(
                'Session expired. Please log in again.',
                401,
                'SESSION_EXPIRED',
                { originalError: error }
              );
            }
          }
          // For other 4xx errors, don't retry
          break;
        }

        // For server errors (5xx) and network errors, retry with exponential backoff
        if (attempt < maxAttempts) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
          await this.sleep(delay);
        }
      }
    }

    // If we get here, all retries failed
    throw lastError || new Error('Request failed after multiple attempts');
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new NetworkError('Request timed out', error);
      }
      throw error;
    }
  }

  private async handleResponse<T>(
    response: Response,
    config: {
      validateResponse: boolean;
      responseSchema?: z.ZodSchema<T>;
    }
  ): Promise<T> {
    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (config.responseSchema && config.validateResponse) {
      const result = config.responseSchema.safeParse(data);
      if (!result.success) {
        throw new Error(`Response validation failed: ${result.error.message}`);
      }
      return result.data;
    }

    return data as T;
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let errorData: any;

    try {
      const text = await response.text();
      errorData = text ? JSON.parse(text) : {};
    } catch {
      errorData = {};
    }

    const error = new ApiError(
      errorData.detail || errorData.message || response.statusText,
      response.status,
      errorData.code,
      errorData
    );

    throw error;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCsrfToken(): string | null {
    if (typeof document === 'undefined') return null;

    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];

    return cookieValue || null;
  }

  private async refreshToken(): Promise<void> {
    // This would be implemented based on your auth system
    // For now, we'll just throw an error
    throw new Error('Token refresh not implemented');
  }

  private clearAuth(): void {
    // Clear any stored auth tokens
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Convenience methods for common HTTP methods
  async get<T = unknown>(
    endpoint: string,
    options: Omit<RequestOptions, 'method' | 'body'> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = unknown, U = unknown>(
    endpoint: string,
    body: U,
    options: Omit<RequestOptions<U>, 'method' | 'body'> = {}
  ): Promise<T> {
    return this.request<T, U>(endpoint, { ...options, method: 'POST', body });
  }

  async put<T = unknown, U = unknown>(
    endpoint: string,
    body: U,
    options: Omit<RequestOptions<U>, 'method' | 'body'> = {}
  ): Promise<T> {
    return this.request<T, U>(endpoint, { ...options, method: 'PUT', body });
  }

  async patch<T = unknown, U = unknown>(
    endpoint: string,
    body: U,
    options: Omit<RequestOptions<U>, 'method' | 'body'> = {}
  ): Promise<T> {
    return this.request<T, U>(endpoint, { ...options, method: 'PATCH', body });
  }

  async delete<T = unknown>(
    endpoint: string,
    options: Omit<RequestOptions, 'method' | 'body'> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
