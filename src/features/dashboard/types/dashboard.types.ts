/**
 * Dashboard Types
 * 
 * TypeScript types for dashboard functionality
 */

export interface SystemOverview {
  activeExecutions: number;
  totalTemplates: number;
  successRate: number;
  costEfficiency: number;
  systemHealth: SystemHealthStatus;
  totalExecutionsToday: number;
  averageExecutionTime: number;
  totalCostToday: number;
}

export interface LiveExecution {
  id: string;
  templateId: string;
  templateName: string;
  status: ExecutionStatus;
  progress: number;
  currentAgent?: string;
  startedAt: string;
  estimatedCompletion?: string;
  costSoFar: number;
  tokensUsed: number;
  userId: string;
  canPause: boolean;
  canCancel: boolean;
}

export interface TemplateHubItem {
  id: string;
  name: string;
  description: string;
  category: string;
  usageCount: number;
  successRate: number;
  averageDuration: number;
  averageCost: number;
  lastUsed?: string;
  isFeatured: boolean;
  tags: string[];
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  severity: ActivitySeverity;
  timestamp: string;
  userId?: string;
  executionId?: string;
  templateId?: string;
  metadata: Record<string, unknown>;
}

export interface SystemComponent {
  name: string;
  status: SystemHealthStatus;
  lastCheck: string;
  responseTime?: number;
  errorMessage?: string;
}

export interface SystemAlert {
  id: string;
  title: string;
  description: string;
  severity: ActivitySeverity;
  createdAt: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface SystemHealth {
  overall: SystemHealthStatus;
  components: SystemComponent[];
  alerts: SystemAlert[];
  uptime: number;
  lastCheck: string;
}

export interface ExecutionTrend {
  timestamp: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  totalCost: number;
}

export interface CostAnalysis {
  totalCost: number;
  costByTemplate: Array<{ templateId: string; cost: number }>;
  costByAgent: Array<{ agentName: string; cost: number }>;
  costTrend: Array<{ timestamp: string; cost: number }>;
}

export interface AgentPerformance {
  agentName: string;
  totalExecutions: number;
  successRate: number;
  averageDuration: number;
  averageCost: number;
  averageConfidence: number;
}

export interface ResponseTimeMetrics {
  averageResponseTime: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
}

export interface PerformanceMetrics {
  executionTrends: ExecutionTrend[];
  costAnalysis: CostAnalysis;
  agentPerformance: AgentPerformance[];
  responseTimeMetrics: ResponseTimeMetrics;
}

export interface DashboardData {
  systemOverview: SystemOverview;
  liveExecutions: LiveExecution[];
  templateHub: TemplateHubItem[];
  performanceMetrics: PerformanceMetrics;
  activityFeed: ActivityItem[];
  systemHealth: SystemHealth;
  lastUpdated: string;
}

export interface DashboardFilters {
  timeRange?: string;
  templateCategory?: string;
  executionStatus?: ExecutionStatus[];
  showOnlyFavorites?: boolean;
}

export interface RealTimeUpdate {
  type: RealTimeUpdateType;
  data: Record<string, unknown>;
  timestamp: string;
  userId?: string;
}

// Type unions instead of enums
export type SystemHealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown';

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';

export type ActivitySeverity = 'info' | 'success' | 'warning' | 'error';

export type RealTimeUpdateType = 'execution_update' | 'system_metric' | 'new_activity' | 'system_alert' | 'template_update';

// Dashboard component props
export interface DashboardPageProps {
  initialFilters?: DashboardFilters;
}

export interface SystemOverviewCardsProps {
  data: SystemOverview | null;
  isLoading?: boolean;
}

export interface LiveExecutionMonitorProps {
  executions: LiveExecution[];
  isLoading?: boolean;
  onStop: (executionId: string) => Promise<void>;
  onPause: (executionId: string) => Promise<void>;
  onResume: (executionId: string) => Promise<void>;
  onViewDetails: (executionId: string) => void;
}

export interface TemplateHubProps {
  templates: TemplateHubItem[];
  isLoading?: boolean;
  onExecute: (templateId: string) => Promise<void>;
  onViewDetails: (templateId: string) => void;
}

export interface ActivityFeedProps {
  activities: ActivityItem[];
  isLoading?: boolean;
  limit?: number;
}

export interface SystemHealthProps {
  health: SystemHealth;
  isLoading?: boolean;
  onAcknowledgeAlert: (alertId: string) => Promise<void>;
}

export interface PerformanceChartsProps {
  metrics: PerformanceMetrics;
  isLoading?: boolean;
  timeRange?: string;
}

export interface AgentPerformanceCardsProps {
  agents: AgentPerformance[];
  isLoading?: boolean;
}

export interface QuickStatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  onClick?: () => void;
}

// Hook return types
export interface UseDashboardDataReturn {
  // Data
  dashboardData: DashboardData | null;
  systemOverview: SystemOverview | null;
  liveExecutions: LiveExecution[];
  templateHub: TemplateHubItem[];
  performanceMetrics: PerformanceMetrics | null;
  activityFeed: ActivityItem[];
  systemHealth: SystemHealth | null;
  
  // State
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isRealTimeConnected: boolean;
  
  // Actions
  refresh: () => Promise<void>;
  executeTemplate: (templateId: string, parameters?: Record<string, unknown>) => Promise<string>;
  stopExecution: (executionId: string) => Promise<void>;
  pauseExecution: (executionId: string) => Promise<void>;
  resumeExecution: (executionId: string) => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  updateFilters: (filters: Partial<DashboardFilters>) => void;
  toggleRealTime: () => void;
  
  // Filters
  filters: DashboardFilters;
}

export interface UseDashboardDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableRealTime?: boolean;
  initialFilters?: DashboardFilters;
}
