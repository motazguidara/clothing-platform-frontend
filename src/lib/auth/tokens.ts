// src/lib/auth/tokens.ts
'use client';

// In-memory token store to avoid persisting refresh tokens
let accessToken: string | null = null;
let refreshToken: string | null = null;

export const tokenStore = {
  getAccess(): string | null {
    return accessToken;
  },
  setAccess(token: string | null) {
    accessToken = token;
  },
  getRefresh(): string | null {
    return refreshToken;
  },
  setRefresh(token: string | null) {
    refreshToken = token;
  },
  clear() {
    accessToken = null;
    refreshToken = null;
  }
};
