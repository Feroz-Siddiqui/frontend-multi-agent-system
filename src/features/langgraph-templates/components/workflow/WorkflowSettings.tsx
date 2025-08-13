/**
 * Workflow Settings Component
 * Clean component for configuring workflow execution settings
 */

import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Switch } from '../../../../components/ui/switch';
import { Separator } from '../../../../components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { COMPLETION_STRATEGIES } from './constants';
import type { WorkflowConfig, CompletionStrategy, Agent } from '../../types';

interface WorkflowSettingsProps {
  workflow: WorkflowConfig;
  agents: Agent[];
  onUpdateWorkflow: (updates: Partial<WorkflowConfig>) => void;
}

export function WorkflowSettings({
  workflow,
  agents,
  onUpdateWorkflow,
}: WorkflowSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflow Settings</CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure completion strategy, timeouts, and error handling
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Completion Strategy</Label>
            <Select
              value={workflow.completion_strategy}
              onValueChange={(value: CompletionStrategy) => onUpdateWorkflow({ completion_strategy: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPLETION_STRATEGIES.map(strategy => (
                  <SelectItem key={strategy.value} value={strategy.value}>
                    <div>
                      <div className="font-medium">{strategy.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {strategy.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Workflow Timeout (seconds)</Label>
            <Input
              type="number"
              min="60"
              max="7200"
              value={workflow.timeout_seconds}
              onChange={(e) => onUpdateWorkflow({ timeout_seconds: parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label>Max Concurrent Agents</Label>
            <Input
              type="number"
              min="1"
              max="10"
              value={workflow.max_concurrent_agents}
              onChange={(e) => onUpdateWorkflow({ max_concurrent_agents: parseInt(e.target.value) })}
            />
          </div>

          {workflow.completion_strategy === 'threshold' && (
            <div className="space-y-2">
              <Label>Required Completions</Label>
              <Input
                type="number"
                min="1"
                max={agents.length}
                value={workflow.required_completions || 1}
                onChange={(e) => onUpdateWorkflow({ required_completions: parseInt(e.target.value) })}
              />
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Continue on Failure</Label>
              <p className="text-xs text-muted-foreground">
                Continue workflow execution even if some agents fail
              </p>
            </div>
            <Switch
              checked={workflow.continue_on_failure}
              onCheckedChange={(checked) => onUpdateWorkflow({ continue_on_failure: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Retry Failed Agents</Label>
              <p className="text-xs text-muted-foreground">
                Automatically retry agents that fail during execution
              </p>
            </div>
            <Switch
              checked={workflow.retry_failed_agents}
              onCheckedChange={(checked) => onUpdateWorkflow({ retry_failed_agents: checked })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
