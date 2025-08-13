/**
 * Agent Ordering Component
 * Simple form-based agent ordering for sequential workflows
 */

import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { Agent, WorkflowConfig } from '../../types';

interface AgentOrderingProps {
  agents: Agent[];
  workflow: WorkflowConfig;
  onMoveAgent: (fromIndex: number, toIndex: number) => void;
}

export function AgentOrdering({
  agents,
  workflow,
  onMoveAgent,
}: AgentOrderingProps) {
  if (workflow.mode !== 'sequential' || !workflow.sequence) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Execution Order</CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure the order in which agents will execute
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {workflow.sequence.map((agentId, index) => {
            const agent = agents.find(a => a.id === agentId);
            if (!agent) return null;
            
            return (
              <div key={agentId} className="flex items-center gap-3 p-3 border rounded-lg">
                <Badge variant="outline" className="text-xs">
                  {index + 1}
                </Badge>
                <div className="flex-1">
                  <div className="font-medium">{agent.name}</div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {agent.type} Agent
                    {agent.hitl_config?.enabled && (
                      <span className="ml-2 text-primary">• HITL Enabled</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMoveAgent(index, index - 1)}
                    disabled={index === 0}
                    title="Move up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMoveAgent(index, index + 1)}
                    disabled={index === workflow.sequence!.length - 1}
                    title="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
