"use client";

import React from "react";
import { useUIStore } from "@/store/ui";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCart, useRemoveFromCart, useUpdateCartItem } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import { useWishlist } from "@/store/wishlist";
import { useToast } from "@/providers/toast-provider";

export function CartDrawer() {
  const isOpen = useUIStore((s) => s.isCartOpen);
  const close = useUIStore((s) => s.closeCart);
  const { data, isLoading } = useCart();
  const remove = useRemoveFromCart();
  const wish = useWishlist();
  const { show } = useToast();
  const updateQty = useUpdateCartItem();
  const items = React.useMemo(() => data?.items ?? [], [data?.items]);
  const [qtyMap, setQtyMap] = React.useState<Record<number, number>>({});
  React.useEffect(() => {
    const init: Record<number, number> = {};
    for (const it of items) init[it.id] = it.quantity ?? 1;
    setQtyMap(init);
  }, [items]);
  const getQty = (id: number, fallback: number = 1) => qtyMap[id] ?? fallback;
  const subtotal = items.reduce((sum: number, it: { price?: number; id: number; quantity?: number }) => sum + (Number(it.price ?? 0)) * getQty(it.id, it.quantity ?? 1), 0);
  const total = subtotal;
  return (
    <Sheet open={isOpen} onOpenChange={(v) => (v ? null : close())}>
      <SheetContent side="right" className="w-[400px] sm:w-[520px] bg-white text-foreground border-border">
        <SheetHeader>
          <SheetTitle>Your Bag</SheetTitle>
        </SheetHeader>
        <div className="py-6 px-2 sm:px-4 space-y-5">
          {isLoading && <p className="text-sm text-muted">Loading…</p>}
          {!isLoading && items.length === 0 && (
            <>
              <p className="text-sm text-muted">Your cart is empty.</p>
              <Button onClick={close} className="w-full">Continue shopping</Button>
            </>
          )}

          {!isLoading && items.length > 0 && (
            <div className="space-y-4">
              <ul className="divide-y divide-border" role="list">
                {items.map((it: any) => (
                  <li key={it.id} className="py-5 flex gap-4 items-start">
                    <div className="h-20 w-20 bg-subtle rounded" />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold leading-5">{it.product_title ?? "Item"}</div>
                          {it.variant && (
                            <div className="text-xs text-muted">{it.variant?.name}</div>
                          )}
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              className="h-7 w-7 border rounded-md flex items-center justify-center text-sm"
                              onClick={() => {
                                const next = Math.max(1, getQty(it.id) - 1);
                                setQtyMap((m) => ({ ...m, [it.id]: next }));
                                updateQty.mutate({ item_id: it.id, quantity: next });
                              }}
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min={1}
                              value={getQty(it.id)}
                              onChange={(e) => {
                                const val = Math.max(1, Number(e.target.value || 1));
                                setQtyMap((m) => ({ ...m, [it.id]: val }));
                              }}
                              onBlur={() => updateQty.mutate({ item_id: it.id, quantity: getQty(it.id) })}
                              className="w-12 text-center border rounded-md h-7 text-sm"
                              aria-label="Quantity"
                            />
                            <button
                              className="h-7 w-7 border rounded-md flex items-center justify-center text-sm"
                              onClick={() => {
                                const next = getQty(it.id) + 1;
                                setQtyMap((m) => ({ ...m, [it.id]: next }));
                                updateQty.mutate({ item_id: it.id, quantity: next });
                              }}
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="text-sm font-semibold">{formatPrice((it.price || 0) * getQty(it.id, it.quantity || 1))}</div>
                          <div className="flex gap-2 justify-end">
                            <button
                              className="text-xs underline"
                              onClick={() => {
                                const pid = (it as any).product_id ?? (it as any).id;
                                if (typeof pid === 'number') {
                                  wish.toggle(pid);
                                  show({ title: wish.has(pid) ? "Removed from wishlist" : "Added to wishlist", variant: "success" });
                                }
                              }}
                            >
                              Move to Wishlist
                            </button>
                            <button
                              className="text-xs underline"
                              onClick={() => remove.mutate(it.id)}
                              aria-label={`Remove ${it.product_title ?? "item"}`}
                            >
                              Remove
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
                <p className="text-xs text-muted">Have a promo code? Apply it on the <a className="underline" href="/cart">Cart page</a>.</p>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="text-sm font-semibold">{formatPrice(total)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Link href="/cart" onClick={close} className="block">
                  <Button variant="secondary" className="w-full">View Cart</Button>
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



