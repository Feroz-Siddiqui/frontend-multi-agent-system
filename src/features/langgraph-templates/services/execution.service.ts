/**
 * Template Execution Service
 * 
 * API service for template execution with real-time streaming support
 */

import { ApiClient } from '../../../services/api/ApiClient';
import { apiConfig } from '../../../services/config/api.config';
import type { Template } from '../types';

export interface ExecutionRequest {
  template_id: string;
  query: string;
  custom_parameters?: Record<string, unknown>;
}

export interface ExecutionResponse {
  execution_id: string;
  message: string;
  status: string;
}

export interface ExecutionResult {
  execution_id: string;
  template_id: string;
  template_name: string;
  query: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  agent_results: AgentResult[];
  final_result?: Record<string, unknown>;
  total_cost: number;
  total_duration: number;
  overall_confidence: number;
  total_tokens: number;
  total_tavily_credits: number;
  progress_percentage: number;
  current_agent?: string;
  error_message?: string;
  failed_agent?: string;
  started_at: string;
  completed_at?: string;
  user_id: string;
}

export interface AgentResult {
  agent_id: string;
  agent_name: string;
  success: boolean;
  result?: Record<string, unknown>;
  error?: string;
  cost: number;
  duration_seconds: number;
  confidence_score: number;
  tokens_used: number;
  tavily_calls: number;
  tavily_credits: number;
  started_at: string;
  completed_at?: string;
}

export interface StreamingEvent {
  type: 'connection_established' | 'agent_started' | 'agent_result' | 'execution_status' | 
        'execution_completed' | 'execution_error' | 'parallel_progress' | 'intervention_required' | 
        'heartbeat';
  data: any;
  timestamp: string;
  connection_id?: string;
}

export interface ParallelProgress {
  execution_id: string;
  completion_tracker: {
    total_agents: number;
    completed_count: number;
    failed_count: number;
    pending_count: number;
    completion_percentage: number;
    is_complete: boolean;
    completion_strategy: string;
  };
  active_agents: string[];
  agent_statuses: Record<string, string>;
}

export interface InterventionRequest {
  intervention_id: string;
  execution_id: string;
  agent_id: string;
  intervention_type: string;
  intervention_point: string;
  context: Record<string, unknown>;
  agent_result: any;
  timeout_at: string;
  requested_at: string;
}

export interface InterventionResponse {
  intervention_id: string;
  action: 'approve' | 'reject' | 'skip' | 'retry';
  human_feedback?: string;
}

export class ExecutionService {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = ApiClient.getInstance();
  }

  /**
   * Execute a template with the given query
   */
  async executeTemplate(request: ExecutionRequest): Promise<ExecutionResponse> {
    try {
      const response = await this.apiClient.post<ExecutionResponse>('/api/execute', request);
      return response;
    } catch (error) {
      console.error('Failed to execute template:', error);
      throw new Error('Failed to start template execution. Please try again.');
    }
  }

  /**
   * Get execution status and results
   */
  async getExecutionStatus(executionId: string): Promise<ExecutionResult> {
    try {
      const response = await this.apiClient.get<ExecutionResult>(`/api/executions/${executionId}`);
      return response;
    } catch (error) {
      console.error('Failed to get execution status:', error);
      throw new Error('Failed to load execution status. Please try again.');
    }
  }

  /**
   * Cancel a running execution
   */
  async cancelExecution(executionId: string): Promise<{ message: string }> {
    try {
      const response = await this.apiClient.post<{ message: string }>(`/api/executions/${executionId}/cancel`);
      return response;
    } catch (error) {
      console.error('Failed to cancel execution:', error);
      throw new Error('Failed to cancel execution. Please try again.');
    }
  }

  /**
   * Get execution logs
   */
  async getExecutionLogs(executionId: string): Promise<any> {
    try {
      const response = await this.apiClient.get(`/api/executions/${executionId}/logs`);
      return response;
    } catch (error) {
      console.error('Failed to get execution logs:', error);
      throw new Error('Failed to load execution logs. Please try again.');
    }
  }

  /**
   * Submit intervention response
   */
  async submitInterventionResponse(response: InterventionResponse): Promise<void> {
    try {
      await this.apiClient.post('/api/interventions/respond', response);
    } catch (error) {
      console.error('Failed to submit intervention response:', error);
      throw new Error('Failed to submit intervention response. Please try again.');
    }
  }

  /**
   * Create SSE connection for real-time execution updates
   */
  createExecutionStream(executionId: string, onEvent: (event: StreamingEvent) => void): () => void {
    // Get JWT token from localStorage
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Authentication token not found. Please log in again.');
    }
    
    const eventSource = new EventSource(`${apiConfig.baseURL}/api/stream/execution/${executionId}?token=${encodeURIComponent(token)}`);
    
    eventSource.onmessage = (event) => {
      try {
        const streamingEvent: StreamingEvent = JSON.parse(event.data);
        onEvent(streamingEvent);
      } catch (error) {
        console.error('Failed to parse streaming event:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log('Attempting to reconnect SSE...');
          // The caller should handle reconnection logic
        }
      }, 5000);
    };

    // Return cleanup function
    return () => {
      eventSource.close();
    };
  }

  /**
   * Get available templates for execution
   */
  async getAvailableTemplates(): Promise<Template[]> {
    try {
      const response = await this.apiClient.get<{templates: Template[]}>('/api/templates');
      return response.templates || [];
    } catch (error) {
      console.error('Failed to get available templates:', error);
      return [];
    }
  }

  /**
   * Get template by ID for execution preview
   */
  async getTemplateForExecution(templateId: string): Promise<Template> {
    try {
      const response = await this.apiClient.get<Template>(`/api/templates/${templateId}`);
      return response;
    } catch (error) {
      console.error('Failed to get template for execution:', error);
      throw new Error('Failed to load template details. Please try again.');
    }
  }

  /**
   * Validate query before execution
   */
  async validateQuery(templateId: string, query: string): Promise<{ isValid: boolean; errors: string[] }> {
    try {
      const response = await this.apiClient.post<{ isValid: boolean; errors: string[] }>(
        '/api/templates/validate-query',
        { template_id: templateId, query }
      );
      return response;
    } catch (error) {
      console.error('Failed to validate query:', error);
      // Return basic validation
      return {
        isValid: query.trim().length > 10,
        errors: query.trim().length <= 10 ? ['Query must be at least 10 characters long'] : []
      };
    }
  }

  /**
   * Get execution metrics for dashboard
   */
  async getExecutionMetrics(days: number = 30): Promise<any> {
    try {
      const response = await this.apiClient.get(`/api/executions/metrics/summary?days=${days}`);
      return response;
    } catch (error) {
      console.error('Failed to get execution metrics:', error);
      return null;
    }
  }

  /**
   * Get execution preview (HTML version of PDF)
   */
  async getExecutionPreview(executionId: string): Promise<string> {
    try {
      const response = await this.apiClient.get<{html: string}>(`/api/executions/${executionId}/export?format=html`);
      return response.html || '';
    } catch (error) {
      console.error('Failed to get execution preview:', error);
      throw new Error('Failed to load execution preview. Please try again.');
    }
  }

  /**
   * Export execution results
   */
  async exportExecution(executionId: string, format: 'json' | 'pdf' = 'json'): Promise<any> {
    try {
      if (format === 'pdf') {
        // For PDF, we need to handle the binary response differently
        const token = localStorage.getItem('auth_token');
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

        return { success: true, message: 'PDF downloaded successfully' };
      } else {
        const response = await this.apiClient.get(`/api/executions/${executionId}/export?format=${format}`);
        return response;
      }
    } catch (error) {
      console.error('Failed to export execution:', error);
      throw new Error('Failed to export execution results. Please try again.');
    }
  }
}

// Export singleton instance
export const executionService = new ExecutionService();
export default executionService;
