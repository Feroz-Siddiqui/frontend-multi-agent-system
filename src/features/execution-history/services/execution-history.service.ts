/**
 * Execution History Service
 * 
 * API service for execution history operations
 */

import { ApiClient } from '../../../services/api/ApiClient';
import { apiConfig } from '../../../services/config/api.config';
import type {
  ExecutionResult,
  ExecutionListResponse,
  ExecutionFilters,
  ExecutionMetrics,
  ExecutionStatusCounts,
  ExecutionAction,
  ExecutionExportOptions,
} from '../types';

// Helper function for type-safe API responses
function assertApiResponse<T>(response: unknown): T {
  return response as T;
}

class ExecutionHistoryService {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = ApiClient.getInstance();
  }

  /**
   * Get paginated list of executions
   */
  async getExecutions(
    page: number = 1,
    limit: number = 20,
    filters?: ExecutionFilters
  ): Promise<ExecutionListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    // Add filters to params
    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.template_id) {
      params.append('template_id', filters.template_id);
    }
    if (filters?.date_from) {
      params.append('date_from', filters.date_from);
    }
    if (filters?.date_to) {
      params.append('date_to', filters.date_to);
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }

    const response = await this.apiClient.get(`/api/executions?${params.toString()}`);
    // Backend now returns proper pagination object
    const paginationResponse = assertApiResponse<{
      executions: ExecutionResult[];
      total: number;
      page: number;
      limit: number;
      total_pages: number;
      has_more: boolean;
    }>(response);
    
    return {
      executions: paginationResponse.executions || [],
      total: paginationResponse.total || 0,
      page: paginationResponse.page || page,
      limit: paginationResponse.limit || limit,
      has_more: paginationResponse.has_more || false,
    };
  }

  /**
   * Get single execution by ID
   */
  async getExecution(executionId: string): Promise<ExecutionResult> {
    const response = await this.apiClient.get(`/api/executions/${executionId}`);
    return assertApiResponse<ExecutionResult>(response);
  }

  /**
   * Get execution status counts
   */
  async getExecutionStatusCounts(): Promise<ExecutionStatusCounts> {
    const response = await this.apiClient.get('/api/executions/status/counts');
    return assertApiResponse<ExecutionStatusCounts>(response);
  }

  /**
   * Get execution metrics summary
   */
  async getExecutionMetrics(days: number = 30): Promise<ExecutionMetrics> {
    const response = await this.apiClient.get(`/api/executions/metrics/summary?days=${days}`);
    const apiResponse = assertApiResponse<{ metrics: ExecutionMetrics }>(response);
    return apiResponse.metrics;
  }

  /**
   * Cancel a running execution
   */
  async cancelExecution(executionId: string): Promise<{ message: string }> {
    const response = await this.apiClient.post(`/api/executions/${executionId}/cancel`);
    return assertApiResponse<{ message: string }>(response);
  }

  /**
   * Retry a failed execution
   */
  async retryExecution(executionId: string): Promise<{ execution_id: string }> {
    // Get the original execution
    const execution = await this.getExecution(executionId);
    
    // Create a new execution with the same parameters
    const response = await this.apiClient.post('/api/execute', {
      template_id: execution.template_id,
      query: execution.query,
    });
    
    return assertApiResponse<{ execution_id: string }>(response);
  }

  /**
   * Duplicate an execution (create new with same parameters)
   */
  async duplicateExecution(executionId: string): Promise<{ execution_id: string }> {
    return this.retryExecution(executionId); // Same logic as retry
  }

  /**
   * Export execution results
   */
  async exportExecution(
    executionId: string, 
    options: ExecutionExportOptions
  ): Promise<{ download_url?: string; data?: unknown }> {
    const params = new URLSearchParams({
      format: options.format,
    });

    if (options.include_agent_details) {
      params.append('include_agent_details', 'true');
    }
    if (options.include_raw_data) {
      params.append('include_raw_data', 'true');
    }

    const response = await this.apiClient.get(`/api/executions/${executionId}/export?${params.toString()}`);
    return assertApiResponse<{ download_url?: string; data?: unknown }>(response);
  }

  /**
   * Export execution to PDF and trigger download using new beautiful PDF service
   */
  async exportExecutionToPDF(executionId: string): Promise<void> {
    try {
      // Get JWT token from localStorage
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      const response = await fetch(`${apiConfig.baseURL}/api/executions/${executionId}/export?format=pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `execution_${executionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF export failed:', error);
      throw new Error('Failed to export PDF');
    }
  }

  /**
   * Delete an execution
   */
  async deleteExecution(executionId: string): Promise<{ message: string }> {
    const response = await this.apiClient.delete(`/api/executions/${executionId}`);
    return assertApiResponse<{ message: string }>(response);
  }

  /**
   * Get detailed execution logs
   */
  async getExecutionLogs(executionId: string): Promise<{
    execution_id: string;
    status: string;
    progress: number;
    current_agent: string;
    agent_results: unknown[];
    timeline: unknown[];
    errors: unknown[];
  }> {
    const response = await this.apiClient.get(`/api/executions/${executionId}/logs`);
    return assertApiResponse<{
      execution_id: string;
      status: string;
      progress: number;
      current_agent: string;
      agent_results: unknown[];
      timeline: unknown[];
      errors: unknown[];
    }>(response);
  }

  /**
   * Perform execution action
   */
  async performAction(action: ExecutionAction): Promise<unknown> {
    switch (action.type) {
      case 'cancel':
        return this.cancelExecution(action.execution_id);
      
      case 'retry':
        return this.retryExecution(action.execution_id);
      
      case 'duplicate':
        return this.duplicateExecution(action.execution_id);
      
      case 'export':
        if (!action.options || typeof action.options !== 'object' || !('format' in action.options)) {
          throw new Error('Export action requires valid options with format');
        }
        return this.exportExecution(
          action.execution_id, 
          action.options as unknown as ExecutionExportOptions
        );
      
      case 'delete':
        return this.deleteExecution(action.execution_id);
      
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Get popular templates based on execution count
   */
  async getPopularTemplates(limit: number = 10): Promise<unknown[]> {
    const response = await this.apiClient.get(`/api/executions/templates/popular?limit=${limit}`);
    return assertApiResponse<unknown[]>(response);
  }

  /**
   * Batch execute multiple templates
   */
  async batchExecute(requests: Array<{
    template_id: string;
    query: string;
  }>): Promise<{
    successful_executions: Array<{ execution_id: string; template_id: string }>;
    failed_executions: Array<{ template_id: string; error: string }>;
    total_requested: number;
  }> {
    const response = await this.apiClient.post('/api/executions/batch', { requests });
    return assertApiResponse<{
      successful_executions: Array<{ execution_id: string; template_id: string }>;
      failed_executions: Array<{ template_id: string; error: string }>;
      total_requested: number;
    }>(response);
  }

  /**
   * Real-time execution monitoring
   * Returns a function to stop monitoring
   */
  monitorExecution(
    executionId: string, 
    onUpdate: (execution: ExecutionResult) => void,
    onError: (error: Error) => void,
    intervalMs: number = 2000
  ): () => void {
    let isMonitoring = true;
    
    const poll = async () => {
      if (!isMonitoring) return;
      
      try {
        const execution = await this.getExecution(executionId);
        onUpdate(execution);
        
        // Stop monitoring if execution is complete
        if (['completed', 'failed', 'cancelled'].includes(execution.status)) {
          isMonitoring = false;
          return;
        }
        
        // Schedule next poll
        setTimeout(poll, intervalMs);
      } catch (error) {
        onError(error as Error);
        isMonitoring = false;
      }
    };
    
    // Start polling
    poll();
    
    // Return stop function
    return () => {
      isMonitoring = false;
    };
  }
}

export const executionHistoryService = new ExecutionHistoryService();
export default executionHistoryService;
