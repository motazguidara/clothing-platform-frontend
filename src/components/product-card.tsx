"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/providers/toast-provider";
import { useWishlist } from "@/lib/wishlist";
import type { Product, ProductVariant } from "@/types";
// Quick View removed
import { ProductImagePlaceholder } from "@/components/product-image-placeholder";

type ProductCardProduct = Product & {
  subtitle?: string;
  brand?: Product["brand"] | { name?: string | null };
  is_sustainable?: boolean;
};

interface Props {
  product: ProductCardProduct;
}

type VariantAttributeValue = string | null | undefined;

type VariantLike = ProductVariant & {
  attributes?: Record<string, VariantAttributeValue>;
  colour?: VariantAttributeValue;
  swatch?: VariantAttributeValue;
  hex?: VariantAttributeValue;
  hex_code?: VariantAttributeValue;
  color_name?: VariantAttributeValue;
  image_url?: VariantAttributeValue;
  thumbnail?: VariantAttributeValue;
  images?: Array<string | null | undefined>;
};

const pickFirstString = (values: Array<unknown>): string | undefined => {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return undefined;
};

const resolveVariantImage = (variant?: VariantLike): string | undefined => {
  if (!variant) {
    return undefined;
  }
  const primaryImage = pickFirstString([
    variant.image,
    variant.image_url,
    variant.thumbnail,
  ]);

  if (primaryImage) {
    return primaryImage;
  }

  if (Array.isArray(variant.images)) {
    const firstImage = variant.images.find(
      (image): image is string => typeof image === "string" && image.trim().length > 0
    );
    return firstImage;
  }

  return undefined;
};

const extractBrandName = (brand: ProductCardProduct["brand"]): string | undefined => {
  if (typeof brand === "string") {
    return brand;
  }
  if (
    brand &&
    typeof brand === "object" &&
    "name" in brand &&
    (typeof (brand as { name?: string }).name === "string")
  ) {
    return (brand as { name?: string }).name;
  }
  return undefined;
};
const sanitizeImageSource = (value: string | null | undefined): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export default function ProductCard({ product }: Props) {
  const displayTitle = product.name ?? "Product";
  const { hasItem, toggleItem } = useWishlist();
  const [mounted, setMounted] = React.useState(false);
  const isWished = mounted ? hasItem(product.id) : false;
  const { show } = useToast();
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [previewImage, setPreviewImage] = React.useState<string | null>(null);
  const [lockedPreview, setLockedPreview] = React.useState<string | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const rawVariants: VariantLike[] = React.useMemo(() => {
    if (Array.isArray(product.variants)) {
      return product.variants as unknown as VariantLike[];
    }
    return [];
  }, [product.variants]);
  const [selectedColor, setSelectedColor] = React.useState<string | undefined>();
  const [selectedSize, setSelectedSize] = React.useState<string | undefined>();

  // Helpers to normalize variant attributes
  const getColor = React.useCallback((variant: VariantLike): string | undefined => {
    const attributes = variant.attributes;
    return pickFirstString([
      variant.color,
      variant.colour,
      attributes?.["color"],
      attributes?.["Colour"],
      attributes?.["COLOR"],
      variant.swatch,
      variant.hex,
      variant.hex_code,
      variant.color_name,
    ]);
  }, []);
  const getSize = React.useCallback((variant: VariantLike): string | undefined => {
    const attributes = variant.attributes;
    return pickFirstString([variant.size, attributes?.["size"], attributes?.["Size"], attributes?.["SIZE"]]);
  }, []);

  const colorsSet = new Set<string>();
  for (const variant of rawVariants) {
    const color = getColor(variant);
    if (color) {
      colorsSet.add(color);
    }
  }
  // Also support products that expose colors separately
  if (Array.isArray(product.available_colors)) {
    for (const color of product.available_colors) {
      if (color != null) {
        colorsSet.add(String(color));
      }
    }
  }
  const colors = Array.from(colorsSet);
  const sizes = Array.from(
    new Set(
      rawVariants
        .map((variant) => getSize(variant))
        .filter((value): value is string => typeof value === "string" && value.length > 0)
    )
  );

  const normalizedSelectedColor = selectedColor?.toLowerCase() ?? null;
  const normalizedSelectedSize = selectedSize?.toLowerCase() ?? null;
  const filteredColors: string[] = normalizedSelectedSize
    ? Array.from(
        new Set(
          rawVariants
            .map((variant) => ({
              size: getSize(variant)?.toLowerCase(),
              color: getColor(variant),
            }))
            .filter(
              (entry): entry is { size: string; color: string } =>
                Boolean(entry.size) && entry.color != null && entry.color.length > 0
            )
            .filter((entry) => entry.size === normalizedSelectedSize)
            .map((entry) => entry.color)
        )
      )
    : colors;

  return (
    <article className="w-full p-2 select-none card-hover">
      <div
        className="relative h-80 rounded-md overflow-hidden group hover-shine"
        onMouseEnter={() => {
          setCurrentImageIndex(0);
        }}
        onMouseLeave={() => {
          setCurrentImageIndex(0);
          setPreviewImage(lockedPreview);
        }}
      >
        <Link href={`/products/${product.slug ?? product.id}`} className="absolute inset-0 block" aria-label={`View ${displayTitle}`} />
        <motion.div initial={{ scale: 1 }} whileHover={{ scale: 1.03 }} transition={{ duration: 0.2, ease: "easeOut" }} className="absolute inset-0 pointer-events-none">
          {(() => {
            const fallback = sanitizeImageSource(product.images?.[currentImageIndex]);
            const src = sanitizeImageSource(previewImage) ?? sanitizeImageSource(lockedPreview) ?? fallback;
            return src ? (
              <Image
                src={src}
                alt={displayTitle}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover img-zoom"
              />
            ) : (
              <ProductImagePlaceholder
                className="flex h-full w-full items-center justify-center text-muted bg-subtle"
                productName={displayTitle}
              />
            );
          })()}
        </motion.div>
        {/* Badges: Out of stock, Sale % */}
        {(() => {
          const inStock = Boolean(product.in_stock);
          const basePrice = typeof product.base_price === "number" ? product.base_price : product.price;
          const salePrice = typeof product.sale_price === "number" ? product.sale_price : product.price;
          const onSale = (Boolean(product.is_on_sale) && salePrice < basePrice) || (basePrice > 0 && salePrice < basePrice);
          const discountPct = onSale && basePrice > 0 ? Math.round(((basePrice - salePrice) / basePrice) * 100) : 0;
          return (
            <div className="absolute left-2 top-2 flex flex-col gap-2 z-10">
              {!inStock && (
                <span className="inline-flex items-center rounded bg-gray-900 text-white text-[10px] font-bold px-2 py-1 uppercase">Out of stock</span>
              )}
              {onSale && discountPct > 0 && (
                <span className="inline-flex items-center rounded bg-red-600 text-white text-[10px] font-bold px-2 py-1">-{discountPct}%</span>
              )}
            </div>
          );
        })()}
        <button
          aria-label={isWished ? "Remove from wishlist" : "Add to wishlist"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          toggleItem(product.id)
            .then(() => {
              const nowWished = !isWished;
              show({ title: nowWished ? "Added to wishlist" : "Removed from wishlist", variant: nowWished ? "success" : "default" });
            })
            .catch((error: unknown) => {
              const message = error instanceof Error ? error.message : "Wishlist update failed";
              show({ title: message, variant: "error" });
            });
        }}
          className={`absolute top-2 right-2 rounded-full px-2 py-1 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black ${isWished ? "bg-foreground text-white" : "bg-white/90"}`}
        >
          {isWished ? "♥" : "♡"}
        </button>
      </div>

      {/* Color variant swatches below image (non-blocking) */}
      {filteredColors.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          {filteredColors.slice(0, 6).map((c: string) => (
            <button
              key={c}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const normalizedColor = c.toLowerCase();
                setSelectedColor(c);
                setCurrentImageIndex(0);
                const match = rawVariants.find((variant) => getColor(variant)?.toLowerCase() === normalizedColor);
                const candidate = sanitizeImageSource(resolveVariantImage(match) ?? undefined);
                setLockedPreview(candidate ?? null);
                setPreviewImage(candidate ?? null);
              }}
              onMouseEnter={() => {
                // Try to preview variant image for this color
                const normalizedColor = c.toLowerCase();
                const match = rawVariants.find((variant) => getColor(variant)?.toLowerCase() === normalizedColor);
                const candidate = sanitizeImageSource(resolveVariantImage(match) ?? undefined);
                if (candidate) {
                  setPreviewImage(candidate);
                }
              }}
              onMouseLeave={() => {
                // Revert to locked preview if set; otherwise clear
                setPreviewImage(lockedPreview);
              }}
              aria-label={`Select color ${c}`}
              title={c}
              className={`w-5 h-5 rounded-full border ${selectedColor === c ? 'ring-2 ring-black' : ''}`}
              style={{ backgroundColor: c.toLowerCase() }}
            />
          ))}
          {filteredColors.length > 6 && (
            <span className="text-xs text-gray-500">+{filteredColors.length - 6}</span>
          )}
        </div>
      )}

      {/* Size variant selection (optional, shown if available) */}
      {(() => {
        const sizesToShow =
          normalizedSelectedColor !== null
            ? Array.from(
                new Set(
                  rawVariants
                    .filter((variant) => getColor(variant)?.toLowerCase() === normalizedSelectedColor)
                    .map((variant) => getSize(variant))
                    .filter((value): value is string => typeof value === "string" && value.length > 0)
                )
              )
            : sizes;

        if (sizesToShow.length === 0) {
          return null;
        }

        return (
          <div className="mt-2 flex flex-wrap gap-2">
            {sizesToShow.slice(0, 8).map((size) => (
              <button
                key={size}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setSelectedSize(size);
                }}
                className={`px-2 py-1 border rounded text-[11px] ${
                  selectedSize === size ? "bg-black text-white border-black" : "hover:bg-gray-100"
                }`}
                aria-label={`Select size ${size}`}
                title={size}
              >
                {size}
              </button>
            ))}
            {sizesToShow.length > 8 && (
              <span className="text-xs text-gray-500">+{sizesToShow.length - 8}</span>
            )}
          </div>
        );
      })()}

      {/* Sustainability or badges */}
      {(() => {
        const sustainabilityFlag =
          (typeof product.is_sustainable === "boolean" ? product.is_sustainable : false) ||
          (Array.isArray(product.tags) && product.tags.includes("sustainable"));
        return sustainabilityFlag ? (
          <p className="mt-3 text-xs font-semibold text-emerald-700">Sustainable Materials</p>
        ) : null;
      })()}

      {/* Brand and name */}
      {(() => {
        const brandText = extractBrandName(product.brand);
        return brandText ? (
          <p className="mt-1 text-xs text-gray-500 uppercase tracking-wide">{brandText}</p>
        ) : null;
      })()}
      <h3 className="mt-1 text-sm font-semibold tracking-tight uppercase line-clamp-1">{displayTitle}</h3>
      {typeof product.subtitle === "string" && product.subtitle.length > 0 && (
        <p className="text-sm text-gray-600">{product.subtitle}</p>
      )}

      {/* Colours count */}
      {Array.isArray(product.available_colors) && product.available_colors.length > 0 && (
        <p className="text-xs text-gray-500 mt-1">
          {product.available_colors.length} {product.available_colors.length === 1 ? "Colour" : "Colours"}
        </p>
      )}

      <div className="mt-2 text-sm flex items-center gap-2">
        {(() => {
          const saleDisplay = typeof product.sale_price === "number" ? product.sale_price : product.price;
          const basePrice = typeof product.base_price === "number" ? product.base_price : undefined;
          const onSale = Boolean(product.is_on_sale) && basePrice != null && basePrice > saleDisplay;
          return (
            <>
              <span className="font-semibold">{formatPrice(saleDisplay)}</span>
              {onSale && (
                <>
                  <span className="line-through text-muted">{formatPrice(basePrice ?? saleDisplay)}</span>
                  {(() => {
                    const pct = basePrice
                      ? Math.round(((basePrice - saleDisplay) / basePrice) * 100)
                      : 0;
                    return (
                      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold bg-red-600 text-white">-{pct}%</span>
                    );
                  })()}
                </>
              )}
            </>
          );
        })()}
      </div>
    </article>
  );
}
