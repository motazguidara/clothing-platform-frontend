import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api, { setAccessToken, setRefreshToken } from "@/lib/api";
import { z } from "zod";

const TokenSchema = z.object({ access: z.string(), refresh: z.string() });
const ProfileSchema = z.object({ id: z.number(), email: z.string().email(), first_name: z.string().nullable(), last_name: z.string().nullable() });

export type AuthPayload = { email: string; password: string };
export type Tokens = z.infer<typeof TokenSchema>;
export type Profile = z.infer<typeof ProfileSchema>;

export function useLogin() {
  const qc = useQueryClient();
  return useMutation<Tokens, Error, AuthPayload>({
    mutationFn: async (data: AuthPayload) => {
      const res = await api.post("/auth/login/", data);
      const parsed = TokenSchema.parse(res.data);
      setAccessToken(parsed.access);
      setRefreshToken(parsed.refresh);
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_tokens', JSON.stringify(parsed));
      }
      return parsed;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation<Tokens, Error, AuthPayload>({
    mutationFn: async (data: AuthPayload) => {
      const res = await api.post("/auth/register/", data);
      // After register, login to get tokens
      const loginRes = await api.post("/auth/login/", data);
      const parsed = TokenSchema.parse(loginRes.data);
      setAccessToken(parsed.access);
      setRefreshToken(parsed.refresh);
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_tokens', JSON.stringify(parsed));
      }
      return parsed;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useProfile() {
  return useQuery<Profile>({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await api.get("/auth/me/");
      return ProfileSchema.parse(res.data);
    },
  });
}
