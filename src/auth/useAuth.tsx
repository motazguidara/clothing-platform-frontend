"use client";

import React from "react";
import { apiClient } from "@/lib/api/client";
import { authService } from "@/lib/api/services/auth";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { setTokens, clearTokens, hydrateFromStorage, getRefreshToken } from "./tokenStore";

const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
});
export type User = z.infer<typeof UserSchema>;

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  login: (p: { email: string; password: string }) => Promise<void>;
  register: (p: { email: string; password: string; first_name?: string; last_name?: string }) => Promise<void>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

async function fetchMe(): Promise<User | null> {
  try {
    // Avoid calling the endpoint if we clearly have no auth context
    if (!getRefreshToken()) {
      return null;
    }
    const res = await apiClient.get("/accounts/auth/me/");
    return UserSchema.parse(res as unknown as any);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const qc = useQueryClient();
  const router = useRouter();

  React.useEffect(() => {
    hydrateFromStorage();
    (async () => {
      const u = await fetchMe();
      setUser(u);
      setLoading(false);
    })();
  }, []);

  const login = React.useCallback(async ({ email, password }: { email: string; password: string }) => {
    setLoading(true);
    try {
      const res = await authService.login({ email, password });
      const { access, refresh } = res;
      setTokens(access ?? null, refresh ?? null, true);
      const u = await fetchMe();
      setUser(u);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = React.useCallback(async (p: { email: string; password: string; first_name?: string; last_name?: string; terms_consent?: boolean }) => {
    setLoading(true);
    try {
      await authService.register({ 
        ...p, 
        password_confirm: p.password, 
        marketing_consent: false,
        terms_consent: p.terms_consent ?? true 
      });
      await login({ email: p.email, password: p.password });
    } finally {
      setLoading(false);
    }
  }, [login]);

  const logout = React.useCallback(() => {
    authService.logout().catch(() => {});
    clearTokens();
    setUser(null);
    qc.invalidateQueries({ queryKey: ["profile"] });
    router.replace("/login");
  }, [qc, router]);

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


