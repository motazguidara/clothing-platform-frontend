import { z } from 'zod';

// Base schemas
export const ErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  code: z.string().optional(),
  details: z.record(z.unknown()).optional(),
});

export const ValidationErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  code: z.string().optional(),
  field_errors: z.record(z.array(z.string())).optional(),
  non_field_errors: z.array(z.string()).optional(),
});

export const EmptyResponseSchema = z.object({});
export const MessageResponseSchema = z.object({ message: z.string() });

// Pagination schema
export const PaginationSchema = z.object({
  count: z.number(),
  next: z.string().url().nullable(),
  previous: z.string().url().nullable(),
});

// Product schemas
export const ProductImageSchema = z.object({
  id: z.number(),
  image: z.string().url(),
  alt_text: z.string().optional(),
  is_primary: z.boolean(),
});

export const CategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  image: z.string().url().nullable(),
  parent: z.number().nullable(),
  is_active: z.boolean(),
});

export const BrandSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  logo: z.string().url().nullable(),
  website: z.string().url().nullable(),
  is_active: z.boolean(),
});

export const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  price: z.number(),
  sale_price: z.number().nullable(),
  sku: z.string(),
  stock_quantity: z.number(),
  is_featured: z.boolean(),
  is_active: z.boolean(),
  gender: z.enum(['men', 'women', 'kids', 'unisex']),
  category: CategorySchema,
  brand: BrandSchema,
  images: z.array(ProductImageSchema),
  sizes: z.array(z.string()),
  colors: z.array(z.string()),
  tags: z.array(z.string()),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const PaginatedProductListSchema = PaginationSchema.extend({
  results: z.array(ProductSchema),
});

// Wishlist schemas
export const WishlistItemSchema = z.object({
  id: z.number(),
  product: ProductSchema,
  added_at: z.string().datetime(),
});

export const WishlistIdsSchema = z.object({
  ids: z.array(z.number()),
});

// Auth schemas
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  is_active: z.boolean(),
  is_verified: z.boolean(),
  date_joined: z.string().datetime(),
  last_login: z.string().datetime().nullable(),
});

export const NotificationPreferencesSchema = z.object({
  email_marketing: z.boolean().default(false),
  email_orders: z.boolean().default(true),
  email_security: z.boolean().default(true),
  push_notifications: z.boolean().default(true),
});

export const UserPreferencesSchema = z.object({
  language: z.string().default('en'),
  currency: z.string().default('USD'),
  timezone: z.string().default('UTC'),
  notifications: NotificationPreferencesSchema,
});

export const UserProfileSchema = UserSchema.extend({
  phone: z.string().nullable(),
  date_of_birth: z.string().date().nullable(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).nullable(),
  avatar: z.string().url().nullable(),
  marketing_consent: z.boolean(),
  preferences: UserPreferencesSchema,
});

export const AuthResponseSchema = z.object({
  access: z.string(),
  refresh: z.string(),
  user: UserSchema,
});

export const TokenRefreshResponseSchema = z.object({
  access: z.string(),
  refresh: z.string().optional(),
});

// Address schemas
export const AddressSchema = z.object({
  id: z.number(),
  type: z.enum(['billing', 'shipping', 'both']),
  first_name: z.string(),
  last_name: z.string(),
  company: z.string().nullable(),
  address_line_1: z.string(),
  address_line_2: z.string().nullable(),
  city: z.string(),
  state: z.string(),
  postal_code: z.string(),
  country: z.string(),
  phone: z.string().nullable(),
  is_default: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Cart schemas
export const CartProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  price: z.number(),
  sale_price: z.number().nullable(),
  image: z.string().url().nullable(),
  stock_quantity: z.number(),
  is_active: z.boolean(),
});

export const CartItemSchema = z.object({
  id: z.number(),
  product: CartProductSchema,
  quantity: z.number().min(1),
  size: z.string().nullable(),
  color: z.string().nullable(),
  unit_price: z.number(),
  total_price: z.number(),
  added_at: z.string().datetime(),
});

export const CartSchema = z.object({
  id: z.string(),
  items: z.array(CartItemSchema),
  total_items: z.number(),
  subtotal: z.number(),
  tax_amount: z.number(),
  shipping_amount: z.number(),
  total_amount: z.number(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Order schemas
export const OrderAddressSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  company: z.string().nullable(),
  address_line_1: z.string(),
  address_line_2: z.string().nullable(),
  city: z.string(),
  state: z.string(),
  postal_code: z.string(),
  country: z.string(),
  phone: z.string().nullable(),
});

export const OrderItemSchema = z.object({
  id: z.number(),
  product: CartProductSchema,
  quantity: z.number(),
  size: z.string().nullable(),
  color: z.string().nullable(),
  unit_price: z.number(),
  total_price: z.number(),
});

export const OrderSchema = z.object({
  id: z.string().uuid(),
  order_number: z.string(),
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
  items: z.array(OrderItemSchema),
  shipping_address: OrderAddressSchema,
  billing_address: OrderAddressSchema,
  payment_method: z.string(),
  payment_status: z.enum(['pending', 'processing', 'completed', 'failed', 'refunded']),
  subtotal: z.number(),
  tax_amount: z.number(),
  shipping_amount: z.number(),
  discount_amount: z.number(),
  total_amount: z.number(),
  coupon_code: z.string().nullable(),
  notes: z.string().nullable(),
  tracking_number: z.string().nullable(),
  estimated_delivery: z.string().date().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const PaginatedOrderListSchema = PaginationSchema.extend({
  results: z.array(OrderSchema),
});

// Request schemas
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  password_confirm: z.string().min(8),
  first_name: z.string().min(1).max(30),
  last_name: z.string().min(1).max(30),
  phone: z.string().nullable().optional(),
  date_of_birth: z.string().date().nullable().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).nullable().optional(),
  marketing_consent: z.boolean().default(false),
}).refine((data) => data.password === data.password_confirm, {
  message: "Passwords don't match",
  path: ["password_confirm"],
});

export const AddToCartRequestSchema = z.object({
  product_id: z.number(),
  quantity: z.number().min(1).default(1),
  size: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
});

export const UpdateCartItemRequestSchema = z.object({
  quantity: z.number().min(1).optional(),
  size: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
});

export const CheckoutRequestSchema = z.object({
  shipping_address_id: z.number(),
  billing_address_id: z.number().nullable().optional(),
  payment_method: z.enum(['credit_card', 'debit_card', 'paypal', 'stripe', 'bank_transfer']),
  payment_details: z.record(z.unknown()),
  coupon_code: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// Export types
export type Error = z.infer<typeof ErrorSchema>;
export type ValidationError = z.infer<typeof ValidationErrorSchema>;
export type EmptyResponse = z.infer<typeof EmptyResponseSchema>;
export type MessageResponse = z.infer<typeof MessageResponseSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type PaginatedProductList = z.infer<typeof PaginatedProductListSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Brand = z.infer<typeof BrandSchema>;
export type WishlistItem = z.infer<typeof WishlistItemSchema>;
export type WishlistIds = z.infer<typeof WishlistIdsSchema>;
export type User = z.infer<typeof UserSchema>;
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type TokenRefreshResponse = z.infer<typeof TokenRefreshResponseSchema>;
export type Address = z.infer<typeof AddressSchema>;
export type Cart = z.infer<typeof CartSchema>;
export type CartItem = z.infer<typeof CartItemSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type PaginatedOrderList = z.infer<typeof PaginatedOrderListSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type AddToCartRequest = z.infer<typeof AddToCartRequestSchema>;
export type UpdateCartItemRequest = z.infer<typeof UpdateCartItemRequestSchema>;
export type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>;
