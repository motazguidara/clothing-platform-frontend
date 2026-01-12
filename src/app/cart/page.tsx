"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart, useRemoveFromCart, useUpdateCartItem } from "@/hooks/useCart";
import type { CartItem } from "@/hooks/useCart";
import type { Coupon } from "@/hooks/useCatalog";
import { useAuth } from "@/hooks/useAuth";
import { useLoyalty, redeemLoyalty } from "@/hooks/useLoyalty";
import { formatPrice } from "@/lib/utils";
import PromoCodeForm from "@/components/PromoCodeForm";
import CollectionRail from "@/components/CollectionRail";
import { useCheckoutStore } from "@/store/checkout";
import dynamic from "next/dynamic";

const CartPromotionRecommendations = dynamic(
  () => import("@/components/recommendations/CartPromotionRecommendations").then(mod => mod.CartPromotionRecommendations),
  { ssr: false }
);

type TrustBadge = {
  label: string;
  description: string;
  emoji: string;
};

const TRUST_BADGES: TrustBadge[] = [
  {
    label: "Secure checkout",
    description: "SSL encryption and buyer protection on every order.",
    emoji: "🛡️",
  },
  {
    label: "Flexible payment",
    description: "Visa • MasterCard • PayPal • Cash on delivery.",
    emoji: "💳",
  },
  {
    label: "Fast delivery",
    description: "Express and standard shipping with live tracking.",
    emoji: "🚚",
  },
];

type CartItemWithDetails = CartItem & {
  image?: string | null;
  product_image?: string | null;
  thumbnail?: string | null;
  original_price?: number;
  variant?: { name?: string | null } | null;
  variant_name?: string | null;
};

const SKELETON_ITEM_KEYS = ["cart-skeleton-1", "cart-skeleton-2", "cart-skeleton-3"];

const renderTrustBadge = ({ label, description, emoji }: TrustBadge) => (
  <div key={label} className="flex items-start gap-2 text-xs text-muted">
    <span className="text-base" aria-hidden>
      {emoji}
    </span>
    <div>
      <span className="font-semibold text-foreground">{label}</span>
      <span className="block leading-snug">{description}</span>
    </div>
  </div>
);

export default function CartPage() {
  const { data, isLoading } = useCart();
  const remove = useRemoveFromCart();
  const updateQty = useUpdateCartItem();
  const { isAuthenticated } = useAuth({ fetchProfile: false });
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const { data: loyalty, isLoading: loyaltyLoading } = useLoyalty({ enabled: isAuthenticated });
  const items: CartItemWithDetails[] = React.useMemo(() => {
    if (!Array.isArray(data?.items)) {
      return [];
    }
    return data.items as CartItemWithDetails[];
  }, [data?.items]);
  const [qtyMap, setQtyMap] = React.useState<Record<number, number>>({});

  const resolveItemKey = React.useCallback(
    (item: CartItemWithDetails) => item.id ?? item.product_id,
    []
  );

  React.useEffect(() => {
    const initialQuantities: Record<number, number> = {};
    items.forEach((item) => {
      const key = resolveItemKey(item);
      const quantity = Number.isFinite(item.quantity) ? item.quantity : 1;
      initialQuantities[key] = Math.max(1, quantity);
    });
    setQtyMap(initialQuantities);
  }, [items, resolveItemKey]);

  const getQty = (id: number, fallback = 1) => qtyMap[id] ?? fallback;

  const subtotal = items.reduce((sum, item) => {
    const key = resolveItemKey(item);
    const quantity = getQty(key, item.quantity);
    return sum + item.price * quantity;
  }, 0);

  const [coupon, setCoupon] = React.useState<Coupon | null>(null);
  const [couponFeedback, setCouponFeedback] = React.useState<string | null>(null);
  const [loyaltyDiscount, setLoyaltyDiscount] = React.useState(0);
  const [loyaltyApplied, setLoyaltyApplied] = React.useState(false);
  const [loyaltyError, setLoyaltyError] = React.useState<string | null>(null);
  const [pointsToRedeem, setPointsToRedeem] = React.useState(0);
  const discountAmount = React.useMemo(() => {
    if (!coupon) return 0;
    const value = typeof coupon.discount_value === "number" ? coupon.discount_value : Number(coupon.discount_value) || 0;
    if (coupon.discount_type === "fixed_amount") {
      return value;
    }
    return (subtotal * value) / 100;
  }, [coupon, subtotal]);
const FREE_THRESHOLD = 300;
const BASE_SHIP = 7;
const withDiscount = Math.max(0, subtotal - discountAmount - loyaltyDiscount);
const shipping = withDiscount >= FREE_THRESHOLD ? 0 : BASE_SHIP;
const total = withDiscount + shipping;
const remainingForFree = Math.max(0, FREE_THRESHOLD - withDiscount);
const estimatedPointsEarned = Math.floor(withDiscount / 5);

  const payment = useCheckoutStore((s) => s.payment);
  const setPayment = useCheckoutStore((s) => s.setPayment);

  const itemSavings = items.reduce((sum, item) => {
    const original = typeof item.original_price === "number" ? item.original_price : null;
    if (original !== null && original > item.price) {
      const key = resolveItemKey(item);
      const quantity = getQty(key, item.quantity);
      return sum + (original - item.price) * quantity;
    }
    return sum;
  }, 0);
  const totalSavings = itemSavings + discountAmount;
  const hasDiscounts = totalSavings > 0;
  const loyaltyBalance = loyalty?.points_balance ?? 0;

  const handleApplyPoints = async () => {
    if (!isAuthenticated) {
      setLoyaltyError("Sign in to use loyalty points.");
      return;
    }
    if (pointsToRedeem <= 0) {
      setLoyaltyError("Enter points to redeem.");
      return;
    }
    if (pointsToRedeem > loyaltyBalance) {
      setLoyaltyError("Not enough points.");
      return;
    }
    setLoyaltyError(null);
    try {
      const res = await redeemLoyalty(pointsToRedeem);
      setLoyaltyDiscount(res.discount_amount || 0);
      setLoyaltyApplied(true);
    } catch (err: any) {
      setLoyaltyError(err?.message || "Unable to apply points.");
      setLoyaltyDiscount(0);
      setLoyaltyApplied(false);
    }
  };

  const handleQuantityChange = (item: CartItemWithDetails, delta: number) => {
    const key = resolveItemKey(item);
    const nextQuantity = Math.max(1, getQty(key, item.quantity) + delta);
    setQtyMap((map) => ({ ...map, [key]: nextQuantity }));
    if (typeof item.id === "number") {
      updateQty.mutate({ item_id: item.id, quantity: nextQuantity });
    }
  };

  const handleRemove = (item: CartItemWithDetails) => {
    if (typeof item.id === "number") {
      remove.mutate(item.id);
    }
  };

  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight uppercase">Cart</h1>
      <p className="text-muted mt-2">Review your items before checking out.</p>

      <div className="mt-3 text-sm rounded-md border border-border p-3 bg-subtle space-y-2">
        {!hasDiscounts ? (
          <>
            <div className="font-semibold">Good choice!</div>
            <div>Enjoy high-quality products at a fair price.</div>
          </>
        ) : (
          <>
            <div className="font-semibold">Smart shopping!</div>
            <div>You are saving {formatPrice(totalSavings, "TND")} with current offers.</div>
          </>
        )}
        {mounted && isAuthenticated && (
          <div className="text-xs text-gray-700">
            This order will earn approximately {estimatedPointsEarned} loyalty points.
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {SKELETON_ITEM_KEYS.map((skeletonKey) => (
              <div key={skeletonKey} className="h-24 rounded-md bg-subtle animate-pulse" />
            ))}
          </div>
          <div className="border rounded-md p-4 h-48 bg-subtle animate-pulse" />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {items.length === 0 ? (
              <div className="text-sm text-muted">Your cart is empty.</div>
            ) : (
              <ul className="divide-y divide-border" role="list">
                {items.map((item) => {
                  const key = resolveItemKey(item);
                  const coverImage = [item.image, item.product_image, item.thumbnail].find(
                    (src): src is string => typeof src === "string" && src.trim().length > 0
                  );
                  const variantName = (() => {
                    if (typeof item.variant?.name === "string") {
                      const trimmed = item.variant.name.trim();
                      if (trimmed.length > 0) {
                        return trimmed;
                      }
                    }
                    if (typeof item.variant_name === "string") {
                      const trimmed = item.variant_name.trim();
                      if (trimmed.length > 0) {
                        return trimmed;
                      }
                    }
                    return null;
                  })();
                  const quantity = getQty(key, item.quantity);
                  const skuDisplay =
                    typeof item.sku === "string" && item.sku.trim().length > 0 ? item.sku.trim() : "";

                  const productHref = `/products/${item.product_slug ?? item.product_id}`;

                  return (
                    <li key={key} className="py-4 flex gap-4 items-start">
                      <Link href={productHref} className="relative h-20 w-20 rounded border bg-subtle overflow-hidden flex-shrink-0">
                        {coverImage ? (
                          <Image
                            src={coverImage}
                            alt={item.product_title ?? "Product image"}
                            fill
                            sizes="80px"
                            className="object-contain p-1"
                          />
                        ) : (
                          <div className="h-full w-full grid place-content-center text-[11px] text-muted">
                            No image
                          </div>
                        )}
                      </Link>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <Link href={productHref} className="text-sm font-semibold hover:underline">
                              {item.product_title ?? "Item"}
                            </Link>
                            {variantName && (
                              <div className="text-xs text-muted">{variantName}</div>
                            )}
                            <div className="mt-2 flex items-center gap-2">
                              <button
                                className="h-8 w-8 border rounded-md flex items-center justify-center text-sm"
                                onClick={() => {
                                  handleQuantityChange(item, -1);
                                }}
                                aria-label="Decrease quantity"
                              >
                                -
                              </button>
                              <span className="w-10 text-center text-sm">{quantity}</span>
                              <button
                                className="h-8 w-8 border rounded-md flex items-center justify-center text-sm"
                                onClick={() => {
                                  handleQuantityChange(item, 1);
                                }}
                                aria-label="Increase quantity"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="text-xs text-muted">
                              Unit: {formatPrice(item.price, "TND")}
                            </div>
                            <div className="text-sm font-semibold">
                              {formatPrice(item.price * quantity, "TND")}
                            </div>
                            {typeof item.original_price === "number" && item.original_price > item.price && (
                              <div className="text-xs text-muted line-through">
                                {formatPrice(item.original_price * quantity, "TND")}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-xs">
                          <button
                            className="text-red-500 hover:underline"
                            onClick={() => handleRemove(item)}
                          >
                            Remove
                          </button>
                          <span className="text-muted">SKU: {skuDisplay.length > 0 ? skuDisplay : "N/A"}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-6 rounded-md border border-border bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                {withDiscount >= FREE_THRESHOLD ? (
                  <span className="text-sm font-semibold">You qualify for free delivery!</span>
                ) : (
                  <span className="text-sm">
                    Spend {formatPrice(remainingForFree, "TND")} more to unlock{" "}
                    <span className="font-semibold">free delivery</span>.
                  </span>
                )}
              </div>
              {(() => {
                const pct = Math.min(100, Math.round((withDiscount / FREE_THRESHOLD) * 100));
                return (
                  <div
                    className="relative h-3 w-full rounded-full bg-green-100 border border-green-300 overflow-hidden"
                    aria-label="Progress to free delivery"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={pct}
                    role="progressbar"
                  >
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
              <span className="text-xs text-muted">
                {items.length} {items.length === 1 ? "item" : "items"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Subtotal</span>
              <span className="text-sm font-semibold">{formatPrice(subtotal, "TND")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Discount</span>
              <span className="text-sm font-semibold text-green-700">
                {coupon || loyaltyApplied
                  ? `- ${formatPrice(discountAmount + loyaltyDiscount, "TND")}`
                  : formatPrice(0, "TND")}
              </span>
            </div>
            <PromoCodeForm
              onApplied={(applied) => {
                setCoupon(applied);
                const value = typeof applied.discount_value === "number" ? applied.discount_value : Number(applied.discount_value) || 0;
                const saved =
                  applied.discount_type === "fixed_amount"
                    ? formatPrice(value, "TND")
                    : `${value}%`;
                setCouponFeedback(`Nice! Coupon ${applied.code} applied, saving ${saved}.`);
              }}
            />
            {coupon ? (
              <div className="text-xs text-green-700">
                Applied {coupon.code} ({coupon.discount_type === "fixed_amount" ? formatPrice(coupon.discount_value, "TND") : `${coupon.discount_value}%`} off)
              </div>
            ) : null}
            <div className="border rounded-md p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Loyalty points</span>
                <span className="text-xs text-gray-600">
                  {loyaltyLoading ? "Loading..." : `${loyaltyBalance} pts`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={loyaltyBalance}
                  value={pointsToRedeem}
                  onChange={(e) => setPointsToRedeem(Number(e.target.value) || 0)}
                  className="w-28 rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:border-black"
                  disabled={!isAuthenticated || loyaltyLoading}
                />
                <button
                  type="button"
                  onClick={handleApplyPoints}
                  disabled={!isAuthenticated || loyaltyLoading}
                  className="text-xs font-semibold px-3 py-2 rounded bg-black text-white hover:bg-black/85 disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
              {loyaltyApplied && loyaltyDiscount > 0 && (
                <div className="text-xs text-green-700">
                  Applied points worth {formatPrice(loyaltyDiscount, "TND")}.
                </div>
              )}
              {loyaltyError && <div className="text-xs text-red-600">{loyaltyError}</div>}
              {!isAuthenticated && (
                <div className="text-xs text-gray-600">Sign in to redeem points.</div>
              )}
            </div>
            {couponFeedback && (
              <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                {couponFeedback} 🎉
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Delivery</span>
              <span className="text-sm font-semibold">{shipping === 0 ? "Free" : formatPrice(shipping, "TND")}</span>
            </div>
            <p className="text-xs text-muted -mt-2">Fast delivery in 1â€“2 business days.</p>
            <div>
              <div className="text-xs font-semibold uppercase tracking-tight mb-2">Payment</div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    checked={payment === "cod"}
                    onChange={() => setPayment("cod")}
                  />
                  Pay on delivery
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    checked={payment === "card"}
                    onChange={() => setPayment("card")}
                  />
                  Pay with card
                </label>
              </div>
              <div className="mt-2 text-[11px] text-muted">
                {payment === "card"
                  ? "Visa, MasterCard and PayPal payments are fully encrypted."
                  : "Pay with cash when your parcel arrives. No extra fees."}
              </div>
            </div>
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-sm font-semibold">{formatPrice(total, "TND")}</span>
            </div>
            <Link href="/checkout" className="block">
              <button
                className="mt-2 w-full inline-flex items-center justify-center rounded-md border border-primary bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                disabled={items.length === 0}
              >
                Proceed to checkout
              </button>
            </Link>
            <div className="space-y-3 rounded-md border border-dashed border-border px-3 py-4">
              {TRUST_BADGES.map(renderTrustBadge)}
            </div>
          </aside>
        </div>
      )}

      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-white/90 backdrop-blur px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-muted">Total</div>
          <div className="text-sm font-semibold">{formatPrice(total, "TND")}</div>
        </div>
        <Link href="/checkout" className="block">
          <button
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold disabled:opacity-50"
            disabled={items.length === 0}
          >
            Checkout
          </button>
        </Link>
      </div>

      <div className="mt-16 border-t pt-8">
        <CartPromotionRecommendations
          excludeProductIds={items.map((it) => Number(it.product_id ?? it.id ?? 0)).filter(Boolean)}
          limit={6}
        />
      </div>
    </section>
  );
}


