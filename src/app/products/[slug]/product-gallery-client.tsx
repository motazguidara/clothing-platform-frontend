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

  const galleryImages = React.useMemo(() => {
    const ordered: string[] = [];
    const c = (color || "").toLowerCase();
    const variants = product.variants || [];

    // 1) Selected color variant image
    if (c) {
      const match = variants.find((v) => (v.color || "").toLowerCase() === c && isValidImage(variantImage(v)));
      const img = variantImage(match);
      if (img) ordered.push(img.trim());
    }
    // 2) Listing thumbnail (if provided)
    if (isValidImage(product.thumbnail)) ordered.push(product.thumbnail!.trim());
    // 3) Primary single image
    if (isValidImage(product.image)) ordered.push(product.image!.trim());
    // 4) Product images array
    for (const img of product.images || []) {
      if (isValidImage(img)) ordered.push((img as string).trim());
    }
    // 5) Other variant images
    for (const v of variants) {
      const img = variantImage(v);
      if (isValidImage(img)) ordered.push(img!.trim());
    }
    return Array.from(new Set(ordered));
  }, [product.images, product.image, product.variants, color]);

  const [index, setIndex] = React.useState(0);
  React.useEffect(() => {
    setIndex(0);
  }, [galleryImages.join("|")]);

  const main = galleryImages[index] ?? null;

  return (
    <div className="space-y-4">
      <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100">
        {main ? (
          <Image
            src={main}
            alt={product.name || "Product"}
            fill
            className="object-cover"
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
                className="object-cover"
                sizes="(max-width: 768px) 25vw, 12.5vw"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
