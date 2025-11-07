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
  return value.filter(
    (entry): entry is string => typeof entry === "string" && entry.length > 0,
  );
};

const extractDimensions = (value: unknown): Product["dimensions"] => {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const record = value as Record<string, unknown>;
  const length = toNumberOrUndefined(record["length"]);
  const width = toNumberOrUndefined(record["width"]);
  const height = toNumberOrUndefined(record["height"]);
  if (length === undefined || width === undefined || height === undefined) {
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
      : (product.images?.find(
          (img) => typeof img.image === "string" && img.image.length > 0,
        )?.image ?? undefined);

  const images =
    product.images
      ?.map((img) => (typeof img.image === "string" ? img.image : undefined))
      ?.filter(
        (img): img is string => typeof img === "string" && img.length > 0,
      ) ?? [];

  const price =
    toNumberOrUndefined(product.current_price) ??
    toNumberOrUndefined(product.price) ??
    0;

  const variants =
    product.variants?.map((variant) => {
      const mappedVariant: {
        id: number;
        sku: string;
        price_adjustment: number;
        is_active: boolean;
        size?: string;
        color?: string;
        inventory?: {
          quantity: number;
          status: string;
          is_in_stock: boolean;
          is_low_stock: boolean;
        };
      } = {
        id: Number(variant.id),
        sku:
          typeof variant.sku === "string" && variant.sku.length > 0
            ? variant.sku
            : "",
        price_adjustment: toNumberOrUndefined(variant.price_adjustment) ?? 0,
        is_active: variant.is_active ?? true,
      };

      if (typeof variant.size === "string" && variant.size.length > 0) {
        mappedVariant.size = variant.size;
      }

      if (typeof variant.color === "string" && variant.color.length > 0) {
        mappedVariant.color = variant.color;
      }

      if (variant.inventory) {
        mappedVariant.inventory = {
          quantity: toNumberOrUndefined(variant.inventory.quantity) ?? 0,
          status: variant.inventory.status ?? "unknown",
          is_in_stock: variant.inventory.is_in_stock ?? false,
          is_low_stock: variant.inventory.is_low_stock ?? false,
        };
      }

      return mappedVariant;
    }) ?? [];

  const reviews =
    product.reviews?.map((review) => ({
      id: Number(review.id),
      rating: toNumberOrUndefined(review.rating) ?? 0,
      title: review.title ?? "",
      comment: review.comment ?? "",
      user_name: review.user_name ?? "",
      created_at: review.created_at ?? "",
    })) ?? [];

  const slug =
    typeof product.slug === "string" && product.slug.length > 0
      ? product.slug
      : undefined;
  const compareAtPrice = toNumberOrUndefined(product.compare_at_price);
  const salePrice = toNumberOrUndefined(product.sale_price);
  const basePrice = toNumberOrUndefined(product.base_price);
  const sku =
    typeof product.sku === "string" && product.sku.length > 0
      ? product.sku
      : undefined;
  const brandName =
    typeof product.brand === "string"
      ? product.brand
      : (product.brand?.name ?? undefined);
  const description = product.description ?? undefined;
  const material = product.material ?? undefined;
  const careInstructions = product.care_instructions ?? undefined;
  const seoTitle = product.seo_title ?? undefined;
  const seoDescription = product.seo_description ?? undefined;
  const createdAt = product.created_at ?? undefined;
  const updatedAt = product.updated_at ?? undefined;
  const gender = product.gender ?? undefined;
  const shortDescription = product.short_description ?? undefined;
  const avgRating = toNumberOrUndefined(product.avg_rating);
  const reviewCount = toNumberOrUndefined(product.review_count);
  const weight = toNumberOrUndefined(product.weight);
  const dimensions = extractDimensions(product.dimensions);
  const rating = toNumberOrUndefined(product.rating);

  const mappedProduct: Product = {
    id: Number(product.id ?? 0),
    name: product.name ?? "",
    price,
    category: product.category?.name ?? "",
    in_stock:
      product.in_stock ??
      variants.some((variant) => variant.inventory?.is_in_stock),
    is_on_sale: product.is_on_sale ?? false,
    is_featured: product.is_featured ?? false,
    available_sizes: sanitizeStringArray(product.available_sizes),
    available_colors: sanitizeStringArray(product.available_colors),
    tags: sanitizeStringArray(product.tags),
    ...(slug ? { slug } : {}),
    ...(compareAtPrice !== undefined
      ? { compare_at_price: compareAtPrice }
      : {}),
    ...(salePrice !== undefined ? { sale_price: salePrice } : {}),
    ...(basePrice !== undefined ? { base_price: basePrice } : {}),
    ...(sku ? { sku } : {}),
    ...(brandName ? { brand: brandName } : {}),
    ...(description ? { description } : {}),
    ...(material ? { material } : {}),
    ...(careInstructions ? { care_instructions: careInstructions } : {}),
    ...(seoTitle ? { seo_title: seoTitle } : {}),
    ...(seoDescription ? { seo_description: seoDescription } : {}),
    ...(createdAt ? { created_at: createdAt } : {}),
    ...(updatedAt ? { updated_at: updatedAt } : {}),
    ...(gender ? { gender } : {}),
    ...(shortDescription ? { short_description: shortDescription } : {}),
    ...(avgRating !== undefined ? { avg_rating: avgRating } : {}),
    ...(reviewCount !== undefined ? { review_count: reviewCount } : {}),
    ...(weight !== undefined ? { weight } : {}),
    ...(dimensions ? { dimensions } : {}),
    ...(rating !== undefined ? { rating } : {}),
  };

  if (images.length > 0) {
    mappedProduct.images = images;
  }
  if (primaryImage) {
    mappedProduct.image = primaryImage;
  }
  if (variants.length > 0) {
    mappedProduct.variants = variants;
  }
  if (reviews.length > 0) {
    mappedProduct.reviews = reviews;
  }

  return mappedProduct;
}
