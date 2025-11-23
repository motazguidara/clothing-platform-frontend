// src/lib/api/client.ts
'use client';

import { z } from 'zod';
import { clientConfig, isDevelopment } from '@/lib/client-env';
import { tokenStore } from '@/lib/auth/tokens';
import { ErrorReporter } from '@/lib/error-reporter';
import { TokenRefreshResponseSchema } from '@/lib/api/schemas';

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

type ErrorResponsePayload = Record<string, unknown> & {
  detail?: unknown;
  message?: unknown;
  code?: unknown;
};

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

    // Attach bearer token in header mode
    // Exclude only endpoints that must not send Authorization (login/register/refresh)
    if (typeof window !== 'undefined' && !clientConfig.featureCookieJwt) {
      const authExclusions = [
        '/accounts/auth/login/',
        '/accounts/auth/register/',
        '/accounts/auth/refresh/',
      ];
      const shouldExcludeAuth = authExclusions.some((p) => endpoint.startsWith(p));
      const token = tokenStore.getAccess();
      if (token && !shouldExcludeAuth) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    // Add CSRF token for non-GET requests in cookie mode only
    if (clientConfig.featureCookieJwt && method !== 'GET' && typeof window !== 'undefined') {
      const csrfToken = this.getCsrfToken();
      if (csrfToken) {
        requestHeaders['X-CSRFToken'] = csrfToken;
      }
    }

    // Include credentials for orders/cart-related endpoints to support session carts
    const needsCookies = endpoint.startsWith('/orders/');
    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      credentials: (clientConfig.featureCookieJwt || needsCookies) ? 'include' : 'same-origin',
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

        const handleCfg: { validateResponse: boolean; responseSchema?: z.ZodSchema<T> } = {
          validateResponse: config.validateResponse,
        };
        if (config.responseSchema) handleCfg.responseSchema = config.responseSchema as z.ZodSchema<T>;
        return await this.handleResponse(response, handleCfg);
      } catch (error) {
        lastError = error as Error;
        attempt++;

        // Don't retry on client errors (4xx) except 401 with refresh token
        if (error instanceof ApiError && typeof error.status === 'number' && error.status >= 400 && error.status < 500) {
          // Handle 401 Unauthorized - try to refresh token (single guarded retry)
          if (error.status === 401 && !isRetry) {
            // If we have no refresh path, fail fast to prevent auth hammering
            const hasRefresh = clientConfig.featureCookieJwt || Boolean(tokenStore.getRefresh());
            if (!hasRefresh) {
              this.clearAuth();
              throw new ApiError('Not authenticated', 401, 'SESSION_EXPIRED');
            }
            try {
              // Try to refresh the token
              await this.refreshToken();
              // Update Authorization header with refreshed token when using header mode
              if (!clientConfig.featureCookieJwt) {
                const headers = options.headers as Record<string, string> | undefined;
                const newAccessToken = tokenStore.getAccess();
                if (headers) {
                  if (newAccessToken) {
                    headers['Authorization'] = `Bearer ${newAccessToken}`;
                  } else {
                    delete headers['Authorization'];
                  }
                }
              }
              // Retry the original request with new token
              return this.executeWithRetry(url, options, config, true);
            } catch {
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
    throw lastError ?? new Error('Request failed after multiple attempts');
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
        credentials: clientConfig.featureCookieJwt ? 'include' : options.credentials,
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
    let errorData: ErrorResponsePayload = {};

    try {
      const text = await response.text();
      if (text) {
        const parsed = JSON.parse(text) as unknown;
        if (parsed && typeof parsed === 'object') {
          errorData = parsed as ErrorResponsePayload;
        }
      }
    } catch {
      errorData = {};
    }

    const detail = typeof errorData.detail === 'string' ? errorData.detail : undefined;
    const message = typeof errorData.message === 'string' ? errorData.message : undefined;
    const code = typeof errorData.code === 'string' ? errorData.code : undefined;

    const error = new ApiError(
      detail ?? message ?? response.statusText,
      response.status,
      code,
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

    return cookieValue ?? null;
  }

  private async refreshToken(): Promise<void> {
    const refreshEndpoint = new URL(`${this.config.baseURL}/accounts/auth/refresh/`);
    // Cookie mode: rely on httpOnly cookies; just call refresh to rotate/access cookie
    if (clientConfig.featureCookieJwt) {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const csrf = this.getCsrfToken();
      if (csrf) headers['X-CSRFToken'] = csrf;
      const resp = await this.fetchWithTimeout(
        refreshEndpoint.toString(),
        {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({}),
        },
        this.config.timeout
      );
      if (!resp.ok) {
        await this.handleErrorResponse(resp);
      }
      // No tokens to store in cookie mode
      return;
    }

    // Header mode: use in-memory refresh token
    const refresh = tokenStore.getRefresh();
    if (!refresh) throw new Error('No refresh token available');
    const resp = await this.fetchWithTimeout(
      refreshEndpoint.toString(),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ refresh }),
      },
      this.config.timeout
    );
    if (!resp.ok) {
      await this.handleErrorResponse(resp);
    }
    const text = await resp.text();
    const data = text ? JSON.parse(text) : {};
    const parsed = TokenRefreshResponseSchema.safeParse(data);
    if (!parsed.success) throw new Error('Invalid refresh response');
    tokenStore.setAccess(parsed.data.access);
    if (parsed.data.refresh) tokenStore.setRefresh(parsed.data.refresh);
  }

  private clearAuth(): void {
    // Clear any stored auth tokens
    tokenStore.clear();
    // Back-compat cleanup if any
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
