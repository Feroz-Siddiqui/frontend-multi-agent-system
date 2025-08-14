/**
 * Workflow Preview Card Component
 * Shows workflow visualization and configuration
 */

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
          {/* Top Row - Mode and Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="flex items-center justify-between lg:justify-start lg:flex-col lg:items-start">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Mode</div>
                <div className="text-xs mt-1 text-gray-600">{workflowConfig.description}</div>
              </div>
              <Badge className={`${workflowConfig.color} font-medium px-3 py-1 lg:mt-2`}>
                <WorkflowIcon className={`w-4 h-4 mr-1.5 ${workflowConfig.iconColor}`} />
                {workflowConfig.label}
              </Badge>
            </div>
            <div className="lg:col-span-2">
              <div className="text-sm font-medium text-muted-foreground">Summary</div>
              <div className="text-sm mt-1">{workflowSummary}</div>
            </div>
          </div>

          {/* Execution Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <div>
                <div className="text-xs text-muted-foreground">Connections</div>
                <div className="text-sm font-medium">{template.workflow.graph_structure?.edges?.length || 0}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <div>
                <div className="text-xs text-muted-foreground">Est. Duration</div>
                <div className="text-sm font-medium">{formatDuration(estimatedDuration)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-gray-500" />
              <div>
                <div className="text-xs text-muted-foreground">Total Agents</div>
                <div className="text-sm font-medium">{template.agents.length}</div>
              </div>
            </div>
            {template.workflow.entry_point && (
              <div className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-green-500" />
                <div>
                  <div className="text-xs text-muted-foreground">Entry Point</div>
                  <div className="text-sm font-medium truncate">
                    {template.agents.find(a => (a.id || a.name) === template.workflow.entry_point)?.name || 'Unknown'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Execution Features Row */}
          <div className="pt-2 border-t">
            <div className="text-sm font-medium text-muted-foreground mb-3">Execution Features</div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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

          {/* Advanced Settings and Status Row */}
          <div className="pt-2 border-t">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Advanced Settings */}
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-3">Advanced Settings</div>
                <div className="space-y-2">
                  {template.workflow.max_concurrent_agents && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Max Concurrent</span>
                      <span className="font-medium">{template.workflow.max_concurrent_agents}</span>
                    </div>
                  )}
                  {template.workflow.completion_strategy && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Completion Strategy</span>
                      <span className="font-medium capitalize">{template.workflow.completion_strategy}</span>
                    </div>
                  )}
                  {template.workflow.sequence && (
                    <div>
                      <span className="text-muted-foreground text-sm">Sequence:</span>
                      <div className="text-xs mt-1 text-gray-600 truncate">
                        {template.workflow.sequence.join(' → ')}
                      </div>
                    </div>
                  )}
                  {template.workflow.parallel_groups && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Parallel Groups</span>
                      <span className="font-medium">{template.workflow.parallel_groups.length}</span>
                    </div>
                  )}
                  {template.workflow.conditions && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Conditions</span>
                      <span className="font-medium">{Object.keys(template.workflow.conditions).length}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Template Status */}
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-3">Template Status</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Status</span>
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
                    <span className="text-muted-foreground text-sm">Visibility</span>
                    <Badge variant="outline">
                      {template.is_public ? 'Public' : 'Private'}
                    </Badge>
                  </div>
                </div>
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
