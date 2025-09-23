import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(value?: number, currency: string = "USD") {
  if (typeof value !== "number") return "$0.00";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
}

// Simple loyalty points estimator: 1 point per $5, rounded down
export function estimatePoints(value?: number) {
  if (!value || value <= 0) return 0;
  return Math.floor(value / 5);
}
