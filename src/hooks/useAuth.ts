import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/lib/api/services/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Types
export interface User {
  id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  is_staff?: boolean;
  is_active?: boolean;
  date_joined?: string;
  last_login?: string | null;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  user: User;
}

// Auth hooks
export function useAuth() {
  const qc = useQueryClient();
  const router = useRouter();

  // Check if user is authenticated
  const isAuthenticated = authService.isAuthenticated();

  // Get current user profile
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["auth", "profile"],
    queryFn: () => authService.getCurrentUser(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });

  // Handle login
  const login = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await authService.login(credentials);
      return response.user;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["auth"] });
      router.push("/dashboard");
    },
  });

  // Handle registration
  const register = useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      first_name?: string;
      last_name?: string;
    }) => {
      const response = await authService.register({
        ...data,
        password_confirm: data.password,
        marketing_consent: false, // Default to false, can be made configurable
      });
      return response.user;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["auth"] });
      router.push("/login");
    },
  });

  // Handle logout
  const logout = useMutation({
    mutationFn: async () => {
      await authService.logout();
    },
    onSuccess: () => {
      qc.clear();
      router.push("/login");
    },
  });

  // Handle token refresh
  useEffect(() => {
    if (error && (error as any)?.status === 401) {
      // If we get a 401, try to refresh the token
      authService.refreshToken().catch(() => {
        // If refresh fails, clear auth state
        authService.clearAuth();
        qc.clear();
      });
    }
  }, [error, qc]);

  return {
    user,
    isLoading: isLoading || login.isPending || register.isPending || logout.isPending,
    isAuthenticated: isAuthenticated && !!user,
    login: login.mutate,
    register: register.mutate,
    logout: logout.mutate,
    error: login.error || register.error || logout.error,
  };
}

// Protected route hook
export function useProtectedRoute(redirectTo = "/login") {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isLoading, isAuthenticated, router, redirectTo]);

  return { isLoading, isAuthenticated };
}
