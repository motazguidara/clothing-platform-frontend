import { apiClient } from '../client';
import * as schemas from '../schemas';
import { clientConfig } from '@/lib/client-env';
import { tokenStore } from '@/lib/auth/tokens';

export class AuthService {
  // Token management
  private getAccessToken(): string | null {
    return tokenStore.getAccess();
  }

  private setAccessToken(token: string | null): void {
    tokenStore.setAccess(token);
  }

  private getRefreshToken(): string | null {
    return tokenStore.getRefresh();
  }

  private setRefreshToken(token: string | null): void {
    tokenStore.setRefresh(token);
  }

  clearAuth(): void {
    tokenStore.clear();
    this.clearStoredUser();
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    try {
      const [, payloadB64] = token.split('.');
      if (!payloadB64) return true; // non-JWT token; assume valid
      const json = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
      const exp = typeof json?.exp === 'number' ? json.exp : null;
      if (!exp) return true;
      const nowSec = Math.floor(Date.now() / 1000);
      // Consider small clock skew (30s)
      return exp > nowSec + 30;
    } catch {
      // If decoding fails, assume token is present but unknown; treat as not authenticated to be safe
      return false;
    }
  }
  async register(data: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    password_confirm: string;
    marketing_consent: boolean;
    terms_consent: boolean;
  }): Promise<schemas.RegisterResponse> {
    const response = await apiClient.post<schemas.RegisterResponse>(
      '/accounts/auth/register/',
      {
        email: data.email,
        password: data.password,
        password_confirm: data.password_confirm,
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        marketing_consent: data.marketing_consent ?? false,
        terms_consent: data.terms_consent ?? true,
      },
      {
        responseSchema: schemas.RegisterResponseSchema,
      }
    );
    
    if ((response as any)?.user) {
      this.storeUser((response as any).user);
    }
    return response;
  }

  async login(credentials: { email: string; password: string }): Promise<schemas.LoginResponse> {
    const response = await apiClient.post<schemas.LoginResponse>(
      '/accounts/auth/login/',
      {
        email: credentials.email,
        password: credentials.password,
      },
      {
        responseSchema: schemas.LoginResponseSchema,
      }
    );

    // In header mode, store tokens from body if present
    if (!clientConfig.featureCookieJwt) {
      const asAny: any = response as any;
      if (asAny?.access) this.setAccessToken(asAny.access);
      if (asAny?.refresh) this.setRefreshToken(asAny.refresh);
    }
    const loginUser = (response as any)?.user;
    if (loginUser) {
      this.storeUser(loginUser);
    }
    
    return response;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/accounts/auth/logout/', {}, { responseSchema: schemas.EmptyResponseSchema });
    } finally {
      // Always clear tokens, even if logout request fails
      this.clearAuth();
      this.clearStoredUser();
    }
  }

  async refreshToken(): Promise<{ access: string; refresh: string }> {
    // Delegate to apiClient logic; here keep types for header mode convenience
    const refresh = this.getRefreshToken();
    if (!refresh && !clientConfig.featureCookieJwt) throw new Error('No refresh token available');
    const resp = await apiClient.post<{ access: string; refresh?: string }>(
      '/accounts/auth/refresh/',
      clientConfig.featureCookieJwt ? {} : { refresh },
      { responseSchema: schemas.TokenRefreshResponseSchema }
    );
    if (!clientConfig.featureCookieJwt) {
      if (resp.access) this.setAccessToken(resp.access);
      if (resp.refresh) this.setRefreshToken(resp.refresh);
    }
    return { access: resp.access, refresh: resp.refresh || '' };
  }

  // Profile management
  async getCurrentUser(): Promise<{
    id: number;
    email: string;
    first_name: string | null;
    last_name: string | null;
    is_staff: boolean;
    is_active: boolean;
    date_joined: string;
    last_login: string | null;
  }> {
    const profile = await apiClient.get('/accounts/auth/me/', {
      responseSchema: schemas.UserSchema,
    });
    this.storeUser(profile);
    return profile;
  }

  async getUserProfile(): Promise<schemas.UserProfile> {
    return apiClient.get<schemas.UserProfile>('/accounts/profile/', {
      responseSchema: schemas.UserProfileSchema,
    });
  }

  async updateProfile(data: Partial<schemas.UpdateMeRequest>): Promise<schemas.UserProfile> {
    return apiClient.put<schemas.UserProfile>('/accounts/profile/', data, {
      responseSchema: schemas.UserProfileSchema,
    });
  }

  async changePassword(data: {
    old_password: string;
    new_password: string;
    new_password_confirm: string;
  }): Promise<{ message: string }> {
    return apiClient.post('/accounts/profile/change-password/', data);
  }

  // Address management
  async getAddresses(): Promise<schemas.Address[]> {
    return apiClient.get<schemas.Address[]>('/accounts/addresses/', {
      responseSchema: schemas.AddressSchema.array(),
    });
  }

  async getAddress(id: number): Promise<schemas.Address> {
    return apiClient.get<schemas.Address>(`/accounts/addresses/${id}/`, {
      responseSchema: schemas.AddressSchema,
    });
  }

  async createAddress(data: {
    type: 'billing' | 'shipping' | 'both';
    first_name: string;
    last_name: string;
    company?: string | null;
    address_line_1: string;
    address_line_2?: string | null;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    phone?: string | null;
    is_default?: boolean;
  }): Promise<schemas.Address> {
    return apiClient.post<schemas.Address>('/accounts/addresses/', data, {
      responseSchema: schemas.AddressSchema,
    });
  }

  async updateAddress(id: number, data: Partial<{
    type: 'billing' | 'shipping' | 'both';
    first_name: string;
    last_name: string;
    company: string | null;
    address_line_1: string;
    address_line_2: string | null;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    phone: string | null;
    is_default: boolean;
  }>): Promise<schemas.Address> {
    return apiClient.put<schemas.Address>(`/accounts/addresses/${id}/`, data, {
      responseSchema: schemas.AddressSchema,
    });
  }

  async deleteAddress(id: number): Promise<void> {
    return apiClient.delete<void>(`/accounts/addresses/${id}/`);
  }

  // Password reset
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    return apiClient.post('/accounts/auth/password-reset-request/', { email });
  }

  async resetPassword(data: {
    token: string;
    new_password: string;
    new_password_confirm: string;
  }): Promise<{ message: string }> {
    return apiClient.post('/accounts/auth/password-reset/', data);
  }

  // Email verification
  async verifyEmail(token: string): Promise<{ message: string }> {
    return apiClient.post('/accounts/auth/verify-email/', { token });
  }

  async resendVerificationEmail(): Promise<{ message: string }> {
    return apiClient.post('/accounts/auth/resend-verification/', {}, { responseSchema: schemas.MessageResponseSchema });
  }

  // User data management
  getStoredUser(): schemas.User | null {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      const userData = window.localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.warn('Failed to parse stored user data:', error);
      return null;
    }
  }

  storeUser(user: schemas.User): void {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.warn('Failed to store user data:', error);
    }
  }

  clearStoredUser(): void {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.removeItem('user');
    } catch (error) {
      console.warn('Failed to clear stored user data:', error);
    }
  }
}

export const authService = new AuthService();


