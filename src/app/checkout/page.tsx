"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useCart, useCheckout } from "@/hooks/useCart";
import type { CartItem } from "@/hooks/useCart";
import { useToast } from "@/providers/toast-provider";
import { formatPrice } from "@/lib/utils";
import { useCheckoutStore } from "@/store/checkout";
import { useAuth } from "@/hooks/useAuth";

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

type CheckoutCartItem = CartItem & {
  product_title?: string;
};

const CHECKOUT_STEPS: Array<{ key: "shipping" | "payment" | "review"; label: string }> = [
  { key: "shipping", label: "Shipping" },
  { key: "payment", label: "Payment" },
  { key: "review", label: "Review" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const checkout = useCheckout();
  const { data: cart, isLoading: cartLoading } = useCart();
  const { toast } = useToast();
  const auth = useAuth({ fetchProfile: true });
  const paymentPreference = useCheckoutStore((s) => s.payment);
  const setPaymentPreference = useCheckoutStore((s) => s.setPayment);
  const [step, setStep] = React.useState<"shipping" | "payment" | "review">("shipping");
  const [form, setForm] = React.useState<CheckoutForm>(() => ({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
    paymentMethod: paymentPreference,
  }));
  const [deliveryMethod, setDeliveryMethod] = React.useState<"standard" | "express">("standard");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const currentStepIndex = React.useMemo(
    () => CHECKOUT_STEPS.findIndex((item) => item.key === step),
    [step]
  );

  // Prefill with logged-in user profile when available (non-destructive: only fill empty fields)
  React.useEffect(() => {
    if (!auth.user) return;
    setForm((prev) => {
      const addr = Array.isArray((auth.user as any)?.addresses) ? (auth.user as any).addresses[0] : undefined;
      return {
        ...prev,
        email: prev.email || auth.user.email || "",
        firstName: prev.firstName || auth.user.first_name || "",
        lastName: prev.lastName || auth.user.last_name || "",
        phone: prev.phone || (addr?.phone ?? (auth.user as any)?.phone ?? ""),
        address: prev.address || addr?.address_line_1 || "",
        city: prev.city || addr?.city || "",
        postalCode: prev.postalCode || addr?.postal_code || "",
      };
    });
  }, [auth.user]);
  React.useEffect(() => {
    setForm((prev) =>
      prev.paymentMethod === paymentPreference
        ? prev
        : {
            ...prev,
            paymentMethod: paymentPreference,
          }
    );
  }, [paymentPreference]);

  const items: CheckoutCartItem[] = React.useMemo(() => {
    if (!Array.isArray(cart?.items)) {
      return [];
    }
    return cart.items as CheckoutCartItem[];
  }, [cart?.items]);
  const outOfStock = React.useMemo(
    () => items.filter((item) => item.in_stock === false),
    [items]
  );
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const qualifiesForFreeShipping = subtotal >= 300;
  const shipping =
    deliveryMethod === "express" ? 18 : qualifiesForFreeShipping ? 0 : 7;
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + shipping + tax;

  const updateForm = (updates: Partial<CheckoutForm>) => {
    if (updates.paymentMethod) {
      setPaymentPreference(updates.paymentMethod);
    }
    setForm((prev) => ({ ...prev, ...updates }));
    // Clear errors on change for the updated fields
    const cleared = { ...fieldErrors };
    Object.keys(updates).forEach((k) => delete cleared[k as keyof CheckoutForm]);
    setFieldErrors(cleared);
  };

  const validateShipping = () => {
    const errors: Record<string, string> = {};
    if (!form.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) {
      errors.email = "Enter a valid email";
    }
    if (!form.firstName || form.firstName.trim().length < 2) {
      errors.firstName = "Enter a valid first name";
    }
    if (!form.lastName || form.lastName.trim().length < 2) {
      errors.lastName = "Enter a valid last name";
    }
    if (!form.address || form.address.trim().length < 5) {
      errors.address = "Enter a full address";
    }
    if (!form.city || form.city.trim().length < 2) {
      errors.city = "Enter a city";
    }
    if (!form.postalCode || !/^\d{3,}$/.test(form.postalCode.trim())) {
      errors.postalCode = "Enter a numeric postal code";
    }
    if (!form.phone || !/^\+?\d{8,15}$/.test(form.phone.trim())) {
      errors.phone = "Enter a valid phone number";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePayment = () => {
    if (form.paymentMethod === "cod") return true;
    const errors: Record<string, string> = { ...fieldErrors };
    const card = (form.cardNumber || "").replace(/\s+/g, "");
    const cvv = (form.cvv || "").trim();
    const expiry = (form.expiryDate || "").trim();
    const cardNameOk = (form.cardName || "").trim().length >= 2;
    const cardOk = /^\d{12,19}$/.test(card);
    const cvvOk = /^\d{3,4}$/.test(cvv);
    const expiryOk = /^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry);
    if (!cardOk) errors.cardNumber = "Enter a valid card number";
    if (!cvvOk) errors.cvv = "Enter a valid CVV";
    if (!expiryOk) errors.expiryDate = "Use MM/YY";
    if (!cardNameOk) errors.cardName = "Enter cardholder name";
    setFieldErrors(errors);
    return Boolean(cardOk && cvvOk && expiryOk && cardNameOk);
  };

  const handleContinueToNextStep = () => {
    const ok = validateShipping();
    if (!ok) {
      toast({ title: "Please correct highlighted shipping fields", variant: "destructive" });
      return;
    }
    if (outOfStock.length > 0) {
      toast({ title: "Remove out-of-stock items before continuing", variant: "destructive" });
      return;
    }
    if (form.paymentMethod === "cod") {
      setStep("review");
    } else {
      setStep("payment");
    }
  };

  const handleSubmit = async () => {
    const okShip = validateShipping();
    const okPay = validatePayment();
    if (outOfStock.length > 0) {
      toast({ title: "Remove out-of-stock items before placing the order", variant: "destructive" });
      return;
    }
    if (!okShip || !okPay) {
      toast({ title: "Please correct highlighted fields", variant: "destructive" });
      return;
    }

    try {
      const order = await checkout.mutateAsync({
        email: form.email.trim(),
        first_name: form.firstName,
        last_name: form.lastName,
      });
      const orderId =
        typeof order === "object" &&
        order !== null &&
        "id" in order &&
        (typeof (order as { id?: unknown }).id === "string" || typeof (order as { id?: unknown }).id === "number")
          ? (order as { id?: number | string }).id
          : undefined;
      if (typeof window !== "undefined") {
        const summary = {
          orderId,
          items: items.map((item) => ({
            id: item.id ?? item.product_id,
            name: item.product_title ?? item.product_name ?? "Item",
            quantity: item.quantity,
            price: item.price,
          })),
          totals: {
            subtotal,
            shipping,
            tax,
            total,
          },
          email: form.email.trim(),
        };
        window.sessionStorage.setItem("last-order-summary", JSON.stringify(summary));
      }
      toast({ title: "Order placed successfully!", variant: "success" });
      const thankYouPath = orderId ? `/checkout/thank-you?order=${orderId}` : "/checkout/thank-you";
      router.push(thankYouPath);
    } catch (error: unknown) {
      const message =
        typeof error === "object" && error !== null && "message" in error && typeof (error as { message?: unknown }).message === "string"
          ? (error as { message: string }).message
          : "Failed to place order";
      toast({ title: message, variant: "destructive" });
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
          {CHECKOUT_STEPS.map((stepItem, index) => {
            const isCurrent = index === currentStepIndex;
            const isCompleted = currentStepIndex > index;
            const circleClass = isCurrent
              ? "bg-black text-white"
              : isCompleted
                ? "bg-green-500 text-white"
                : "bg-gray-200 text-gray-600";
            return (
              <div key={stepItem.key} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${circleClass}`}
                >
                  {isCompleted ? <Check className="h-4 w-4" aria-hidden /> : index + 1}
                </div>
                <span
                  className={`ml-2 text-sm ${isCurrent ? "font-semibold text-foreground" : "text-gray-600"}`}
                >
                  {stepItem.label}
                </span>
                {index < CHECKOUT_STEPS.length - 1 && <div className="flex-1 h-px bg-gray-200 mx-4" />}
              </div>
            );
          })}
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
                    type="email" id="checkout_email" name="email"
                    value={form.email}
                    onChange={(e) => updateForm({ email: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${fieldErrors.email ? "border-red-500" : ""}`}
                    placeholder="your@email.com"
                    required
                  />
                  {fieldErrors.email && <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">First Name</label>
                    <input
                      type="text"
                      id="checkout_first_name" name="firstName" value={form.firstName}
                      onChange={(e) => updateForm({ firstName: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${fieldErrors.firstName ? "border-red-500" : ""}`}
                      required
                    />
                    {fieldErrors.firstName && <p className="text-xs text-red-600 mt-1">{fieldErrors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Last Name</label>
                    <input
                      type="text"
                      id="checkout_last_name" name="lastName" value={form.lastName}
                      onChange={(e) => updateForm({ lastName: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${fieldErrors.lastName ? "border-red-500" : ""}`}
                      required
                    />
                    {fieldErrors.lastName && <p className="text-xs text-red-600 mt-1">{fieldErrors.lastName}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => updateForm({ address: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${fieldErrors.address ? "border-red-500" : ""}`}
                    placeholder="123 Main Street"
                    required
                  />
                  {fieldErrors.address && <p className="text-xs text-red-600 mt-1">{fieldErrors.address}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">City</label>
                    <input
                      type="text"
                      id="checkout_city" name="city" value={form.city}
                      onChange={(e) => updateForm({ city: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${fieldErrors.city ? "border-red-500" : ""}`}
                      required
                    />
                    {fieldErrors.city && <p className="text-xs text-red-600 mt-1">{fieldErrors.city}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Postal Code</label>
                    <input
                      type="text"
                      id="checkout_postal" name="postalCode" value={form.postalCode}
                      onChange={(e) => updateForm({ postalCode: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${fieldErrors.postalCode ? "border-red-500" : ""}`}
                      required
                    />
                    {fieldErrors.postalCode && <p className="text-xs text-red-600 mt-1">{fieldErrors.postalCode}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel" id="checkout_phone" name="phone"
                    value={form.phone}
                    onChange={(e) => updateForm({ phone: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${fieldErrors.phone ? "border-red-500" : ""}`}
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                  {fieldErrors.phone && <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>}
                </div>
              </div>
              <div className="mt-4 rounded-md border border-border bg-gray-50 p-4">
                <p className="text-sm font-semibold mb-2">Delivery options</p>
                <div className="space-y-3 text-sm">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="standard"
                      checked={deliveryMethod === "standard"}
                      onChange={() => setDeliveryMethod("standard")}
                    />
                    <span>
                      <span className="block font-medium text-foreground">Standard delivery</span>
                      <span className="block text-xs text-muted">
                        {qualifiesForFreeShipping ? "Free" : formatPrice(7, "TND")} - arrives in 2-3 business days.
                      </span>
                    </span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="express"
                      checked={deliveryMethod === "express"}
                      onChange={() => setDeliveryMethod("express")}
                    />
                    <span>
                      <span className="block font-medium text-foreground">Express delivery</span>
                      <span className="block text-xs text-muted">
                        {formatPrice(18, "TND")} - next-day delivery with real-time tracking.
                      </span>
                    </span>
                  </label>
                </div>
                <p className="mt-2 text-xs text-muted">
                  You can change the delivery option later during checkout review.
                </p>
              </div>
              <button
                onClick={handleContinueToNextStep}
                className="mt-6 w-full bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition"
              >
                {form.paymentMethod === "cod" ? "Continue to Review" : "Continue to Payment"}
              </button>
            </div>
          )}

          {step === "payment" && (
            <div className="border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
              <div className="space-y-4">
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={form.paymentMethod === "card"}
                        onChange={(e) => updateForm({ paymentMethod: e.target.value as "card" | "cod" })}
                      />
                      <span className="font-medium">Pay with card</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={form.paymentMethod === "cod"}
                        onChange={(e) => updateForm({ paymentMethod: e.target.value as "card" | "cod" })}
                      />
                      <span className="font-medium">Pay on delivery</span>
                    </label>
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <span>Accepted:</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                        Visa | MasterCard | PayPal
                      </span>
                    </div>
                  </div>

                {form.paymentMethod === "card" && (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <label className="block text-sm font-medium mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        id="checkout_card_name" name="cardName" value={form.cardName ?? ""}
                        onChange={(e) => updateForm({ cardName: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${fieldErrors.cardName ? "border-red-500" : ""}`}
                        placeholder="John Doe"
                        required
                      />
                      {fieldErrors.cardName && <p className="text-xs text-red-600 mt-1">{fieldErrors.cardName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Card Number</label>
                      <input
                        type="text"
                        id="checkout_card_number" name="cardNumber" value={form.cardNumber ?? ""}
                        onChange={(e) => updateForm({ cardNumber: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${fieldErrors.cardNumber ? "border-red-500" : ""}`}
                        placeholder="1234 5678 9012 3456"
                        required
                      />
                      {fieldErrors.cardNumber && <p className="text-xs text-red-600 mt-1">{fieldErrors.cardNumber}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Expiry Date</label>
                        <input
                          type="text"
                          id="checkout_expiry" name="expiryDate" value={form.expiryDate ?? ""}
                          onChange={(e) => updateForm({ expiryDate: e.target.value })}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${fieldErrors.expiryDate ? "border-red-500" : ""}`}
                          placeholder="MM/YY"
                          required
                        />
                        {fieldErrors.expiryDate && <p className="text-xs text-red-600 mt-1">{fieldErrors.expiryDate}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">CVV</label>
                        <input
                          type="text"
                          id="checkout_cvv" name="cvv" value={form.cvv ?? ""}
                          onChange={(e) => updateForm({ cvv: e.target.value })}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${fieldErrors.cvv ? "border-red-500" : ""}`}
                          placeholder="123"
                          required
                        />
                        {fieldErrors.cvv && <p className="text-xs text-red-600 mt-1">{fieldErrors.cvv}</p>}
                      </div>
                    </div>
                    <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                      Secure payment powered by SSL and PCI DSS compliant processors. Your full card details are never stored.
                    </div>
                  </div>
                )}

                {form.paymentMethod === "cod" && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      Pay the courier with cash or card when the parcel arrives. No upfront payment required.
                    </p>
                    <p className="text-xs text-muted mt-2">
                      Please have the exact amount ready. Couriers can accept card payments on delivery in most regions.
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
                  onClick={() => validatePayment() ? setStep("review") : toast({ title: "Please complete payment information", variant: "destructive" })}
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
                <div>
                  <h3 className="font-medium">Delivery Option</h3>
                  <p className="text-sm text-gray-600">
                    {deliveryMethod === "express" ? "Express delivery (next day)" : "Standard delivery (2-3 days)"}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setStep(form.paymentMethod === "cod" ? "shipping" : "payment")}
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
            {items.map((item) => (
              <div key={item.id ?? item.product_id} className="flex justify-between text-sm">
                <div>
                  <div className="font-medium">{item.product_title}</div>
                  <div className="text-gray-600">Qty: {item.quantity}</div>
                </div>
                <div className="font-medium">
                  {formatPrice(item.price * item.quantity, "TND")}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal, "TND")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Shipping ({deliveryMethod === "express" ? "Express" : "Standard"})</span>
              <span>{shipping === 0 ? "Free" : formatPrice(shipping, "TND")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax</span>
              <span>{formatPrice(tax, "TND")}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg border-t pt-2">
              <span>Total</span>
              <span>{formatPrice(total, "TND")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}






