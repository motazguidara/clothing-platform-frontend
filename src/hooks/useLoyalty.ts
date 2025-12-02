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
