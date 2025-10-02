import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/providers/toast-provider";
import { useWishlist } from "@/lib/wishlist";
import type { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);
  const variants = (product as any)?.variants || [];
  const [selectedColor, setSelectedColor] = React.useState<string | undefined>();
  const [selectedSize, setSelectedSize] = React.useState<string | undefined>();
  const colors = Array.from(new Set(variants.map((v: any) => v.color).filter(Boolean))) as string[];
  const sizes = Array.from(new Set(variants.map((v: any) => v.size).filter(Boolean))) as string[];
  const filteredSizes = selectedColor
    ? Array.from(new Set(variants.filter((v: any) => v.color === selectedColor).map((v: any) => v.size).filter(Boolean)))
    : sizes;
  const filteredColors = selectedSize
    ? Array.from(new Set(variants.filter((v: any) => v.size === selectedSize).map((v: any) => v.color).filter(Boolean)))
    : colors;

  return (
    <article className="w-64 p-2 select-none">
      <div className="relative h-80 rounded-md overflow-hidden group">
        <Link href={`/products/${product.slug ?? product.id}`} className="absolute inset-0 block" aria-label={`View ${displayTitle}`} />
        <motion.div initial={{ scale: 1 }} whileHover={{ scale: 1.03 }} transition={{ duration: 0.2, ease: "easeOut" }} className="absolute inset-0 pointer-events-none">
          {product?.images?.[0] && product.images[0].length > 0 ? (
            <Image src={product.images[0]} alt={displayTitle} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
          ) : (
            <ProductImagePlaceholder
              className="flex h-full w-full items-center justify-center text-muted bg-subtle"
              productName={displayTitle}
            />
          )}
        </motion.div>
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
          className={`absolute top-2 right-2 rounded-full px-2 py-1 text-xs font-semibold ${isWished ? "bg-foreground text-white border-2 border-white" : "bg-white/90"}`}
        >
          {isWished ? "♥" : "♡"}
        </button>
        <div className="absolute inset-x-0 bottom-2 px-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition">
          <Button className="w-full bg-black text-white hover:bg-black/90" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(true); }}>Quick View</Button>
        </div>
      </div>
      <h3 className="mt-3 text-sm font-semibold tracking-tight uppercase line-clamp-1">{displayTitle}</h3>
      <div className="mt-1 text-sm flex items-center gap-2">
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
                  <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold bg-red-600 text-white">SALE</span>
                </>
              )}
            </>
          );
        })()}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[700px] bg-white text-foreground">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-tight">{displayTitle}</DialogTitle>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative aspect-square rounded-md overflow-hidden bg-subtle">
              {product?.images?.[0] && product.images[0].length > 0 ? (
                <Image src={product.images[0]} alt={displayTitle} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
              ) : (
                <ProductImagePlaceholder
                  className="flex h-full w-full items-center justify-center text-muted bg-subtle"
                  productName={displayTitle}
                />
              )}
            </div>
            <div className="flex flex-col justify-between">
              <div>
                <div className="text-lg font-semibold">{formatPrice(product.price)}</div>
                <p className="mt-2 text-sm text-muted">Premium materials. Everyday comfort.</p>
                {variants.length > 0 && (
                  <div className="mt-4 space-y-4">
                    {colors.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-tight">Color</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {colors.map((c) => {
                            const disabled = !filteredColors.includes(c);
                            const active = selectedColor === c;
                            return (
                              <button
                                key={c}
                                className={`px-3 py-2 border rounded-md text-sm ${active ? 'bg-secondary' : ''} ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                onClick={() => !disabled && setSelectedColor(c)}
                                aria-pressed={active}
                                aria-label={`Color ${c}`}
                              >
                                {c}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {sizes.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-tight">Size</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {sizes.map((s) => {
                            const disabled = !filteredSizes.includes(s);
                            const active = selectedSize === s;
                            return (
                              <button
                                key={s}
                                className={`px-3 py-2 border rounded-md text-sm ${active ? 'bg-secondary' : ''} ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                onClick={() => !disabled && setSelectedSize(s)}
                                aria-pressed={active}
                                aria-label={`Size ${s}`}
                              >
                                {s}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Link href={`/products/${product.slug ?? product.id}${selectedColor || selectedSize ? `?${selectedColor ? `color=${encodeURIComponent(selectedColor)}` : ''}${selectedColor && selectedSize ? '&' : ''}${selectedSize ? `size=${encodeURIComponent(selectedSize)}` : ''}` : ''}`} className="flex-1">
                  <Button className="w-full">View Product</Button>
                </Link>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}
