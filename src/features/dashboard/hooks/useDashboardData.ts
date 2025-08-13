/**
 * Dashboard Data Hook
 * 
 * Custom hook for managing dashboard data and real-time updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { dashboardService } from '../services';
import type {
  DashboardData,
  SystemOverview,
  LiveExecution,
  TemplateHubItem,
  PerformanceMetrics,
  ActivityItem,
  SystemHealth,
  DashboardFilters,
  UseDashboardDataReturn,
  UseDashboardDataOptions
} from '../types';

export function useDashboardData(options: UseDashboardDataOptions = {}): UseDashboardDataReturn {
  const {
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    enableRealTime = false,
    initialFilters = {}
  } = options;

  // State
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [systemOverview, setSystemOverview] = useState<SystemOverview | null>(null);
  const [liveExecutions, setLiveExecutions] = useState<LiveExecution[]>([]);
  const [templateHub, setTemplateHub] = useState<TemplateHubItem[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false);
  const [filters, setFilters] = useState<DashboardFilters>(initialFilters);

  // Refs
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  /**
   * Load dashboard data
   */
  const loadDashboardData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      // Load all data concurrently
      const [
        dashboardResponse,
        overviewResponse,
        executionsResponse,
        templatesResponse,
        metricsResponse,
        activitiesResponse,
        healthResponse
      ] = await Promise.allSettled([
        dashboardService.getDashboardData(filters),
        dashboardService.getSystemOverview(filters.timeRange),
        dashboardService.getLiveExecutions(filters.executionStatus),
        dashboardService.getTemplateHub(6, filters.templateCategory),
        dashboardService.getPerformanceMetrics(filters.timeRange),
        dashboardService.getActivityFeed(10, filters.timeRange),
        dashboardService.getSystemHealth()
      ]);

      // Update state with successful responses
      if (dashboardResponse.status === 'fulfilled') {
        setDashboardData(dashboardResponse.value);
      }
      if (overviewResponse.status === 'fulfilled') {
        setSystemOverview(overviewResponse.value);
      }
      if (executionsResponse.status === 'fulfilled') {
        setLiveExecutions(executionsResponse.value);
      }
      if (templatesResponse.status === 'fulfilled') {
        setTemplateHub(templatesResponse.value);
      }
      if (metricsResponse.status === 'fulfilled') {
        setPerformanceMetrics(metricsResponse.value);
      }
      if (activitiesResponse.status === 'fulfilled') {
        setActivityFeed(activitiesResponse.value);
      }
      if (healthResponse.status === 'fulfilled') {
        setSystemHealth(healthResponse.value);
      }

      // Check for any errors
      const errors = [
        dashboardResponse,
        overviewResponse,
        executionsResponse,
        templatesResponse,
        metricsResponse,
        activitiesResponse,
        healthResponse
      ].filter(result => result.status === 'rejected');

      if (errors.length > 0) {
        console.warn('Some dashboard data failed to load:', errors);
        // Only set error if all requests failed
        if (errors.length === 7) {
          setError('Failed to load dashboard data');
        }
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filters]);

  /**
   * Refresh dashboard data
   */
  const refresh = useCallback(async () => {
    await loadDashboardData(false);
  }, [loadDashboardData]);

  /**
   * Execute template
   */
  const executeTemplate = useCallback(async (templateId: string, parameters?: Record<string, unknown>): Promise<string> => {
    try {
      const executionId = await dashboardService.executeTemplate(templateId, parameters);
      // Refresh live executions to show the new execution
      const updatedExecutions = await dashboardService.getLiveExecutions(filters.executionStatus);
      setLiveExecutions(updatedExecutions);
      return executionId;
    } catch (err) {
      console.error('Failed to execute template:', err);
      throw err;
    }
  }, [filters.executionStatus]);

  /**
   * Stop execution
   */
  const stopExecution = useCallback(async (executionId: string): Promise<void> => {
    try {
      await dashboardService.stopExecution(executionId);
      // Refresh live executions
      const updatedExecutions = await dashboardService.getLiveExecutions(filters.executionStatus);
      setLiveExecutions(updatedExecutions);
    } catch (err) {
      console.error('Failed to stop execution:', err);
      throw err;
    }
  }, [filters.executionStatus]);

  /**
   * Pause execution
   */
  const pauseExecution = useCallback(async (executionId: string): Promise<void> => {
    try {
      await dashboardService.pauseExecution(executionId);
      // Refresh live executions
      const updatedExecutions = await dashboardService.getLiveExecutions(filters.executionStatus);
      setLiveExecutions(updatedExecutions);
    } catch (err) {
      console.error('Failed to pause execution:', err);
      throw err;
    }
  }, [filters.executionStatus]);

  /**
   * Resume execution
   */
  const resumeExecution = useCallback(async (executionId: string): Promise<void> => {
    try {
      await dashboardService.resumeExecution(executionId);
      // Refresh live executions
      const updatedExecutions = await dashboardService.getLiveExecutions(filters.executionStatus);
      setLiveExecutions(updatedExecutions);
    } catch (err) {
      console.error('Failed to resume execution:', err);
      throw err;
    }
  }, [filters.executionStatus]);

  /**
   * Acknowledge alert
   */
  const acknowledgeAlert = useCallback(async (alertId: string): Promise<void> => {
    try {
      await dashboardService.acknowledgeAlert(alertId);
      // Refresh system health
      const updatedHealth = await dashboardService.getSystemHealth();
      setSystemHealth(updatedHealth);
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
      throw err;
    }
  }, []);

  /**
   * Update filters
   */
  const updateFilters = useCallback((newFilters: Partial<DashboardFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Toggle real-time connection
   */
  const toggleRealTime = useCallback(() => {
    if (isRealTimeConnected) {
      // Disconnect
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsRealTimeConnected(false);
    } else {
      // Connect
      try {
        const eventSource = dashboardService.createRealtimeConnection(
          (data) => {
            console.log('Dashboard real-time update:', data);
            // Handle real-time updates
            // This would update specific parts of the dashboard based on the update type
            refresh();
          },
          (error) => {
            console.error('Dashboard real-time error:', error);
            setIsRealTimeConnected(false);
          }
        );
        eventSourceRef.current = eventSource;
        setIsRealTimeConnected(true);
      } catch (err) {
        console.error('Failed to establish real-time connection:', err);
      }
    }
  }, [isRealTimeConnected, refresh]);

  // Initial load
  useEffect(() => {
    loadDashboardData(true);
  }, [loadDashboardData]);

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        refresh();
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, refresh]);

  // Real-time connection
  useEffect(() => {
    if (enableRealTime && !isRealTimeConnected) {
      toggleRealTime();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [enableRealTime]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return {
    // Data
    dashboardData,
    systemOverview,
    liveExecutions,
    templateHub,
    performanceMetrics,
    activityFeed,
    systemHealth,
    
    // State
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
    isRealTimeConnected,
    
    // Actions
    refresh,
    executeTemplate,
    stopExecution,
    pauseExecution,
    resumeExecution,
    acknowledgeAlert,
    updateFilters,
    toggleRealTime,
    
    // Filters
    filters
  };
}
