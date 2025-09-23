let accessToken: string | null = null;
let refreshToken: string | null = null;

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}

export function setTokens(nextAccess: string | null, nextRefresh?: string | null, persistRefresh = true) {
  accessToken = nextAccess;
  if (typeof nextRefresh !== "undefined") {
    refreshToken = nextRefresh;
    if (typeof window !== "undefined" && persistRefresh) {
      if (nextRefresh) localStorage.setItem("auth_refresh", nextRefresh);
      else localStorage.removeItem("auth_refresh");
    }
  }
}

export function hydrateFromStorage() {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem("auth_refresh");
  if (stored) refreshToken = stored;
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_refresh");
  }
}
