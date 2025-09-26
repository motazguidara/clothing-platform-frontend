import { z } from 'zod';

// Server-side environment schema
const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().optional(),
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  UPLOADTHING_SECRET: z.string().optional(),
  UPLOADTHING_APP_ID: z.string().optional(),
  GOOGLE_SITE_VERIFICATION: z.string().optional(),
  YANDEX_VERIFICATION: z.string().optional(),
  YAHOO_VERIFICATION: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  ANALYZE: z.enum(['true', 'false']).optional(),
});

// Client-side environment schema (NEXT_PUBLIC_ prefixed)
const clientSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default('http://127.0.0.1:8000/api'),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_APP_ENV: z.enum(['development', 'preview', 'production']).default('development'),
  NEXT_PUBLIC_ENABLE_ANALYTICS: z.enum(['true', 'false']).default('false'),
  NEXT_PUBLIC_ENABLE_MONITORING: z.enum(['true', 'false']).default('false'),
});

// Combined schema for server-side validation
const combinedSchema = serverSchema.merge(clientSchema);

// Type definitions
export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;
export type Env = z.infer<typeof combinedSchema>;

// Validation functions
function validateServerEnv(): ServerEnv {
  const parsed = serverSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error('❌ Invalid server environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid server environment variables');
  }
  
  return parsed.data;
}

function validateClientEnv(): ClientEnv {
  const clientEnv = Object.keys(clientSchema.shape).reduce((acc, key) => {
    acc[key] = process.env[key];
    return acc;
  }, {} as Record<string, string | undefined>);

  const parsed = clientSchema.safeParse(clientEnv);
  
  if (!parsed.success) {
    console.error('❌ Invalid client environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid client environment variables');
  }
  
  return parsed.data;
}

// Server-side environment (includes all variables)
export const env = (() => {
  if (typeof window !== 'undefined') {
    throw new Error('❌ Server env accessed on client side');
  }
  
  const parsed = combinedSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }
  
  return parsed.data;
})();

// Client-side environment (only NEXT_PUBLIC_ variables)
export const clientEnv = (() => {
  const clientEnv = Object.keys(clientSchema.shape).reduce((acc, key) => {
    acc[key] = process.env[key];
    return acc;
  }, {} as Record<string, string | undefined>);

  const parsed = clientSchema.safeParse(clientEnv);
  
  if (!parsed.success) {
    console.error('❌ Invalid client environment variables:', parsed.error.flatten().fieldErrors);
    // In client-side, we'll use defaults rather than throwing
    return clientSchema.parse({});
  }
  
  return parsed.data;
})();

// Runtime environment checks
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Feature flags based on environment
export const features = {
  analytics: isProduction && clientEnv.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  monitoring: isProduction && clientEnv.NEXT_PUBLIC_ENABLE_MONITORING === 'true',
  debugging: isDevelopment,
  strictMode: !isDevelopment,
} as const;

// Environment-specific configurations
export const config = {
  api: {
    baseUrl: clientEnv.NEXT_PUBLIC_API_URL,
    timeout: isDevelopment ? 30000 : 10000,
    retries: isProduction ? 3 : 1,
  },
  cache: {
    defaultStaleTime: isDevelopment ? 0 : 5 * 60 * 1000, // 5 minutes in prod
    defaultCacheTime: isDevelopment ? 0 : 10 * 60 * 1000, // 10 minutes in prod
  },
  monitoring: {
    sampleRate: isProduction ? 0.1 : 1.0,
    enableTracing: isDevelopment,
  },
} as const;

// Validation helper for runtime checks
export function assertClientSide(): asserts this is typeof globalThis & { window: Window } {
  if (typeof window === 'undefined') {
    throw new Error('This code must run on the client side');
  }
}

export function assertServerSide(): void {
  if (typeof window !== 'undefined') {
    throw new Error('This code must run on the server side');
  }
}

// Export schemas for external validation
export { serverSchema, clientSchema, combinedSchema };
