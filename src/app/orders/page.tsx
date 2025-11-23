"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useProtectedRoute } from "@/hooks/useAuth";
import { ordersService } from "@/lib/api/services/orders";
import type { Order } from "@/lib/api/schemas";
import { formatPrice } from "@/lib/utils";

const STATUS_MAP: Record<Order["status"], { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-800" },
  awaiting_payment: { label: "Awaiting Payment", className: "bg-amber-100 text-amber-800" },
  confirmed: { label: "Confirmed", className: "bg-blue-100 text-blue-800" },
  processing: { label: "Processing", className: "bg-indigo-100 text-indigo-800" },
  paid: { label: "Paid", className: "bg-emerald-100 text-emerald-800" },
  fulfilled: { label: "Fulfilled", className: "bg-emerald-100 text-emerald-800" },
  shipped: { label: "Shipped", className: "bg-cyan-100 text-cyan-800" },
  delivered: { label: "Delivered", className: "bg-emerald-100 text-emerald-800" },
  cancelled: { label: "Cancelled", className: "bg-gray-200 text-gray-700" },
  refunded: { label: "Refunded", className: "bg-rose-100 text-rose-800" },
  failed: { label: "Failed", className: "bg-rose-100 text-rose-800" },
};

function getStatusDisplay(order: Order) {
  const isPayOnDelivery = `${order.payment_method}`.toLowerCase() === "cash_on_delivery";
  // Treat COD orders in transit as "Delivering" to highlight pay-on-delivery flow
  if (isPayOnDelivery && ["processing", "shipped", "fulfilled"].includes(order.status)) {
    return { label: "Delivering (Pay on delivery)", className: "bg-cyan-100 text-cyan-800" };
  }
  return STATUS_MAP[order.status];
}

function StatusBadge({ order }: { order: Order }) {
  const s = getStatusDisplay(order);
  if (!s) return null;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${s.className}`}>
      {s.label}
    </span>
  );
}

export default function OrdersPage() {
  const { isLoading: authLoading, isAuthenticated } = useProtectedRoute("/login?next=/orders");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["orders", { page: 1 }],
    queryFn: async () => {
      try {
        const res = await ordersService.getOrders({ page: 1 });
        // Lightweight debug to help trace payload shape in the console
        console.debug("[orders] list fetched", {
          count: res?.results?.length ?? 0,
          keys: res ? Object.keys(res) : [],
        });
        return res;
      } catch (error) {
        console.error("[orders] list failed", error);
        throw error;
      }
    },
    enabled: mounted && isAuthenticated && !authLoading,
    retry: false,
    staleTime: 60_000,
  });

  const orders = data?.results ?? [];

  // Avoid hydration mismatch by showing a stable placeholder until client mounts
  if (!mounted) {
    return (
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight uppercase">Your Orders</h1>
          <p className="text-muted mt-2">Track your purchases and their status.</p>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-md border bg-subtle animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-5xl mx-auto px-6 py-16">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight uppercase">Your Orders</h1>
        <p className="text-muted mt-2">Track your purchases and their status.</p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-md border bg-subtle animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="text-sm text-red-600">Failed to load your orders. Please refresh the page.</div>
      )}

      {!isLoading && !isError && orders.length === 0 && (
        <div className="text-center py-16 border rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h18M3 7h18M7 7v14m10-14v14M3 21h18" />
          </svg>
          <h2 className="mt-3 text-lg font-semibold">No orders yet</h2>
          <p className="mt-1 text-sm text-gray-600">Browse our catalog to place your first order.</p>
          <Link href="/catalog" className="mt-4 inline-flex items-center rounded-md bg-black text-white px-4 py-2 text-sm font-semibold hover:bg-gray-800 transition">Go to Catalog</Link>
        </div>
      )}

      {!isLoading && !isError && orders.length > 0 && (
        <div className="divide-y border rounded-lg">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
              <div>
                <div className="text-sm text-gray-500">Order</div>
                <div className="font-semibold">#{order.order_number}</div>
                <div className="text-xs text-gray-500">Placed on {new Date(order.created_at).toLocaleDateString()}</div>
              </div>
              <div className="text-right">
                <div className="mb-1 flex flex-wrap gap-2 justify-end">
                  <StatusBadge order={order} />
                  {`${order.payment_method}`.toLowerCase() === "cash_on_delivery" && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      Pay on delivery
                    </span>
                  )}
                </div>
                <div className="text-sm font-semibold">{formatPrice(order.total_amount, "TND")}</div>
                <div className="text-xs text-gray-500">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
