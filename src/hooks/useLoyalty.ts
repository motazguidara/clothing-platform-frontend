import { useQuery } from "@tanstack/react-query";
import { authService } from "@/lib/api/services/auth";
import type { LoyaltySummary } from "@/types";

export function useLoyalty(options?: { enabled?: boolean }) {
  return useQuery<LoyaltySummary>({
    queryKey: ["loyalty", "summary"],
    queryFn: () => authService.getLoyaltySummary(),
    enabled: options?.enabled ?? true,
    staleTime: 60 * 1000,
  });
}

export async function redeemLoyalty(points: number): Promise<{ points_used: number; discount_amount: number; remaining_points: number }> {
  if (!Number.isFinite(points) || points <= 0) {
    throw new Error("Points must be greater than zero");
  }
  const res = await authService.redeemLoyalty(points);
  return {
    points_used: res.points_used,
    discount_amount: typeof res.discount_amount === "string" ? Number(res.discount_amount) : Number(res.discount_amount || 0),
    remaining_points: res.remaining_points ?? 0,
  };
}
