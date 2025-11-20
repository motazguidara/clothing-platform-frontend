"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/utils";

type OrderSummary = {
  orderId?: string | number | null;
  items: Array<{ id?: number | string; name: string; quantity: number; price: number }>;
  totals: { subtotal: number; shipping: number; tax: number; total: number };
  email?: string;
};

const SUMMARY_KEY = "last-order-summary";

export default function CheckoutThankYouPage() {
  const params = useSearchParams();
  const orderId = params.get("order");
  const { user, isLoading } = useAuth();
  const [summary, setSummary] = React.useState<OrderSummary | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem(SUMMARY_KEY);
    if (raw) {
      try {
        setSummary(JSON.parse(raw));
      } catch {
        setSummary(null);
      }
      window.sessionStorage.removeItem(SUMMARY_KEY);
    }
  }, []);

  const effectiveOrderId = orderId || summary?.orderId;
  const isLoggedIn = Boolean(user);
  const showTrackingButton = Boolean(!isLoading && isLoggedIn && effectiveOrderId);
  const continueLink = isLoggedIn ? "/catalog" : "/";

  return (
    <section className="max-w-4xl mx-auto px-6 py-20">
      <div className="text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-6 text-3xl">
          ✓
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Thank you for your order!</h1>
        <p className="mt-3 text-gray-600">
          We&apos;ve received your purchase and sent a confirmation email. You can keep browsing while we prepare everything.
        </p>
        {effectiveOrderId ? (
          <p className="mt-4 text-sm text-gray-500">
            Order reference <span className="font-semibold text-gray-900">#{effectiveOrderId}</span>
          </p>
        ) : null}
      </div>

      <div className="mt-10 rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Order recap</h2>
          {summary?.email ? <p className="text-sm text-gray-500">Confirmation sent to {summary.email}</p> : null}
        </div>
        {summary ? (
          <>
            <ul className="divide-y px-6">
              {summary.items.map((item) => (
                <li key={item.id ?? `${item.name}-${item.quantity}`} className="flex items-center justify-between py-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                </li>
              ))}
            </ul>
            <div className="border-t px-6 py-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(summary.totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{formatPrice(summary.totals.shipping)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>{formatPrice(summary.totals.tax)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-gray-900">
                <span>Total</span>
                <span>{formatPrice(summary.totals.total)}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="px-6 py-8 text-center text-sm text-gray-500">
            We&apos;ll email you a detailed receipt shortly.
          </div>
        )}
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href={continueLink}
          className="inline-flex items-center justify-center rounded-md bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800"
        >
          Continue shopping
        </Link>
        {showTrackingButton ? (
          <Link
            href={`/orders/${effectiveOrderId}`}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Track your order
          </Link>
        ) : null}
      </div>
    </section>
  );
}
