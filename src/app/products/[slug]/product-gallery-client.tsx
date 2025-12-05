"use client";

import React from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ProductImagePlaceholder } from "@/components/product-image-placeholder";

type Variant = {
  id: number;
  size?: string | null;
  color?: string | null;
  image?: string | null;
  image_url?: string | null;
  thumbnail?: string | null;
};

type Product = {
  id: number;
  name: string;
  images?: string[] | null;
  image?: string | null;
  thumbnail?: string | null;
  variants?: Variant[] | null;
};

const isValidImage = (img?: string | null) => typeof img === "string" && img.trim().length > 0;
const extractImageValue = (value: unknown): string | null => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const maybe = (value as any).image || (value as any).url || (value as any).src;
    if (typeof maybe === "string") return maybe;
  }
  return null;
};
const variantImage = (variant?: Variant | null) => {
  if (!variant) return null;
  return (
    (variant.image && variant.image.trim()) ||
    (variant.image_url && variant.image_url.trim()) ||
    (variant.thumbnail && variant.thumbnail.trim()) ||
    null
  );
};

export default function ProductGalleryClient({ product }: { product: Product }) {
  const params = useSearchParams();
  const color = params.get("color");
  const apiBase = (process.env["NEXT_PUBLIC_API_URL"] || "").replace(/\/$/, "");

  const normalizeImage = React.useCallback(
    (img?: string | null) => {
      if (!isValidImage(img)) return null;
      const trimmed = (img as string).trim();
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        return trimmed;
      }
      if (trimmed.startsWith("/") && apiBase) {
        return `${apiBase}${trimmed}`;
      }
      return trimmed;
    },
    [apiBase]
  );

  const galleryImages = React.useMemo(() => {
    const ordered: string[] = [];
    const c = (color || "").toLowerCase();
    const variants = product.variants || [];

    // 1) Selected color variant images (and its own image list)
    if (c) {
      const match = variants.find((v) => (v.color || "").toLowerCase() === c);
      const img = normalizeImage(variantImage(match));
      if (img) ordered.push(img.trim());
      if (match && Array.isArray((match as any).images)) {
        for (const entry of (match as any).images as string[]) {
          const norm = normalizeImage(entry);
          if (norm) ordered.push(norm.trim());
        }
      }
      // Only use images from the selected variant; don't mix other variants
      if (ordered.length === 0 && match) {
        // fallback to product images below
      }
    }
    // 2) If no variant images (or no color chosen), fall back to product-level images only
    if (ordered.length === 0) {
      const normalizedThumb = normalizeImage(product.thumbnail);
      if (normalizedThumb) ordered.push(normalizedThumb.trim());
      const normalizedPrimary = normalizeImage(product.image);
      if (normalizedPrimary) ordered.push(normalizedPrimary.trim());
      for (const img of product.images || []) {
        const raw = extractImageValue(img);
        const normalized = normalizeImage(raw ?? undefined);
        if (normalized) ordered.push(normalized.trim());
      }
    }

    return Array.from(new Set(ordered));
  }, [product.images, product.image, product.variants, product.thumbnail, color, normalizeImage]);

  const [index, setIndex] = React.useState(0);
  React.useEffect(() => {
    setIndex(0);
  }, [galleryImages.join("|")]);

  const main = galleryImages[index] ?? null;

  return (
    <div className="space-y-4">
      <div
        className="aspect-square relative overflow-hidden rounded-lg bg-gray-100"
        tabIndex={0}
        onKeyDown={(e) => {
          if (galleryImages.length <= 1) return;
          if (e.key === "ArrowRight") {
            e.preventDefault();
            setIndex((prev) => (prev + 1) % galleryImages.length);
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            setIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
          }
        }}
        aria-roledescription="carousel"
        aria-label="Product images"
      >
        {main ? (
          <Image
            src={main}
            alt={product.name || "Product"}
            fill
            className="object-contain p-2"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <ProductImagePlaceholder
            className="flex h-full w-full items-center justify-center text-gray-500"
            productName={product.name}
          />
        )}
        {galleryImages.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => setIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded bg-white/90 border border-border shadow-sm flex items-center justify-center hover:bg-white transition"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" className="stroke-black/80" aria-hidden="true">
                <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => setIndex((prev) => (prev + 1) % galleryImages.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded bg-white/90 border border-border shadow-sm flex items-center justify-center hover:bg-white transition"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" className="stroke-black/80" aria-hidden="true">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        )}
        {galleryImages.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/70 px-3 py-1 rounded-full">
            {galleryImages.map((_, dotIdx) => (
              <button
                key={`dot-${dotIdx}`}
                type="button"
                className={`h-2 w-2 rounded-full transition ${dotIdx === index ? "bg-black" : "bg-black/30"}`}
                aria-label={`Show image ${dotIdx + 1}`}
                onClick={() => setIndex(dotIdx)}
              />
            ))}
          </div>
        )}
      </div>
      {galleryImages.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {galleryImages.map((image, idx) => (
            <button
              key={image + idx}
              type="button"
              onClick={() => setIndex(idx)}
              className={`aspect-square relative overflow-hidden rounded-md bg-gray-100 border ${idx === index ? "border-black" : "border-transparent"} hover:border-black transition`}
            >
              <Image
                src={image}
                alt={`${product.name} thumb ${idx + 1}`}
                fill
                className="object-contain p-1"
                sizes="(max-width: 768px) 25vw, 12.5vw"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
