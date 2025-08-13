/**
 * Unified Configuration Panel Component
 * Adaptive configuration that changes based on workflow type
 */

import { Badge } from '../../../../../components/ui/badge';
import { Switch } from '../../../../../components/ui/switch';
import { Label } from '../../../../../components/ui/label';
import { Settings, GitBranch } from 'lucide-react';
import type { Agent, WorkflowConfig } from '../../../types';

interface UnifiedConfigPanelProps {
  agents: Agent[];
  workflow: WorkflowConfig;
  workflowType: string;
  onUpdateWorkflow: (updates: Partial<WorkflowConfig>) => void;
}

export function UnifiedConfigPanel({
  agents,
  workflow,
  workflowType,
  onUpdateWorkflow
}: UnifiedConfigPanelProps) {

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Workflow Settings */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-4 w-4" />
          <span className="font-medium">Workflow Configuration</span>
          <Badge variant="outline" className="text-xs capitalize">
            {workflowType}
          </Badge>
        </div>

        <div className="space-y-4">
          {/* Entry Point Display (Read-only) */}
          <div className="space-y-2">
            <Label>Entry Point Agent</Label>
            <div className="p-2 bg-muted/50 border rounded-md text-sm">
              {workflow.entry_point ? (
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {agents.find(a => (a.id || a.name) === workflow.entry_point)?.name || workflow.entry_point}
                  </span>
                  <span className="text-muted-foreground">
                    ({agents.find(a => (a.id || a.name) === workflow.entry_point)?.type || 'unknown'})
                  </span>
                </div>
              ) : (
                <span className="text-muted-foreground">No entry point set</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              💡 Click on an agent node in the canvas above to set as entry point
            </div>
          </div>

          {/* Workflow-specific settings */}
          {workflowType === 'parallel' && (
            <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
              <div className="text-sm font-medium mb-2 text-green-800 dark:text-green-200">
                Parallel Execution Settings:
              </div>
              <div className="space-y-2 text-xs text-green-700 dark:text-green-300">
                <div>• All agents execute simultaneously</div>
                <div>• Results are collected and merged</div>
                <div>• Execution continues when all agents complete</div>
              </div>
            </div>
          )}

          {workflowType === 'conditional' && (
            <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg">
              <div className="text-sm font-medium mb-2 text-orange-800 dark:text-orange-200">
                Conditional Logic Settings:
              </div>
              <div className="space-y-2 text-xs text-orange-700 dark:text-orange-300">
                <div>• Branching based on success/failure conditions</div>
                <div>• Different paths for different outcomes</div>
                <div>• Configure conditions in edge settings below</div>
              </div>
            </div>
          )}

          {workflowType === 'sequential' && (
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
              <div className="text-sm font-medium mb-2 text-blue-800 dark:text-blue-200">
                Sequential Execution Settings:
              </div>
              <div className="space-y-2 text-xs text-blue-700 dark:text-blue-300">
                <div>• Agents execute in linear order</div>
                <div>• Each agent receives output from previous</div>
                <div>• Execution stops on first failure</div>
              </div>
            </div>
          )}

          {/* Advanced Settings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Enable Checkpointing</Label>
                <div className="text-sm text-muted-foreground">
                  Save state at each node for debugging
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
                <Label className="font-medium">Enable Streaming</Label>
                <div className="text-sm text-muted-foreground">
                  Stream results in real-time
                </div>
              </div>
              <Switch
                checked={workflow.enable_streaming ?? true}
                onCheckedChange={(checked) => 
                  onUpdateWorkflow({ enable_streaming: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Enable Time Travel</Label>
                <div className="text-sm text-muted-foreground">
                  Allow execution replay and state inspection
                </div>
              </div>
              <Switch
                checked={workflow.enable_time_travel ?? true}
                onCheckedChange={(checked) => 
                  onUpdateWorkflow({ enable_time_travel: checked })
                }
              />
            </div>
          </div>

        </div>
      </div>

      {/* Edge Configuration - Full Card */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <GitBranch className="h-4 w-4" />
          <span className="font-medium">Edge Configuration</span>
          <Badge variant="outline" className="text-xs">
            {workflow.graph_structure?.edges?.length || 0} connections
          </Badge>
        </div>

        {workflow.graph_structure?.edges && workflow.graph_structure.edges.length > 0 ? (
          <div className="space-y-3">
            {workflow.graph_structure.edges.map((edge, index) => {
              const sourceAgent = agents.find(a => (a.id || a.name) === edge.from_node);
              const targetAgent = agents.find(a => (a.id || a.name) === edge.to_node);
              
              const sourceDisplayName = edge.from_node === 'start' 
                ? 'Start' 
                : sourceAgent?.name || `Agent ${agents.findIndex(a => (a.id || a.name) === edge.from_node) + 1}`;
              const targetDisplayName = edge.to_node === 'end' 
                ? 'End' 
                : targetAgent?.name || `Agent ${agents.findIndex(a => (a.id || a.name) === edge.to_node) + 1}`;
              
              return (
                <div key={edge.edge_id || `edge-${index}`} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium">
                      {sourceDisplayName} → {targetDisplayName}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {edge.condition_type || 'always'}
                    </Badge>
                    {edge.weight && edge.weight !== 1 && (
                      <Badge variant="secondary" className="text-xs">
                        Weight: {edge.weight}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <div className="text-sm font-medium mb-1">No connections configured</div>
            <div className="text-xs">
              Use the workflow builder above to create connections between agents
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
