/**
 * Enhanced Workflow Configuration Form
 * 
 * Complete redesign with:
 * 1. Shadcn Tabs instead of dropdowns
 * 2. Top-positioned validation errors
 * 3. Complete backend field coverage
 * 4. Smart validation with auto-fixes
 * 5. Modular, maintainable components
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Button } from '../../../components/ui/button';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Checkbox } from '../../../components/ui/checkbox';
import { Switch } from '../../../components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { 
  Settings, 
  CheckCircle, 
  AlertTriangle,
  ArrowUpDown,
  Layers,
  GitBranch,
  Network,
  User,
  Shield
} from 'lucide-react';

import type {
  WorkflowConfig,
  Agent,
  Template,
  WorkflowMode,
  CompletionStrategy,
  InterventionType,
} from '../types';

import { validateWorkflow } from '../utils/workflow-validation';
import type { ValidationResult } from '../utils/workflow-validation';
import SequentialWorkflowVisualization from './workflow-visualizations/SequentialWorkflowVisualization';
import ParallelWorkflowVisualization from './workflow-visualizations/ParallelWorkflowVisualization';
import ConditionalWorkflowVisualization from './workflow-visualizations/ConditionalWorkflowVisualization';
import LangGraphWorkflowVisualization from './workflow-visualizations/LangGraphWorkflowVisualization';

interface WorkflowConfigurationFormProps {
  workflow: WorkflowConfig;
  agents: Agent[];
  template: Template;
  onUpdateWorkflow: (updates: Partial<WorkflowConfig>) => void;
  onUpdateTemplate: (updates: Partial<Template>) => void;
  onUpdateAgent: (index: number, updates: Partial<Agent>) => void;
  validation: ValidationResult;
}

const INTERVENTION_TYPES = [
  { value: 'approval' as InterventionType, label: 'Approval', description: 'Simple approve/reject' },
  { value: 'input' as InterventionType, label: 'Input', description: 'Human provides input' },
  { value: 'review' as InterventionType, label: 'Review', description: 'Human reviews results' },
  { value: 'modify' as InterventionType, label: 'Modify', description: 'Human modifies parameters' },
  { value: 'decision' as InterventionType, label: 'Decision', description: 'Human makes routing decision' }
];

export function WorkflowConfigurationForm({
  workflow,
  agents,
  template,
  onUpdateWorkflow,
  onUpdateAgent
}: WorkflowConfigurationFormProps) {

  // Real-time validation with smart fixes
  const currentValidation = React.useMemo(() => {
    const result = validateWorkflow(template);
    
    // Smart auto-fixes for common issues
    const autoFixes: Array<{ field: string; currentValue: unknown; suggestedValue: unknown; reason: string }> = [];
    
    // Fix max_concurrent_agents issue
    if (workflow.max_concurrent_agents > agents.length && agents.length > 0) {
      autoFixes.push({
        field: 'max_concurrent_agents',
        currentValue: workflow.max_concurrent_agents,
        suggestedValue: Math.min(agents.length, 3),
        reason: `Cannot exceed total agents (${agents.length})`
      });
    }
    
    return { ...result, autoFixes };
  }, [template, workflow.max_concurrent_agents, agents.length]);

  // Auto-apply fixes
  const applyAutoFix = (fix: { field: string; suggestedValue: unknown }) => {
    onUpdateWorkflow({ [fix.field]: fix.suggestedValue });
  };

  // Apply all auto-fixes
  const applyAllAutoFixes = () => {
    const fixes = currentValidation.autoFixes || [];
    const updates: Record<string, unknown> = {};
    fixes.forEach(fix => {
      updates[fix.field] = fix.suggestedValue;
    });
    if (Object.keys(updates).length > 0) {
      onUpdateWorkflow(updates as Partial<WorkflowConfig>);
    }
  };

  // Handle mode change with complete state replacement for robust tab switching
  const handleModeChange = (value: string) => {
    const mode = value as WorkflowMode;
    const agentIds = agents.map(agent => agent.id || agent.name).filter(Boolean);
    
    // Preserve non-mode-specific settings
    const baseWorkflow = {
      mode,
      timeout_seconds: workflow.timeout_seconds || 1800,
      failure_threshold: workflow.failure_threshold,
      retry_failed_agents: workflow.retry_failed_agents ?? false,
      continue_on_failure: workflow.continue_on_failure ?? true,
      enable_checkpointing: workflow.enable_checkpointing ?? true,
      enable_streaming: workflow.enable_streaming ?? true,
      enable_time_travel: workflow.enable_time_travel ?? true,
    };

    // Build completely new workflow object based on mode - no partial updates
    let newWorkflow: WorkflowConfig;
    
    switch (mode) {
      case 'sequential':
        newWorkflow = {
          ...baseWorkflow,
          sequence: agentIds.length > 0 ? agentIds : [],
          max_concurrent_agents: 1,
          completion_strategy: 'all' as CompletionStrategy,
          // Only sequential-specific fields - no other mode fields
        } as WorkflowConfig;
        break;
        
      case 'parallel':
        newWorkflow = {
          ...baseWorkflow,
          parallel_groups: agentIds.length > 0 ? [agentIds] : [[]],
          max_concurrent_agents: Math.min(agents.length || 1, 3),
          completion_strategy: (workflow.completion_strategy as CompletionStrategy) || 'all',
          required_completions: workflow.completion_strategy === 'threshold' ? workflow.required_completions : undefined,
          // Only parallel-specific fields - no other mode fields
        } as WorkflowConfig;
        break;
        
      case 'conditional':
        newWorkflow = {
          ...baseWorkflow,
          conditions: {},
          max_concurrent_agents: Math.min(agents.length || 1, 3),
          completion_strategy: 'all' as CompletionStrategy,
          // Only conditional-specific fields - no other mode fields
        } as WorkflowConfig;
        break;
        
      case 'langgraph':
        newWorkflow = {
          ...baseWorkflow,
          entry_point: agents.length > 0 ? agentIds[0] : undefined,
          max_concurrent_agents: Math.min(agents.length || 1, 3),
          completion_strategy: 'all' as CompletionStrategy,
          // Initialize basic graph structure for LangGraph mode
          graph_structure: agents.length > 0 ? {
            nodes: agentIds,
            edges: [],
            entry_point: agentIds[0],
            exit_points: [agentIds[agentIds.length - 1]],
            validation_errors: []
          } : undefined,
          // Only langgraph-specific fields - no other mode fields
        } as WorkflowConfig;
        break;
        
      default:
        // Fallback to sequential if unknown mode
        newWorkflow = {
          ...baseWorkflow,
          mode: 'sequential',
          sequence: agentIds.length > 0 ? agentIds : [],
          max_concurrent_agents: 1,
          completion_strategy: 'all' as CompletionStrategy,
        } as WorkflowConfig;
    }

    // Replace entire workflow object to ensure clean state
    onUpdateWorkflow(newWorkflow);
  };


  // HITL configuration
  const toggleHITL = (agentIndex: number, enabled: boolean) => {
    onUpdateAgent(agentIndex, {
      hitl_config: enabled ? {
        enabled: true,
        intervention_points: ['before_execution'],
        intervention_type: 'approval',
        timeout_seconds: 300,
        auto_approve_after_timeout: false,
        required_fields: [],
        custom_prompt: undefined
      } : undefined
    });
  };

  const updateHITLConfig = (agentIndex: number, field: string, value: string | number | boolean) => {
    const agent = agents[agentIndex];
    if (!agent.hitl_config) return;
    
    onUpdateAgent(agentIndex, {
      hitl_config: {
        ...agent.hitl_config,
        [field]: value
      }
    });
  };

  if (agents.length === 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Please add at least one agent before configuring the workflow.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* TOP-POSITIONED VALIDATION ERRORS */}
      {currentValidation.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-3">
              <div className="font-medium">Configuration Issues ({currentValidation.errors.length}):</div>
              {currentValidation.errors.slice(0, 3).map((error, index) => (
                <div key={index} className="text-sm">
                  • <span className="font-medium">{error.field}:</span> {error.message}
                </div>
              ))}
              {currentValidation.errors.length > 3 && (
                <div className="text-sm text-muted-foreground">
                  ... and {currentValidation.errors.length - 3} more issues
                </div>
              )}
              
              {/* Auto-fix suggestions */}
              {currentValidation.autoFixes && currentValidation.autoFixes.length > 0 && (
                <div className="border-t pt-3 mt-3">
                  <div className="font-medium text-sm mb-2">Suggested Fixes:</div>
                  <div className="space-y-2">
                    {currentValidation.autoFixes.map((fix, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted/20 p-2 rounded">
                        <div className="text-sm">
                          <span className="font-medium">{fix.field}:</span> {fix.reason}
                          <div className="text-xs text-muted-foreground">
                            Change from {String(fix.currentValue)} to {String(fix.suggestedValue)}
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => applyAutoFix(fix)}>
                          Fix
                        </Button>
                      </div>
                    ))}
                    <Button size="sm" onClick={applyAllAutoFixes} className="w-full">
                      Apply All Fixes
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* MAIN WORKFLOW CONFIGURATION WITH SHADCN TABS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Workflow Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={workflow.mode} onValueChange={handleModeChange} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="sequential" className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Sequential
              </TabsTrigger>
              <TabsTrigger value="parallel" className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Parallel
              </TabsTrigger>
              <TabsTrigger value="conditional" className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                Conditional
              </TabsTrigger>
              <TabsTrigger value="langgraph" className="flex items-center gap-2">
                <Network className="h-4 w-4" />
                LangGraph
              </TabsTrigger>
            </TabsList>

            {/* SEQUENTIAL MODE TAB */}
            <TabsContent value="sequential" className="space-y-4">
              <SequentialWorkflowVisualization
                agents={agents}
                workflow={workflow}
                onUpdateWorkflow={onUpdateWorkflow}
                onUpdateAgent={onUpdateAgent}
              />
            </TabsContent>

            {/* PARALLEL MODE TAB */}
            <TabsContent value="parallel" className="space-y-4">
              <ParallelWorkflowVisualization
                agents={agents}
                workflow={workflow}
                onUpdateWorkflow={onUpdateWorkflow}
                onUpdateAgent={onUpdateAgent}
              />
            </TabsContent>

            {/* CONDITIONAL MODE TAB */}
            <TabsContent value="conditional" className="space-y-4">
              <ConditionalWorkflowVisualization
                agents={agents}
                workflow={workflow}
                onUpdateWorkflow={onUpdateWorkflow}
                onUpdateAgent={onUpdateAgent}
              />
            </TabsContent>

            {/* LANGGRAPH NATIVE MODE TAB */}
            <TabsContent value="langgraph" className="space-y-4">
              <LangGraphWorkflowVisualization
                agents={agents}
                workflow={workflow}
                onUpdateWorkflow={onUpdateWorkflow}
                onUpdateAgent={onUpdateAgent}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* HITL CONFIGURATION SECTION */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Human-in-the-Loop (HITL) Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {agents.map((agent, agentIndex) => (
            <div key={agent.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-medium">{agent.name}</div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {agent.type} Agent
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={agent.hitl_config?.enabled || false}
                    onCheckedChange={(checked) => toggleHITL(agentIndex, checked as boolean)}
                  />
                  <Label>Enable HITL</Label>
                </div>
              </div>

              {agent.hitl_config?.enabled && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Intervention Type</Label>
                    <Select
                      value={agent.hitl_config.intervention_type}
                      onValueChange={(value) => updateHITLConfig(agentIndex, 'intervention_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INTERVENTION_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-muted-foreground">{type.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Timeout (seconds)</Label>
                    <Input
                      type="number"
                      min="30"
                      max="3600"
                      value={agent.hitl_config.timeout_seconds}
                      onChange={(e) => updateHITLConfig(agentIndex, 'timeout_seconds', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ADVANCED WORKFLOW SETTINGS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Advanced Workflow Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Global Timeout (seconds)</Label>
              <Input
                type="number"
                min="60"
                max="7200"
                value={workflow.timeout_seconds}
                onChange={(e) => 
                  onUpdateWorkflow({ timeout_seconds: parseInt(e.target.value) })
                }
              />
              <div className="text-xs text-muted-foreground">
                Maximum execution time for entire workflow
              </div>
            </div>

            <div className="space-y-2">
              <Label>Failure Threshold</Label>
              <Input
                type="number"
                min="0"
                max={agents.length}
                value={workflow.failure_threshold || 0}
                onChange={(e) => 
                  onUpdateWorkflow({ failure_threshold: parseInt(e.target.value) })
                }
              />
              <div className="text-xs text-muted-foreground">
                Max failures before stopping workflow (0 = no limit)
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Retry Failed Agents</div>
                <div className="text-sm text-muted-foreground">Automatically retry failed agents</div>
              </div>
              <Switch
                checked={workflow.retry_failed_agents}
                onCheckedChange={(checked) => 
                  onUpdateWorkflow({ retry_failed_agents: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Continue on Failure</div>
                <div className="text-sm text-muted-foreground">Continue workflow even if some agents fail</div>
              </div>
              <Switch
                checked={workflow.continue_on_failure}
                onCheckedChange={(checked) => 
                  onUpdateWorkflow({ continue_on_failure: checked })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SUCCESS STATE */}
      {currentValidation.isValid && currentValidation.errors.length === 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            ✅ Workflow configuration is valid and ready for execution!
          </AlertDescription>
        </Alert>
      )}

      {/* WARNINGS */}
      {currentValidation.warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">Warnings ({currentValidation.warnings.length}):</div>
              {currentValidation.warnings.slice(0, 3).map((warning, index) => (
                <div key={index} className="text-sm">• {warning}</div>
              ))}
              {currentValidation.warnings.length > 3 && (
                <div className="text-sm text-muted-foreground">
                  ... and {currentValidation.warnings.length - 3} more warnings
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default WorkflowConfigurationForm;
