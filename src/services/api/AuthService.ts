/**
 * AuthService
 * Authentication service with JWT token management
 */

import { apiClient } from './ApiClient';
import { endpoints } from '../config/api.config';
import { errorMessageService } from '../error-message.service';

// Define auth types inline since we removed the types directory
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
  login_count?: number;
  role?: string;
  status?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
  login_count?: number;
  role?: string;
  status?: string;
}

export interface UpdateProfileRequest {
  full_name?: string;
  email?: string;
}

export class AuthService {
  private static instance: AuthService;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Login user with credentials
   */
  public async login(username: string, password: string): Promise<AuthResponse> {
    try {
      // Backend expects form data for OAuth2PasswordRequestForm
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await apiClient.post<AuthResponse>(
        endpoints.auth.login,
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          skipAuth: true,
        }
      );

      // Store both access and refresh tokens
      apiClient.setAuthToken(response.access_token, response.refresh_token);

      return response;
    } catch (error) {
      // Use error message service to get user-friendly login error
      const userFriendlyMessage = errorMessageService.getErrorMessage(error, {
        operation: 'login'
      });
      
      // Create a new error with the user-friendly message
      const loginError = new Error(userFriendlyMessage);
      // Preserve original error properties if it's an ApiException
      if (error && typeof error === 'object' && 'status' in error) {
        (loginError as any).status = (error as any).status;
        (loginError as any).code = (error as any).code;
      }
      
      throw loginError;
    }
  }

  /**
   * Register new user
   */
  public async register(userData: RegisterRequest): Promise<UserResponse> {
    try {
      const response = await apiClient.post<UserResponse>(
        endpoints.auth.register,
        userData,
        { skipAuth: true }
      );

      return response;
    } catch (error) {
      // Use error message service to get user-friendly registration error
      const userFriendlyMessage = errorMessageService.getErrorMessage(error, {
        operation: 'register'
      });
      
      // Create a new error with the user-friendly message
      const registerError = new Error(userFriendlyMessage);
      // Preserve original error properties if it's an ApiException
      if (error && typeof error === 'object' && 'status' in error) {
        (registerError as any).status = (error as any).status;
        (registerError as any).code = (error as any).code;
      }
      
      throw registerError;
    }
  }

  /**
   * Logout user
   */
  public async logout(): Promise<void> {
    // Clear tokens from client
    apiClient.clearAuthToken();
    
    // In a real implementation, you might also call a logout endpoint
    // to invalidate the token on the server side
  }

  /**
   * Get current user information
   */
  public async getCurrentUser(): Promise<UserResponse> {
    const response = await apiClient.get<UserResponse>(endpoints.auth.me);
    return response;
  }

  /**
   * Update user profile
   */
  public async updateProfile(data: UpdateProfileRequest): Promise<UserResponse> {
    const response = await apiClient.put<UserResponse>(endpoints.auth.me, data);
    return response;
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return apiClient.isAuthenticated();
  }

  /**
   * Get stored token
   */
  public getStoredToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Set stored token
   */
  public setStoredToken(token: string, refresh?: string): void {
    apiClient.setAuthToken(token, refresh);
  }

  /**
   * Clear stored token
   */
  public clearStoredToken(): void {
    apiClient.clearAuthToken();
  }

  /**
   * Check if token is valid (basic check)
   */
  public isTokenValid(): boolean {
    const token = this.getStoredToken();
    if (!token) return false;

    try {
      // Basic JWT structure check
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      // Decode payload to check expiration
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      
      return payload.exp > now;
    } catch {
      return false;
    }
  }

  /**
   * Get user info from token payload
   */
  public getUserFromToken(): Partial<User> | null {
    const token = this.getStoredToken();
    if (!token) return null;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      
      return {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    } catch {
      return null;
    }
  }

  /**
   * Initialize authentication state
   * Call this on app startup to restore authentication
   */
  public async initializeAuth(): Promise<User | null> {
    if (!this.isAuthenticated() || !this.isTokenValid()) {
      this.clearStoredToken();
      return null;
    }

    try {
      // Verify token with server and get user info
      const user = await this.getCurrentUser();
      return {
        id: user.id,
        email: user.email,
        is_active: user.is_active,
        full_name: user.full_name,
        role: user.role,
        status: user.status,
      };
    } catch {
      // Token is invalid, clear it
      this.clearStoredToken();
      return null;
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
