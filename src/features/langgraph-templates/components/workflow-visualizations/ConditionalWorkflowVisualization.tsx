/**
 * Conditional Workflow Visualization Component
 * 
 * Displays dependency graph visualization for conditional agent execution
 * with interactive dependency management, critical path analysis, and cycle detection.
 */

import React from 'react';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Switch } from '../../../../components/ui/switch';
import { Label } from '../../../../components/ui/label';
import { Alert, AlertDescription } from '../../../../components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { 
  GitBranch,
  ArrowDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  RotateCcw,
  Workflow,
  Link,
  Unlink
} from 'lucide-react';
import AgentNode from './shared/AgentNode';
import type { Agent, WorkflowConfig } from '../../types';

interface ConditionalWorkflowVisualizationProps {
  agents: Agent[];
  workflow: WorkflowConfig;
  onUpdateWorkflow: (updates: Partial<WorkflowConfig>) => void;
  onUpdateAgent: (index: number, updates: Partial<Agent>) => void;
  onConfigureAgent?: (index: number) => void;
}

interface DependencyGraphNode {
  agent: Agent;
  index: number;
  level: number;
  dependencies: number[];
  dependents: number[];
  isEntryPoint: boolean;
  isInCycle: boolean;
  criticalPath: boolean;
}

export function ConditionalWorkflowVisualization({
  agents,
  workflow,
  onUpdateWorkflow,
  onUpdateAgent,
  onConfigureAgent
}: ConditionalWorkflowVisualizationProps) {
  
  // Build dependency graph
  const dependencyGraph = React.useMemo(() => {
    const nodes: DependencyGraphNode[] = agents.map((agent, index) => ({
      agent,
      index,
      level: 0,
      dependencies: (agent.depends_on || []).map(dep => parseInt(dep)),
      dependents: [],
      isEntryPoint: !agent.depends_on || agent.depends_on.length === 0,
      isInCycle: false,
      criticalPath: false
    }));

    // Calculate dependents
    nodes.forEach(node => {
      node.dependencies.forEach(depIndex => {
        if (nodes[depIndex]) {
          nodes[depIndex].dependents.push(node.index);
        }
      });
    });

    // Detect cycles using DFS
    const detectCycles = () => {
      const visited = new Set<number>();
      const recStack = new Set<number>();
      const cycleNodes = new Set<number>();

      const dfs = (nodeIndex: number): boolean => {
        visited.add(nodeIndex);
        recStack.add(nodeIndex);

        const node = nodes[nodeIndex];
        for (const depIndex of node.dependencies) {
          if (!visited.has(depIndex)) {
            if (dfs(depIndex)) {
              cycleNodes.add(nodeIndex);
              return true;
            }
          } else if (recStack.has(depIndex)) {
            cycleNodes.add(nodeIndex);
            cycleNodes.add(depIndex);
            return true;
          }
        }

        recStack.delete(nodeIndex);
        return false;
      };

      nodes.forEach(node => {
        if (!visited.has(node.index)) {
          dfs(node.index);
        }
      });

      // Mark cycle nodes
      nodes.forEach(node => {
        node.isInCycle = cycleNodes.has(node.index);
      });

      return cycleNodes.size > 0;
    };

    // Calculate levels (topological sort)
    const calculateLevels = () => {
      const inDegree = new Map<number, number>();
      const queue: number[] = [];

      // Initialize in-degrees
      nodes.forEach(node => {
        inDegree.set(node.index, node.dependencies.length);
        if (node.dependencies.length === 0) {
          queue.push(node.index);
          node.level = 0;
        }
      });

      let level = 0;
      while (queue.length > 0) {
        const levelSize = queue.length;
        
        for (let i = 0; i < levelSize; i++) {
          const nodeIndex = queue.shift()!;
          const node = nodes[nodeIndex];
          node.level = level;

          // Process dependents
          node.dependents.forEach(depIndex => {
            const currentInDegree = inDegree.get(depIndex)! - 1;
            inDegree.set(depIndex, currentInDegree);
            
            if (currentInDegree === 0) {
              queue.push(depIndex);
            }
          });
        }
        level++;
      }
    };

    // Calculate critical path
    const calculateCriticalPath = () => {
      const memo = new Map<number, number>();

      const getMaxPath = (nodeIndex: number): number => {
        if (memo.has(nodeIndex)) {
          return memo.get(nodeIndex)!;
        }

        const node = nodes[nodeIndex];
        let maxPath = node.agent.timeout_seconds / 60; // Convert to minutes

        if (node.dependencies.length > 0) {
          const maxDepPath = Math.max(...node.dependencies.map(depIndex => getMaxPath(depIndex)));
          maxPath += maxDepPath;
        }

        memo.set(nodeIndex, maxPath);
        return maxPath;
      };

      // Find the longest path
      let maxTotalPath = 0;
      let criticalEndNode = -1;

      nodes.forEach(node => {
        if (node.dependents.length === 0) { // End nodes
          const pathLength = getMaxPath(node.index);
          if (pathLength > maxTotalPath) {
            maxTotalPath = pathLength;
            criticalEndNode = node.index;
          }
        }
      });

      // Mark critical path nodes
      const markCriticalPath = (nodeIndex: number) => {
        const node = nodes[nodeIndex];
        node.criticalPath = true;

        if (node.dependencies.length > 0) {
          // Find the dependency with the longest path
          let maxDepPath = 0;
          let criticalDep = -1;

          node.dependencies.forEach(depIndex => {
            const pathLength = getMaxPath(depIndex);
            if (pathLength > maxDepPath) {
              maxDepPath = pathLength;
              criticalDep = depIndex;
            }
          });

          if (criticalDep !== -1) {
            markCriticalPath(criticalDep);
          }
        }
      };

      if (criticalEndNode !== -1) {
        markCriticalPath(criticalEndNode);
      }
    };

    const hasCycles = detectCycles();
    if (!hasCycles) {
      calculateLevels();
      calculateCriticalPath();
    }

    return { nodes, hasCycles };
  }, [agents]);

  // Dependency management functions
  const addDependency = (agentIndex: number, dependencyIndex: number) => {
    const agent = agents[agentIndex];
    const currentDeps = agent.depends_on || [];
    const dependencyIndexStr = dependencyIndex.toString();
    
    if (!currentDeps.includes(dependencyIndexStr)) {
      onUpdateAgent(agentIndex, {
        depends_on: [...currentDeps, dependencyIndexStr]
      });
    }
  };

  const removeDependency = (agentIndex: number, dependencyIndex: number) => {
    const agent = agents[agentIndex];
    const currentDeps = agent.depends_on || [];
    const dependencyIndexStr = dependencyIndex.toString();
    
    onUpdateAgent(agentIndex, {
      depends_on: currentDeps.filter(id => id !== dependencyIndexStr)
    });
  };

  // Group nodes by level for visualization
  const nodesByLevel = React.useMemo(() => {
    const levels: DependencyGraphNode[][] = [];
    
    dependencyGraph.nodes.forEach(node => {
      if (!levels[node.level]) {
        levels[node.level] = [];
      }
      levels[node.level].push(node);
    });

    return levels.filter(level => level.length > 0);
  }, [dependencyGraph]);

  // Calculate execution order
  const executionOrder = React.useMemo(() => {
    if (dependencyGraph.hasCycles) return [];
    
    const order: number[] = [];
    const visited = new Set<number>();
    
    const visit = (nodeIndex: number) => {
      if (visited.has(nodeIndex)) return;
      visited.add(nodeIndex);
      
      const node = dependencyGraph.nodes[nodeIndex];
      node.dependencies.forEach(depIndex => visit(depIndex));
      order.push(nodeIndex);
    };
    
    dependencyGraph.nodes.forEach(node => {
      if (!visited.has(node.index)) {
        visit(node.index);
      }
    });
    
    return order;
  }, [dependencyGraph]);

  return (
    <div className="space-y-6">
      {/* Dependency Graph Visualization */}
      <div className="bg-orange-50 dark:bg-orange-950/20 p-6 rounded-lg min-h-[600px]">
        <div className="flex items-center gap-2 mb-6">
          <GitBranch className="h-5 w-5 text-orange-600" />
          <h3 className="font-medium text-orange-900 dark:text-orange-100">Conditional Execution Flow</h3>
          <Badge variant="outline" className="ml-auto">
            {agents.length} agents, {dependencyGraph.nodes.filter(n => n.isEntryPoint).length} entry points
          </Badge>
        </div>

        {/* Cycle Detection Alert */}
        {dependencyGraph.hasCycles && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Circular Dependencies Detected!</div>
              <div className="text-sm mt-1">
                The workflow contains circular dependencies that will prevent execution. 
                Please remove dependencies to break the cycles.
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Dependency Graph Visualization */}
        <div className="relative overflow-x-auto overflow-y-auto max-h-[500px]">
          <div className="flex flex-col gap-12 min-w-max pb-6">
            {nodesByLevel.map((level, levelIndex) => (
              <div key={levelIndex} className="flex flex-col items-center">
                {/* Level Header */}
                <div className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-6">
                  {levelIndex === 0 ? 'Entry Points' : `Level ${levelIndex}`}
                </div>

                {/* Nodes in Level */}
                <div className="flex items-center gap-8 flex-wrap justify-center py-4">
                  {level.map((node) => (
                    <div key={node.index} className="flex flex-col items-center relative">
                      {/* Agent Node */}
                      <div className="relative mb-4">
                        <AgentNode
                          agent={node.agent}
                          index={node.index}
                          showMetrics={true}
                          showControls={true}
                          onClick={() => onConfigureAgent?.(node.index)}
                          onConfigure={() => onConfigureAgent?.(node.index)}
                          className={`w-56 ${
                            node.isInCycle ? 'ring-2 ring-red-500 ring-offset-2' :
                            node.criticalPath ? 'ring-2 ring-yellow-500 ring-offset-2' :
                            node.isEntryPoint ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                          }`}
                        />

                        {/* Status Indicators */}
                        <div className="absolute -top-3 -left-3 flex gap-1 flex-wrap">
                          {node.isEntryPoint && (
                            <Badge variant="secondary" className="text-xs px-2 py-1">
                              Entry
                            </Badge>
                          )}
                          {node.criticalPath && !node.isInCycle && (
                            <Badge variant="destructive" className="text-xs px-2 py-1">
                              Critical
                            </Badge>
                          )}
                          {node.isInCycle && (
                            <Badge variant="destructive" className="text-xs px-2 py-1">
                              Cycle
                            </Badge>
                          )}
                        </div>

                        {/* Dependency Count */}
                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center">
                          <div className="text-xs text-orange-600 bg-white dark:bg-gray-900 px-2 py-1 rounded border">
                            {node.dependencies.length} deps • {node.dependents.length} dependents
                          </div>
                        </div>
                      </div>

                      {/* Dependency Arrows */}
                      {levelIndex > 0 && node.dependencies.length > 0 && (
                        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
                          <ArrowDown className="h-5 w-5 text-orange-600" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Level Separator */}
                {levelIndex < nodesByLevel.length - 1 && (
                  <div className="mt-12 mb-8 w-full flex items-center justify-center">
                    <div className="flex-1 border-t border-orange-300 dark:border-orange-700"></div>
                    <div className="px-6 text-sm text-orange-600 bg-orange-100 dark:bg-orange-900/30 rounded-full py-1">
                      depends on
                    </div>
                    <div className="flex-1 border-t border-orange-300 dark:border-orange-700"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dependency Management */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Link className="h-4 w-4" />
          <span className="font-medium">Dependency Management</span>
        </div>

        <div className="space-y-4">
          {agents.map((agent, agentIndex) => {
            const node = dependencyGraph.nodes[agentIndex];
            const availableDeps = agents.filter((_, index) => index !== agentIndex);

            return (
              <div key={agent.id} className="border rounded-lg p-4 bg-muted/20">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {agent.type} Agent
                      {node.isEntryPoint && <span className="ml-2 text-blue-600">• Entry Point</span>}
                      {node.criticalPath && <span className="ml-2 text-yellow-600">• Critical Path</span>}
                      {node.isInCycle && <span className="ml-2 text-red-600">• In Cycle</span>}
                    </div>
                  </div>
                  <Badge variant="outline">
                    {node.dependencies.length} dependencies
                  </Badge>
                </div>

                {/* Current Dependencies */}
                {node.dependencies.length > 0 && (
                  <div className="mb-3">
                    <div className="text-sm font-medium mb-2">Depends on:</div>
                    <div className="flex flex-wrap gap-2">
                      {node.dependencies.map(depIndex => {
                        const depAgent = agents[depIndex];
                        return (
                          <div key={depIndex} className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
                            <span className="text-sm">{depAgent?.name || 'Unknown'}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDependency(agentIndex, depIndex)}
                              className="h-4 w-4 p-0 text-red-500"
                            >
                              <Unlink className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Add Dependency */}
                <Select
                  onValueChange={(value) => addDependency(agentIndex, parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Add dependency..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDeps.length > 0 ? (
                      availableDeps
                        .filter(dep => {
                          const depIndex = agents.indexOf(dep);
                          return !node.dependencies.includes(depIndex);
                        })
                        .map((dep) => {
                          const depIndex = agents.indexOf(dep);
                          return (
                            <SelectItem key={depIndex} value={depIndex.toString()}>
                              {dep.name} ({dep.type})
                            </SelectItem>
                          );
                        })
                    ) : (
                      <SelectItem value="" disabled>
                        No available dependencies
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>
      </div>


      {/* Execution Analysis */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Workflow className="h-4 w-4" />
          <span className="font-medium">Execution Analysis</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Execution Order */}
          <div className="space-y-4">
            <div>
              <Label className="font-medium mb-2 block">Execution Order</Label>
              {dependencyGraph.hasCycles ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Cannot determine execution order due to circular dependencies.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="bg-muted/20 rounded-lg p-3 space-y-2">
                  {executionOrder.map((agentIndex, orderIndex) => {
                    const agent = agents[agentIndex];
                    const node = dependencyGraph.nodes[agentIndex];
                    
                    return (
                      <div key={agentIndex} className="flex items-center gap-2 text-sm">
                        <Badge variant="secondary" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                          {orderIndex + 1}
                        </Badge>
                        <span className="flex-1">{agent.name}</span>
                        <span className="text-muted-foreground">
                          {Math.round(agent.timeout_seconds / 60)}min
                        </span>
                        {node.criticalPath && (
                          <Badge variant="outline" className="text-xs">Critical</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Critical Path Analysis */}
          <div className="space-y-4">
            <div>
              <Label className="font-medium mb-2 block">Critical Path Analysis</Label>
              <div className="bg-muted/20 rounded-lg p-3 space-y-2">
                {!dependencyGraph.hasCycles ? (
                  <>
                    <div className="text-sm">
                      <div className="font-medium">Critical Path Agents:</div>
                      <div className="text-muted-foreground ml-2">
                        {dependencyGraph.nodes
                          .filter(node => node.criticalPath)
                          .map(node => node.agent.name)
                          .join(' → ')}
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">Entry Points:</div>
                      <div className="text-muted-foreground ml-2">
                        {dependencyGraph.nodes
                          .filter(node => node.isEntryPoint)
                          .map(node => node.agent.name)
                          .join(', ')}
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">Execution Levels:</div>
                      <div className="text-muted-foreground ml-2">
                        {nodesByLevel.length} levels of execution
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-red-600">
                    Critical path analysis unavailable due to circular dependencies.
                  </div>
                )}
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
                  Save state after each agent completion
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
                  Allow replay from any dependency checkpoint
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
                  Stream results as dependencies complete
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

          {/* Dependency Validation */}
          <div className="space-y-4">
            <div>
              <Label className="font-medium mb-2 block">Dependency Validation</Label>
              <div className="bg-muted/20 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  {dependencyGraph.hasCycles ? (
                    <>
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-red-600">Circular dependencies detected</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">No circular dependencies</span>
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4 text-blue-500" />
                  <span>{dependencyGraph.nodes.filter(n => n.isEntryPoint).length} entry points identified</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span>{dependencyGraph.nodes.filter(n => n.criticalPath).length} agents on critical path</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Link className="h-4 w-4 mr-2" />
          Auto-Optimize Dependencies
        </Button>
        <Button variant="outline" size="sm">
          <Target className="h-4 w-4 mr-2" />
          Highlight Critical Path
        </Button>
        <Button variant="outline" size="sm">
          <RotateCcw className="h-4 w-4 mr-2" />
          Clear All Dependencies
        </Button>
      </div>
    </div>
  );
}

export default ConditionalWorkflowVisualization;
