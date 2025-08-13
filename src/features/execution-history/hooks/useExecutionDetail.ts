/**
 * useExecutionDetail Hook
 * 
 * Hook for individual execution details with real-time monitoring
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { executionHistoryService } from '../services';
import type { ExecutionResult } from '../types';

interface UseExecutionDetailOptions {
  executionId: string;
  enableRealTimeMonitoring?: boolean;
  pollingInterval?: number;
  autoStopOnComplete?: boolean;
}

interface UseExecutionDetailReturn {
  // Data
  execution: ExecutionResult | null;
  logs: {
    execution_id: string;
    status: string;
    progress: number;
    current_agent: string;
    agent_results: unknown[];
    timeline: unknown[];
    errors: unknown[];
  } | null;
  
  // Loading states
  isLoading: boolean;
  isLoadingLogs: boolean;
  isMonitoring: boolean;
  
  // Error handling
  error: string | null;
  
  // Actions
  refresh: () => Promise<void>;
  loadLogs: () => Promise<void>;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  
  // Real-time status
  lastUpdated: Date | null;
  isComplete: boolean;
  isRunning: boolean;
  isFailed: boolean;
}

export function useExecutionDetail(
  options: UseExecutionDetailOptions
): UseExecutionDetailReturn {
  const {
    executionId,
    enableRealTimeMonitoring = true,
    pollingInterval = 2000,
    autoStopOnComplete = true,
  } = options;

  // State
  const [execution, setExecution] = useState<ExecutionResult | null>(null);
  const [logs, setLogs] = useState<UseExecutionDetailReturn['logs']>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Refs for cleanup
  const stopMonitoringRef = useRef<(() => void) | null>(null);

  // Computed states
  const isComplete = execution?.status === 'completed';
  const isRunning = execution?.status === 'running' || execution?.status === 'pending';
  const isFailed = execution?.status === 'failed';

  // Load execution details
  const loadExecution = useCallback(async () => {
    if (!executionId) return;

    try {
      setIsLoading(true);
      setError(null);

      const executionData = await executionHistoryService.getExecution(executionId);
      setExecution(executionData);
      setLastUpdated(new Date());

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load execution';
      setError(errorMessage);
      console.error('Failed to load execution:', err);
    } finally {
      setIsLoading(false);
    }
  }, [executionId]);

  // Load execution logs
  const loadLogs = useCallback(async () => {
    if (!executionId) return;

    try {
      setIsLoadingLogs(true);
      const logsData = await executionHistoryService.getExecutionLogs(executionId);
      setLogs(logsData);
    } catch (err) {
      console.error('Failed to load execution logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  }, [executionId]);

  // Refresh both execution and logs
  const refresh = useCallback(async () => {
    await Promise.all([
      loadExecution(),
      loadLogs(),
    ]);
  }, [loadExecution, loadLogs]);

  // Start real-time monitoring
  const startMonitoring = useCallback(() => {
    if (!executionId || isMonitoring) return;

    setIsMonitoring(true);

    const stopFn = executionHistoryService.monitorExecution(
      executionId,
      (updatedExecution) => {
        setExecution(updatedExecution);
        setLastUpdated(new Date());
        
        // Auto-stop monitoring when execution completes
        if (autoStopOnComplete && ['completed', 'failed', 'cancelled'].includes(updatedExecution.status)) {
          stopMonitoring();
        }
      },
      (err) => {
        console.error('Monitoring error:', err);
        setError(err.message);
        stopMonitoring();
      },
      pollingInterval
    );

    stopMonitoringRef.current = stopFn;
  }, [executionId, isMonitoring, autoStopOnComplete, pollingInterval]);

  // Stop real-time monitoring
  const stopMonitoring = useCallback(() => {
    if (stopMonitoringRef.current) {
      stopMonitoringRef.current();
      stopMonitoringRef.current = null;
    }
    setIsMonitoring(false);
  }, []);

  // Effect: Load initial data
  useEffect(() => {
    if (executionId) {
      loadExecution();
    }
  }, [executionId, loadExecution]);

  // Effect: Start monitoring for running executions
  useEffect(() => {
    if (enableRealTimeMonitoring && execution && isRunning && !isMonitoring) {
      startMonitoring();
    }
  }, [enableRealTimeMonitoring, execution, isRunning, isMonitoring, startMonitoring]);

  // Effect: Cleanup monitoring on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  // Effect: Stop monitoring when execution completes
  useEffect(() => {
    if (autoStopOnComplete && execution && !isRunning && isMonitoring) {
      stopMonitoring();
    }
  }, [autoStopOnComplete, execution, isRunning, isMonitoring, stopMonitoring]);

  return {
    // Data
    execution,
    logs,
    
    // Loading states
    isLoading,
    isLoadingLogs,
    isMonitoring,
    
    // Error handling
    error,
    
    // Actions
    refresh,
    loadLogs,
    startMonitoring,
    stopMonitoring,
    
    // Real-time status
    lastUpdated,
    isComplete,
    isRunning,
    isFailed,
  };
}

export default useExecutionDetail;
