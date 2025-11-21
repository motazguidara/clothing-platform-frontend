// Client-safe environment utilities
'use client';

// Client-safe environment checks
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';

// Client-safe environment variables (NEXT_PUBLIC_ prefixed)
export const clientConfig = {
  apiUrl: process.env['NEXT_PUBLIC_API_URL'] || 'http://127.0.0.1:8000/api',
  siteUrl: process.env['NEXT_PUBLIC_SITE_URL'] || 'http://localhost:3000',
  gaId: process.env['NEXT_PUBLIC_GA_ID'],
  sentryDsn: process.env['NEXT_PUBLIC_SENTRY_DSN'],
  appEnv: process.env['NEXT_PUBLIC_APP_ENV'] || 'development',
  enableAnalytics: process.env['NEXT_PUBLIC_ENABLE_ANALYTICS'] === 'true',
  enableMonitoring: process.env['NEXT_PUBLIC_ENABLE_MONITORING'] === 'true',
  featureCookieJwt: process.env['NEXT_PUBLIC_FEATURE_COOKIE_JWT'] === 'true',
  supportPhone: process.env['NEXT_PUBLIC_SUPPORT_PHONE'] || '+1 (555) 010-9999',
} as const;

// Feature flags based on environment
export const features = {
  analytics: isProduction && clientConfig.enableAnalytics,
  monitoring: isProduction && clientConfig.enableMonitoring,
  debugging: isDevelopment,
  strictMode: !isDevelopment,
} as const;

// API configuration
export const apiConfig = {
  baseUrl: clientConfig.apiUrl,
  timeout: isDevelopment ? 30000 : 10000,
  retries: isProduction ? 3 : 1,
} as const;

// Cache configuration
export const cacheConfig = {
  defaultStaleTime: isDevelopment ? 0 : 5 * 60 * 1000, // 5 minutes in prod
  defaultCacheTime: isDevelopment ? 0 : 10 * 60 * 1000, // 10 minutes in prod
} as const;

// Monitoring configuration
export const monitoringConfig = {
  sampleRate: isProduction ? 0.1 : 1.0,
  enableTracing: isDevelopment,
} as const;
