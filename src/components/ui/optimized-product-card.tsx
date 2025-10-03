"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { OptimizedButton } from './optimized-button';
import { useAddToCart } from '@/hooks/useCart';
import { useWishlist } from '@/lib/wishlist';
import { imageOptimization } from '@/lib/performance';
import type { Product } from '@/types';

interface OptimizedProductCardProps {
  product: Product;
  priority?: boolean;
  className?: string;
  showQuickAdd?: boolean;
  showWishlist?: boolean;
  lazy?: boolean;
}

const OptimizedProductCard = React.memo<OptimizedProductCardProps>(({
  product,
  priority = false,
  className,
  showQuickAdd = true,
  showWishlist = true,
  lazy = true,
}) => {
  const addToCart = useAddToCart();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, hasItem: isInWishlist } = useWishlist();
  
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);

  // Intersection Observer for lazy loading
  const [isVisible, setIsVisible] = React.useState(!lazy);
  
  React.useEffect(() => {
    if (!lazy || !cardRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first && first.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [lazy]);

  // Avoid SSR/CSR mismatches for client-only state (e.g., wishlist)
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Optional image cycling on hover (disabled when user selects a thumbnail)
  React.useEffect(() => {
    const imagesCount = product.images?.length ?? 0;
    if (!isHovered || imagesCount <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev >= imagesCount - 1 ? 0 : prev + 1));
    }, 1500);
    return () => clearInterval(interval);
  }, [isHovered, product.images]);

  // Optimized handlers
  const handleAddToCart = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      addToCart.mutate({ product_id: product.id, delta_qty: 1 });
    },
    [addToCart, product.id]
  );

  const handleWishlistToggle = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (isInWishlist(product.id)) {
        removeFromWishlist(product.id);
      } else {
        addToWishlist(product.id);
      }
    },
    [addToWishlist, removeFromWishlist, isInWishlist, product.id]
  );

  

  const handleMouseEnter = React.useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = React.useCallback(() => {
    setIsHovered(false);
    setCurrentImageIndex(0);
  }, []);

  // Price calculations
  const discountPercentage = React.useMemo(() => {
    if (!product.compare_at_price || !product.price) return 0;
    return Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100);
  }, [product.compare_at_price, product.price]);

  const isOnSale = React.useMemo(() => {
    return product.is_on_sale || (product.compare_at_price && product.compare_at_price > product.price);
  }, [product.is_on_sale, product.compare_at_price, product.price]);

  // Image props
  const imageProps = React.useMemo(() => {
    // Use an existing asset from public/ to avoid 400s if no product image
    const fallback = '/file.svg';
    const mainImage = product.images?.[currentImageIndex] || product.image || fallback;
    return imageOptimization.getResponsiveProps(mainImage, product.name, priority);
  }, [product.images, currentImageIndex, product.image, product.name, priority]);

  if (!isVisible) {
    return (
      <div
        ref={cardRef}
        className={cn("aspect-[3/4] bg-gray-100 rounded-lg animate-pulse", className)}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      ref={cardRef}
      className={cn(
        "group relative bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300",
        "border border-gray-200 hover:border-gray-300",
        "transform hover:-translate-y-1",
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link href={`/products/${product.slug || product.id}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-t-lg bg-gray-100">
          {/* Main Product Image */}
          <Image
            {...imageProps}
            fill
            className={cn(
              "object-cover transition-all duration-500",
              imageLoaded ? "opacity-100" : "opacity-0",
              (() => { const imagesCount = product.images?.length ?? 0; return isHovered && imagesCount > 1 ? "scale-105" : "scale-100"; })()
            )}
            onLoad={() => setImageLoaded(true)}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Loading Skeleton */
          }
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}

          {/* Sale Badge */}
          {isOnSale && (
            <div className="absolute top-2 left-2 z-10">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {discountPercentage > 0 ? `-${discountPercentage}%` : 'Sale'}
              </span>
            </div>
          )}

          {/* Wishlist Button */}
          {showWishlist && (
            <button
              onClick={handleWishlistToggle}
              className={cn(
                "absolute top-2 right-2 z-10 p-2 rounded-full transition-all duration-200",
                "bg-white/80 hover:bg-white shadow-sm hover:shadow-md",
                "opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0"
              )}
              aria-label={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
            >
              <svg
                className={cn(
                  "w-4 h-4 transition-colors duration-200",
                  mounted && isInWishlist(product.id) ? "text-red-500 fill-current" : "text-gray-600"
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
          )}

          {/* Quick Actions Overlay */}
          <div className={cn(
            "absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          )}>
            <div className="flex gap-2">
              {showQuickAdd && (
                <OptimizedButton
                  size="sm"
                  onClick={handleAddToCart}
                  loading={addToCart.isPending}
                  className="flex-1 bg-white text-black hover:bg-gray-100"
                  disabled={!product.in_stock || addToCart.isPending}
                >
                  {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
                </OptimizedButton>
              )}
            </div>
          </div>

          {/* Thumbnail strip (on hover) */}
          {product.images && product.images.length > 1 && (
            <div className="absolute bottom-2 left-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {product.images.slice(0, 4).map((img, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentImageIndex(idx); }}
                  onMouseEnter={(e) => { e.preventDefault(); setCurrentImageIndex(idx); }}
                  aria-label={`Show image ${idx + 1}`}
                  className={cn(
                    "relative w-10 h-10 rounded overflow-hidden border",
                    idx === currentImageIndex ? "border-white" : "border-white/50"
                  )}
                >
                  <Image
                    src={img}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Sustainability or badges */}
          {(() => {
            const isSustainable = (product as any)?.is_sustainable || (Array.isArray((product as any)?.tags) && (product as any).tags.includes('sustainable'));
            return isSustainable ? (
              <p className="text-xs font-semibold text-emerald-700 mb-1">Sustainable Materials</p>
            ) : null;
          })()}
          {/* Brand */}
          {(() => {
            const brandText = typeof product.brand === 'string'
              ? product.brand
              : (product as any)?.brand?.name ?? '';
            return brandText ? (
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                {brandText}
              </p>
            ) : null;
          })()}

          {/* Product Name */}
          <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-gray-700 transition-colors">
            {product.name}
          </h3>

          {/* Subtitle */}
          {((product as any)?.subtitle) && (
            <p className="text-sm text-gray-600 mb-1">{(product as any).subtitle}</p>
          )}

          {/* Rating */}
          {product.rating && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={cn(
                      "w-3 h-3",
                      i < Math.floor(product.rating!) ? "text-yellow-400 fill-current" : "text-gray-300"
                    )}
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs text-gray-500">
                ({product.review_count || 0})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2">
            {(() => {
              const display: any = (product as any)?.sale_price ?? (product as any)?.price ?? (product as any)?.base_price ?? 0;
              const base: any = (product as any)?.base_price ?? (product as any)?.compare_at_price;
              const onSale = Boolean((product as any)?.is_on_sale) && base != null && Number(base) > Number(display);
              const fmt = (v: any) => {
                const n = typeof v === 'string' ? Number(v) : v;
                return `$${(Number.isFinite(n) ? n : 0).toFixed(2)}`;
              };
              return (
                <>
                  <span className="font-semibold text-gray-900">{fmt(display)}</span>
                  {onSale && (
                    <span className="text-sm text-gray-500 line-through">{fmt(base)}</span>
                  )}
                </>
              );
            })()}
          </div>

          {/* Color Variants */}
          {product.available_colors && product.available_colors.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1">
                {product.available_colors.slice(0, 4).map((color, index) => (
                  <div
                    key={index}
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: color.toLowerCase() }}
                    title={color}
                  />
                ))}
                {product.available_colors.length > 4 && (
                  <span className="text-xs text-gray-500 ml-1">
                    +{product.available_colors.length - 4}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {product.available_colors.length} {product.available_colors.length === 1 ? 'Colour' : 'Colours'}
              </span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
});

OptimizedProductCard.displayName = 'OptimizedProductCard';

export { OptimizedProductCard };
