/**
 * Dashboard Service
 * 
 * Service for dashboard API calls and data management
 */

import { apiClient } from '../../../services/api';
import {
  transformDashboardData,
  transformSystemOverview,
  transformActivityFeed,
  transformPerformanceMetrics,
  transformSystemHealth,
  transformLiveExecutions,
  transformTemplateHub
} from '../utils';
import type {
  DashboardData,
  SystemOverview,
  LiveExecution,
  TemplateHubItem,
  PerformanceMetrics,
  ActivityItem,
  SystemHealth,
  DashboardFilters
} from '../types';

export class DashboardService {
  private static instance: DashboardService;
  private baseUrl = '/api/dashboard';

  static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
    }
    return DashboardService.instance;
  }

  /**
   * Get complete dashboard data
   */
  async getDashboardData(filters?: DashboardFilters): Promise<DashboardData> {
    const params = new URLSearchParams();
    
    if (filters?.timeRange) {
      params.append('time_range', filters.timeRange);
    }
    if (filters?.templateCategory) {
      params.append('category', filters.templateCategory);
    }
    if (filters?.executionStatus?.length) {
      filters.executionStatus.forEach(status => {
        params.append('status', status);
      });
    }
    if (filters?.showOnlyFavorites) {
      params.append('favorites', 'true');
    }

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
    
    const response = await apiClient.get(url);
    return transformDashboardData(response) as DashboardData;
  }

  /**
   * Get system overview metrics
   */
  async getSystemOverview(timeRange = '24h'): Promise<SystemOverview> {
    const response = await apiClient.get(
      `${this.baseUrl}/overview?time_range=${timeRange}`
    );
    return transformSystemOverview(response) as SystemOverview;
  }

  /**
   * Get live executions
   */
  async getLiveExecutions(statusFilter?: string[]): Promise<LiveExecution[]> {
    const params = new URLSearchParams();
    if (statusFilter?.length) {
      statusFilter.forEach(status => {
        params.append('status', status);
      });
    }

    const queryString = params.toString();
    const url = queryString 
      ? `${this.baseUrl}/executions/live?${queryString}` 
      : `${this.baseUrl}/executions/live`;
    
    const response = await apiClient.get(url);
    const transformed = transformLiveExecutions(response) as unknown;
    const typedResponse = transformed as { executions: LiveExecution[] };
    return typedResponse.executions || [];
  }

  /**
   * Get template hub data
   */
  async getTemplateHub(limit = 6, category?: string): Promise<TemplateHubItem[]> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (category) {
      params.append('category', category);
    }

    const response = await apiClient.get(
      `${this.baseUrl}/templates/hub?${params.toString()}`
    );
    const transformed = transformTemplateHub(response) as unknown;
    const typedResponse = transformed as { templates: TemplateHubItem[] };
    return typedResponse.templates || [];
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(timeRange = '7d'): Promise<PerformanceMetrics> {
    const response = await apiClient.get(
      `${this.baseUrl}/metrics?time_range=${timeRange}`
    );
    return transformPerformanceMetrics(response) as PerformanceMetrics;
  }

  /**
   * Get activity feed
   */
  async getActivityFeed(limit = 10, timeRange = '24h'): Promise<ActivityItem[]> {
    const response = await apiClient.get(
      `${this.baseUrl}/activity?limit=${limit}&time_range=${timeRange}`
    );
    const transformed = transformActivityFeed(response) as unknown;
    const typedResponse = transformed as { activities: ActivityItem[] };
    return typedResponse.activities || [];
  }

  /**
   * Get system health
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const response = await apiClient.get(`${this.baseUrl}/health`);
    return transformSystemHealth(response) as SystemHealth;
  }

  /**
   * Execute template from dashboard
   */
  async executeTemplate(templateId: string, parameters?: Record<string, unknown>): Promise<string> {
    const response = await apiClient.post<{ executionId: string }>(
      `${this.baseUrl}/execute`,
      {
        templateId,
        parameters: parameters || {}
      }
    );
    return response.executionId;
  }

  /**
   * Stop execution
   */
  async stopExecution(executionId: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/executions/${executionId}/stop`);
  }

  /**
   * Pause execution
   */
  async pauseExecution(executionId: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/executions/${executionId}/pause`);
  }

  /**
   * Resume execution
   */
  async resumeExecution(executionId: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/executions/${executionId}/resume`);
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/alerts/${alertId}/acknowledge`);
  }

  /**
   * Get execution details
   */
  async getExecutionDetails(executionId: string): Promise<LiveExecution> {
    return await apiClient.get<LiveExecution>(
      `${this.baseUrl}/executions/${executionId}`
    );
  }

  /**
   * Get template statistics
   */
  async getTemplateStats(templateId: string): Promise<{
    usageCount: number;
    successRate: number;
    averageDuration: number;
    averageCost: number;
    lastUsed?: string;
  }> {
    return await apiClient.get<{
      usageCount: number;
      successRate: number;
      averageDuration: number;
      averageCost: number;
      lastUsed?: string;
    }>(`${this.baseUrl}/templates/${templateId}/stats`);
  }

  /**
   * Export dashboard data
   */
  async exportDashboardData(format: 'json' | 'csv' = 'json'): Promise<Blob> {
    return await apiClient.get<Blob>(
      `${this.baseUrl}/export?format=${format}`,
      { responseType: 'blob' }
    );
  }

  /**
   * Create SSE connection for real-time updates
   */
  createRealtimeConnection(onUpdate: (data: unknown) => void, onError?: (error: Event) => void): EventSource {
    const eventSource = new EventSource(`${this.baseUrl}/stream`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onUpdate(data);
      } catch (error) {
        console.error('Failed to parse SSE data:', error);
      }
    };

    eventSource.addEventListener('dashboard_update', (event) => {
      try {
        const data = JSON.parse(event.data);
        onUpdate(data);
      } catch (error) {
        console.error('Failed to parse dashboard update:', error);
      }
    });

    eventSource.addEventListener('heartbeat', (event) => {
      console.debug('Dashboard heartbeat:', event.data);
    });

    eventSource.onerror = (error) => {
      console.error('Dashboard SSE error:', error);
      onError?.(error);
    };

    return eventSource;
  }
}

// Export singleton instance
export const dashboardService = DashboardService.getInstance();
