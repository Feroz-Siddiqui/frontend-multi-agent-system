/**
 * Centralized Type Exports
 * 
 * Main entry point for all TypeScript types used across the application
 * Provides clean imports and maintains consistency with backend models
 */

// HITL (Human-in-the-Loop) Types
export type {
  InterventionType,
  InterventionPoint,
  CompletionStrategy,
  ExecutionStatus,
  HITLConfig,
  InterventionRequest,
  InterventionResponse,
  ParallelCompletionTracker,
  ExecutionState,
} from './hitl.types';

export { DEFAULT_HITL_CONFIG } from './hitl.types';

// Tavily API Types
export type {
  TavilyAPIType,
  TavilySearchDepth,
  TavilyExtractDepth,
  TavilyContentFormat,
  TavilyTimeRange,
  TavilyConfig,
  TavilySearchResult,
  TavilySearchResponse,
  TavilyExtractResult,
  TavilyExtractResponse,
  TavilyCrawlResult,
  TavilyCrawlResponse,
  TavilyMapResponse,
  TavilyUnifiedResponse,
} from './tavily.types';

export { DEFAULT_TAVILY_CONFIG } from './tavily.types';

// Template Types (re-export from feature modules)
export type {
  AgentType,
  WorkflowMode,
  LLMConfig,
  Agent,
  WorkflowConfig,
  Template,
  TemplateCreationData,
  ValidationError,
  ValidationResult,
} from '../features/langgraph-templates/types/template.types';

export {
  DEFAULT_LLM_CONFIG,
  DEFAULT_AGENT,
  DEFAULT_TEMPLATE,
  DEFAULT_TEMPLATE_CREATION_DATA,
} from '../features/langgraph-templates/types/template.types';

// Execution History Types
export type {
  ExecutionResult,
  AgentResult,
  ExecutionRequest,
  TemplateStats,
  ExecutionFilters,
  ExecutionMetrics,
  ExecutionListResponse,
  ExecutionExportOptions,
  ExecutionAction,
  ExecutionStatusCounts,
} from '../features/execution-history/types/execution-history.types';

// Dashboard Types
export type {
  SystemHealthStatus,
  ActivitySeverity,
  RealTimeUpdateType,
  SystemOverview,
  LiveExecution,
  TemplateHubItem,
  PerformanceMetrics,
  ExecutionTrend,
  CostAnalysis,
  AgentPerformance,
  ResponseTimeMetrics,
  ActivityItem,
  SystemHealth,
  SystemComponent,
  SystemAlert,
  DashboardData,
  DashboardFilters,
  RealTimeUpdate,
} from '../features/dashboard/types/dashboard.types';

// Auth Types (from AuthService)
export type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  UserResponse,
  UpdateProfileRequest,
} from '../services/api/AuthService';
