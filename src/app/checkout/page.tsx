"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart, useCheckout } from "@/hooks/useCart";
import { useToast } from "@/providers/toast-provider";
import { formatPrice } from "@/lib/utils";

interface CheckoutForm {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  paymentMethod: "card" | "cod";
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  cardName?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const checkout = useCheckout();
  const { data: cart, isLoading: cartLoading } = useCart();
  const { show } = useToast();
  const [step, setStep] = React.useState<"shipping" | "payment" | "review">("shipping");
  const [form, setForm] = React.useState<CheckoutForm>({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
    paymentMethod: "card",
  });

  const items = cart?.items || [];
  const subtotal = items.reduce((sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 1), 0);
  const shipping = subtotal >= 300 ? 0 : 7; // Free shipping over $300
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + shipping + tax;

  const updateForm = (updates: Partial<CheckoutForm>) => {
    setForm(prev => ({ ...prev, ...updates }));
  };

  const validateShipping = () => {
    const required = ["email", "firstName", "lastName", "address", "city", "postalCode", "phone"];
    return required.every(field => form[field as keyof CheckoutForm]?.toString().trim());
  };

  const validatePayment = () => {
    if (form.paymentMethod === "cod") return true;
    const required = ["cardNumber", "expiryDate", "cvv", "cardName"];
    return required.every(field => form[field as keyof CheckoutForm]?.toString().trim());
  };

  const handleSubmit = async () => {
    if (!validateShipping() || !validatePayment()) {
      show({ title: "Please fill in all required fields", variant: "error" });
      return;
    }

    try {
      const order = await checkout.mutateAsync();
      const orderId = (order as any)?.id;
      show({ title: "Order placed successfully!", variant: "success" });
      if (orderId) {
        router.push(`/orders/${orderId}`);
      } else {
        router.push("/orders");
      }
    } catch (error: any) {
      show({ 
        title: error?.message || "Failed to place order", 
        variant: "error" 
      });
    }
  };

  if (cartLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <div className="space-y-4">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Your cart is empty</h1>
        <p className="text-muted mt-2 mb-8">Add some items to your cart before checking out.</p>
        <Link href="/catalog" className="inline-flex items-center justify-center rounded-md bg-black text-white px-6 py-3 text-sm font-semibold hover:bg-gray-800 transition">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Checkout</h1>
        <p className="text-muted mt-2">Complete your order</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { key: "shipping", label: "Shipping" },
            { key: "payment", label: "Payment" },
            { key: "review", label: "Review" }
          ].map((stepItem, index) => (
            <div key={stepItem.key} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step === stepItem.key ? "bg-black text-white" : 
                ["shipping", "payment", "review"].indexOf(step) > index ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"
              }`}>
                {["shipping", "payment", "review"].indexOf(step) > index ? "✓" : index + 1}
              </div>
              <span className={`ml-2 text-sm ${step === stepItem.key ? "font-semibold" : "text-gray-600"}`}>
                {stepItem.label}
              </span>
              {index < 2 && <div className="flex-1 h-px bg-gray-200 mx-4"></div>}
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column - Forms */}
        <div className="space-y-6">
          {step === "shipping" && (
            <div className="border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Shipping Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateForm({ email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">First Name</label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(e) => updateForm({ firstName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Last Name</label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(e) => updateForm({ lastName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => updateForm({ address: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="123 Main Street"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">City</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => updateForm({ city: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Postal Code</label>
                    <input
                      type="text"
                      value={form.postalCode}
                      onChange={(e) => updateForm({ postalCode: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateForm({ phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </div>
              </div>
              <button
                onClick={() => validateShipping() ? setStep("payment") : show({ title: "Please fill in all shipping fields", variant: "error" })}
                className="mt-6 w-full bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition"
              >
                Continue to Payment
              </button>
            </div>
          )}

          {step === "payment" && (
            <div className="border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={form.paymentMethod === "card"}
                      onChange={(e) => updateForm({ paymentMethod: e.target.value as "card" | "cod" })}
                    />
                    <span>Credit/Debit Card</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={form.paymentMethod === "cod"}
                      onChange={(e) => updateForm({ paymentMethod: e.target.value as "card" | "cod" })}
                    />
                    <span>Cash on Delivery</span>
                  </label>
                </div>

                {form.paymentMethod === "card" && (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <label className="block text-sm font-medium mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        value={form.cardName || ""}
                        onChange={(e) => updateForm({ cardName: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Card Number</label>
                      <input
                        type="text"
                        value={form.cardNumber || ""}
                        onChange={(e) => updateForm({ cardNumber: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                        placeholder="1234 5678 9012 3456"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Expiry Date</label>
                        <input
                          type="text"
                          value={form.expiryDate || ""}
                          onChange={(e) => updateForm({ expiryDate: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                          placeholder="MM/YY"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">CVV</label>
                        <input
                          type="text"
                          value={form.cvv || ""}
                          onChange={(e) => updateForm({ cvv: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                          placeholder="123"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {form.paymentMethod === "cod" && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      Pay with cash when your order is delivered. A small COD fee may apply.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setStep("shipping")}
                  className="flex-1 border border-gray-300 px-6 py-3 rounded-md hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={() => validatePayment() ? setStep("review") : show({ title: "Please complete payment information", variant: "error" })}
                  className="flex-1 bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition"
                >
                  Review Order
                </button>
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Review Your Order</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Shipping Address</h3>
                  <p className="text-sm text-gray-600">
                    {form.firstName} {form.lastName}<br />
                    {form.address}<br />
                    {form.city}, {form.postalCode}<br />
                    {form.phone}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Payment Method</h3>
                  <p className="text-sm text-gray-600">
                    {form.paymentMethod === "card" ? `Card ending in ${form.cardNumber?.slice(-4)}` : "Cash on Delivery"}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setStep("payment")}
                  className="flex-1 border border-gray-300 px-6 py-3 rounded-md hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={checkout.isPending}
                  className="flex-1 bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition disabled:opacity-50"
                >
                  {checkout.isPending ? "Placing Order..." : "Place Order"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Order Summary */}
        <div className="border rounded-lg p-6 h-fit sticky top-4">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          <div className="space-y-3">
            {items.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <div>
                  <div className="font-medium">{item.product_title}</div>
                  <div className="text-gray-600">Qty: {item.quantity}</div>
                </div>
                <div className="font-medium">
                  {formatPrice((item.price || 0) * (item.quantity || 1), "USD")}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal, "USD")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Shipping</span>
              <span>{shipping === 0 ? "Free" : formatPrice(shipping, "USD")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax</span>
              <span>{formatPrice(tax, "USD")}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg border-t pt-2">
              <span>Total</span>
              <span>{formatPrice(total, "USD")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



