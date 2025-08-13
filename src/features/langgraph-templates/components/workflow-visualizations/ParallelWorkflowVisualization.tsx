/**
 * Parallel Workflow Visualization Component
 * 
 * Displays multi-branch flow diagrams for parallel agent execution
 * with interactive group management, completion strategies, and metrics.
 */

import React from 'react';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Switch } from '../../../../components/ui/switch';
import { Label } from '../../../../components/ui/label';
import { Input } from '../../../../components/ui/input';
import { Checkbox } from '../../../../components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { 
  Layers,
  Plus,
  Trash2,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Users,
  Target,
  CheckCircle,
  Zap,
  Settings,
  RotateCcw,
  GitMerge
} from 'lucide-react';
import AgentNode from './shared/AgentNode';
import type { Agent, WorkflowConfig, CompletionStrategy } from '../../types';

interface ParallelWorkflowVisualizationProps {
  agents: Agent[];
  workflow: WorkflowConfig;
  onUpdateWorkflow: (updates: Partial<WorkflowConfig>) => void;
  onUpdateAgent: (index: number, updates: Partial<Agent>) => void;
  onConfigureAgent?: (index: number) => void;
}

const COMPLETION_STRATEGIES = [
  { value: 'all' as CompletionStrategy, label: 'All Agents', description: 'All agents must complete successfully', icon: CheckCircle },
  { value: 'majority' as CompletionStrategy, label: 'Majority', description: '50%+ agents must complete', icon: Target },
  { value: 'any' as CompletionStrategy, label: 'Any Agent', description: 'At least one agent completes', icon: Zap },
  { value: 'threshold' as CompletionStrategy, label: 'Threshold', description: 'Specific number complete', icon: Settings },
  { value: 'first_success' as CompletionStrategy, label: 'First Success', description: 'Stop after first success', icon: ArrowUp }
];

export function ParallelWorkflowVisualization({
  agents,
  workflow,
  onUpdateWorkflow,
  onConfigureAgent
}: ParallelWorkflowVisualizationProps) {
  
  // Get current parallel groups or create default
  const currentGroups = React.useMemo(() => {
    if (workflow.parallel_groups && workflow.parallel_groups.length > 0) {
      return workflow.parallel_groups;
    }
    // Default: all agents in one group using agent IDs
    return [agents.map(agent => agent.id || agent.name)];
  }, [workflow.parallel_groups, agents]);

  // Group management functions
  const addParallelGroup = () => {
    const newGroups = [...currentGroups, []];
    onUpdateWorkflow({ parallel_groups: newGroups });
  };

  const removeParallelGroup = (groupIndex: number) => {
    const newGroups = currentGroups.filter((_, i) => i !== groupIndex);
    onUpdateWorkflow({ parallel_groups: newGroups });
  };

  const toggleAgentInGroup = (groupIndex: number, agentIndexStr: string, checked: boolean) => {
    const newGroups = currentGroups.map((group, index) => {
      if (index === groupIndex) {
        return checked
          ? [...group, agentIndexStr]
          : group.filter(id => id !== agentIndexStr);
      }
      // Remove from other groups
      return group.filter(id => id !== agentIndexStr);
    });
    onUpdateWorkflow({ parallel_groups: newGroups });
  };

  const moveGroupUp = (groupIndex: number) => {
    if (groupIndex === 0) return;
    const newGroups = [...currentGroups];
    [newGroups[groupIndex - 1], newGroups[groupIndex]] = 
    [newGroups[groupIndex], newGroups[groupIndex - 1]];
    onUpdateWorkflow({ parallel_groups: newGroups });
  };

  const moveGroupDown = (groupIndex: number) => {
    if (groupIndex === currentGroups.length - 1) return;
    const newGroups = [...currentGroups];
    [newGroups[groupIndex], newGroups[groupIndex + 1]] = 
    [newGroups[groupIndex + 1], newGroups[groupIndex]];
    onUpdateWorkflow({ parallel_groups: newGroups });
  };

  // Helper function to find agent by ID or index
  const findAgentByIdentifier = React.useCallback((identifier: string) => {
    return agents.find(agent => 
      agent.id === identifier || 
      agent.name === identifier || 
      agents.indexOf(agent).toString() === identifier
    );
  }, [agents]);

  // Calculate group metrics
  const calculateGroupMetrics = (group: string[]) => {
    const groupAgents = group.map(agentId => findAgentByIdentifier(agentId)).filter(Boolean) as Agent[];
    if (groupAgents.length === 0) return { time: 0, cost: 0, maxTime: 0, agents: 0 };

    const times = groupAgents.map(agent => agent.timeout_seconds / 60);
    const costs = groupAgents.map(agent => 
      agent.llm_config.max_tokens * 0.00002 + agent.tavily_config.max_credits_per_agent * 0.001
    );

    return {
      time: Math.max(...times), // Parallel execution = max time
      cost: costs.reduce((sum, cost) => sum + cost, 0),
      maxTime: Math.max(...times),
      agents: groupAgents.length
    };
  };

  // Get total workflow metrics
  const totalMetrics = React.useMemo(() => {
    const groupMetrics = currentGroups.map(calculateGroupMetrics);
    return {
      totalTime: groupMetrics.reduce((sum, group) => sum + group.time, 0), // Groups run sequentially
      totalCost: groupMetrics.reduce((sum, group) => sum + group.cost, 0),
      maxConcurrent: groupMetrics.length > 0 ? Math.max(...groupMetrics.map(group => group.agents)) : 0,
      totalAgents: agents.length
    };
  }, [currentGroups, agents]);

  return (
    <div className="space-y-6">
      {/* Parallel Flow Visualization */}
      <div className="bg-green-50 dark:bg-green-950/20 p-6 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="h-5 w-5 text-green-600" />
          <h3 className="font-medium text-green-900 dark:text-green-100">Parallel Execution Flow</h3>
          <Badge variant="outline" className="ml-auto">
            {currentGroups.length} groups, {agents.length} agents
          </Badge>
        </div>

        {/* Flow Diagram */}
        <div className="relative overflow-x-auto">
          <div className="flex items-center gap-6 min-w-max pb-4">
            {/* Start Node */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-full flex items-center justify-center">
                <div className="text-sm font-medium text-blue-900 dark:text-blue-100">Start</div>
              </div>
              <div className="text-xs text-blue-600 mt-2">Entry</div>
            </div>

            {/* Arrow to Groups */}
            <ArrowRight className="h-6 w-6 text-green-600 flex-shrink-0" />

            {/* Parallel Groups */}
            {currentGroups.map((group, groupIndex) => {
              const groupMetrics = calculateGroupMetrics(group);
              const groupAgents = group.map(agentId => findAgentByIdentifier(agentId)).filter(Boolean) as Agent[];

              return (
                <React.Fragment key={groupIndex}>
                  <div className="flex flex-col items-center">
                    {/* Group Container */}
                    <div className="relative bg-green-100 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg p-4 min-w-[280px]">
                      {/* Group Header */}
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="secondary">Group {groupIndex + 1}</Badge>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveGroupUp(groupIndex)}
                            disabled={groupIndex === 0}
                            className="h-6 w-6 p-0"
                            title="Move group up"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveGroupDown(groupIndex)}
                            disabled={groupIndex === currentGroups.length - 1}
                            className="h-6 w-6 p-0"
                            title="Move group down"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeParallelGroup(groupIndex)}
                            className="h-6 w-6 p-0 text-red-500"
                            title="Remove group"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Parallel Agents in Group */}
                      <div className="space-y-2">
                        {groupAgents.length > 0 ? (
                          groupAgents.map((agent) => {
                            const originalIndex = agents.indexOf(agent);
                            return (
                              <AgentNode
                                key={agent.id}
                                agent={agent}
                                index={originalIndex}
                                showMetrics={true}
                                showControls={true}
                                onClick={() => onConfigureAgent?.(originalIndex)}
                                onConfigure={() => onConfigureAgent?.(originalIndex)}
                                className="w-full"
                              />
                            );
                          })
                        ) : (
                          <div className="text-center py-4 text-muted-foreground text-sm">
                            No agents assigned
                          </div>
                        )}
                      </div>

                      {/* Group Metrics */}
                      <div className="mt-3 pt-3 border-t border-green-300 dark:border-green-700">
                        <div className="flex items-center justify-between text-xs text-green-700 dark:text-green-300">
                          <span>Concurrent: {groupAgents.length}</span>
                          <span>Time: {Math.round(groupMetrics.time)}min</span>
                          <span>Cost: ${groupMetrics.cost.toFixed(3)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Group Label */}
                    <div className="text-xs text-green-600 mt-2">
                      Parallel Group {groupIndex + 1}
                    </div>
                  </div>

                  {/* Arrow between groups */}
                  {groupIndex < currentGroups.length - 1 && (
                    <div className="flex flex-col items-center">
                      <ArrowRight className="h-6 w-6 text-green-600" />
                      <div className="text-xs text-green-600 mt-2">then</div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}

            {/* Arrow to Merge */}
            <ArrowRight className="h-6 w-6 text-green-600 flex-shrink-0" />

            {/* Merge Node */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-full flex items-center justify-center">
                <GitMerge className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-xs text-purple-600 mt-2">Merge</div>
            </div>

            {/* Arrow to Final */}
            <ArrowRight className="h-6 w-6 text-green-600 flex-shrink-0" />

            {/* Final Result */}
            <div className="flex flex-col items-center">
              <div className="w-24 h-16 bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-800 rounded-lg flex items-center justify-center">
                <div className="text-sm font-medium text-green-900 dark:text-green-100">
                  Final Result
                </div>
              </div>
              <div className="text-xs text-green-600 mt-2">Complete</div>
            </div>
          </div>
        </div>
      </div>

      {/* Group Management */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="font-medium">Group Management</span>
          </div>
          <Button onClick={addParallelGroup} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Group
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {currentGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="border rounded-lg p-4 bg-muted/20">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="outline">Group {groupIndex + 1}</Badge>
                <div className="text-sm text-muted-foreground">
                  {group.length} agents
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                {agents.map((agent) => {
                  const agentId = agent.id || agent.name;
                  const isInThisGroup = group.includes(agentId);
                  const isAssignedElsewhere = !isInThisGroup &&
                    currentGroups.some(g => g !== group && g.includes(agentId));
                  
                  return (
                    <label
                      key={agentId}
                      className={`flex items-center space-x-2 p-2 rounded border cursor-pointer ${
                        isInThisGroup ? 'bg-primary/5 border-primary/20' :
                        isAssignedElsewhere ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted/20'
                      }`}
                    >
                      <Checkbox
                        checked={isInThisGroup}
                        disabled={isAssignedElsewhere}
                        onCheckedChange={(checked) =>
                          toggleAgentInGroup(groupIndex, agentId, checked as boolean)
                        }
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{agent.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {agent.type} • {Math.round(agent.timeout_seconds / 60)}min
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* Parallel Configuration */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-4 w-4" />
          <span className="font-medium">Parallel Execution Settings</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Completion Strategy */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Completion Strategy</Label>
              <Select
                value={workflow.completion_strategy || 'all'}
                onValueChange={(value: CompletionStrategy) => 
                  onUpdateWorkflow({ completion_strategy: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMPLETION_STRATEGIES.map(strategy => {
                    const Icon = strategy.icon;
                    return (
                      <SelectItem key={strategy.value} value={strategy.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{strategy.label}</div>
                            <div className="text-xs text-muted-foreground">{strategy.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {workflow.completion_strategy === 'threshold' && (
              <div className="space-y-2">
                <Label>Required Completions</Label>
                <Input
                  type="number"
                  min="1"
                  max={agents.length}
                  value={workflow.required_completions || 1}
                  onChange={(e) => 
                    onUpdateWorkflow({ required_completions: parseInt(e.target.value) })
                  }
                />
                <div className="text-xs text-muted-foreground">
                  Number of agents that must complete successfully
                </div>
              </div>
            )}
          </div>

          {/* Concurrency Settings */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Max Concurrent Agents</Label>
              <Input
                type="number"
                min="1"
                max={agents.length}
                value={workflow.max_concurrent_agents || Math.min(agents.length, 3)}
                onChange={(e) => 
                  onUpdateWorkflow({ max_concurrent_agents: parseInt(e.target.value) })
                }
              />
              <div className="text-xs text-muted-foreground">
                Maximum: {agents.length} (total agents)
              </div>
            </div>

            <div className="bg-muted/20 rounded-lg p-3">
              <div className="text-sm font-medium mb-2">Execution Summary:</div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>• {currentGroups.length} parallel groups</div>
                <div>• Max {totalMetrics.maxConcurrent} concurrent agents</div>
                <div>• Total time: ~{Math.round(totalMetrics.totalTime)} minutes</div>
                <div>• Estimated cost: ${totalMetrics.totalCost.toFixed(3)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Time Travel & Advanced Controls */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <RotateCcw className="h-4 w-4" />
          <span className="font-medium">Time Travel & Execution Controls</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Time Travel Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Enable Checkpointing</Label>
                <div className="text-sm text-muted-foreground">
                  Save state after each group completion
                </div>
              </div>
              <Switch
                checked={workflow.enable_checkpointing ?? true}
                onCheckedChange={(checked) => 
                  onUpdateWorkflow({ enable_checkpointing: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Enable Time Travel</Label>
                <div className="text-sm text-muted-foreground">
                  Allow replay from any group checkpoint
                </div>
              </div>
              <Switch
                checked={workflow.enable_time_travel ?? true}
                onCheckedChange={(checked) => 
                  onUpdateWorkflow({ enable_time_travel: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Enable Streaming</Label>
                <div className="text-sm text-muted-foreground">
                  Stream results from each agent
                </div>
              </div>
              <Switch
                checked={workflow.enable_streaming ?? true}
                onCheckedChange={(checked) => 
                  onUpdateWorkflow({ enable_streaming: checked })
                }
              />
            </div>
          </div>

          {/* Execution Strategy Preview */}
          <div className="space-y-4">
            <div>
              <Label className="font-medium mb-2 block">Execution Strategy Preview</Label>
              <div className="bg-muted/20 rounded-lg p-3 space-y-2">
                {currentGroups.map((group, groupIndex) => {
                  const groupAgents = agents.filter((_, index) => group.includes(index.toString()));
                  const groupMetrics = calculateGroupMetrics(group);
                  
                  return (
                    <div key={groupIndex} className="text-sm">
                      <div className="font-medium">Group {groupIndex + 1}:</div>
                      <div className="text-muted-foreground ml-2">
                        • {groupAgents.length} agents run concurrently
                        • Completes in ~{Math.round(groupMetrics.time)} minutes
                        • Strategy: {workflow.completion_strategy || 'all'}
                      </div>
                    </div>
                  );
                })}
                <div className="border-t pt-2 mt-2 text-sm font-medium">
                  Total workflow time: ~{Math.round(totalMetrics.totalTime)} minutes
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Configure All Groups
        </Button>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4 mr-2" />
          Balance Groups
        </Button>
        <Button variant="outline" size="sm">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Groups
        </Button>
      </div>
    </div>
  );
}

export default ParallelWorkflowVisualization;
