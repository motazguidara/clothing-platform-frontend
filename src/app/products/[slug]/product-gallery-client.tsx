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
};

type Product = {
  id: number;
  name: string;
  images?: string[] | null;
  image?: string | null;
  variants?: Variant[] | null;
};

function pickMain(product: Product, color?: string | null) {
  const c = (color || "").toLowerCase();
  const variants = product.variants || [];
  if (c) {
    const match = variants.find((v) => (v.color || "").toLowerCase() === c && v.image);
    if (match?.image) return match.image;
  }
  if (product.images && product.images.length > 0 && typeof product.images[0] === "string" && product.images[0].length > 0) {
    return product.images[0];
  }
  if (product.image && product.image.length > 0) return product.image;
  return null;
}

export default function ProductGalleryClient({ product }: { product: Product }) {
  const params = useSearchParams();
  const color = params.get("color");
  const main = pickMain(product, color);

  const thumbs: string[] = React.useMemo(() => {
    const base: string[] = [];
    // Include variant image for selected color first, if available and not equal to main
    const c = (color || "").toLowerCase();
    const variants = product.variants || [];
    if (c) {
      const match = variants.find((v) => (v.color || "").toLowerCase() === c && v.image);
      if (match?.image && match.image !== main) base.push(match.image);
    }
    // Append remaining product images
    for (const img of product.images || []) {
      if (typeof img === "string" && img.length > 0 && img !== main) base.push(img);
    }
    return Array.from(new Set(base)).slice(0, 8);
  }, [product.images, product.variants, color, main]);

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
      </div>
      {thumbs.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {thumbs.map((image, idx) => (
            <div key={image + idx} className="aspect-square relative overflow-hidden rounded-md bg-gray-100">
              <Image
                src={image}
                alt={`${product.name} thumb ${idx + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 25vw, 12.5vw"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
