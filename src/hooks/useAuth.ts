import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
import { authService } from "@/lib/api/services/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import type { User } from "@/lib/api/schemas";
import { clientConfig } from "@/lib/client-env";

// Re-export the User type from schemas
export type { User } from "@/lib/api/schemas";

interface AuthTokens {
  access: string;
  refresh: string;
  user: User;
}

// Auth hooks
export function useAuth(options?: { fetchProfile?: boolean }) {
  const qc = useQueryClient();
  const router = useRouter();

  // Check if user is authenticated
  const tokenAuthenticated = authService.isAuthenticated();
  const cookieSession = clientConfig.featureCookieJwt;

  // Get current user profile
  const shouldFetchProfile =
    (options?.fetchProfile ?? true) && (tokenAuthenticated || cookieSession);
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["auth", "profile"],
    queryFn: () => authService.getCurrentUser(),
    enabled: shouldFetchProfile, // prevent 401 spam when not logged in
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 0,
  });

  // Debug: log auth state in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Raw token flag vs. profile availability
      // eslint-disable-next-line no-console
      console.log('[useAuth] state', {
        hasToken: tokenAuthenticated,
        hasProfile: !!user,
        loading: isLoading,
        error: error ? (error as any)?.status || (error as any)?.message : null,
      });
    }
  }, [tokenAuthenticated, user, isLoading, error]);

  // Handle login
  const login = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await authService.login(credentials);
      // Normalize to user object
      const user = (response as any)?.user || null;
      return user;
    },
    onSuccess: (user) => {
      qc.invalidateQueries({ queryKey: ["auth"] });
      qc.setQueryData(['auth', 'user'], user);
      // Ensure server-side cart merge is surfaced
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      const errorMessage = error?.response?.data?.detail || 'Failed to log in. Please try again.';
      toast.error(errorMessage);
    }
  });

  // Handle registration
  const register = useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      first_name?: string;
      last_name?: string;
      marketing_consent?: boolean;
      terms_consent?: boolean;
    }) => {
      const payload: {
        email: string;
        password: string;
        password_confirm: string;
        marketing_consent: boolean;
        terms_consent: boolean;
        first_name?: string;
        last_name?: string;
      } = {
        email: data.email,
        password: data.password,
        password_confirm: data.password,
        marketing_consent: data.marketing_consent ?? false,
        terms_consent: data.terms_consent ?? true,
      };

      if (typeof data.first_name === 'string' && data.first_name.length > 0) {
        payload.first_name = data.first_name;
      }
      if (typeof data.last_name === 'string' && data.last_name.length > 0) {
        payload.last_name = data.last_name;
      }

      const response = await authService.register(payload);
      return (response as any)?.user || response;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["auth"] });
    },
  });

  // Handle logout
  const logout = useMutation({
    mutationFn: async () => {
      await authService.logout();
    },
    onSuccess: () => {
      // Invalidate key resources
      qc.invalidateQueries({ queryKey: ["auth"] });
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      router.push("/");
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
    // Expose raw token-based auth to avoid false negatives before profile loads
    isAuthenticated: tokenAuthenticated || (cookieSession ? !!user : false),
    hasProfile: !!user,
    login: login.mutate,
    loginAsync: login.mutateAsync,
    register: register.mutate,
    registerAsync: register.mutateAsync,
    logout: logout.mutate,
    error: login.error || register.error || logout.error,
  } as const;
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

