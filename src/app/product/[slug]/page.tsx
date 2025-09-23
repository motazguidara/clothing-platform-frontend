"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useProduct } from "@/hooks/useCatalog";
import { useAddToCart } from "@/hooks/useCart";
import { useToast } from "@/providers/toast-provider";
import { useWishlistIds, useToggleWishlist } from "@/hooks/useWishlist";
import ProductCard from "@/components/product-card";

type Props = { params: { slug: string } };

export default function ProductPage({ params }: Props) {
  const { data: product, isLoading, isError } = useProduct(params.slug);
  const addToCart = useAddToCart();
  const { show } = useToast();
  const { data: wishlist } = useWishlistIds();
  const toggleWishlist = useToggleWishlist();
  const [selectedVariant, setSelectedVariant] = React.useState<any>(null);
  const [quantity, setQuantity] = React.useState(1);
  const [currentImage, setCurrentImage] = React.useState(0);

  // Early return if no product
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square rounded-md bg-gray-200 animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 animate-pulse rounded" />
            <div className="h-6 bg-gray-200 animate-pulse rounded" />
            <div className="h-24 bg-gray-200 animate-pulse rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <p className="mt-2 text-muted">The product you are looking for does not exist.</p>
        <Link href="/" className="mt-6 inline-block underline">Go back home</Link>
      </div>
    );
  }

  // Safe destructuring with defaults
  const images = product.images || [];
  const variants = product.variants || [];
  const reviews = product.reviews || [];
  const isWished = wishlist?.ids?.includes(product.id) || false;
  const currentPrice = selectedVariant?.price_adjustment 
    ? product.price + selectedVariant.price_adjustment 
    : product.price;
  const availableSizes = product.available_sizes || [];
  const availableColors = product.available_colors || [];

  const handleAddToCart = () => {
    if (!selectedVariant) {
      show({ title: "Please select a variant", variant: "error" });
      return;
    }
    addToCart.mutate({
      product_id: product.id,
      variant_id: selectedVariant.id,
      quantity
    }, {
      onSuccess: () => {
        show({ title: "Added to cart", variant: "success" });
      },
      onError: (e: any) => {
        show({ title: e?.message || "Failed to add to cart", variant: "error" });
      }
    });
  };

  // Select first available variant on load
  React.useEffect(() => {
    if (variants.length && !selectedVariant) {
      const firstAvailable = variants.find((v) => v.inventory?.is_in_stock);
      setSelectedVariant(firstAvailable || variants[0]);
    }
  }, [selectedVariant, variants]);

  // Reset current image if it's out of bounds
  React.useEffect(() => {
    if (currentImage >= images.length && images.length > 0) {
      setCurrentImage(0);
    }
  }, [images.length, currentImage]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="grid md:grid-cols-2 gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
            {images[currentImage] ? (
              <Image
                src={images[currentImage]}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No Image
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setCurrentImage(i)}
                  className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 ${i === currentImage ? "border-black" : "border-transparent"}`}
                >
                  <Image src={img} alt={product.name} width={80} height={80} className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-2xl font-semibold">${currentPrice?.toFixed(2)}</span>
              {product.is_on_sale && product.compare_at_price && (
                <span className="text-lg text-gray-500 line-through">${product.compare_at_price.toFixed(2)}</span>
              )}
            </div>
            {product.avg_rating && (
              <div className="mt-2 flex items-center gap-1">
                <div className="flex text-yellow-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < Math.floor(product.avg_rating || 0) ? "text-yellow-400" : "text-gray-300"}>★</span>
                  ))}
                </div>
                <span className="text-sm text-gray-600">({product.review_count || 0} reviews)</span>
              </div>
            )}
          </div>

          {product.short_description && (
            <p className="text-gray-600">{product.short_description}</p>
          )}

          {/* Variant Selection */}
          {availableSizes.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Size</label>
              <div className="flex gap-2 flex-wrap">
                {availableSizes.map((size: string) => (
                  <button
                    key={size}
                    onClick={() => {
                      const variant = variants.find((v: any) => v.size === size && v.color === selectedVariant?.color);
                      if (variant) setSelectedVariant(variant);
                    }}
                    className={`px-3 py-2 border rounded-md text-sm ${selectedVariant?.size === size ? "bg-black text-white" : "hover:bg-gray-100"}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {availableColors.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Color</label>
              <div className="flex gap-2 flex-wrap">
                {availableColors.map((color: string) => (
                  <button
                    key={color}
                    onClick={() => {
                      const variant = variants.find((v: any) => v.color === color && v.size === selectedVariant?.size);
                      if (variant) setSelectedVariant(variant);
                    }}
                    className={`px-3 py-2 border rounded-md text-sm ${selectedVariant?.color === color ? "bg-black text-white" : "hover:bg-gray-100"}`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity and Add to Cart */}
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Quantity</label>
              <select
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="px-3 py-2 border rounded-md"
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={addToCart.isPending || !selectedVariant?.inventory?.is_in_stock}
              className="flex-1 px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addToCart.isPending ? "Adding..." : "Add to Cart"}
            </button>
          </div>

          {/* Wishlist */}
          <button
            onClick={() => {
              toggleWishlist.mutate({ product_id: product.id }, {
                onSuccess: (r) => {
                  show({ title: r.added ? "Added to wishlist" : "Removed from wishlist", variant: r.added ? "success" : "default" });
                },
                onError: () => {
                  show({ title: "Failed to update wishlist", variant: "error" });
                }
              });
            }}
            className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-100"
          >
            {isWished ? "♥" : "♡"} {isWished ? "Remove from Wishlist" : "Add to Wishlist"}
          </button>

          {/* Description */}
          {product.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-600 whitespace-pre-line">{product.description}</p>
            </div>
          )}

          {/* Material and Care */}
          {product.material && (
            <div>
              <h3 className="font-semibold mb-2">Material</h3>
              <p className="text-gray-600">{product.material}</p>
            </div>
          )}

          {product.care_instructions && (
            <div>
              <h3 className="font-semibold mb-2">Care Instructions</h3>
              <p className="text-gray-600 whitespace-pre-line">{product.care_instructions}</p>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      {product.reviews && product.reviews.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
          <div className="space-y-4">
            {product.reviews.map((review: any) => (
              <div key={review.id} className="border-b pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex text-yellow-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={i < review.rating ? "text-yellow-400" : "text-gray-300"}>★</span>
                    ))}
                  </div>
                  <span className="text-sm font-medium">{review.user_name}</span>
                  <span className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString()}</span>
                </div>
                <h4 className="font-semibold">{review.title}</h4>
                <p className="text-gray-600 mt-1">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Products */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-6">Related Products</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <p className="col-span-full text-center text-gray-500">Related products coming soon...</p>
        </div>
      </div>
    </div>
  );
}
