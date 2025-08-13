/**
 * API Configuration
 * Centralized configuration for API client
 */

export interface ApiConfig {
  baseURL: string;
  timeout: number;
  executionPollingTimeout: number;
  longExecutionTimeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableLogging: boolean;
}

export const apiConfig: ApiConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
  executionPollingTimeout: 600000, // 10 minutes for execution status polling
  longExecutionTimeout: 600000,    // 10 minutes max execution time
  retryAttempts: parseInt(import.meta.env.VITE_API_RETRY_ATTEMPTS) || 1, // Reduced from 3 to 1
  retryDelay: 1000, // 1 second
  enableLogging: import.meta.env.DEV || false,
};

export const endpoints = {
  auth: {
    login: '/api/auth/token',
    register: '/api/auth/register',
    me: '/api/auth/me',
  },
  // Template Management - Exact backend endpoints
  templates: {
    list: '/api/templates',
    detail: (id: string) => `/api/templates/${id}`,
    create: '/api/templates',
    update: (id: string) => `/api/templates/${id}`,
    delete: (id: string) => `/api/templates/${id}`,
    stats: (id: string) => `/api/templates/${id}/stats`,
    duplicate: (id: string) => `/api/templates/${id}/duplicate`,
    categories: '/api/templates/categories/list',
    examples: '/api/templates/examples',
  },
  execution: {
    execute: '/api/execution/execute',
    status: (id: string) => `/api/execution/${id}/status`,
    results: (id: string) => `/api/execution/${id}/results`,
    history: '/api/execution/history',
    pause: (id: string) => `/api/execution/${id}/pause`,
    resume: (id: string) => `/api/execution/${id}/resume`,
  },
} as const;
