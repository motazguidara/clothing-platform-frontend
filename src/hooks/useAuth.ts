"use client";

import { useEffect, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { authService } from "@/lib/api/services/auth";
import type { User } from "@/lib/api/schemas";
import { clientConfig } from "@/lib/client-env";
import { ApiError } from "@/lib/api/client";

export type { User } from "@/lib/api/schemas";

type Credentials = { email: string; password: string };

type RegisterInput = {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  marketing_consent?: boolean;
  terms_consent?: boolean;
};

const AUTH_PROFILE_QUERY_KEY = ["auth", "profile"] as const;

export function useAuth(options?: { fetchProfile?: boolean }) {
  const qc = useQueryClient();
  const router = useRouter();

  const tokenAuthenticated = authService.isAuthenticated();
  const cookieSession = clientConfig.featureCookieJwt;
  const shouldFetchProfile =
    (options?.fetchProfile ?? true) && (tokenAuthenticated || cookieSession);

  const [storedUser, setStoredUser] = useState<User | undefined>(
    () => authService.getStoredUser() ?? undefined,
  );
  const effectiveStoredUser = shouldFetchProfile ? storedUser : undefined;

  const profileQueryOptions: UseQueryOptions<
    User | undefined,
    Error,
    User | undefined,
    typeof AUTH_PROFILE_QUERY_KEY
  > = {
    queryKey: AUTH_PROFILE_QUERY_KEY,
    enabled: shouldFetchProfile,
    queryFn: async () => authService.getCurrentUser(),
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 0,
  };

  if (effectiveStoredUser) {
    profileQueryOptions.initialData = effectiveStoredUser;
    profileQueryOptions.placeholderData = effectiveStoredUser;
  }

  const {
    data: user,
    isLoading: profileLoading,
    error,
  } = useQuery(profileQueryOptions);

  // Dev-time visibility to reduce auth debugging guesswork (log on change only)
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    // eslint-disable-next-line no-console
    console.debug("[auth] state", {
      tokenAuthenticated,
      cookieSession,
      shouldFetchProfile,
      profileLoading,
      hasUser: Boolean(user),
      storedUser: Boolean(storedUser),
      error: error ? (error as Error).message : null,
    });
  }, [
    tokenAuthenticated,
    cookieSession,
    shouldFetchProfile,
    profileLoading,
    user,
    storedUser,
    error,
  ]);

  useEffect(() => {
    if (user) {
      authService.storeUser(user);
      setStoredUser(user);
    }
  }, [user]);

  useEffect(() => {
    if (!error) return;
    if (error instanceof ApiError && error.status === 401) {
      authService.clearAuth();
      qc.removeQueries({ queryKey: AUTH_PROFILE_QUERY_KEY, exact: true });
      authService.clearStoredUser();
      setStoredUser(undefined);
    }
  }, [error, qc]);

  const login = useMutation({
    mutationFn: async (credentials: Credentials) => {
      const response = await authService.login(credentials);
      return (response as { user?: User }).user;
    },
    onSuccess: (loggedInUser) => {
      if (loggedInUser) {
        authService.storeUser(loggedInUser);
        setStoredUser(loggedInUser);
        qc.setQueryData(AUTH_PROFILE_QUERY_KEY, loggedInUser);
      }
      qc.invalidateQueries({ queryKey: AUTH_PROFILE_QUERY_KEY });
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (err: unknown) => {
      const apiError = err as ApiError & {
        response?: { data?: { detail?: string } };
      };
      const errorMessage =
        apiError?.response?.data?.detail ??
        apiError?.message ??
        "Failed to log in. Please try again.";
      toast.error(errorMessage);
    },
  });

  const register = useMutation({
    mutationFn: async (data: RegisterInput) => {
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

      const normalizedFirstName =
        typeof data.first_name === "string" && data.first_name.length > 0
          ? data.first_name
          : undefined;
      if (normalizedFirstName) {
        payload.first_name = normalizedFirstName;
      }

      const normalizedLastName =
        typeof data.last_name === "string" && data.last_name.length > 0
          ? data.last_name
          : undefined;
      if (normalizedLastName) {
        payload.last_name = normalizedLastName;
      }

      return authService.register(payload);
    },
    onSuccess: (result) => {
      const newUser = (result as { user?: User }).user;
      if (newUser) {
        authService.storeUser(newUser);
        setStoredUser(newUser);
        qc.setQueryData(AUTH_PROFILE_QUERY_KEY, newUser);
      }
      qc.invalidateQueries({ queryKey: AUTH_PROFILE_QUERY_KEY });
    },
    onError: (err: unknown) => {
      const apiError = err as ApiError & {
        response?: { data?: { detail?: string } };
      };
      const errorMessage =
        apiError?.response?.data?.detail ??
        apiError?.message ??
        "Registration failed. Please try again.";
      toast.error(errorMessage);
    },
  });

  const logout = useMutation({
    mutationFn: authService.logout.bind(authService),
    onSuccess: () => {
      authService.clearStoredUser();
      setStoredUser(undefined);
      qc.removeQueries({ queryKey: AUTH_PROFILE_QUERY_KEY, exact: true });
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      router.push("/");
    },
  });

  const isAuthenticated =
    tokenAuthenticated ||
    Boolean(user) ||
    (cookieSession && Boolean(storedUser));

  return {
    user,
    isLoading:
      profileLoading ||
      login.isPending ||
      register.isPending ||
      logout.isPending,
    isAuthenticated,
    hasProfile: Boolean(user),
    login: login.mutate,
    loginAsync: login.mutateAsync,
    register: register.mutate,
    registerAsync: register.mutateAsync,
    logout: logout.mutate,
    error: login.error ?? register.error ?? logout.error ?? error,
  } as const;
}

export function useProtectedRoute(redirectTo = "/login") {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isLoading, isAuthenticated, router, redirectTo]);

  return { isLoading, isAuthenticated } as const;
}
