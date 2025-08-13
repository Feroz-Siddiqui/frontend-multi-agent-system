/**
 * API Services Index
 * Centralized exports for core API services
 */

// Import core services
import { apiClient } from './ApiClient';
import { authService } from './AuthService';

// Export API Client
export { ApiClient, apiClient } from './ApiClient';

// Export Services
export { AuthService, authService } from './AuthService';

// Export Configuration
export { apiConfig, endpoints } from '../config/api.config';

// Core API object for legacy compatibility
export const api = {
  auth: authService,
  client: apiClient,
};

// Initialize services on import
export const initializeServices = async () => {
  try {
    // Initialize authentication state
    const user = await authService.initializeAuth();
    return { user, initialized: true };
  } catch (error) {
    console.error('Failed to initialize services:', error);
    return { user: null, initialized: false, error };
  }
};
