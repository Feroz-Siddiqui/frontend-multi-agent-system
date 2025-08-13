/**
 * Profile Service
 * Handles API calls for user profile and statistics
 */

import { apiClient } from '../../../services/api/ApiClient';

// User statistics interface
export interface UserStats {
  totalExecutions: number;
  totalCost: number;
  successRate: number;
  averageExecutionTime: number;
  lastExecutionDate: string | null;
}

// Execution history response interface (reusing from dashboard)
interface ExecutionListResponse {
  success: boolean;
  user_id: string;
  total_executions: number;
  page: number;
  limit: number;
  has_more: boolean;
  executions: ExecutionHistoryItem[];
  summary_stats: {
    total_cost: number;
    total_duration_hours: number;
    success_rate: number;
    average_confidence: number;
  };
}

interface ExecutionHistoryItem {
  execution_id: string;
  template_id: string;
  template_name: string;
  query: string;
  status: string;
  started_at: string;
  completed_at?: string;
  total_duration_seconds?: number;
  final_confidence: number;
  total_cost: number;
  agents_executed: number;
  workflow_type: string;
  final_recommendation?: string;
  key_findings_count: number;
  error_count: number;
  human_interventions: number;
}

export class ProfileService {
  /**
   * Get user statistics from execution history
   */
  async getUserStats(): Promise<UserStats> {
    try {
      // Fetch all user executions to calculate statistics
      const response = await apiClient.get<ExecutionListResponse>('/api/execution-results/history', {
        params: { 
          limit: 1000, // Get all executions for accurate stats
          page: 1 
        }
      });

      const executions = response.executions || [];
      const summaryStats = response.summary_stats;

      // Calculate statistics
      const totalExecutions = response.total_executions || 0;
      const totalCost = summaryStats?.total_cost || 0;
      
      // Calculate success rate from actual execution statuses
      let successfulExecutions = 0;
      let lastExecutionDate: string | null = null;
      let totalDurationSeconds = 0;
      let completedExecutions = 0;

      executions.forEach((execution) => {
        // Count successful executions
        if (execution.status === 'completed' || execution.status === 'success') {
          successfulExecutions++;
        }

        // Track latest execution date
        if (execution.started_at) {
          if (!lastExecutionDate || new Date(execution.started_at) > new Date(lastExecutionDate)) {
            lastExecutionDate = execution.started_at;
          }
        }

        // Calculate average execution time
        if (execution.total_duration_seconds) {
          totalDurationSeconds += execution.total_duration_seconds;
          completedExecutions++;
        }
      });

      const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;
      const averageExecutionTime = completedExecutions > 0 ? totalDurationSeconds / completedExecutions : 0;

      return {
        totalExecutions,
        totalCost,
        successRate,
        averageExecutionTime,
        lastExecutionDate
      };

    } catch (error) {
      console.error('Failed to fetch user statistics:', error);
      
      // Return default stats if API fails
      return {
        totalExecutions: 0,
        totalCost: 0,
        successRate: 0,
        averageExecutionTime: 0,
        lastExecutionDate: null
      };
    }
  }

  /**
   * Get recent user executions for profile display
   */
  async getRecentExecutions(limit: number = 5): Promise<ExecutionHistoryItem[]> {
    try {
      const response = await apiClient.get<ExecutionListResponse>('/api/execution-results/history', {
        params: { 
          limit,
          page: 1 
        }
      });

      return response.executions || [];

    } catch (error) {
      console.error('Failed to fetch recent executions:', error);
      return [];
    }
  }
}

export const profileService = new ProfileService();
