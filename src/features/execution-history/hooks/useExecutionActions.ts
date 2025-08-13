/**
 * useExecutionActions Hook
 * 
 * Hook for execution actions (cancel, retry, duplicate, export, delete)
 */

import { useState, useCallback } from 'react';
import { executionHistoryService } from '../services';
import type { ExecutionAction, ExecutionExportOptions } from '../types';

interface UseExecutionActionsOptions {
  onSuccess?: (action: string, result: unknown) => void;
  onError?: (action: string, error: Error) => void;
}

interface UseExecutionActionsReturn {
  // Loading states
  isPerformingAction: boolean;
  currentAction: string | null;
  
  // Error handling
  error: string | null;
  
  // Actions
  cancelExecution: (executionId: string) => Promise<void>;
  retryExecution: (executionId: string) => Promise<string>;
  duplicateExecution: (executionId: string) => Promise<string>;
  exportExecution: (executionId: string, options: ExecutionExportOptions) => Promise<void>;
  deleteExecution: (executionId: string) => Promise<void>;
  performAction: (action: ExecutionAction) => Promise<unknown>;
  
  // Utilities
  clearError: () => void;
}

export function useExecutionActions(
  options: UseExecutionActionsOptions = {}
): UseExecutionActionsReturn {
  const { onSuccess, onError } = options;

  // State
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Generic action handler
  const handleAction = useCallback(async <T>(
    actionName: string,
    actionFn: () => Promise<T>
  ): Promise<T> => {
    try {
      setIsPerformingAction(true);
      setCurrentAction(actionName);
      setError(null);

      const result = await actionFn();
      
      onSuccess?.(actionName, result);
      return result;

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error.message);
      onError?.(actionName, error);
      throw error;
    } finally {
      setIsPerformingAction(false);
      setCurrentAction(null);
    }
  }, [onSuccess, onError]);

  // Cancel execution
  const cancelExecution = useCallback(async (executionId: string): Promise<void> => {
    await handleAction('cancel', async () => {
      const result = await executionHistoryService.cancelExecution(executionId);
      return result;
    });
  }, [handleAction]);

  // Retry execution
  const retryExecution = useCallback(async (executionId: string): Promise<string> => {
    return await handleAction('retry', async () => {
      const result = await executionHistoryService.retryExecution(executionId);
      return result.execution_id;
    });
  }, [handleAction]);

  // Duplicate execution
  const duplicateExecution = useCallback(async (executionId: string): Promise<string> => {
    return await handleAction('duplicate', async () => {
      const result = await executionHistoryService.duplicateExecution(executionId);
      return result.execution_id;
    });
  }, [handleAction]);

  // Export execution
  const exportExecution = useCallback(async (
    executionId: string, 
    options: ExecutionExportOptions
  ): Promise<void> => {
    await handleAction('export', async () => {
      const result = await executionHistoryService.exportExecution(executionId, options);
      
      // Handle download URL if provided
      if (result.download_url) {
        // Create a temporary link to trigger download
        const link = document.createElement('a');
        link.href = result.download_url;
        link.download = `execution-${executionId}.${options.format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      return result;
    });
  }, [handleAction]);

  // Delete execution
  const deleteExecution = useCallback(async (executionId: string): Promise<void> => {
    await handleAction('delete', async () => {
      const result = await executionHistoryService.deleteExecution(executionId);
      return result;
    });
  }, [handleAction]);

  // Generic action performer
  const performAction = useCallback(async (action: ExecutionAction): Promise<unknown> => {
    return await handleAction(action.type, async () => {
      return await executionHistoryService.performAction(action);
    });
  }, [handleAction]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Loading states
    isPerformingAction,
    currentAction,
    
    // Error handling
    error,
    
    // Actions
    cancelExecution,
    retryExecution,
    duplicateExecution,
    exportExecution,
    deleteExecution,
    performAction,
    
    // Utilities
    clearError,
  };
}

export default useExecutionActions;
