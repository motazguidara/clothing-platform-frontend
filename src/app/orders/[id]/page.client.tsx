"use client";

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useProtectedRoute } from "@/hooks/useAuth";
import { ordersService } from "@/lib/api/services/orders";
import type { Order } from "@/lib/api/schemas";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/providers/toast-provider";

type OrderDetailPageClientProps = {
  orderId: string;
};

function StatusBadge({ order }: { order: Order }) {
  const map: Record<Order["status"], { label: string; className: string }> = {
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

  const isCOD = `${order.payment_method}`.toLowerCase() === "cash_on_delivery";
  if (isCOD && ["processing", "shipped", "fulfilled"].includes(order.status)) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800">
        Delivering (Pay on delivery)
      </span>
    );
  }

  const s = map[order.status];
  if (!s) return null;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${s.className}`}>
      {s.label}
    </span>
  );
}

export function OrderDetailPageClient({ orderId }: OrderDetailPageClientProps) {
  useProtectedRoute(`/login?next=/orders/${orderId}`);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["orders", orderId],
    queryFn: async () => {
      try {
        const res = await ordersService.getOrder(orderId);
        console.debug("[orders] detail fetched", {
          id: orderId,
          status: res?.status,
          items: res?.items?.length ?? 0,
        });
        return res;
      } catch (error) {
        console.error("[orders] detail failed", { id: orderId, error });
        throw error;
      }
    },
    enabled: mounted,
    staleTime: 60_000,
  });

  const cancelMutation = useMutation({
    mutationFn: () => ordersService.cancelOrder(orderId),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(["orders", orderId], updatedOrder);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({ title: "Order cancelled successfully", variant: "success" });
    },
    onError: (error: unknown) => {
      const message =
        typeof error === "object" && error !== null && "message" in error
          ? String((error as { message?: unknown }).message || "Unable to cancel order.")
          : "Unable to cancel order.";
      toast({ title: message, variant: "destructive" });
    },
  });

  return (
    <section className="max-w-5xl mx-auto px-6 py-16">
      {(!mounted || isLoading) && (
        <div className="space-y-3">
          <div className="h-8 w-1/3 bg-subtle animate-pulse rounded" />
          <div className="h-40 bg-subtle animate-pulse rounded" />
        </div>
      )}

      {isError && (
        <div className="text-sm text-red-600">
          Failed to load order. Please go back to{" "}
          <Link href="/orders" className="underline">
            orders
          </Link>
          .
        </div>
      )}

      {!isLoading && !isError && data && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight uppercase">Order #{data.order_number}</h1>
              <p className="text-sm text-gray-600">Placed on {new Date(data.created_at).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge order={data} />
              {`${data.payment_method}`.toLowerCase() === "cash_on_delivery" && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  Pay on delivery
                </span>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 border rounded-lg">
              <div className="px-4 py-3 border-b font-medium">Items</div>
              <div className="divide-y">
                {data.items.map((it) => (
                  <div key={it.id} className="flex items-center justify-between p-4">
                    <div>
                      <div className="font-medium">{it.product.name}</div>
                      <div className="text-xs text-gray-500">
                        Qty {it.quantity}
                        {it.size ? ` · Size ${it.size}` : ""}
                        {it.color ? ` · ${it.color}` : ""}
                      </div>
                    </div>
                    <div className="text-sm font-semibold">{formatPrice(it.total_price, "TND")}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="border rounded-lg">
                <div className="px-4 py-3 border-b font-medium">Summary</div>
                <div className="p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(data.subtotal, "TND")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>{formatPrice(data.tax_amount, "TND")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{formatPrice(data.shipping_amount, "TND")}</span>
                  </div>
                  {data.discount_amount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount</span>
                      <span>-{formatPrice(data.discount_amount, "TND")}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 font-semibold text-base">
                    <span>Total</span>
                    <span>{formatPrice(data.total_amount, "TND")}</span>
                  </div>
                </div>
              </div>
              <div className="border rounded-lg">
                <div className="px-4 py-3 border-b font-medium">Shipping</div>
                <div className="p-4 text-sm text-gray-700">
                  <div>
                    {data.shipping_address.first_name} {data.shipping_address.last_name}
                  </div>
                  <div>{data.shipping_address.address_line_1}</div>
                  {data.shipping_address.address_line_2 && <div>{data.shipping_address.address_line_2}</div>}
                  <div>
                    {data.shipping_address.city} {data.shipping_address.state} {data.shipping_address.postal_code}
                  </div>
                  <div>{data.shipping_address.country}</div>
                </div>
              </div>
              {data.can_cancel && (
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="text-sm text-gray-700">
                    You can cancel this order while it is still processing.
                    {data.can_cancel_until ? (
                      <>
                        {" "}
                        This option is available until{" "}
                        <span className="font-semibold">
                          {new Date(data.can_cancel_until).toLocaleString()}
                        </span>
                        .
                      </>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => cancelMutation.mutate()}
                    disabled={cancelMutation.isPending}
                    className="w-full inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {cancelMutation.isPending ? "Cancelling…" : "Cancel this order"}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <Link
              href="/orders"
              className="inline-flex items-center rounded-md border px-4 py-2 text-sm hover:bg-gray-50 transition"
            >
              Back to orders
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
