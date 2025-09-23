// Security utilities and validation

import { z } from 'zod';

// Input sanitization
export class SecurityManager {
  // XSS prevention
  static sanitizeHtml(input: string): string {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  // SQL injection prevention for search queries
  static sanitizeSearchQuery(query: string): string {
    return query
      .replace(/['"\\;]/g, '') // Remove dangerous characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 100); // Limit length
  }

  // CSRF token validation
  static generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  static validateCSRFToken(token: string, expectedToken: string): boolean {
    if (!token || !expectedToken || token.length !== expectedToken.length) {
      return false;
    }
    
    // Constant-time comparison to prevent timing attacks
    let result = 0;
    for (let i = 0; i < token.length; i++) {
      result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i);
    }
    return result === 0;
  }

  // Rate limiting
  static createRateLimiter(maxRequests: number, windowMs: number) {
    const requests = new Map<string, number[]>();

    return (identifier: string): boolean => {
      const now = Date.now();
      const windowStart = now - windowMs;
      
      if (!requests.has(identifier)) {
        requests.set(identifier, []);
      }

      const userRequests = requests.get(identifier)!;
      
      // Remove old requests outside the window
      const validRequests = userRequests.filter(time => time > windowStart);
      
      if (validRequests.length >= maxRequests) {
        return false; // Rate limit exceeded
      }

      validRequests.push(now);
      requests.set(identifier, validRequests);
      return true;
    };
  }

  // Content Security Policy
  static getCSPHeader(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.stripe.com https://checkout.stripe.com",
      "frame-src 'self' https://checkout.stripe.com https://js.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; ');
  }

  // Secure cookie settings
  static getSecureCookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    };
  }

  // Password strength validation
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score += 1;
    else feedback.push('Password must be at least 8 characters long');

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Password must contain lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Password must contain uppercase letters');

    if (/\d/.test(password)) score += 1;
    else feedback.push('Password must contain numbers');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    else feedback.push('Password must contain special characters');

    // Check for common patterns
    if (/(.)\1{2,}/.test(password)) {
      score -= 1;
      feedback.push('Avoid repeating characters');
    }

    if (/123|abc|qwe/i.test(password)) {
      score -= 1;
      feedback.push('Avoid common sequences');
    }

    return {
      isValid: score >= 4,
      score: Math.max(0, Math.min(5, score)),
      feedback,
    };
  }
}

// Validation schemas using Zod
export const validationSchemas = {
  // User registration
  userRegistration: z.object({
    email: z.string().email('Invalid email address').max(255),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
    terms: z.boolean().refine(val => val === true, 'You must accept the terms'),
    marketingConsent: z.boolean().optional(),
  }),

  // User login
  userLogin: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional(),
    mfaCode: z.string().optional(),
  }),

  // Product creation/update
  product: z.object({
    name: z.string().min(1, 'Product name is required').max(255),
    description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
    price: z.number().positive('Price must be positive').max(999999.99),
    compareAtPrice: z.number().positive().optional(),
    sku: z.string().min(1, 'SKU is required').max(100),
    category: z.string().min(1, 'Category is required'),
    brand: z.string().max(100).optional(),
    tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed'),
    images: z.array(z.string().url()).min(1, 'At least one image is required').max(10),
    variants: z.array(z.object({
      size: z.string().optional(),
      color: z.string().optional(),
      material: z.string().optional(),
      stock: z.number().int().min(0),
      price: z.number().positive().optional(),
    })).optional(),
    seoTitle: z.string().max(60).optional(),
    seoDescription: z.string().max(160).optional(),
    isActive: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
  }),

  // Address
  address: z.object({
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
    company: z.string().max(100).optional(),
    addressLine1: z.string().min(1, 'Address is required').max(255),
    addressLine2: z.string().max(255).optional(),
    city: z.string().min(1, 'City is required').max(100),
    stateProvince: z.string().min(1, 'State/Province is required').max(100),
    postalCode: z.string().min(1, 'Postal code is required').max(20),
    country: z.string().length(2, 'Country must be 2-letter code'),
    phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number').optional(),
    isDefault: z.boolean().default(false),
    type: z.enum(['billing', 'shipping', 'both']).default('both'),
  }),

  // Order
  order: z.object({
    items: z.array(z.object({
      productId: z.number().int().positive(),
      variantId: z.number().int().positive().optional(),
      quantity: z.number().int().positive().max(99),
      price: z.number().positive(),
    })).min(1, 'Order must contain at least one item'),
    shippingAddress: z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      addressLine1: z.string().min(1),
      city: z.string().min(1),
      stateProvince: z.string().min(1),
      postalCode: z.string().min(1),
      country: z.string().length(2),
    }),
    billingAddress: z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      addressLine1: z.string().min(1),
      city: z.string().min(1),
      stateProvince: z.string().min(1),
      postalCode: z.string().min(1),
      country: z.string().length(2),
    }),
    paymentMethod: z.enum(['credit_card', 'paypal', 'apple_pay', 'google_pay']),
    notes: z.string().max(500).optional(),
  }),

  // Search query
  searchQuery: z.object({
    q: z.string().max(100).optional(),
    category: z.string().max(50).optional(),
    brand: z.string().max(50).optional(),
    minPrice: z.number().positive().optional(),
    maxPrice: z.number().positive().optional(),
    size: z.string().max(20).optional(),
    color: z.string().max(30).optional(),
    sort: z.enum(['relevance', 'price_asc', 'price_desc', 'newest', 'rating']).default('relevance'),
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
  }),

  // Contact form
  contactForm: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    email: z.string().email('Invalid email address'),
    subject: z.string().min(1, 'Subject is required').max(200),
    message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
    category: z.enum(['general', 'support', 'returns', 'wholesale']).default('general'),
  }),

  // Newsletter subscription
  newsletter: z.object({
    email: z.string().email('Invalid email address'),
    preferences: z.array(z.enum(['new_arrivals', 'sales', 'style_tips', 'exclusive_offers'])).optional(),
  }),

  // Review
  review: z.object({
    productId: z.number().int().positive(),
    rating: z.number().int().min(1).max(5),
    title: z.string().min(1, 'Review title is required').max(100),
    content: z.string().min(10, 'Review must be at least 10 characters').max(1000),
    recommend: z.boolean(),
    verified: z.boolean().default(false),
  }),
};

// Form validation hook
export const useFormValidation = <T extends z.ZodSchema>(schema: T) => {
  const validate = (data: unknown): { success: boolean; data?: z.infer<T>; errors?: Record<string, string> } => {
    try {
      const result = schema.parse(data);
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });
        return { success: false, errors };
      }
      return { success: false, errors: { general: 'Validation failed' } };
    }
  };

  return { validate };
};

// Security headers middleware
export const securityHeaders = {
  'X-DNS-Prefetch-Control': 'off',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': SecurityManager.getCSPHeader(),
};

// API security utilities
export const apiSecurity = {
  // Validate API key
  validateApiKey: (apiKey: string): boolean => {
    const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
    return validApiKeys.includes(apiKey);
  },

  // Generate secure random token
  generateSecureToken: (length = 32): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Hash sensitive data
  hashData: async (data: string): Promise<string> => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  // Encrypt sensitive data
  encryptData: async (data: string, key: string): Promise<string> => {
    const encoder = new TextEncoder();
    const keyBuffer = await crypto.subtle.importKey(
      'raw',
      encoder.encode(key.padEnd(32, '0').slice(0, 32)),
      'AES-GCM',
      false,
      ['encrypt']
    );
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      keyBuffer,
      encoder.encode(data)
    );
    
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  },
};
