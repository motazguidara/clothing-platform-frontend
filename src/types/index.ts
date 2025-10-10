// Core type definitions for the e-commerce platform

export interface Product {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  price: number;
  compare_at_price?: number;
  base_price?: number | null;
  sale_price?: number | null;
  is_on_sale?: boolean;
  is_featured?: boolean;
  in_stock: boolean;
  stock_quantity?: number;
  sku?: string;
  brand?: string;
  category: string;
  category_id?: number;
  gender?: string;
  short_description?: string;
  images?: string[];
  image?: string;
  available_colors?: string[];
  available_sizes?: string[];
  rating?: number;
  avg_rating?: number;
  review_count?: number;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  material?: string;
  care_instructions?: string;
  tags?: string[];
  seo_title?: string;
  seo_description?: string;
  variants?: Array<{
    id: number;
    sku: string;
    size?: string;
    color?: string;
    price_adjustment: number;
    is_active: boolean;
    inventory?: {
      quantity: number;
      status: string;
      is_in_stock: boolean;
      is_low_stock: boolean;
    };
  }>;
  reviews?: Array<{
    id: number;
    rating: number;
    title: string;
    comment: string;
    user_name: string;
    created_at: string;
  }>;
  created_at?: string;
  updated_at?: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  name: string;
  sku: string;
  price?: number;
  compare_at_price?: number;
  stock_quantity: number;
  size?: string;
  color?: string;
  material?: string;
  weight?: number;
  image?: string;
  is_active: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string | null;
  description?: string;
  parent_id?: number;
  image?: string;
  is_active: boolean;
  sort_order?: number;
  product_count?: number;
  children?: Category[];
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  is_active: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'editor' | 'customer' | 'guest';
  is_active: boolean;
  is_email_confirmed: boolean;
  is_locked: boolean;
  phone?: string;
  preferred_language?: string;
  preferred_country?: string;
  profile_image?: string;
  date_of_birth?: string;
  gender?: string;
  company?: string;
  job_title?: string;
  locale: string;
  timezone: string;
  marketing_consent: boolean;
  tracking_consent: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  mfa_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: number;
  type: 'billing' | 'shipping' | 'both';
  is_default: boolean;
  first_name: string;
  last_name: string;
  company?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: number;
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  item_count: number;
  currency: string;
}

export interface Order {
  id: string;
  user?: User;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping_cost: number;
  discount: number;
  total: number;
  currency: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  shipping_address: Address;
  billing_address: Address;
  tracking_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Review {
  id: number;
  product_id: number;
  user: User;
  rating: number;
  title: string;
  content: string;
  recommend: boolean;
  verified: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface SearchFilters {
  category?: string;
  brand?: string;
  min_price?: number;
  max_price?: number;
  size?: string;
  color?: string;
  rating?: number;
  in_stock?: boolean;
  on_sale?: boolean;
}

export interface SearchParams extends SearchFilters {
  q?: string;
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'rating' | 'popularity';
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  meta?: {
    pagination?: PaginationMeta;
  };
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

// Global window interface extensions
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: any
    ) => void;
  }
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T = any> {
  data: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isValid: boolean;
}

// UI State types
export interface UIState {
  isCartOpen: boolean;
  isSearchOpen: boolean;
  isMobileMenuOpen: boolean;
  isWishlistOpen: boolean;
  theme: 'light' | 'dark' | 'system';
}

// Filter state types
export interface FilterState {
  category: string[];
  brand: string[];
  priceRange: [number, number];
  size: string[];
  color: string[];
  rating: number;
  inStock: boolean;
  onSale: boolean;
}

export type SortOption = 
  | 'relevance'
  | 'price_asc' 
  | 'price_desc' 
  | 'newest' 
  | 'rating' 
  | 'popularity';

export type ProductList = {
  results: Product[];
  count: number;
  heroImages?: string[];
  heroTitle?: string;
  heroSubtitle?: string;
  heroCta?: {
    label: string;
    href: string;
  } | null;
};
