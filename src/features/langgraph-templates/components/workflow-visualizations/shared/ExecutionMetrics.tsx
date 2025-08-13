/**
 * Execution Metrics Component
 * 
 * Displays estimated execution time, cost, and performance metrics
 * for workflow configurations across all modes.
 */

import React from 'react';
import { Badge } from '../../../../../components/ui/badge';
import { 
  Clock, 
  DollarSign, 
  Zap, 
  Users,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import type { Agent, WorkflowConfig, WorkflowMode } from '../../../types';

interface ExecutionMetricsProps {
  agents: Agent[];
  workflow: WorkflowConfig;
  mode: WorkflowMode;
  className?: string;
}

interface MetricCalculation {
  totalTime: number;
  totalCost: number;
  maxConcurrent: number;
  criticalPath: string[];
  warnings: string[];
}

export function ExecutionMetrics({
  agents,
  workflow,
  mode,
  className = ''
}: ExecutionMetricsProps) {
  
  const calculateMetrics = (): MetricCalculation => {
    if (agents.length === 0) {
      return {
        totalTime: 0,
        totalCost: 0,
        maxConcurrent: 0,
        criticalPath: [],
        warnings: []
      };
    }

    const warnings: string[] = [];
    let totalTime = 0;
    let totalCost = 0;
    const maxConcurrent = workflow.max_concurrent_agents || 1;
    let criticalPath: string[] = [];

    // Calculate cost for all agents
    totalCost = agents.reduce((sum, agent) => {
      const agentCost = agent.llm_config.max_tokens * 0.00002; // Rough GPT-4 estimate
      const tavilyCost = agent.tavily_config.max_credits_per_agent * 0.001; // Rough Tavily estimate
      return sum + agentCost + tavilyCost;
    }, 0);

    // Calculate time based on workflow mode
    switch (mode) {
      case 'sequential':
        // Sequential: sum of all agent times
        totalTime = agents.reduce((sum, agent) => sum + (agent.timeout_seconds / 60), 0);
        criticalPath = agents.map(agent => agent.name);
        
        if (totalTime > workflow.timeout_seconds / 60) {
          warnings.push(`Sequential execution time (${Math.round(totalTime)}min) may exceed workflow timeout (${Math.round(workflow.timeout_seconds / 60)}min)`);
        }
        break;

      case 'parallel':
        // Parallel: time of longest agent in each group
        if (workflow.parallel_groups && workflow.parallel_groups.length > 0) {
          totalTime = workflow.parallel_groups.reduce((maxGroupTime, group) => {
            const groupAgents = agents.filter((_, index) => group.includes(index.toString()));
            if (groupAgents.length === 0) return maxGroupTime; // Handle empty groups
            const groupTime = Math.max(...groupAgents.map(agent => agent.timeout_seconds / 60));
            return maxGroupTime + groupTime; // Groups run sequentially
          }, 0);
          
          // Find critical path (longest agents in each group)
          criticalPath = workflow.parallel_groups
            .map(group => {
              const groupAgents = agents.filter((_, index) => group.includes(index.toString()));
              if (groupAgents.length === 0) return null; // Handle empty groups
              const longestAgent = groupAgents.reduce((longest, current) => 
                current.timeout_seconds > longest.timeout_seconds ? current : longest
              );
              return longestAgent.name;
            })
            .filter(name => name !== null) as string[]; // Remove null entries
        } else {
          // All agents in one parallel group
          if (agents.length > 0) {
            totalTime = Math.max(...agents.map(agent => agent.timeout_seconds / 60));
            const longestAgent = agents.reduce((longest, current) => 
              current.timeout_seconds > longest.timeout_seconds ? current : longest
            );
            criticalPath = [longestAgent.name];
          }
        }

        if (maxConcurrent > agents.length) {
          warnings.push(`Max concurrent agents (${maxConcurrent}) exceeds total agents (${agents.length})`);
        }
        break;

      case 'conditional': {
        // Conditional: calculate based on dependency graph
        const { time, path } = calculateConditionalPath(agents);
        totalTime = time;
        criticalPath = path;
        
        if (hasCycles(agents)) {
          warnings.push('Circular dependencies detected - may cause infinite loops');
        }
        break;
      }

      case 'langgraph':
        // LangGraph: estimate based on graph structure or fall back to sequential
        if (workflow.graph_structure) {
          // Complex graph analysis would go here
          totalTime = agents.reduce((sum, agent) => sum + (agent.timeout_seconds / 60), 0) * 0.8; // Estimate 20% efficiency gain
          criticalPath = ['Graph execution path'];
        } else {
          totalTime = agents.reduce((sum, agent) => sum + (agent.timeout_seconds / 60), 0);
          criticalPath = agents.map(agent => agent.name);
        }
        break;
    }

    // Add HITL time overhead
    const hitlAgents = agents.filter(agent => agent.hitl_config?.enabled);
    if (hitlAgents.length > 0) {
      const hitlOverhead = hitlAgents.reduce((sum, agent) => 
        sum + (agent.hitl_config?.timeout_seconds || 300) / 60, 0
      );
      totalTime += hitlOverhead;
      warnings.push(`HITL overhead: +${Math.round(hitlOverhead)}min for ${hitlAgents.length} agents`);
    }

    return {
      totalTime: Math.round(totalTime),
      totalCost: Math.round(totalCost * 100) / 100,
      maxConcurrent,
      criticalPath,
      warnings
    };
  };

  const calculateConditionalPath = (agents: Agent[]): { time: number; path: string[] } => {
    // Simple critical path calculation for conditional workflows
    const agentMap = new Map(agents.map(agent => [agent.name, agent]));
    const visited = new Set<string>();
    const path: string[] = [];
    let totalTime = 0;

    const dfs = (agentName: string): number => {
      if (visited.has(agentName)) return 0;
      visited.add(agentName);
      
      const agent = agentMap.get(agentName);
      if (!agent) return 0;

      path.push(agentName);
      let maxDepTime = 0;

      if (agent.depends_on) {
        for (const depName of agent.depends_on) {
          maxDepTime = Math.max(maxDepTime, dfs(depName));
        }
      }

      return maxDepTime + (agent.timeout_seconds / 60);
    };

    // Find entry points (agents with no dependencies)
    const entryAgents = agents.filter(agent => !agent.depends_on || agent.depends_on.length === 0);
    
    for (const agent of entryAgents) {
      totalTime = Math.max(totalTime, dfs(agent.name));
    }

    return { time: totalTime, path };
  };

  const hasCycles = (agents: Agent[]): boolean => {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (agentName: string): boolean => {
      visited.add(agentName);
      recStack.add(agentName);

      const agent = agents.find(a => a.name === agentName);
      if (agent?.depends_on) {
        for (const depName of agent.depends_on) {
          if (!visited.has(depName)) {
            if (dfs(depName)) return true;
          } else if (recStack.has(depName)) {
            return true;
          }
        }
      }

      recStack.delete(agentName);
      return false;
    };

    for (const agent of agents) {
      if (!visited.has(agent.name)) {
        if (dfs(agent.name)) return true;
      }
    }

    return false;
  };

  const metrics = calculateMetrics();

  return (
    <div className={`bg-muted/20 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4" />
        <span className="font-medium text-sm">Execution Metrics</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
        {/* Total Time */}
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-600" />
          <div>
            <div className="text-sm font-medium">{metrics.totalTime}min</div>
            <div className="text-xs text-muted-foreground">Total Time</div>
          </div>
        </div>

        {/* Total Cost */}
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-green-600" />
          <div>
            <div className="text-sm font-medium">${metrics.totalCost}</div>
            <div className="text-xs text-muted-foreground">Est. Cost</div>
          </div>
        </div>

        {/* Concurrent Agents */}
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-purple-600" />
          <div>
            <div className="text-sm font-medium">{metrics.maxConcurrent}</div>
            <div className="text-xs text-muted-foreground">Max Concurrent</div>
          </div>
        </div>

        {/* Agent Count */}
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-orange-600" />
          <div>
            <div className="text-sm font-medium">{agents.length}</div>
            <div className="text-xs text-muted-foreground">Total Agents</div>
          </div>
        </div>
      </div>

      {/* Critical Path */}
      {metrics.criticalPath.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-medium mb-1">Critical Path:</div>
          <div className="flex flex-wrap gap-1">
            {metrics.criticalPath.map((agentName, index) => (
              <React.Fragment key={agentName}>
                <Badge variant="outline" className="text-xs">
                  {agentName}
                </Badge>
                {index < metrics.criticalPath.length - 1 && (
                  <span className="text-xs text-muted-foreground">→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {metrics.warnings.length > 0 && (
        <div className="space-y-1">
          {metrics.warnings.map((warning, index) => (
            <div key={index} className="flex items-start gap-2 text-xs text-amber-600">
              <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ExecutionMetrics;
