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
  promotion?: string | null;
  bestseller_score?: number | null;
  tags?: string[] | null;
  is_bestseller?: boolean | null;
  promotion_price?: number | null;
  promotion_savings?: number | null;
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

  const directSources: Array<unknown> = [variant.image, variant.image_url, variant.thumbnail];
  for (const source of directSources) {
    const candidate = extractImageUrl(source);
    if (candidate) {
      return candidate;
    }
  }

  if (Array.isArray(variant.images)) {
    for (const entry of variant.images as Array<unknown>) {
      const candidate = extractImageUrl(entry);
      if (candidate) {
        return candidate;
      }
    }
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

const extractImageUrl = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    return sanitizeImageSource(value);
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const possibleKeys = ["image", "url", "src", "thumbnail", "original", "large", "medium", "small"];
    for (const key of possibleKeys) {
      const candidate = record[key];
      if (typeof candidate === "string") {
        const sanitized = sanitizeImageSource(candidate);
        if (sanitized) {
          return sanitized;
        }
      }
    }
  }
  return undefined;
};

const sanitizeHexColor = (value: VariantAttributeValue): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) {
    return trimmed;
  }
  if (/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) {
    return `#${trimmed}`;
  }
  return undefined;
};

export default function ProductCard({ product }: Props) {
  const displayTitle = product.name ?? "Product";
  const { hasItem, toggleItem } = useWishlist();
  const [mounted, setMounted] = React.useState(false);
  const isWished = mounted ? hasItem(product.id) : false;
  const { toast } = useToast();
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
  const [selectedColorKey, setSelectedColorKey] = React.useState<string | null>(null);
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

  const getColorHex = React.useCallback((variant: VariantLike): string | undefined => {
    const attributes = variant.attributes ?? {};
    return sanitizeHexColor(
      pickFirstString([
        variant.hex,
        variant.hex_code,
        attributes?.["hex"],
        attributes?.["HEX"],
        attributes?.["colour_hex"],
        attributes?.["color_hex"],
        attributes?.["swatch"],
        variant.swatch,
      ])
    );
  }, []);

  const colorSwatches = React.useMemo(() => {
    const map = new Map<string, { key: string; label: string; preview?: string; swatchColor?: string }>();

    for (const variant of rawVariants) {
      const label = getColor(variant);
      if (!label) continue;
      const key = label.trim().toLowerCase();
      if (!key || map.has(key)) continue;
      const preview = sanitizeImageSource(resolveVariantImage(variant));
      const swatchColor = getColorHex(variant);
      map.set(key, {
        key,
        label,
        ...(preview ? { preview } : {}),
        ...(swatchColor ? { swatchColor } : {}),
      });
    }

    if (Array.isArray(product.available_colors)) {
      for (const color of product.available_colors) {
        if (color == null) continue;
        const label = String(color);
        const key = label.trim().toLowerCase();
        if (!key || map.has(key)) continue;
        map.set(key, { key, label });
      }
    }

    return Array.from(map.values());
  }, [rawVariants, product.available_colors, getColor, getColorHex]);

  const sizes = React.useMemo(
    () =>
      Array.from(
        new Set(
          rawVariants
            .map((variant) => getSize(variant))
            .filter((value): value is string => typeof value === "string" && value.length > 0)
        )
      ),
    [rawVariants, getSize]
  );

  const normalizedSelectedColor = selectedColorKey;
  const normalizedSelectedSize = selectedSize?.toLowerCase() ?? null;

  const colorsForSize = React.useMemo(() => {
    if (!normalizedSelectedSize) return null;
    const allowed = new Set<string>();
    for (const variant of rawVariants) {
      const size = getSize(variant)?.toLowerCase();
      if (size && size === normalizedSelectedSize) {
        const color = getColor(variant)?.trim().toLowerCase();
        if (color) {
          allowed.add(color);
        }
      }
    }
    return allowed;
  }, [normalizedSelectedSize, rawVariants, getColor, getSize]);

  const filteredSwatches = React.useMemo(() => {
    if (!colorsForSize) {
      return colorSwatches;
    }
    return colorSwatches.filter((swatch) => colorsForSize.has(swatch.key));
  }, [colorSwatches, colorsForSize]);

  const swatchesToDisplay = filteredSwatches.slice(0, 6);
  const hiddenSwatchCount = Math.max(0, filteredSwatches.length - swatchesToDisplay.length);

  const badges = React.useMemo(() => {
    const list: Array<{ label: string; tone: "sale" | "neutral" | "warn" | "info" }> = [];
    const variantQuantities = rawVariants
      .map((v) => (v.inventory && typeof v.inventory.quantity === "number" ? v.inventory.quantity : null))
      .filter((n): n is number => typeof n === "number");
    const anyVariantInStock =
      rawVariants.some(
        (v) =>
          (v.inventory && v.inventory.is_in_stock) ||
          (v.inventory && typeof v.inventory.quantity === "number" && v.inventory.quantity > 0)
      ) || variantQuantities.some((qty) => qty > 0);

    let inStock = true;
    if (typeof product.stock_quantity === "number") {
      inStock = product.stock_quantity > 0;
    } else if (rawVariants.length > 0) {
      inStock = anyVariantInStock || product.in_stock !== false;
    } else if (product.in_stock === false) {
      inStock = false;
    }

    const lowStock =
      inStock &&
      ((typeof product.stock_quantity === "number" && product.stock_quantity > 0 && product.stock_quantity <= 3) ||
        (variantQuantities.length > 0 &&
          (() => {
            const minQty = Math.min(...variantQuantities);
            return minQty > 0 && minQty <= 3;
          })()));

    const basePrice =
      typeof product.base_price === "number"
        ? product.base_price
        : typeof product.compare_at_price === "number"
          ? product.compare_at_price
          : product.price;
    const salePrice = typeof product.sale_price === "number" ? product.sale_price : product.price;
    const onSale = Number(basePrice) > 0 && Number(salePrice) < Number(basePrice);
    if (onSale || product.is_on_sale) list.push({ label: "Sale", tone: "sale" });
    if (onSale) {
      const pct = Math.round(((Number(basePrice) - Number(salePrice)) / Number(basePrice)) * 100);
      if (pct > 0) list.push({ label: `${pct}% Off`, tone: "sale" });
    }
    if (!onSale && typeof product.compare_at_price === "number" && product.compare_at_price > (product.price || 0)) {
      const diff = product.compare_at_price - (product.price || 0);
      const pct = Math.round((diff / product.compare_at_price) * 100);
      if (pct > 0) list.push({ label: `${pct}% Off`, tone: "sale" });
    }
    if (product.promotion) {
      list.push({ label: product.promotion, tone: "sale" });
    }
    const tags = Array.isArray(product.tags) ? product.tags.map((t) => String(t).toLowerCase()) : [];
    const isBestsellerFlag = product.is_bestseller === true;
    const isBestsellerScore = typeof product.bestseller_score === "number" && product.bestseller_score > 0;
    const isBestsellerTag = tags.includes("bestseller");
    const isBestseller = isBestsellerFlag || isBestsellerScore || isBestsellerTag;
    if (isBestseller) list.push({ label: "Bestseller", tone: "info" });
    if (!inStock) list.push({ label: "Out of Stock", tone: "warn" });
    else if (lowStock) list.push({ label: "Low Stock", tone: "warn" });
    if (product.created_at) {
      try {
        const created = new Date(product.created_at);
        const days = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
        if (days <= 30) list.push({ label: "New In", tone: "neutral" });
      } catch {
        /* ignore */
      }
    }
    return list;
  }, [product]);

  React.useEffect(() => {
    if (selectedColorKey && !filteredSwatches.some((swatch) => swatch.key === selectedColorKey)) {
      setSelectedColorKey(null);
      setLockedPreview(null);
      setPreviewImage(null);
    }
  }, [filteredSwatches, selectedColorKey]);

  const normalizedImages = React.useMemo(() => {
    const collected: string[] = [];
    const primary = extractImageUrl(product.image);
    if (primary) {
      collected.push(primary);
    }
    if (Array.isArray(product.images)) {
      for (const entry of product.images as Array<unknown>) {
        const candidate = extractImageUrl(entry);
        if (candidate && !collected.includes(candidate)) {
          collected.push(candidate);
        }
      }
    }
    return collected;
  }, [product.image, product.images]);

  return (
    <article className="w-full p-2 select-none card-hover rounded">
      <div
        className="relative aspect-[3/4] rounded overflow-hidden group hover-shine bg-white"
        onMouseEnter={() => {
          setCurrentImageIndex(0);
        }}
        onMouseLeave={() => {
          setCurrentImageIndex(0);
          setPreviewImage(lockedPreview);
        }}
      >
        <Link href={`/products/${product.slug ?? product.id}`} className="absolute inset-0 block" aria-label={`View ${displayTitle}`} />
        <motion.div suppressHydrationWarning initial={{ scale: 1 }} whileHover={{ scale: 1.03 }} transition={{ duration: 0.2, ease: "easeOut" }} className="absolute inset-0 pointer-events-none">
          {(() => {
            const fallback = normalizedImages[currentImageIndex] ?? normalizedImages[0];
            const src = sanitizeImageSource(previewImage) ?? sanitizeImageSource(lockedPreview) ?? fallback;
            return src ? (
              <Image
                src={src}
                alt={displayTitle}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-contain p-2"
              />
            ) : (
              <ProductImagePlaceholder
                className="flex h-full w-full items-center justify-center text-muted bg-subtle"
                productName={displayTitle}
              />
            );
          })()}
        </motion.div>
        {/* Badges */}
        {badges.length > 0 && (
          <div className="absolute left-2 right-2 bottom-2 flex flex-wrap items-center gap-2 z-10">
            {badges.slice(0, 3).map((badge, idx) => {
              const toneClasses =
                badge.tone === "sale"
                  ? "bg-[#7a0f2f] text-white border-[#6a0d29]"
                  : "bg-black text-white border-black";
              return (
                <span
                  key={`${badge.label}-${idx}`}
                  className={`inline-flex items-center rounded border px-2 py-1 text-[11px] font-semibold ${toneClasses}`}
                >
                  {badge.label}
                </span>
              );
            })}
            {badges.length > 3 && (
              <span className="inline-flex items-center rounded border border-black bg-black text-white px-2 py-1 text-[11px] font-semibold">
                +{badges.length - 3}
              </span>
            )}
          </div>
        )}
        <button
          aria-label={isWished ? "Remove from wishlist" : "Add to wishlist"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          toggleItem(product.id)
            .then(() => {
              const nowWished = !isWished;
              toast({ title: nowWished ? "Added to wishlist" : "Removed from wishlist", variant: nowWished ? "success" : "default" });
            })
            .catch((error: unknown) => {
              const message = error instanceof Error ? error.message : "Wishlist update failed";
              toast({ title: message, variant: "destructive" });
            });
        }}
          className={`absolute top-2 right-2 rounded-full px-2 py-1 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black ${isWished ? "bg-foreground text-white" : "bg-white/90"}`}
        >
          {isWished ? "♥" : "♡"}
        </button>
      </div>

      {/* Color variant swatches below image (non-blocking) */}
      {swatchesToDisplay.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          {swatchesToDisplay.map((swatch) => {
            const isSelected = selectedColorKey === swatch.key;
            return (
              <button
                key={swatch.key}
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  const nextPreview = swatch.preview ?? null;
                  setSelectedColorKey(swatch.key);
                  setLockedPreview(nextPreview);
                  setPreviewImage(nextPreview);
                  setCurrentImageIndex(0);
                }}
                onMouseEnter={() => {
                  if (swatch.preview) {
                    setPreviewImage(swatch.preview);
                  }
                }}
                onFocus={() => {
                  if (swatch.preview) {
                    setPreviewImage(swatch.preview);
                  }
                }}
                onMouseLeave={() => {
                  setPreviewImage(lockedPreview);
                }}
                onBlur={() => {
                  setPreviewImage(lockedPreview);
                }}
                aria-label={`${displayTitle} in ${swatch.label}`}
                aria-pressed={isSelected}
                title={swatch.label}
                className={`w-5 h-5 rounded-full border transition-transform duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black hover:shadow-sm hover:scale-105 ${
                  isSelected ? "ring-2 ring-offset-1 ring-black border-black" : "border-gray-300 hover:border-gray-500"
                }`}
                style={{
                  backgroundColor:
                    swatch.swatchColor ??
                    (/\s/.test(swatch.label) ? undefined : swatch.label.toLowerCase()),
                }}
              />
            );
          })}
          {hiddenSwatchCount > 0 && (
            <span className="text-xs text-gray-500">+{hiddenSwatchCount}</span>
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
        const categoryText = typeof product.category === "string" && product.category.trim().length > 0 ? product.category : null;
        if (!brandText && !categoryText) return null;
        return (
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 uppercase tracking-wide">
            {brandText ? <span>{brandText}</span> : null}
            {categoryText ? <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-[2px] text-[10px] font-semibold text-gray-700">{categoryText}</span> : null}
          </div>
        );
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
          const promoPrice = typeof product.promotion_price === "number" ? product.promotion_price : null;
          const saleDisplay = typeof product.sale_price === "number" ? product.sale_price : product.price;
          const effectivePrice = promoPrice !== null && promoPrice > 0 ? Math.min(saleDisplay, promoPrice) : saleDisplay;
          const basePrice =
            typeof product.base_price === "number"
              ? product.base_price
              : typeof product.compare_at_price === "number"
                ? product.compare_at_price
                : product.price;
          const onSale = Number(basePrice) > 0 && Number(effectivePrice) < Number(basePrice);
          return (
            <>
              <span className="font-semibold">{formatPrice(effectivePrice)}</span>
              {onSale && (
                <>
                  <span className="line-through text-muted">{formatPrice(basePrice ?? effectivePrice)}</span>
                  {(() => {
                    const pct = basePrice ? Math.round(((Number(basePrice) - Number(effectivePrice)) / Number(basePrice)) * 100) : 0;
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
