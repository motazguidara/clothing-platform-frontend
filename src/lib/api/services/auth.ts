import { apiClient } from '../client';
import * as schemas from '../schemas';

export class AuthService {
  // Token management
  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  }

  private setAccessToken(token: string | null): void {
    if (typeof window === 'undefined') return;
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refresh_token');
  }

  private setRefreshToken(token: string | null): void {
    if (typeof window === 'undefined') return;
    if (token) {
      localStorage.setItem('refresh_token', token);
    } else {
      localStorage.removeItem('refresh_token');
    }
  }

  clearAuth(): void {
    this.setAccessToken(null);
    this.setRefreshToken(null);
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
  async register(data: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    password_confirm: string;
    marketing_consent: boolean;
    terms_consent: boolean;
  }): Promise<schemas.AuthResponse> {
    const response = await apiClient.post<schemas.AuthResponse>(
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
        responseSchema: schemas.AuthResponseSchema,
      }
    );

    // Store tokens
    this.setAccessToken(response.access);
    this.setRefreshToken(response.refresh);
    
    return response;
  }

  async login(credentials: { email: string; password: string }): Promise<schemas.AuthResponse> {
    const response = await apiClient.post<schemas.AuthResponse>(
      '/accounts/auth/login/',
      {
        email: credentials.email,
        password: credentials.password,
      },
      {
        responseSchema: schemas.AuthResponseSchema,
      }
    );

    // Store tokens
    this.setAccessToken(response.access);
    this.setRefreshToken(response.refresh);
    
    return response;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/accounts/auth/logout/', {}, { responseSchema: schemas.EmptyResponseSchema });
    } finally {
      // Always clear tokens, even if logout request fails
      this.clearAuth();
    }
  }

  async refreshToken(): Promise<{ access: string; refresh: string }> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<{ access: string; refresh: string }>(
      '/accounts/auth/refresh/',
      { refresh: refreshToken },
      { responseSchema: schemas.TokenRefreshResponseSchema }
    );

    // Update stored tokens
    this.setAccessToken(response.access);
    if (response.refresh) {
      this.setRefreshToken(response.refresh);
    }
    
    return response;
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
    return apiClient.get('/accounts/auth/me/', {
      responseSchema: schemas.UserSchema,
    });
  }

  async getUserProfile(): Promise<schemas.UserProfile> {
    return apiClient.get<schemas.UserProfile>('/accounts/profile/', {
      responseSchema: schemas.UserProfileSchema,
    });
  }

  async updateProfile(data: Partial<{
    first_name: string;
    last_name: string;
    phone: string | null;
    date_of_birth: string | null;
    gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
    marketing_consent: boolean;
    preferences: schemas.UserPreferences;
  }>): Promise<schemas.UserProfile> {
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
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        return JSON.parse(userData);
      }
    } catch (error) {
      console.warn('Failed to parse stored user data:', error);
    }
    return null;
  }

  storeUser(user: schemas.User): void {
    try {
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.warn('Failed to store user data:', error);
    }
  }

  clearStoredUser(): void {
    try {
      localStorage.removeItem('user');
    } catch (error) {
      console.warn('Failed to clear stored user data:', error);
    }
  }
}

export const authService = new AuthService();
