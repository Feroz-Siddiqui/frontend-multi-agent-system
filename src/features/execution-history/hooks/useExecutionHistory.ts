/**
 * useExecutionHistory Hook
 * 
 * Main hook for execution history data fetching and management
 */

import { useState, useEffect, useCallback } from 'react';
import { executionHistoryService } from '../services';
import type {
  ExecutionResult,
  ExecutionListResponse,
  ExecutionFilters,
  ExecutionMetrics,
  ExecutionStatusCounts,
} from '../types';

interface UseExecutionHistoryOptions {
  initialPage?: number;
  initialLimit?: number;
  initialFilters?: ExecutionFilters;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseExecutionHistoryReturn {
  // Data
  executions: ExecutionResult[];
  metrics: ExecutionMetrics | null;
  statusCounts: ExecutionStatusCounts | null;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
  
  // Filters
  filters: ExecutionFilters;
  setFilters: (filters: ExecutionFilters) => void;
  clearFilters: () => void;
  
  // Loading states
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  
  // Error handling
  error: string | null;
  
  // Actions
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  setPage: (page: number) => void;
}

export function useExecutionHistory(
  options: UseExecutionHistoryOptions = {}
): UseExecutionHistoryReturn {
  const {
    initialPage = 1,
    initialLimit = 20,
    initialFilters = {},
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
  } = options;

  // State
  const [executions, setExecutions] = useState<ExecutionResult[]>([]);
  const [metrics, setMetrics] = useState<ExecutionMetrics | null>(null);
  const [statusCounts, setStatusCounts] = useState<ExecutionStatusCounts | null>(null);
  
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  const [filters, setFilters] = useState<ExecutionFilters>(initialFilters);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load executions
  const loadExecutions = useCallback(async (
    page: number = currentPage,
    append: boolean = false
  ) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response: ExecutionListResponse = await executionHistoryService.getExecutions(
        page,
        initialLimit,
        filters
      );

      if (append) {
        setExecutions(prev => [...prev, ...response.executions]);
      } else {
        setExecutions(response.executions);
      }

      setTotalCount(response.total);
      setTotalPages(Math.ceil(response.total / initialLimit));
      setHasMore(response.has_more);
      setCurrentPage(response.page);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load executions';
      setError(errorMessage);
      console.error('Failed to load executions:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [currentPage, initialLimit, filters]);

  // Load metrics
  const loadMetrics = useCallback(async () => {
    try {
      const [metricsData, statusData] = await Promise.all([
        executionHistoryService.getExecutionMetrics(30),
        executionHistoryService.getExecutionStatusCounts(),
      ]);

      setMetrics(metricsData);
      setStatusCounts(statusData);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    }
  }, []);

  // Load more executions (pagination)
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    await loadExecutions(currentPage + 1, true);
  }, [hasMore, isLoadingMore, currentPage, loadExecutions]);

  // Refresh data
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadExecutions(1, false),
        loadMetrics(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadExecutions, loadMetrics]);

  // Set page
  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
    loadExecutions(page, false);
  }, [loadExecutions]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({});
    setCurrentPage(1);
  }, []);

  // Effect: Load initial data
  useEffect(() => {
    loadExecutions(1, false);
    loadMetrics();
  }, [filters]); // Reload when filters change

  // Effect: Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Only refresh if not currently loading
      if (!isLoading && !isLoadingMore) {
        refresh();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, isLoading, isLoadingMore, refresh]);

  // Effect: Update filters
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [filters]);

  return {
    // Data
    executions,
    metrics,
    statusCounts,
    
    // Pagination
    currentPage,
    totalPages,
    totalCount,
    hasMore,
    
    // Filters
    filters,
    setFilters,
    clearFilters,
    
    // Loading states
    isLoading,
    isLoadingMore,
    isRefreshing,
    
    // Error handling
    error,
    
    // Actions
    loadMore,
    refresh,
    setPage,
  };
}

export default useExecutionHistory;
