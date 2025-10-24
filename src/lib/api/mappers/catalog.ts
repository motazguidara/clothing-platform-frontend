import { z } from "zod";
import type { Product } from "@/types";

const toNumberOrUndefined = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const sanitizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
};

const extractDimensions = (value: unknown): Product["dimensions"] => {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const record = value as Record<string, unknown>;
  const length = toNumberOrUndefined(record.length);
  const width = toNumberOrUndefined(record.width);
  const height = toNumberOrUndefined(record.height);
  if (
    length === undefined ||
    width === undefined ||
    height === undefined
  ) {
    return undefined;
  }
  return { length, width, height };
};

const ApiInventorySchema = z
  .object({
    quantity: z.union([z.number(), z.string()]).optional().nullable(),
    status: z.string().optional().nullable(),
    is_in_stock: z.boolean().optional(),
    is_low_stock: z.boolean().optional(),
  })
  .partial();

const ApiVariantSchema = z
  .object({
    id: z.union([z.number(), z.string()]),
    sku: z.string().optional().nullable(),
    size: z.string().optional().nullable(),
    color: z.string().optional().nullable(),
    price_adjustment: z.union([z.number(), z.string()]).optional().nullable(),
    is_active: z.boolean().optional(),
    inventory: ApiInventorySchema.optional(),
  })
  .partial();

const ApiImageSchema = z
  .object({
    image: z.string().optional().nullable(),
  })
  .partial();

const ApiReviewSchema = z
  .object({
    id: z.union([z.number(), z.string()]),
    rating: z.union([z.number(), z.string()]).optional().nullable(),
    title: z.string().optional().nullable(),
    comment: z.string().optional().nullable(),
    user_name: z.string().optional().nullable(),
    created_at: z.string().optional().nullable(),
  })
  .partial();

const ApiProductCategorySchema = z
  .object({
    name: z.string().optional(),
  })
  .partial();

const ApiProductBrandSchema = z
  .object({
    name: z.string().optional(),
  })
  .partial();

const ApiProductSchema = z
  .object({
    id: z.union([z.number(), z.string()]),
    name: z.string().optional(),
    slug: z.string().optional().nullable(),
    sku: z.string().optional().nullable(),
    price: z.union([z.number(), z.string()]).optional().nullable(),
    current_price: z.union([z.number(), z.string()]).optional().nullable(),
    compare_at_price: z.union([z.number(), z.string()]).optional().nullable(),
    sale_price: z.union([z.number(), z.string()]).optional().nullable(),
    base_price: z.union([z.number(), z.string()]).optional().nullable(),
    is_on_sale: z.boolean().optional(),
    is_featured: z.boolean().optional(),
    in_stock: z.boolean().optional(),
    gender: z.string().optional().nullable(),
    short_description: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    material: z.string().optional().nullable(),
    care_instructions: z.string().optional().nullable(),
    avg_rating: z.union([z.number(), z.string()]).optional().nullable(),
    review_count: z.union([z.number(), z.string()]).optional().nullable(),
    tags: z.array(z.string()).optional(),
    available_sizes: z.array(z.string()).optional(),
    available_colors: z.array(z.string()).optional(),
    created_at: z.string().optional().nullable(),
    updated_at: z.string().optional().nullable(),
    seo_title: z.string().optional().nullable(),
    seo_description: z.string().optional().nullable(),
    weight: z.union([z.number(), z.string()]).optional().nullable(),
    dimensions: z.unknown().optional(),
    rating: z.union([z.number(), z.string()]).optional().nullable(),
    image: z.string().optional().nullable(),
    images: z.array(ApiImageSchema).optional(),
    variants: z.array(ApiVariantSchema).optional(),
    reviews: z.array(ApiReviewSchema).optional(),
    category: ApiProductCategorySchema.optional(),
    brand: ApiProductBrandSchema.optional(),
  })
  .partial();

type ApiProduct = z.infer<typeof ApiProductSchema>;

export function mapApiProductToProduct(rawProduct: unknown): Product {
  const parsed = ApiProductSchema.safeParse(rawProduct);

  const product: ApiProduct = parsed.success ? parsed.data : {};

  const primaryImage =
    typeof product.image === "string" && product.image.length > 0
      ? product.image
      : product.images?.find((img) => typeof img.image === "string" && img.image.length > 0)?.image ?? undefined;

  const images =
    product.images?.map((img) => (typeof img.image === "string" ? img.image : undefined)).filter(Boolean) ?? [];

  const price =
    toNumberOrUndefined(product.current_price) ??
    toNumberOrUndefined(product.price) ??
    0;

  const variants =
    product.variants?.map((variant) => ({
      id: Number(variant.id),
      sku: typeof variant.sku === "string" && variant.sku.length > 0 ? variant.sku : "",
      size: variant.size ?? undefined,
      color: variant.color ?? undefined,
      price_adjustment: toNumberOrUndefined(variant.price_adjustment) ?? 0,
      is_active: variant.is_active ?? true,
      inventory: variant.inventory
        ? {
            quantity: toNumberOrUndefined(variant.inventory.quantity) ?? 0,
            status: variant.inventory.status ?? "unknown",
            is_in_stock: variant.inventory.is_in_stock ?? false,
            is_low_stock: variant.inventory.is_low_stock ?? false,
          }
        : undefined,
    })) ?? [];

  const reviews =
    product.reviews?.map((review) => ({
      id: Number(review.id),
      rating: toNumberOrUndefined(review.rating) ?? 0,
      title: review.title ?? "",
      comment: review.comment ?? "",
      user_name: review.user_name ?? "",
      created_at: review.created_at ?? "",
    })) ?? [];

  return {
    id: Number(product.id ?? 0),
    name: product.name ?? "",
    slug: product.slug ?? undefined,
    price,
    compare_at_price: toNumberOrUndefined(product.compare_at_price),
    sale_price: toNumberOrUndefined(product.sale_price),
    base_price: toNumberOrUndefined(product.base_price),
    is_on_sale: product.is_on_sale ?? false,
    is_featured: product.is_featured ?? false,
    in_stock: product.in_stock ?? variants.some((variant) => variant.inventory?.is_in_stock),
    category: product.category?.name ?? "",
    sku: product.sku ?? undefined,
    brand:
      typeof product.brand === "string"
        ? product.brand
        : product.brand?.name ?? undefined,
    description: product.description ?? undefined,
    material: product.material ?? undefined,
    care_instructions: product.care_instructions ?? undefined,
    images,
    image: primaryImage,
    available_sizes: sanitizeStringArray(product.available_sizes),
    available_colors: sanitizeStringArray(product.available_colors),
    tags: sanitizeStringArray(product.tags),
    seo_title: product.seo_title ?? undefined,
    seo_description: product.seo_description ?? undefined,
    created_at: product.created_at ?? undefined,
    updated_at: product.updated_at ?? undefined,
    gender: product.gender ?? undefined,
    short_description: product.short_description ?? undefined,
    avg_rating: toNumberOrUndefined(product.avg_rating),
    review_count: toNumberOrUndefined(product.review_count),
    weight: toNumberOrUndefined(product.weight),
    dimensions: extractDimensions(product.dimensions),
    rating: toNumberOrUndefined(product.rating),
    variants: variants.length > 0 ? variants : undefined,
    reviews: reviews.length > 0 ? reviews : undefined,
  };
}
