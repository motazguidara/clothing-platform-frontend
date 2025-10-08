// src/lib/auth/tokens.ts
'use client';

const ACCESS_STORAGE_KEY = 'auth_access_token';
const REFRESH_STORAGE_KEY = 'auth_refresh_token';

function readFromStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.warn('[tokenStore] failed to read token from storage', error);
    return null;
  }
}

function writeToStorage(key: string, value: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (value == null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value);
    }
  } catch (error) {
    console.warn('[tokenStore] failed to write token to storage', error);
  }
}

let accessToken: string | null = typeof window !== 'undefined' ? readFromStorage(ACCESS_STORAGE_KEY) : null;
let refreshToken: string | null = typeof window !== 'undefined' ? readFromStorage(REFRESH_STORAGE_KEY) : null;

export const tokenStore = {
  getAccess(): string | null {
    if (accessToken == null) {
      accessToken = readFromStorage(ACCESS_STORAGE_KEY);
    }
    return accessToken;
  },
  setAccess(token: string | null) {
    accessToken = token;
    writeToStorage(ACCESS_STORAGE_KEY, token);
  },
  getRefresh(): string | null {
    if (refreshToken == null) {
      refreshToken = readFromStorage(REFRESH_STORAGE_KEY);
    }
    return refreshToken;
  },
  setRefresh(token: string | null) {
    refreshToken = token;
    writeToStorage(REFRESH_STORAGE_KEY, token);
  },
  clear() {
    accessToken = null;
    refreshToken = null;
    writeToStorage(ACCESS_STORAGE_KEY, null);
    writeToStorage(REFRESH_STORAGE_KEY, null);
  }
};
