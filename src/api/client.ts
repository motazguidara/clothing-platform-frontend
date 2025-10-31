import axios from "axios";
import { getAccessToken, getRefreshToken, setTokens } from "@/auth/tokenStore";

const API_BASE = process.env["NEXT_PUBLIC_API_URL"] ?? "";
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const access = getAccessToken();
  if (access && config.headers) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

let isRefreshing = false;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config ?? {};
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      if (isRefreshing) return Promise.reject(error);
      try {
        isRefreshing = true;
        const refresh = getRefreshToken();
        if (!refresh) throw new Error("No refresh token");
        const r = await axios.post(`${API_BASE}/accounts/auth/refresh/`, { refresh }, { headers: { "Content-Type": "application/json" } });
        const newAccess = r.data?.access;
        if (!newAccess) throw new Error("No new access token");
        setTokens(newAccess, undefined);
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch {
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;

