"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/providers/toast-provider";
import { useWishlist } from "@/lib/wishlist";
import type { Product } from "@/types";
// Quick View removed
import { ProductImagePlaceholder } from "@/components/product-image-placeholder";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const displayTitle = product.name || "Product";
  const { hasItem, toggleItem } = useWishlist();
  const [mounted, setMounted] = React.useState(false);
  const isWished = mounted ? hasItem(product.id) : false;
  const { show } = useToast();
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [previewImage, setPreviewImage] = React.useState<string | null>(null);
  const [lockedPreview, setLockedPreview] = React.useState<string | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);
  const rawVariants = (product as any)?.variants || [];
  const [selectedColor, setSelectedColor] = React.useState<string | undefined>();
  const [selectedSize, setSelectedSize] = React.useState<string | undefined>();

  // Helpers to normalize variant attributes
  const getColor = React.useCallback((v: any): string | undefined => {
    const a = v?.attributes || {};
    return (
      v?.color || v?.colour || a?.color || a?.Colour || a?.COLOR || v?.swatch || v?.hex || v?.hex_code || v?.color_name
    )?.toString();
  }, []);
  const getSize = React.useCallback((v: any): string | undefined => {
    const a = v?.attributes || {};
    return (v?.size || a?.size || a?.Size || a?.SIZE)?.toString();
  }, []);

  const colorsSet = new Set<string>();
  for (const v of rawVariants) {
    const c = getColor(v);
    if (c) colorsSet.add(c);
  }
  // Also support products that expose colors separately
  const availableColors = (product as any)?.available_colors;
  if (Array.isArray(availableColors)) {
    for (const c of availableColors) {
      if (c != null) colorsSet.add(String(c));
    }
  }
  const colors = Array.from(colorsSet) as string[];
  const sizes = Array.from(new Set(rawVariants.map((v: any) => getSize(v)).filter(Boolean))) as string[];

  const filteredSizes = selectedColor
    ? Array.from(
        new Set(
          rawVariants
            .filter((v: any) => (getColor(v) || '').toLowerCase() === (selectedColor || '').toLowerCase())
            .map((v: any) => getSize(v))
            .filter(Boolean)
        )
      )
    : sizes;
  const filteredColors: string[] = selectedSize
    ? Array.from(
        new Set(
          rawVariants
            .filter((v: any) => (getSize(v) || '').toLowerCase() === (selectedSize || '').toLowerCase())
            .map((v: any) => getColor(v))
            .filter(Boolean)
        )
      ) as string[]
    : (colors as string[]);

  return (
    <article className="w-full p-2 select-none card-hover">
      <div 
        className="relative h-80 rounded-md overflow-hidden group hover-shine"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setCurrentImageIndex(0); if (lockedPreview) setPreviewImage(lockedPreview); }}
      >
        <Link href={`/products/${product.slug ?? product.id}`} className="absolute inset-0 block" aria-label={`View ${displayTitle}`} />
        <motion.div initial={{ scale: 1 }} whileHover={{ scale: 1.03 }} transition={{ duration: 0.2, ease: "easeOut" }} className="absolute inset-0 pointer-events-none">
          {(() => {
            const fallback = product?.images?.[currentImageIndex];
            const src = (previewImage || lockedPreview) || (fallback && fallback.length > 0 ? fallback : undefined);
            return src ? (
              <Image 
                src={src}
              alt={displayTitle} 
              fill 
              sizes="(max-width: 768px) 100vw, 33vw" 
              className="object-cover img-zoom" 
              onLoad={() => setImageLoaded(true)}
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
          const inStock = (product as any)?.in_stock !== false; // default true if missing
          const base = Number((product as any)?.base_price ?? (product as any)?.price ?? 0);
          const sale = Number((product as any)?.sale_price ?? (product as any)?.price ?? base);
          const onSale = Boolean((product as any)?.is_on_sale) || (base > 0 && sale > 0 && sale < base);
          const pct = onSale && base > 0 ? Math.round(((base - sale) / base) * 100) : 0;
          return (
            <div className="absolute left-2 top-2 flex flex-col gap-2 z-10">
              {!inStock && (
                <span className="inline-flex items-center rounded bg-gray-900 text-white text-[10px] font-bold px-2 py-1 uppercase">Out of stock</span>
              )}
              {onSale && pct > 0 && (
                <span className="inline-flex items-center rounded bg-red-600 text-white text-[10px] font-bold px-2 py-1">-{pct}%</span>
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
              .catch((e: any) => {
                show({ title: e?.message || "Wishlist update failed", variant: "error" });
              });
          }}
          className={`absolute top-2 right-2 rounded-full px-2 py-1 text-xs font-semibold ${isWished ? "bg-foreground text-white" : "bg-white/90"}`}
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
                e.preventDefault(); e.stopPropagation();
                setSelectedColor(c); setCurrentImageIndex(0);
                // Lock preview to clicked color's image if available
                const variants: any[] = rawVariants;
                const match = variants.find(v => String(getColor(v) || '').toLowerCase() === String(c).toLowerCase());
                const candidate =
                  match?.image ||
                  match?.image_url ||
                  match?.thumbnail ||
                  (Array.isArray(match?.images) ? match.images[0] : undefined);
                if (candidate && typeof candidate === 'string') {
                  setLockedPreview(candidate);
                  setPreviewImage(candidate);
                } else {
                  setLockedPreview(null);
                }
              }}
              onMouseEnter={(e) => {
                // Try to preview variant image for this color
                const variants: any[] = rawVariants;
                const match = variants.find(v => String(getColor(v) || '').toLowerCase() === String(c).toLowerCase());
                const candidate =
                  match?.image ||
                  match?.image_url ||
                  match?.thumbnail ||
                  (Array.isArray(match?.images) ? match.images[0] : undefined);
                if (candidate && typeof candidate === 'string') setPreviewImage(candidate);
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
        const sizesAll = Array.isArray(sizes) ? sizes : [];
        const sizesToShow = selectedColor
          ? Array.from(new Set(
              rawVariants
                .filter((v: any) => (getColor(v) || '').toLowerCase() === (selectedColor || '').toLowerCase())
                .map((v: any) => getSize(v))
                .filter(Boolean)
            ))
          : sizesAll;
        return sizesToShow && sizesToShow.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {sizesToShow.slice(0, 8).map((s: any) => (
              <button
                key={String(s)}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedSize(String(s)); }}
                className={`px-2 py-1 border rounded text-[11px] ${selectedSize === String(s) ? 'bg-black text-white border-black' : 'hover:bg-gray-100'}`}
                aria-label={`Select size ${s}`}
                title={String(s)}
              >
                {String(s)}
              </button>
            ))}
            {sizesToShow.length > 8 && (
              <span className="text-xs text-gray-500">+{sizesToShow.length - 8}</span>
            )}
          </div>
        ) : null;
      })()}

      {/* Sustainability or badges */}
      {(() => {
        const isSustainable = (product as any)?.is_sustainable || (Array.isArray((product as any)?.tags) && (product as any).tags.includes('sustainable'));
        return isSustainable ? (
          <p className="mt-3 text-xs font-semibold text-emerald-700">Sustainable Materials</p>
        ) : null;
      })()}

      {/* Brand and name */}
      {(() => {
        const brandText = typeof (product as any).brand === 'string' ? (product as any).brand : (product as any)?.brand?.name;
        return brandText ? (
          <p className="mt-1 text-xs text-gray-500 uppercase tracking-wide">{brandText}</p>
        ) : null;
      })()}
      <h3 className="mt-1 text-sm font-semibold tracking-tight uppercase line-clamp-1">{displayTitle}</h3>
      {(product as any)?.subtitle && (
        <p className="text-sm text-gray-600">{(product as any).subtitle}</p>
      )}

      {/* Colours count */}
      {Array.isArray((product as any)?.available_colors) && (product as any).available_colors.length > 0 && (
        <p className="text-xs text-gray-500 mt-1">{(product as any).available_colors.length} {(product as any).available_colors.length === 1 ? 'Colour' : 'Colours'}</p>
      )}

      <div className="mt-2 text-sm flex items-center gap-2">
        {(() => {
          const display = (product as any)?.sale_price ?? (product as any)?.price ?? (product as any)?.base_price ?? 0;
          const base = (product as any)?.base_price;
          const onSale = Boolean((product as any)?.is_on_sale) && base != null && Number(base) > Number(display);
          return (
            <>
              <span className="font-semibold">{formatPrice(display)}</span>
              {onSale && (
                <>
                  <span className="line-through text-muted">{formatPrice(base)}</span>
                  {(() => {
                    const pct = base ? Math.round(((Number(base) - Number(display)) / Number(base)) * 100) : 0;
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
