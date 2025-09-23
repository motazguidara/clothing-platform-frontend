import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function setRefreshToken(token: string | null) {
  refreshToken = token;
}

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        if (!refreshToken) throw new Error('No refresh token');
        const r = await axios.post(`${API_BASE}/auth/refresh/`, { refresh: refreshToken }, { withCredentials: false, headers: { 'Content-Type': 'application/json' } });
        const newAccess = r.data?.access;
        if (newAccess) {
          setAccessToken(newAccess);
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${newAccess}`;
          return api(original);
        }
      } catch (e) {
        // fallthrough
      }
    }
    return Promise.reject(error);
  }
);

export default api;
