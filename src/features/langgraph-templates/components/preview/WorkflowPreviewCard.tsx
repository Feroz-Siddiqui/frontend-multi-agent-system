/**
 * Workflow Preview Card Component
 * Shows workflow visualization and configuration
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { 
  Workflow,
  ArrowRight,
  Zap,
  GitMerge,
  Network,
  Clock,
  Activity,
  Settings,
  CheckCircle,
  XCircle,
  Eye,
  Rewind
} from 'lucide-react';

// Import our workflow preview component
import { WorkflowPreview } from '../workflow-visualizations/components/WorkflowPreview';

import type { Template, WorkflowMode } from '../../types';

interface WorkflowPreviewCardProps {
  template: Template;
  workflowSummary: string;
}

// Workflow mode configurations
const WORKFLOW_MODE_CONFIG = {
  sequential: {
    icon: ArrowRight,
    label: 'Sequential',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    iconColor: 'text-blue-600',
    description: 'Agents execute in linear order'
  },
  parallel: {
    icon: Zap,
    label: 'Parallel',
    color: 'bg-green-50 text-green-700 border-green-200',
    iconColor: 'text-green-600',
    description: 'All agents execute simultaneously'
  },
  conditional: {
    icon: GitMerge,
    label: 'Conditional',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    iconColor: 'text-orange-600',
    description: 'Agents execute based on conditions'
  },
  langgraph: {
    icon: Network,
    label: 'Custom',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    iconColor: 'text-purple-600',
    description: 'Custom workflow with manual connections'
  }
} as const;

export function WorkflowPreviewCard({ template, workflowSummary }: WorkflowPreviewCardProps) {
  const workflowConfig = WORKFLOW_MODE_CONFIG[template.workflow.mode as WorkflowMode] || WORKFLOW_MODE_CONFIG.langgraph;
  const WorkflowIcon = workflowConfig.icon;

  // Calculate estimated execution time
  const estimatedDuration = template.agents.reduce((total, agent) => {
    return total + (agent.timeout_seconds || 300);
  }, 0);

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <div className="space-y-4">
      {/* Workflow Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Workflow Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Workflow Mode */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Mode</div>
              <div className="text-sm mt-1">{workflowConfig.description}</div>
            </div>
            <Badge className={`${workflowConfig.color} font-medium px-3 py-1`}>
              <WorkflowIcon className={`w-4 h-4 mr-1.5 ${workflowConfig.iconColor}`} />
              {workflowConfig.label}
            </Badge>
          </div>

          {/* Summary */}
          <div>
            <div className="text-sm font-medium text-muted-foreground">Summary</div>
            <div className="text-sm mt-1">{workflowSummary}</div>
          </div>

          {/* Execution Details */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <div>
                <div className="text-xs text-muted-foreground">Connections</div>
                <div className="text-sm font-medium">
                  {template.workflow.graph_structure?.edges?.length || 0}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <div>
                <div className="text-xs text-muted-foreground">Est. Duration</div>
                <div className="text-sm font-medium">
                  {formatDuration(estimatedDuration)}
                </div>
              </div>
            </div>
          </div>

          {/* Entry Point */}
          {template.workflow.entry_point && (
            <div>
              <div className="text-sm font-medium text-muted-foreground">Entry Point</div>
              <div className="text-sm mt-1 font-medium">
                {template.agents.find(a => (a.id || a.name) === template.workflow.entry_point)?.name || 'Unknown'}
              </div>
            </div>
          )}

          {/* Execution Features */}
          <div className="pt-2 border-t">
            <div className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Execution Features
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Checkpointing</span>
                </div>
                <Badge 
                  variant={template.workflow.enable_checkpointing ? "default" : "secondary"}
                  className={template.workflow.enable_checkpointing ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}
                >
                  {template.workflow.enable_checkpointing ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-purple-500" />
                  <span className="text-sm">Streaming</span>
                </div>
                <Badge 
                  variant={template.workflow.enable_streaming ? "default" : "secondary"}
                  className={template.workflow.enable_streaming ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}
                >
                  {template.workflow.enable_streaming ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Rewind className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">Time Travel</span>
                </div>
                <Badge 
                  variant={template.workflow.enable_time_travel ? "default" : "secondary"}
                  className={template.workflow.enable_time_travel ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}
                >
                  {template.workflow.enable_time_travel ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Advanced Workflow Settings */}
          <div className="pt-2 border-t">
            <div className="text-sm font-medium text-muted-foreground mb-3">Advanced Settings</div>
            <div className="space-y-2">
              {template.workflow.max_concurrent_agents && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Max Concurrent Agents</span>
                  <span className="font-medium">{template.workflow.max_concurrent_agents}</span>
                </div>
              )}

              {template.workflow.completion_strategy && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Completion Strategy</span>
                  <span className="font-medium capitalize">{template.workflow.completion_strategy}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Agents</span>
                <span className="font-medium">{template.agents.length}</span>
              </div>

              {/* Advanced Configuration Details */}
              {(template.workflow.sequence || template.workflow.parallel_groups || template.workflow.conditions) && (
                <div className="pt-2 border-t">
                  {template.workflow.sequence && (
                    <div className="mb-2">
                      <span className="text-muted-foreground text-sm">Sequence:</span>
                      <div className="text-xs mt-1 text-gray-600">
                        {template.workflow.sequence.join(' → ')}
                      </div>
                    </div>
                  )}

                  {template.workflow.parallel_groups && (
                    <div className="mb-2">
                      <span className="text-muted-foreground text-sm">Parallel Groups:</span>
                      <div className="text-xs mt-1 text-gray-600">
                        {template.workflow.parallel_groups.length} group{template.workflow.parallel_groups.length !== 1 ? 's' : ''} configured
                      </div>
                    </div>
                  )}

                  {template.workflow.conditions && (
                    <div className="mb-2">
                      <span className="text-muted-foreground text-sm">Conditions:</span>
                      <div className="text-xs mt-1 text-gray-600">
                        {Object.keys(template.workflow.conditions).length} condition{Object.keys(template.workflow.conditions).length !== 1 ? 's' : ''} configured
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Template Status */}
          <div className="pt-2 border-t">
            <div className="text-sm font-medium text-muted-foreground mb-3">Template Status</div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={template.is_active ? "default" : "secondary"}>
                  {template.is_active ? (
                    <CheckCircle className="w-3 h-3 mr-1" />
                  ) : (
                    <XCircle className="w-3 h-3 mr-1" />
                  )}
                  {template.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Visibility</span>
                <Badge variant="outline">
                  {template.is_public ? 'Public' : 'Private'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workflow Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full border rounded-lg bg-gray-50 overflow-hidden">
            <WorkflowPreview
              agents={template.agents}
              workflow={template.workflow}
              className="h-full w-full"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
