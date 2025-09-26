// src/lib/api/contracts/index.ts
import { z } from 'zod';

// Base Schemas
export const BaseUserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  is_staff: z.boolean().optional().default(false),
  is_active: z.boolean().optional().default(true),
  date_joined: z.string().datetime().optional(),
  last_login: z.string().datetime().nullable().optional(),
});

export const BaseAuthResponseSchema = z.object({
  access: z.string(),
  refresh: z.string(),
  user: BaseUserSchema,
});

export const ErrorResponseSchema = z.object({
  status: z.number().optional(),
  code: z.string().optional(),
  message: z.string().optional(),
  details: z.record(z.any()).optional(),
});

// Request/Response Schemas
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  password_confirm: z.string().min(8),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  marketing_consent: z.boolean().default(false),
});

// Cart Schemas
export const CartItemSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  variant_id: z.number().optional(),
  quantity: z.number().positive(),
  price: z.string(),
  total_price: z.string(),
  product_name: z.string(),
  product_image: z.string().optional(),
  variant_name: z.string().optional(),
});

export const CartSchema = z.object({
  id: z.number(),
  items: z.array(CartItemSchema),
  total_items: z.number(),
  total_price: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Product Schemas
export const ProductVariantSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.string(),
  stock: z.number(),
  sku: z.string(),
  attributes: z.record(z.string()).optional(),
});

export const ProductImageSchema = z.object({
  id: z.number(),
  image: z.string(),
  alt: z.string(),
  is_primary: z.boolean(),
  order: z.number(),
});

export const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  price: z.string(),
  category: z.string(),
  brand: z.string(),
  images: z.array(ProductImageSchema),
  variants: z.array(ProductVariantSchema),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Catalog Schemas
export const CategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  image: z.string().optional(),
  parent: z.number().nullable().optional(),
  is_active: z.boolean(),
});

export const CatalogResponseSchema = z.object({
  products: z.array(ProductSchema),
  categories: z.array(CategorySchema),
  total: z.number(),
  page: z.number(),
  total_pages: z.number(),
});

// Search Schemas
export const SearchParamsSchema = z.object({
  q: z.string(),
  category: z.string().optional(),
  brand: z.string().optional(),
  min_price: z.number().optional(),
  max_price: z.number().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

export const SearchResponseSchema = z.object({
  products: z.array(ProductSchema),
  suggestions: z.array(z.string()),
  total: z.number(),
  page: z.number(),
  total_pages: z.number(),
  facets: z.object({
    categories: z.array(z.string()),
    brands: z.array(z.string()),
    price_ranges: z.array(z.object({
      min: z.number(),
      max: z.number(),
      count: z.number(),
    })),
  }).optional(),
});

// Wishlist Schemas
export const WishlistItemSchema = z.object({
  id: z.number(),
  product: ProductSchema,
  added_at: z.string(),
});

export const WishlistSchema = z.object({
  id: z.number(),
  items: z.array(WishlistItemSchema),
  total_items: z.number(),
});

// Export Types
export type User = z.infer<typeof BaseUserSchema>;
export type AuthResponse = z.infer<typeof BaseAuthResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type CartItem = z.infer<typeof CartItemSchema>;
export type Cart = z.infer<typeof CartSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type ProductVariant = z.infer<typeof ProductVariantSchema>;
export type ProductImage = z.infer<typeof ProductImageSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type CatalogResponse = z.infer<typeof CatalogResponseSchema>;
export type SearchParams = z.infer<typeof SearchParamsSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;
export type WishlistItem = z.infer<typeof WishlistItemSchema>;
export type Wishlist = z.infer<typeof WishlistSchema>;
