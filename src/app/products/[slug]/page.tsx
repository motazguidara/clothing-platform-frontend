// app/products/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import ProductGalleryClient from "./product-gallery-client";
import { ProductClient } from "./product-client";
import { ProductSkeleton } from "./product-skeleton";
import { ProductImagePlaceholder } from "@/components/product-image-placeholder";
import { ProductReviews } from "./product-reviews.client";

/** ---------------- Types ---------------- */
type Brand = string | { name?: string | null };

type Product = {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
  short_description?: string | null;
  images?: string[] | null;
  image?: string | null; // single-image fallback from API
  brand?: Brand | null;
  category?: string | { name?: string | null } | null;
  price: number | string;
  current_price?: number | string | null;
  compare_at_price?: number | string | null;
  sale_price?: number | string | null;
  is_on_sale?: boolean | null;
  in_stock?: boolean | null;
  avg_rating?: number | null;
  review_count?: number | null;
  reviews?: Array<{
    id: number;
    rating: number;
    title?: string | null;
    comment?: string | null;
    user_name?: string | null;
    created_at?: string | null;
  }> | null;
  care_instructions?: string | null;
  available_sizes?: string[] | null;
  available_colors?: string[] | null;
};

interface ProductPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ variant?: string }>;
}

/** ---------------- Helpers ---------------- */
const toNum = (v: number | string | null | undefined): number | null => {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

const toMoney = (v: number | string | null | undefined, currency = "TND") => {
  const n = toNum(v);
  if (n === null) return "";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
};

const priceSummary = (p: Product) => {
  const base = toNum(p.compare_at_price) ?? toNum(p.price);
  const sale = toNum(p.current_price ?? p.sale_price ?? p.price);
  const hasSale = base !== null && sale !== null && sale < base;
  const savings = hasSale ? Number((base - sale).toFixed(2)) : 0;
  const pct = hasSale && base ? Math.round(((base - sale) / base) * 100) : 0;
  return { base, sale, hasSale, savings, pct };
};

const getBrandName = (brand: Brand | null | undefined): string | null => {
  if (!brand) return null;
  return typeof brand === "string" ? brand : brand.name || null;
};

const getMainImage = (p: Product): string | null => {
  if (p.images && Array.isArray(p.images) && p.images.length > 0) {
    const firstImage = p.images[0];
    if (typeof firstImage === 'string' && firstImage.length > 0) {
      return firstImage;
    }
  }
  if (p.image && typeof p.image === 'string' && p.image.length > 0) {
    return p.image;
  }
  return null;
};

/** ---------------- Data ---------------- */
async function getProduct(slug: string): Promise<Product | null> {
  try {
    const base = process.env["NEXT_PUBLIC_API_URL"];
    if (!base) {
      console.error("NEXT_PUBLIC_API_URL is not set");
      return null;
    }

    const res = await fetch(`${base}/catalog/products/${slug}/`, {
      next: { revalidate: 3600 }, // ISR: revalidate every hour
      signal: AbortSignal.timeout(10000), // 10 second timeout for individual product fetches
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch product: ${res.status} ${res.statusText}`);
    }

    return (await res.json()) as Product;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

/** ---------------- Metadata ---------------- */
export async function generateMetadata(
  { params }: ProductPageProps
): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Product Not Found",
      description: "The requested product could not be found.",
      robots: { index: false, follow: false },
    };
  }

  const title = `${product.name} | Your Store`;
  const desc =
    product.short_description ||
    (product.description ? product.description.slice(0, 160) : undefined) ||
    undefined;

  const images = (product.images ?? [])
    .filter((url): url is string => typeof url === 'string' && url.length > 0)
    .map((url) => ({
      url,
      width: 1200,
      height: 630,
      alt: product.name,
    }));

  return {
    title,
    description: desc,
    openGraph: {
      title: product.name,
      description: desc,
      images,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: desc,
      images: (product.images ?? [])
        .filter((url): url is string => typeof url === 'string' && url.length > 0)
        .slice(0, 1), // Twitter only supports one image
    },
    alternates: {
      canonical: `/products/${slug}`,
    },
  };
}

/** ---------------- SSG params (optional) ---------------- */
export async function generateStaticParams() {
  try {
    const base = process.env["NEXT_PUBLIC_API_URL"];
    if (!base) {
      console.warn("NEXT_PUBLIC_API_URL is not set, skipping static generation");
      return [];
    }

    const res = await fetch(`${base}/catalog/products/?limit=100`, {
      // Add timeout and signal for better error handling
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    if (!res.ok) {
      console.warn(`Failed to fetch products for static generation: ${res.status} ${res.statusText}`);
      return [];
    }

    const data = await res.json();
    const results: any[] = data?.results ?? [];
    return results
      .filter((p) => p?.slug)
      .map((p) => ({ slug: String(p.slug) }));
  } catch (error) {
    console.warn("Error generating static params (this is normal if backend is not running):", error);
    // Return empty array to skip static generation instead of failing the build
    return [];
  }
}

/** ---------------- Page ---------------- */
export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  // Derived fields
  const mainImage = getMainImage(product);
  const brandName = getBrandName(product.brand);
  const { base, sale, hasSale, savings, pct } = priceSummary(product);

  // Structured data
  const siteUrl = process.env["NEXT_PUBLIC_SITE_URL"] || "";
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    image: (product.images ?? [])
      .filter((url): url is string => typeof url === 'string' && url.length > 0) ?? (product.image ? [product.image] : []),
    brand: {
      "@type": "Brand",
      name: brandName || "Your Store",
    },
    offers:
      sale !== null
        ? {
            "@type": "Offer",
            price: sale,
            priceCurrency: "TND",
            availability: product.in_stock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            url: `${siteUrl}/products/${slug}`,
          }
        : undefined,
    aggregateRating:
      product.avg_rating != null
        ? {
            "@type": "AggregateRating",
            ratingValue: product.avg_rating,
            reviewCount: product.review_count || 0,
          }
        : undefined,
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images (color-aware) */}
          <ProductGalleryClient product={product as any} />

          {/* Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              {brandName && (
                <p className="text-lg text-gray-600 mt-1">{brandName}</p>
              )}
            </div>

            {/* Price */}
            <div className="flex items-center flex-wrap gap-3">
              <span className="text-3xl font-bold text-gray-900">
                {toMoney(sale)}
              </span>

              {hasSale && (
                <>
                  <span className="text-xl text-gray-500 line-through">
                    {toMoney(base)}
                  </span>
                  <span className="rounded bg-red-100 px-2.5 py-0.5 text-sm font-semibold text-red-800">
                    Save {toMoney(savings)}{pct > 0 ? ` (${pct}% off)` : ""}
                  </span>
                </>
              )}
            </div>

            {/* Rating */}
            {product.avg_rating != null && (
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const filled = i < Math.floor(product.avg_rating!);
                    return (
                      <svg
                        key={i}
                        className={`h-5 w-5 ${
                          filled ? "text-yellow-400" : "text-gray-300"
                        } fill-current`}
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    );
                  })}
                </div>
                <span className="text-sm text-gray-600">
                  {Number(product.avg_rating).toFixed(1)} ({product.review_count || 0} reviews)
                </span>
              </div>
            )}

            {/* Stock */}
            <div className="flex items-center space-x-2">
              <div
                className={`h-3 w-3 rounded-full ${
                  product.in_stock ? "bg-green-400" : "bg-red-400"
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  product.in_stock ? "text-green-800" : "text-red-800"
                }`}
              >
                {product.in_stock ? "In Stock" : "Out of Stock"}
              </span>
            </div>

            {/* Summary */}
            {product.short_description && (
              <div className="prose prose-sm text-gray-600">
                <p>{product.short_description}</p>
              </div>
            )}

            {/* Interactive (client) */}
            <Suspense fallback={<ProductSkeleton />}>
              {(() => {
                const sel = resolvedSearchParams?.variant ?? undefined;
                const normalizedProduct = { ...product, description: product.description ?? '' } as any;
                return (
                  <ProductClient
                    product={normalizedProduct}
                    selectedVariant={sel}
                  />
                );
              })()}
            </Suspense>
          </div>
        </div>

        {/* Full Description */}
        {product.description && (
          <div className="mt-12 border-t border-gray-200 pt-8"> 
            <h2 className="mb-4 text-2xl font-bold text-gray-900">Description</h2>
            <div className="prose prose-sm max-w-none text-gray-600">
              <p>{product.description}</p>
            </div>
          </div>
        )}

        {/* Care Instructions */}
        {product.care_instructions && (
          <div className="mt-8 border-t border-gray-200 pt-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">Care Instructions</h2>
            <div className="prose prose-sm max-w-none text-gray-600">
              <p>{product.care_instructions}</p>
            </div>
          </div>
        )}

        <ProductReviews
          productSlug={(product.slug as string) || slug}
          reviews={product.reviews}
          reviewCount={product.review_count}
          avgRating={typeof product.avg_rating === "number" ? product.avg_rating : null}
        />
      </div>
    </>
  );
}
