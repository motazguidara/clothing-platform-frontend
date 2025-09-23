"use client";

import React from "react";
import api from "@/lib/api";
import { setAccessToken } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { getRefreshToken, setTokens, clearTokens, hydrateFromStorage } from "./tokenStore";

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
    const res = await api.get("/auth/me/");
    return UserSchema.parse(res.data);
  } catch {
    return null;
  }
}

function persistAccess(access: string | null) {
  setAccessToken(access || null);
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
      const res = await api.post("/auth/login/", { email, password });
      const { access, refresh } = res.data || {};
      persistAccess(access || null);
      setTokens(access || null, refresh || null, true);
      const u = await fetchMe();
      setUser(u);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = React.useCallback(async (p: { email: string; password: string; first_name?: string; last_name?: string }) => {
    setLoading(true);
    try {
      await api.post("/auth/register/", p);
      await login({ email: p.email, password: p.password });
    } finally {
      setLoading(false);
    }
  }, [login]);

  const logout = React.useCallback(() => {
    clearTokens();
    persistAccess(null);
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


