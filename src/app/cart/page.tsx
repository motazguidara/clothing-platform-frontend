"use client";

import React from "react";
import Link from "next/link";
import { useCart, useRemoveFromCart, useUpdateCartItem } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import PromoCodeForm from "@/components/PromoCodeForm";
import CollectionRail from "@/components/CollectionRail";
import { useCheckoutStore } from "@/store/checkout";

export default function CartPage() {
  const { data, isLoading } = useCart();
  const remove = useRemoveFromCart();
  const items = data?.items ?? [];
  const updateQty = useUpdateCartItem();
  const [qtyMap, setQtyMap] = React.useState<Record<number, number>>({});
  React.useEffect(() => {
    const init: Record<number, number> = {};
    for (const it of items as any[]) {
      const key = Number((it as any).id);
      const q = Number((it as any).quantity ?? 1);
      if (Number.isFinite(key)) init[key] = Math.max(1, Number.isFinite(q) ? q : 1);
    }
    setQtyMap(init);
  }, [items.length]);
  const getQty = (id: number, fallback: number = 1) => {
    const key = Number(id);
    return Number.isFinite(key) ? (qtyMap[key] ?? fallback) : fallback;
  };
  const subtotal = items.reduce((sum: number, it: any) => sum + (it.price || 0) * getQty(it.id, it.quantity || 1), 0);
  const [coupon, setCoupon] = React.useState<{ code: string; discount: number } | null>(null);
  const discountAmount = coupon ? (subtotal * coupon.discount) / 100 : 0;
  const FREE_THRESHOLD = 300; // dt
  const BASE_SHIP = 7; // dt
  const withDiscount = Math.max(0, subtotal - discountAmount);
  const shipping = withDiscount >= FREE_THRESHOLD ? 0 : BASE_SHIP;
  const total = withDiscount + shipping;
  const remainingForFree = Math.max(0, FREE_THRESHOLD - withDiscount);
  const payment = useCheckoutStore((s) => s.payment);
  const setPayment = useCheckoutStore((s) => s.setPayment);
  const itemSavings = items.reduce((sum: number, it: any) => {
    const qty = getQty(it.id, it.quantity || 1);
    const op = typeof it.original_price === 'number' ? it.original_price : undefined;
    if (typeof op === 'number' && typeof it.price === 'number' && op > it.price) {
      return sum + (op - it.price) * qty;
    }
    return sum;
  }, 0);
  const totalSavings = itemSavings + discountAmount;
  const hasDiscounts = totalSavings > 0;

  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight uppercase">Bag</h1>
      <p className="text-muted mt-2">Review items and proceed to checkout.</p>
      <div className="mt-3 text-sm rounded-md border border-border p-3 bg-subtle space-y-2">
        {!hasDiscounts ? (
          <div>
            <div className="font-semibold">Good choice!</div>
            <div>Here you get proven quality at a reasonable price.</div>
          </div>
        ) : (
          <div>
            <div className="font-semibold">Smart shopping!</div>
            <div>With our promotions and discounts you save {formatPrice(totalSavings, "TND")}.</div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded-md bg-subtle animate-pulse" />
            ))}
          </div>
          <div className="border rounded-md p-4 h-48 bg-subtle animate-pulse" />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {items.length === 0 ? (
              <div className="text-sm text-muted">Your bag is empty.</div>
            ) : (
              <ul className="divide-y divide-border" role="list">
                {items.map((it: any) => (
                  <li key={it.id} className="py-4 flex gap-4 items-start">
                    <div className="h-20 w-20 bg-subtle rounded" />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-semibold">{it.product_title ?? "Item"}</div>
                          {(it.variant?.name || it.variant_name) && (
                            <div className="text-xs text-muted">{it.variant?.name || it.variant_name}</div>
                          )}
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              className="h-8 w-8 border rounded-md flex items-center justify-center text-sm"
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
                              className="w-14 text-center border rounded-md h-8 text-sm"
                              aria-label="Quantity"
                            />
                            <button
                              className="h-8 w-8 border rounded-md flex items-center justify-center text-sm"
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
                          <div className="text-xs text-muted">Unit: {formatPrice((it.price || 0), "TND")}</div>
                          <div className="text-sm font-semibold">{formatPrice((it.price || 0) * getQty(it.id, it.quantity || 1), "TND")}</div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <button className="text-xs underline" onClick={() => remove.mutate(it.id)}>Remove</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {/* Free delivery progress below items */}
            <div className="mt-6 rounded-md border border-border bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                {withDiscount >= FREE_THRESHOLD ? (
                  <span className="text-sm font-semibold">🎉 You qualify for FREE delivery!</span>
                ) : (
                  <span className="text-sm">Spend {formatPrice(remainingForFree, "TND")} more to get <span className="font-semibold">FREE delivery</span>.</span>
                )}
              </div>
              {(() => {
                const pct = Math.min(100, Math.round((withDiscount / FREE_THRESHOLD) * 100));
                return (
                  <div className="relative h-3 w-full rounded-full bg-green-100 border border-green-300 overflow-hidden" aria-label="Progress to free delivery" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} role="progressbar">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                    <div className="absolute inset-0 flex items-center">
                      <div className="ml-auto mr-2 text-[10px] font-semibold text-green-800">{pct}%</div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          <aside className="border rounded-md p-4 space-y-4 h-max">
            <div className="flex items-center justify-between mb-1">
              <span className="text-base font-semibold">Summary</span>
              <span className="text-xs text-muted">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Subtotal</span>
              <span className="text-sm font-semibold">{formatPrice(subtotal, "TND")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Discount</span>
              <span className="text-sm font-semibold">{coupon ? `- ${coupon.discount}%` : formatPrice(0, "TND")}</span>
            </div>
            <PromoCodeForm onApplied={(code, discount) => setCoupon({ code, discount })} />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Delivery</span>
              <span className="text-sm font-semibold">{shipping === 0 ? "Free" : formatPrice(shipping, "TND")}</span>
            </div>
            <p className="text-xs text-muted -mt-2">Delivery in 1–2 days.</p>
            <div>
              <div className="text-xs font-semibold uppercase tracking-tight mb-2">Payment</div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="payment" checked={payment === "card"} onChange={() => setPayment("card")} />
                  Card
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="payment" checked={payment === "cod"} onChange={() => setPayment("cod")} />
                  Pay on delivery
                </label>
              </div>
            </div>
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-sm font-semibold">{formatPrice(total, "TND")}</span>
            </div>
            <Link href="/checkout" className="block">
              <button className="mt-2 w-full inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold hover:opacity-90 transition disabled:opacity-50" disabled={items.length === 0}>
                Checkout
              </button>
            </Link>
          </aside>
        </div>
      )}

      {/* Sticky mobile summary bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-white/90 backdrop-blur px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-muted">Subtotal</div>
          <div className="text-sm font-semibold">{formatPrice(total, "TND")}</div>
        </div>
        <Link href="/checkout" className="block">
          <button className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold disabled:opacity-50" disabled={items.length === 0}>
            Checkout
          </button>
        </Link>
      </div>
      {/* You Might Also Like */}
      <div className="mt-16 border-t pt-8">
        <CollectionRail title="You Might Also Like" params={{ ordering: "-bestseller" }} />
      </div>
    </section>
  );
}



