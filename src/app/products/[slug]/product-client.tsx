'use client';

import { useState, useCallback, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OptimizedButton } from '@/components/ui/optimized-button';
import { useUIStore } from '@/store/ui';
import { useAddToCart } from '@/hooks/useCart';
import { useWishlist } from '@/lib/wishlist';
import type { Product } from '@/types';

interface ProductClientProps {
  product: Product;
  selectedVariant?: string | undefined;
}

export function ProductClient({ product, selectedVariant }: ProductClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedSize, setSelectedSize] = useState<string>(selectedVariant || '');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  
  const addToCart = useAddToCart();
  const openCart = useUIStore((s) => s.openCart);
  const { addItem: addToWishlist, removeItem: removeFromWishlist, hasItem: isInWishlist } = useWishlist();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isInWishlistState = mounted ? isInWishlist(product.id) : false;

  const handleAddToCart = useCallback(async () => {
    if (!product.in_stock) return;
    
    try {
      // Resolve variant id if variants exist by matching selected size/color
      const variants: any[] = (product as any)?.variants || [];
      let variant_id: number | undefined = undefined;
      if (variants.length) {
        const matched = variants.find(v => {
          const sizeOk = selectedSize ? String(v.size).toLowerCase() === String(selectedSize).toLowerCase() : true;
          const colorOk = selectedColor ? String(v.color || '').toLowerCase() === String(selectedColor).toLowerCase() : true;
          return sizeOk && colorOk;
        }) || variants.find(v => selectedSize ? String(v.size).toLowerCase() === String(selectedSize).toLowerCase() : false);
        variant_id = matched?.id;
      }
      await addToCart.mutateAsync({ product_id: product.id, ...(variant_id ? { variant_id } : {}), delta_qty: quantity });
      openCart();
      
      // Show success toast or feedback
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'add_to_cart', {
          currency: 'TND',
          value: product.price * quantity,
          items: [{
            item_id: product.id.toString(),
            item_name: product.name,
            category: product.category,
            quantity: quantity,
            price: product.price,
          }],
        });
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  }, [addToCart, product, quantity, selectedSize, selectedColor, openCart]);

  const handleWishlistToggle = useCallback(async () => {
    try {
      if (isInWishlistState) {
        await removeFromWishlist(product.id);
      } else {
        await addToWishlist(product.id);
      }
    } catch (error) {
      console.error('Failed to update wishlist:', error);
    }
  }, [addToWishlist, removeFromWishlist, isInWishlistState, product.id]);

  const handleVariantChange = useCallback((size: string, color?: string) => {
    setSelectedSize(size);
    if (color) setSelectedColor(color);
    
    // Update URL without page reload
    startTransition(() => {
      const params = new URLSearchParams();
      if (size) params.set('variant', size);
      if (color) params.set('color', color);
      
      const newUrl = params.toString() 
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      
      router.replace(newUrl, { scroll: false });
    });
  }, [router]);

  const sizeGuideHref =
    product.gender === 'kids'
      ? '/size-guide#kids'
      : product.gender === 'men'
      ? '/size-guide#men'
      : product.gender === 'women'
      ? '/size-guide#women'
      : '/size-guide#adults';

  const variantInventories = ((product as any)?.variants || []).map((v: any) => {
    const qty = typeof v?.inventory?.quantity === "number" ? v.inventory.quantity : null;
    const inStock = v?.inventory?.is_in_stock;
    return { qty, inStock };
  });
  const anyVariantInStock = variantInventories.some((v) => v.inStock === true || (typeof v.qty === "number" && v.qty > 0));

  const computeBadges = () => {
    const list: Array<{ label: string; tone: "sale" | "neutral" | "warn" | "info" }> = [];
    const basePrice = typeof (product as any).base_price === "number" ? (product as any).base_price : product.price;
    const salePrice = typeof (product as any).sale_price === "number" ? (product as any).sale_price : product.price;
    const onSale = (Boolean((product as any).is_on_sale) && salePrice < basePrice) || (basePrice > 0 && salePrice < basePrice);
    if (onSale) list.push({ label: "Sale", tone: "sale" });
    if (typeof (product as any).compare_at_price === "number" && (product as any).compare_at_price > (product as any).price) {
      const diff = (product as any).compare_at_price - (product as any).price;
      const pct = Math.round((diff / (product as any).compare_at_price) * 100);
      if (pct > 0) list.push({ label: `${pct}% Off`, tone: "sale" });
    }
    if ((product as any).promotion) list.push({ label: (product as any).promotion, tone: "info" });
    if ((product as any).is_featured) list.push({ label: "Bestseller", tone: "info" });

    const productQty = typeof (product as any).stock_quantity === "number" ? (product as any).stock_quantity : null;
    const inStock = productQty !== null ? productQty > 0 : (anyVariantInStock || product.in_stock !== false);
    const lowStock =
      inStock &&
      ((productQty !== null && productQty > 0 && productQty <= 3) ||
        variantInventories.some((v) => typeof v.qty === "number" && v.qty > 0 && v.qty <= 3));
    if (!inStock) list.push({ label: "Out of Stock", tone: "warn" });
    else if (lowStock) list.push({ label: "Low Stock", tone: "warn" });

    if (product.created_at) {
      try {
        const days = (Date.now() - new Date(product.created_at).getTime()) / (1000 * 60 * 60 * 24);
        if (days <= 30) list.push({ label: "New In", tone: "neutral" });
      } catch {
        /* noop */
      }
    }
    return list;
  };

  const badges = computeBadges();

  const canAddToCart = (product.in_stock || anyVariantInStock) && (!((product as any)?.variants?.length) || selectedSize);

  return (
    <div className="space-y-6">
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {badges.map((badge, idx) => {
            const toneClasses =
              badge.tone === "sale"
                ? "bg-[#7a0f2f] text-white border-[#6a0d29]"
                : "bg-black text-white border-black";
            return (
              <span
                key={`${badge.label}-${idx}`}
                className={`inline-flex items-center rounded border px-2 py-1 text-[12px] font-semibold ${toneClasses}`}
              >
                {badge.label}
              </span>
            );
          })}
        </div>
      )}
      {/* Size Selection */}
      {product.available_sizes && product.available_sizes.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Size</h3>
          <div className="grid grid-cols-4 gap-2">
            {product.available_sizes.map((size) => (
              <button
                key={size}
                onClick={() => handleVariantChange(size, selectedColor)}
                className={`
                  py-2 px-3 text-sm font-medium rounded-md border transition-colors
                  ${selectedSize === size
                    ? 'border-black bg-black text-white'
                    : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400'
                  }
                `}
                disabled={isPending}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color Selection */}
      {product.available_colors && product.available_colors.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Color</h3>
          <div className="flex space-x-2">
            {product.available_colors.map((color) => (
              <button
                key={color}
                onClick={() => handleVariantChange(selectedSize, color)}
                className={`
                  w-8 h-8 rounded-full border-2 transition-transform
                  ${selectedColor === color
                    ? 'border-gray-900 scale-110'
                    : 'border-gray-300 hover:scale-105'
                  }
                `}
                style={{ backgroundColor: color.toLowerCase() }}
                title={color}
                disabled={isPending}
              />
            ))}
          </div>
          {selectedColor && (
            <p className="text-sm text-gray-600 mt-1 capitalize">{selectedColor}</p>
          )}
        </div>
      )}

      {/* Quantity Selection */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Quantity</h3>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 disabled:opacity-50"
            disabled={quantity <= 1 || isPending}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="text-lg font-medium w-8 text-center">{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 disabled:opacity-50"
            disabled={isPending}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <OptimizedButton
          onClick={handleAddToCart}
          disabled={!canAddToCart || addToCart.isPending || isPending}
          loading={addToCart.isPending}
          fullWidth
          className="bg-black text-white hover:bg-gray-800 disabled:bg-gray-300"
        >
          {!product.in_stock 
            ? 'Out of Stock' 
            : !selectedSize && product.available_sizes?.length 
            ? 'Select Size' 
            : 'Add to Cart'
          }
        </OptimizedButton>

        <div className="flex space-x-3">
          <OptimizedButton
            onClick={handleWishlistToggle}
            variant="outline"
            className="flex-1"
            aria-label={isInWishlistState ? 'Remove from Wishlist' : 'Add to Wishlist'}
            icon={
              <svg className="w-4 h-4" fill={isInWishlistState ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            }
          >
            {isInWishlistState ? 'Remove from Wishlist' : 'Add to Wishlist'}
          </OptimizedButton>

          <OptimizedButton
            variant="outline"
            className="px-4"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            }
            title="Share Product"
          />
        </div>
      </div>

      {/* Size Guide */}
      {product.available_sizes && product.available_sizes.length > 0 && (
        <div className="border-t border-gray-200 pt-6">
          <Link href={sizeGuideHref} className="text-sm text-gray-600 hover:text-gray-900 underline">
            Size Guide
          </Link>
        </div>
      )}

      {/* Shipping Info */}
      <div className="border-t border-gray-200 pt-6 space-y-3">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span>Free shipping on orders over 300 TND</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Free returns within 30 days</span>
        </div>
      </div>
    </div>
  );
}
