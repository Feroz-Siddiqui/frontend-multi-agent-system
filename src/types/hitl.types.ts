/**
 * Human-in-the-Loop (HITL) Types
 * 
 * TypeScript types for HITL functionality aligned with backend Python enums
 * Used in LangGraph execution workflow for human interventions
 */

// HITL Intervention Types - matches src/models/template.py:15
export type InterventionType = 
  | 'approval'    // Simple approve/reject
  | 'input'       // Human provides input data
  | 'review'      // Human reviews and validates
  | 'modify'      // Human modifies agent parameters
  | 'decision';   // Human makes routing decision

// HITL Intervention Points - matches src/models/template.py:24
export type InterventionPoint = 
  | 'before_execution'  // Pre-agent execution
  | 'after_execution'   // Post-agent execution
  | 'on_error'         // When agent fails
  | 'conditional';     // At routing decisions

// Parallel Execution Completion Strategies - matches src/models/template.py:88
export type CompletionStrategy = 
  | 'all'           // Wait for all agents
  | 'majority'      // >50% completion
  | 'any'          // Any single completion
  | 'threshold'    // N agents complete
  | 'first_success'; // First successful agent

// HITL Configuration - matches src/models/template.py:32
export interface HITLConfig {
  enabled: boolean;
  intervention_points: InterventionPoint[];
  intervention_type: InterventionType;
  timeout_seconds: number;
  auto_approve_after_timeout: boolean;
  required_fields: string[];
  custom_prompt?: string;
}

// HITL Intervention Request - matches src/models/template.py:43
export interface InterventionRequest {
  intervention_id: string;
  execution_id: string;
  agent_id: string;
  intervention_type: InterventionType;
  intervention_point: InterventionPoint;
  context: Record<string, unknown>;
  agent_result?: Record<string, unknown>;
  requested_at: string;
  timeout_at: string;
  status: 'pending' | 'completed' | 'timeout' | 'cancelled';
  user_id: string;
}

// HITL Intervention Response - matches src/models/template.py:64
export interface InterventionResponse {
  intervention_id: string;
  action: 'approve' | 'reject' | 'modify' | 'skip' | 'retry' | 'cancel';
  modifications?: Record<string, unknown>;
  human_feedback?: string;
  custom_parameters?: Record<string, unknown>;
  responded_at: string;
  response_time_seconds: number;
}

// Parallel Completion Tracker - matches src/models/template.py:97
export interface ParallelCompletionTracker {
  total_agents: number;
  required_completions: number;
  completion_strategy: CompletionStrategy;
  completed_count: number;
  failed_count: number;
  skipped_count: number;
  pending_count: number;
  agent_statuses: Record<string, Record<string, unknown>>;
  is_complete: boolean;
  completion_reason?: string;
  completed_at?: string;
}

// Execution State - matches src/models/template.py:118
export interface ExecutionState {
  execution_id: string;
  status: ExecutionStatus;
  workflow_mode: 'sequential' | 'parallel' | 'conditional';
  current_step: number;
  total_steps: number;
  progress_percentage: number;
  current_agent?: string;
  completed_agents: string[];
  failed_agents: string[];
  pending_agents: string[];
  blocked_agents: string[];
  pending_interventions: Record<string, InterventionRequest>;
  intervention_history: InterventionResponse[];
  completion_tracker?: ParallelCompletionTracker;
  started_at: string;
  last_updated: string;
  user_id: string;
}

// Enhanced Execution Status with HITL support - matches src/models/template.py:76
export type ExecutionStatus = 
  | 'pending'
  | 'running'
  | 'waiting_intervention'  // HITL-specific status
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout';

// Default HITL Configuration
export const DEFAULT_HITL_CONFIG: HITLConfig = {
  enabled: false,
  intervention_points: [],
  intervention_type: 'approval',
  timeout_seconds: 300,
  auto_approve_after_timeout: false,
  required_fields: [],
  custom_prompt: undefined,
};