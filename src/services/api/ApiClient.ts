/**
 * ApiClient
 * Professional Axios-based API client with advanced features
 */

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import { apiConfig } from '../config/api.config';
import { errorMessageService } from '../error-message.service';

// Define types inline since we removed the types directory
export class ApiException extends Error {
  public status: number;
  public code: string;
  public details?: Record<string, unknown>;

  constructor(
    message: string,
    status: number,
    code: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiException';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface ApiRequestConfig {
  retries?: number;
  skipAuth?: boolean;
  isPolling?: boolean; // Flag for polling requests
}

export class ApiClient {
  private static instance: ApiClient;
  private axiosInstance: AxiosInstance;
  private authToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: string) => void;
    reject: (error: Error) => void;
  }> = [];

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: apiConfig.baseURL,
      timeout: apiConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.loadStoredTokens();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  /**
   * Set authentication token
   */
  public setAuthToken(token: string, refresh?: string): void {
    this.authToken = token;
    if (refresh) {
      this.refreshToken = refresh;
    }
    
    // Store in localStorage
    localStorage.setItem('auth_token', token);
    if (refresh) {
      localStorage.setItem('refresh_token', refresh);
    }

    if (apiConfig.enableLogging) {
      console.log('🔐 Auth token set');
    }
  }

  /**
   * Clear authentication token
   */
  public clearAuthToken(): void {
    this.authToken = null;
    this.refreshToken = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');

    if (apiConfig.enableLogging) {
      console.log('🔓 Auth token cleared');
    }
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return !!this.authToken;
  }

  /**
   * Load stored tokens from localStorage
   */
  private loadStoredTokens(): void {
    const token = localStorage.getItem('auth_token');
    const refresh = localStorage.getItem('refresh_token');
    
    if (token) {
      this.authToken = token;
    }
    if (refresh) {
      this.refreshToken = refresh;
    }
  }

  /**
   * HTTP GET request
   */
  public async get<T>(
    url: string,
    config?: AxiosRequestConfig & ApiRequestConfig
  ): Promise<T> {
    return this.request<T>('GET', url, undefined, config);
  }

  /**
   * HTTP POST request
   */
  public async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig & ApiRequestConfig
  ): Promise<T> {
    return this.request<T>('POST', url, data, config);
  }

  /**
   * HTTP PUT request
   */
  public async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig & ApiRequestConfig
  ): Promise<T> {
    return this.request<T>('PUT', url, data, config);
  }

  /**
   * HTTP DELETE request
   */
  public async delete<T>(
    url: string,
    config?: AxiosRequestConfig & ApiRequestConfig
  ): Promise<T> {
    return this.request<T>('DELETE', url, undefined, config);
  }

  /**
   * Generic request method with retry logic
   */
  private async request<T>(
    method: string,
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig & ApiRequestConfig
  ): Promise<T> {
    const requestConfig: AxiosRequestConfig = {
      method,
      url,
      data,
      ...config,
    };

    // Extended timeout for execution status polling
    if (config?.isPolling && url.includes('/execution/') && url.includes('/status')) {
      requestConfig.timeout = apiConfig.executionPollingTimeout; // 10 minutes
      if (apiConfig.enableLogging) {
        console.log(`⏱️ Using extended timeout (${apiConfig.executionPollingTimeout}ms) for execution polling`);
      }
    }

    let lastError: Error;
    // Special handling for polling requests - no retries
    const maxRetries = config?.isPolling ? 0 : (config?.retries ?? apiConfig.retryAttempts);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.axiosInstance.request<T>(requestConfig);
        return response.data;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on authentication errors or client errors
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          if (status && (status < 500 || status === 401)) {
            break;
          }
        }

        // Don't retry polling requests
        if (config?.isPolling) {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = apiConfig.retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          if (apiConfig.enableLogging) {
            console.log(`🔄 Retrying request (${attempt + 1}/${maxRetries}) after ${delay}ms`);
          }
        }
      }
    }

    throw lastError!;
  }

  /**
   * Setup request/response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => this.handleRequest(config),
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => this.handleResponse(response),
      (error) => this.handleError(error)
    );
  }

  /**
   * Handle outgoing requests
   */
  private handleRequest(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    // Add auth token if available and not skipped
    if (this.authToken && !config.headers?.skipAuth) {
      config.headers.set('Authorization', `Bearer ${this.authToken}`);
    }

    // Add request ID for tracking
    config.headers.set('X-Request-ID', this.generateRequestId());

    if (apiConfig.enableLogging) {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        headers: config.headers,
      });
    }

    return config;
  }

  /**
   * Handle successful responses
   */
  private handleResponse<T>(response: AxiosResponse<T>): AxiosResponse<T> {
    if (apiConfig.enableLogging) {
      console.log(`✅ ${response.status} ${response.config.url}`, {
        data: response.data,
        headers: response.headers,
      });
    }

    return response;
  }

  /**
   * Handle error responses
   */
  private async handleError(error: AxiosError): Promise<never> {
    if (apiConfig.enableLogging) {
      console.error(`❌ ${error.response?.status} ${error.config?.url}`, {
        error: error.response?.data,
        headers: error.response?.headers,
      });
    }

    // Handle 401 errors with token refresh attempt
    if (error.response?.status === 401 && this.refreshToken && !this.isRefreshing) {
      try {
        const newToken = await this.refreshAuthToken();
        
        // Retry the original request with new token
        if (error.config) {
          error.config.headers.set('Authorization', `Bearer ${newToken}`);
          const response = await this.axiosInstance.request(error.config);
          // This is a successful retry, but we need to throw to maintain the Promise<never> signature
          // The interceptor will handle this differently in practice
          throw new ApiException('Retry successful', 200, 'RETRY_SUCCESS', response.data);
        }
      } catch {
        // Refresh failed, clear tokens and redirect
        this.clearAuthToken();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        throw new ApiException('Authentication failed', 401, 'AUTH_FAILED');
      }
    } else if (error.response?.status === 401) {
      // No refresh token or already refreshing, clear tokens and redirect
      this.clearAuthToken();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      throw new ApiException('Authentication failed', 401, 'AUTH_FAILED');
    }

    // Convert axios error to ApiException
    const status = error.response?.status || 500;
    const message = this.extractErrorMessage(error);
    const code = this.extractErrorCode(error);
    const details = error.response?.data as Record<string, unknown>;

    throw new ApiException(message, status, code, details);
  }

  /**
   * Refresh authentication token
   */
  private async refreshAuthToken(): Promise<string> {
    if (this.isRefreshing) {
      // Wait for ongoing refresh
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      const response = await axios.post(`${apiConfig.baseURL}/api/auth/refresh`, {
        refresh_token: this.refreshToken,
      });

      const { access_token, refresh_token } = response.data;
      this.setAuthToken(access_token, refresh_token);

      // Process failed queue
      this.failedQueue.forEach(({ resolve }) => resolve(access_token));
      this.failedQueue = [];

      return access_token;
    } catch (error) {
      // Process failed queue
      this.failedQueue.forEach(({ reject }) => reject(error as Error));
      this.failedQueue = [];
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Extract error message from axios error using standardized messages
   */
  private extractErrorMessage(error: AxiosError): string {
    // Use error message service to get user-friendly message
    return errorMessageService.getErrorMessage(error, {
      operation: 'api',
      statusCode: error.response?.status,
      originalMessage: this.getOriginalErrorMessage(error)
    });
  }

  /**
   * Get original error message from axios error
   */
  private getOriginalErrorMessage(error: AxiosError): string {
    const data = error.response?.data as Record<string, unknown>;
    
    if (data?.message) {
      return data.message as string;
    }
    
    if (data?.error) {
      return data.error as string;
    }
    
    if (data?.detail) {
      return data.detail as string;
    }

    return error.message || 'An unexpected error occurred';
  }

  /**
   * Extract error code from axios error
   */
  private extractErrorCode(error: AxiosError): string {
    const data = error.response?.data as Record<string, unknown>;
    
    if (data?.code) {
      return data.code as string;
    }

    const status = error.response?.status;
    switch (status) {
      case 400: return 'BAD_REQUEST';
      case 401: return 'UNAUTHORIZED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 429: return 'RATE_LIMITED';
      case 500: return 'INTERNAL_ERROR';
      default: return 'UNKNOWN_ERROR';
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const apiClient = ApiClient.getInstance();
