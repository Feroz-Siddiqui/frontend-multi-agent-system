/**
 * Workflow Configuration Constants
 * Backend-aligned enums and presets matching LangGraph engine exactly
 */

import type { 
  WorkflowMode,
  CompletionStrategy,
  InterventionType,
  InterventionPoint,
} from '../../types';

import { 
  ArrowRight, 
  GitBranch, 
  Layers,
  Play,
  Eye,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';

// Backend-aligned HITL Presets (matching LangGraph engine exactly)
export const HITL_PRESETS = {
  none: {
    label: 'No HITL',
    description: 'Agent runs automatically',
    icon: Play,
    config: null
  },
  review: {
    label: 'Review Results',
    description: 'Review agent output after execution',
    icon: Eye,
    config: {
      enabled: true,
      intervention_points: ['after_execution' as InterventionPoint] as InterventionPoint[],
      intervention_type: 'review' as InterventionType,
      timeout_seconds: 300,
      auto_approve_after_timeout: false,
      required_fields: [] as string[],
    }
  },
  approve: {
    label: 'Approve First',
    description: 'Approve before agent execution',
    icon: UserCheck,
    config: {
      enabled: true,
      intervention_points: ['before_execution' as InterventionPoint] as InterventionPoint[],
      intervention_type: 'approval' as InterventionType,
      timeout_seconds: 180,
      auto_approve_after_timeout: false,
      required_fields: [] as string[],
    }
  },
  errors: {
    label: 'Handle Errors',
    description: 'Intervene when agent encounters errors',
    icon: AlertTriangle,
    config: {
      enabled: true,
      intervention_points: ['on_error' as InterventionPoint] as InterventionPoint[],
      intervention_type: 'input' as InterventionType,
      timeout_seconds: 600,
      auto_approve_after_timeout: false,
      required_fields: [] as string[],
    }
  }
} as const;

// Backend-aligned enums (exact matches from template.py and langgraph_engine.py)
export const WORKFLOW_MODES: Array<{ 
  value: WorkflowMode; 
  label: string; 
  description: string; 
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    value: 'sequential',
    label: 'Sequential',
    description: 'Agents execute one after another',
    icon: ArrowRight,
  },
  {
    value: 'parallel',
    label: 'Parallel',
    description: 'Multiple agents execute simultaneously',
    icon: Layers,
  },
  {
    value: 'conditional',
    label: 'Conditional',
    description: 'Dynamic routing based on conditions',
    icon: GitBranch,
  },
];

export const COMPLETION_STRATEGIES: Array<{
  value: CompletionStrategy;
  label: string;
  description: string;
}> = [
  { value: 'all', label: 'All Agents', description: 'Wait for all agents to complete' },
  { value: 'majority', label: 'Majority', description: 'Wait for >50% of agents' },
  { value: 'any', label: 'Any Success', description: 'Stop after first success' },
  { value: 'threshold', label: 'Threshold', description: 'Wait for specific number' },
  { value: 'first_success', label: 'First Success', description: 'Stop immediately after first success' },
];

export const INTERVENTION_TYPES: Array<{
  value: InterventionType;
  label: string;
  description: string;
}> = [
  { value: 'approval', label: 'Approval', description: 'Simple approve/reject decision' },
  { value: 'input', label: 'Input', description: 'Request additional information' },
  { value: 'review', label: 'Review', description: 'Review and provide feedback' },
  { value: 'modify', label: 'Modify', description: 'Allow result modification' },
  { value: 'decision', label: 'Decision', description: 'Make routing decisions' },
];

export const INTERVENTION_POINTS: Array<{
  value: InterventionPoint;
  label: string;
  description: string;
}> = [
  { value: 'before_execution', label: 'Before Execution', description: 'Approve before agent runs' },
  { value: 'after_execution', label: 'After Execution', description: 'Review agent results' },
  { value: 'on_error', label: 'On Error', description: 'Handle agent failures' },
  { value: 'conditional', label: 'Conditional', description: 'Dynamic intervention' },
];
