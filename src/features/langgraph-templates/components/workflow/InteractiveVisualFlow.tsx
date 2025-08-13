/**
 * Interactive Visual Flow Component
 * Shows workflow with clickable agents for HITL configuration
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { ArrowRight, Workflow, User, Zap } from 'lucide-react';
import type { Agent, WorkflowConfig } from '../../types';

interface InteractiveVisualFlowProps {
  agents: Agent[];
  workflow: WorkflowConfig;
  onAgentClick: (agentId: string) => void;
}

export function InteractiveVisualFlow({ 
  agents, 
  workflow, 
  onAgentClick 
}: InteractiveVisualFlowProps) {
  const getAgentSequence = () => {
    if (workflow.mode === 'sequential' && workflow.sequence) {
      return workflow.sequence.map(id => agents.find(a => a.id === id)).filter(Boolean) as Agent[];
    }
    return agents;
  };

  const sequencedAgents = getAgentSequence();
  const hitlCount = agents.filter(a => a.hitl_config?.enabled).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Workflow className="h-5 w-5" />
          Interactive Workflow Preview
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Click on any agent to configure HITL settings
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Visual Flow */}
          <div className="flex items-center gap-2 p-4 bg-muted/20 rounded-lg overflow-x-auto">
            {sequencedAgents.map((agent, index) => (
              <React.Fragment key={agent.id}>
                <button
                  onClick={() => onAgentClick(agent.id!)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover:shadow-md min-w-[120px] ${
                    agent.hitl_config?.enabled 
                      ? 'border-primary bg-primary/5 hover:bg-primary/10' 
                      : 'border-muted hover:border-primary/50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${
                    agent.hitl_config?.enabled 
                      ? 'border-primary bg-primary/10' 
                      : 'border-muted-foreground bg-background'
                  }`}>
                    {agent.hitl_config?.enabled ? (
                      <User className="h-5 w-5 text-primary" />
                    ) : (
                      <Zap className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm font-medium truncate max-w-[100px]">
                      {agent.name}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {agent.type}
                    </div>
                    {agent.hitl_config?.enabled ? (
                      <Badge variant="default" className="text-xs mt-1">
                        ✅ HITL
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs mt-1">
                        ❌ Click to configure
                      </Badge>
                    )}
                  </div>
                </button>
                
                {index < sequencedAgents.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
          
          {/* Workflow Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-3 bg-muted/20 rounded-lg">
              <div className="font-semibold text-lg">{agents.length}</div>
              <div className="text-muted-foreground">Agents</div>
            </div>
            <div className="text-center p-3 bg-muted/20 rounded-lg">
              <div className="font-semibold text-lg">{hitlCount}</div>
              <div className="text-muted-foreground">HITL Enabled</div>
            </div>
            <div className="text-center p-3 bg-muted/20 rounded-lg">
              <div className="font-semibold text-lg capitalize">{workflow.mode}</div>
              <div className="text-muted-foreground">Mode</div>
            </div>
            <div className="text-center p-3 bg-muted/20 rounded-lg">
              <div className="font-semibold text-lg">{Math.floor(workflow.timeout_seconds / 60)}</div>
              <div className="text-muted-foreground">Min Timeout</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
