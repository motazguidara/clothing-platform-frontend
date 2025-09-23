"use client";

import { create } from "zustand";

export type PaymentMethod = "card" | "cod";

type CheckoutState = {
  payment: PaymentMethod;
  setPayment: (p: PaymentMethod) => void;
};

export const useCheckoutStore = create<CheckoutState>((set) => ({
  payment: "card",
  setPayment: (p) => set({ payment: p }),
}));
