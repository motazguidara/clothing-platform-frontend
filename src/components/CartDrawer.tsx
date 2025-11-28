"use client";

import React from "react";
import Link from "next/link";

import { useUIStore } from "@/store/ui";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart, useRemoveFromCart, useUpdateCartItem } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import { useWishlist } from "@/lib/wishlist";
import { useToast } from "@/providers/toast-provider";

type CartItemWithVariant = {
  id: number;
  product_id: number;
  variant_id?: number;
  quantity: number;
  price: number;
  product_name: string;
  product_image?: string;
  variant_name?: string;
  variant?: {
    id: number;
    name: string;
  };
};

export function CartDrawer() {
  const isOpen = useUIStore((s) => s.isCartOpen);
  const close = useUIStore((s) => s.closeCart);
  const { data, isLoading, error } = useCart();
  const { mutate: removeItem, isPending: isRemoving } = useRemoveFromCart();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, hasItem: isInWishlist } = useWishlist();
  const { toast } = useToast();
  const { mutate: updateQuantity } = useUpdateCartItem();
  const items = React.useMemo(() => data?.items ?? [], [data?.items]);
  const normalizedItems = React.useMemo(() => {
    return (items as any[]).map((raw, idx) => {
      const id = Number((raw as any).id ?? idx + 1);
      const product_id = Number((raw as any).product_id ?? 0);
      const quantity = Number((raw as any).quantity ?? 1);
      const price = typeof (raw as any).price === 'string' ? parseFloat((raw as any).price) : Number((raw as any).price ?? 0);
      const product_name = (raw as any).product_name || (raw as any).product_title || 'Item';
      const variant = (raw as any).variant;
      const variant_name = variant?.name || (raw as any).variant_name;
      const product_image = (raw as any).product_image || (raw as any).image || null;
      return { id, product_id, quantity, price, product_name, product_image, variant, variant_name } as CartItemWithVariant;
    });
  }, [items]);

  // Dev logging of cart drawer state
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[CartDrawer] state', {
        isOpen,
        isLoading,
        error: error ? String(error) : null,
        cartId: data?.id,
        itemsCount: items.length,
        items,
      });
    }
  }, [isOpen, isLoading, error, data?.id, items]);
  
  const handleRemoveItem = (itemId: number) => {
    removeItem(itemId, {
      onSuccess: () => {
        toast({ title: "Item removed from cart", variant: "success" });
      },
      onError: () => {
        toast({ title: "Failed to remove item", variant: "destructive" });
      }
    });
  };
  
  const handleToggleWishlist = async (item: CartItemWithVariant) => {
    try {
      const productId = item.product_id;
      if (isInWishlist(productId)) {
        await removeFromWishlist(productId);
        toast({ title: "Removed from wishlist", variant: "success" });
      } else {
        await addToWishlist(productId);
        toast({ title: "Added to wishlist", variant: "success" });
      }
    } catch (error) {
      toast({ title: "Failed to update wishlist", variant: "destructive" });
    }
  };

  const handleUpdateQuantity = (item: CartItemWithVariant, newQuantity: number) => {
    if (newQuantity < 1) return;
    setQtyMap(prev => ({
      ...prev,
      [item.id]: newQuantity
    }));
    updateQuantity(
      { item_id: item.id, quantity: newQuantity },
      {
        onError: () => {
          // Revert the quantity change if the API call fails
          setQtyMap(prev => ({
            ...prev,
            [item.id]: getQty(item.id, item.quantity)
          }));
          toast({ title: "Failed to update quantity", variant: "destructive" });
        }
      }
    );
  };

  const [qtyMap, setQtyMap] = React.useState<Record<number, number>>({});
  
  React.useEffect(() => {
    const init: Record<number, number> = {};
    for (const item of normalizedItems) {
      init[item.id] = Math.max(1, Number(item.quantity) || 1);
    }
    setQtyMap(init);
  }, [normalizedItems]);

  const getQty = (id: number, quantity?: number) => {
    // Return the mapped quantity if it exists, otherwise use the provided quantity or default to 1
    return qtyMap[id] ?? (typeof quantity === 'number' ? Math.max(1, quantity) : 1);
  };
  
  // Calculate subtotal
  const subtotal = React.useMemo(() => {
    return normalizedItems.reduce((sum, item) => {
      const unit = Number(item.price ?? 0);
      const quantity = getQty(item.id, item.quantity);
      return sum + (unit * quantity);
    }, 0);
  }, [normalizedItems, getQty]);
  
  const total = subtotal;
  
  return (
    <Sheet open={isOpen} onOpenChange={(v) => (v ? null : close())}>
      <SheetContent side="right" className="w-[400px] sm:w-[520px] bg-white text-foreground border-border">
        <SheetHeader>
          <SheetTitle>Your Bag</SheetTitle>
          <SheetDescription>Review and manage items in your shopping cart</SheetDescription>
        </SheetHeader>
        <div className="py-6 px-2 sm:px-4 space-y-5">
          {process.env.NODE_ENV === 'development' && (
            <details className="text-xs text-muted">
              <summary>Debug cart payload</summary>
              <pre className="whitespace-pre-wrap break-words max-h-48 overflow-auto">
                {JSON.stringify({ id: data?.id, items: data?.items, totals: data?.totals, error: error ? String(error) : null }, null, 2)}
              </pre>
            </details>
          )}
          {isLoading ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : normalizedItems.length === 0 ? (
            <>
              <p className="text-sm text-muted">Your cart is empty.</p>
              <Button onClick={close} className="w-full">
                Continue shopping
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <ul className="divide-y divide-border" role="list">
                {normalizedItems.map((it: CartItemWithVariant) => (
                  <li key={it.id} className="py-5 flex gap-4 items-start">
                    <div className="h-20 w-20 rounded overflow-hidden bg-subtle flex items-center justify-center">
                      {it.product_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={it.product_image}
                          alt={it.product_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="text-xs text-muted">No image</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-sm font-medium">{it.product_name}</h3>
                          {it.variant && (
                            <div className="text-xs text-muted">{it.variant?.name}</div>
                          )}
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              className="flex items-center justify-center w-6 h-6 rounded-full border border-gray-200"
                              onClick={() => handleUpdateQuantity(it, Math.max(1, getQty(it.id, it.quantity) - 1))}
                              aria-label="Decrease quantity"
                            >
                              -
                            </button>
                            <span className="w-6 text-center">{getQty(it.id, it.quantity)}</span>
                            <button
                              className="flex items-center justify-center w-6 h-6 rounded-full border border-gray-200"
                              onClick={() => handleUpdateQuantity(it, getQty(it.id, it.quantity) + 1)}
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="text-sm font-semibold">
                            {(() => {
                              const unit = typeof it.price === 'string' ? parseFloat(it.price) : Number(it.price ?? 0);
                              return formatPrice(unit * getQty(it.id, it.quantity));
                            })()}
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleToggleWishlist(it)}
                              className="text-xs underline"
                            >
                              {isInWishlist(it.product_id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                            </button>
                            <button
                              className="text-xs underline disabled:opacity-50"
                              onClick={() => handleRemoveItem(it.id)}
                              disabled={isRemoving}
                              aria-label={`Remove ${it.product_name ?? "item"}`}
                            >
                              {isRemoving ? 'Removing...' : 'Remove'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="border-t border-border pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Subtotal</span>
                  <span className="text-sm font-semibold">{formatPrice(subtotal)}</span>
                </div>
                <p className="text-xs text-muted">
                  Have a promo code? Apply it on the{' '}
                  <a className="underline" href="/cart">
                    Cart page
                  </a>
                  .
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="text-sm font-semibold">{formatPrice(total)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Link href="/cart" onClick={close} className="block">
                  <Button variant="secondary" className="w-full">
                    View Cart
                  </Button>
                </Link>
                <Link href="/checkout" onClick={close} className="block">
                  <Button className="w-full">Checkout</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}



