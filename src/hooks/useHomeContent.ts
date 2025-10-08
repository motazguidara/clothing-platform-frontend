import { useQuery } from "@tanstack/react-query";
import { fetchHome } from "@/lib/api/home";
import type { HomePayload } from "@/types/home";

export function useHomeContent(initialData?: HomePayload | null) {
  return useQuery<HomePayload, Error>({
    queryKey: ["home", "content"],
    queryFn: fetchHome,
    initialData: initialData ?? undefined,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}
