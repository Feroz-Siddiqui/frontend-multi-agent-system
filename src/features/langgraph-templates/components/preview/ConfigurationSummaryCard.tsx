/**
 * Configuration Summary Card Component
 * Shows execution settings and advanced configuration
 */

import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { 
  Settings,
  CheckCircle,
  XCircle,
  Eye,
  Rewind
} from 'lucide-react';

import type { Template } from '../../types';

interface ConfigurationSummaryCardProps {
  template: Template;
}

export function ConfigurationSummaryCard({ template }: ConfigurationSummaryCardProps) {
  const { workflow } = template;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Configuration Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Execution Features */}
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-3">Execution Features</div>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Checkpointing</span>
              </div>
              <Badge 
                variant={workflow.enable_checkpointing ? "default" : "secondary"}
                className={workflow.enable_checkpointing ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}
              >
                {workflow.enable_checkpointing ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-500" />
                <span className="text-sm">Streaming</span>
              </div>
              <Badge 
                variant={workflow.enable_streaming ? "default" : "secondary"}
                className={workflow.enable_streaming ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}
              >
                {workflow.enable_streaming ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Rewind className="w-4 h-4 text-orange-500" />
                <span className="text-sm">Time Travel</span>
              </div>
              <Badge 
                variant={workflow.enable_time_travel ? "default" : "secondary"}
                className={workflow.enable_time_travel ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}
              >
                {workflow.enable_time_travel ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Workflow Settings */}
        <div className="pt-2 border-t">
          <div className="text-sm font-medium text-muted-foreground mb-3">Workflow Settings</div>
          <div className="space-y-2">
            {workflow.max_concurrent_agents && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Max Concurrent Agents</span>
                <span className="font-medium">{workflow.max_concurrent_agents}</span>
              </div>
            )}

            {workflow.completion_strategy && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completion Strategy</span>
                <span className="font-medium capitalize">{workflow.completion_strategy}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Agents</span>
              <span className="font-medium">{template.agents.length}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Workflow Mode</span>
              <span className="font-medium capitalize">{workflow.mode}</span>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        {(workflow.sequence || workflow.parallel_groups || workflow.conditions) && (
          <div className="pt-2 border-t">
            <div className="text-sm font-medium text-muted-foreground mb-3">Advanced Configuration</div>
            <div className="space-y-2 text-sm">
              {workflow.sequence && (
                <div>
                  <span className="text-muted-foreground">Sequence:</span>
                  <div className="text-xs mt-1 text-gray-600">
                    {workflow.sequence.join(' → ')}
                  </div>
                </div>
              )}

              {workflow.parallel_groups && (
                <div>
                  <span className="text-muted-foreground">Parallel Groups:</span>
                  <div className="text-xs mt-1 text-gray-600">
                    {workflow.parallel_groups.length} group{workflow.parallel_groups.length !== 1 ? 's' : ''} configured
                  </div>
                </div>
              )}

              {workflow.conditions && (
                <div>
                  <span className="text-muted-foreground">Conditions:</span>
                  <div className="text-xs mt-1 text-gray-600">
                    {Object.keys(workflow.conditions).length} condition{Object.keys(workflow.conditions).length !== 1 ? 's' : ''} configured
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Template Metadata */}
        <div className="pt-2 border-t">
          <div className="text-sm font-medium text-muted-foreground mb-3">Template Settings</div>
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
  );
}
