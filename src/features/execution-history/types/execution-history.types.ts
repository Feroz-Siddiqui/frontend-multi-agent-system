/**
 * Execution History Types
 *
 * TypeScript interfaces synchronized with backend Pydantic models
 */

import type { ExecutionStatus } from '../../../types/hitl.types';
import type { TavilyConfig } from '../../../types/tavily.types';

// Backend-synchronized types
export interface ExecutionResult {
  execution_id: string;
  template_id: string;
  template_name: string;
  query: string;
  status: ExecutionStatus;
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

export interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  agents: Agent[];
  workflow: WorkflowConfig;
  created_by: string;
  created_at: string;
  updated_at: string;
  execution_count: number;
  success_rate: number;
  avg_cost: number;
  avg_duration: number;
  is_active: boolean;
  is_public: boolean;
}

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  system_prompt: string;
  user_prompt: string;
  llm_config: LLMConfig;
  tavily_config: TavilyConfig;
  depends_on?: string[];
}

export interface LLMConfig {
  provider: 'openai';
  model: 'gpt-4' | 'gpt-3.5-turbo' | 'gpt-4-turbo';
  temperature: number;
  max_tokens: number;
}

// Re-export TavilyConfig from centralized types
export type { TavilyConfig } from '../../../types/tavily.types';

export interface WorkflowConfig {
  mode: 'sequential' | 'parallel' | 'conditional';
  sequence?: string[];
  parallel_groups?: string[][];
  conditions?: Record<string, unknown>;
}

// Re-export ExecutionStatus from centralized types
export type { ExecutionStatus } from '../../../types/hitl.types';

export type TemplateCategory = 
  | 'market_research'
  | 'risk_assessment'
  | 'data_analysis'
  | 'competitive_intelligence'
  | 'trend_analysis';

export type AgentType = 
  | 'research'
  | 'analysis'
  | 'synthesis'
  | 'validation';

export interface ExecutionRequest {
  template_id: string;
  query: string;
  user_id: string;
  custom_parameters?: Record<string, unknown>;
}

export interface TemplateStats {
  template_id: string;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  success_rate: number;
  avg_duration: number;
  avg_cost: number;
  avg_confidence: number;
  most_common_queries: string[];
  peak_usage_hours: number[];
  last_execution?: string;
  stats_updated_at: string;
}

export interface ExecutionFilters {
  status?: ExecutionStatus;
  template_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface ExecutionMetrics {
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  total_cost: number;
  total_tokens: number;
  average_duration: number;
  success_rate: number;
}

export interface ExecutionListResponse {
  executions: ExecutionResult[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface ExecutionExportOptions {
  format: 'json' | 'pdf';
  include_agent_details?: boolean;
  include_raw_data?: boolean;
}

export interface ExecutionAction {
  type: 'cancel' | 'retry' | 'duplicate' | 'export' | 'delete';
  execution_id: string;
  options?: Record<string, unknown>;
}

export interface ExecutionStatusCounts {
  pending: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
}

export interface ExecutionDetailModalProps {
  execution: ExecutionResult | null;
  isOpen: boolean;
  onClose: () => void;
}

export interface ExecutionCardProps {
  execution: ExecutionResult;
  onSelect: (execution: ExecutionResult) => void;
  onAction: (action: ExecutionAction) => void;
}

export interface ExecutionFiltersProps {
  filters: ExecutionFilters;
  onFiltersChange: (filters: ExecutionFilters) => void;
  onReset: () => void;
}

export interface ExecutionMetricsProps {
  metrics: ExecutionMetrics;
  isLoading?: boolean;
}
