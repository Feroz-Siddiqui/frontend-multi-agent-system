/**
 * Sequential Workflow Visualization Component
 * 
 * Beautiful, compact horizontal flow design matching the Parallel workflow style
 * with drag & drop functionality and proper workflow visualization
 */

import React, { useState, useCallback } from 'react';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Switch } from '../../../../components/ui/switch';
import { Label } from '../../../../components/ui/label';
import { 
  ArrowRight,
  Play,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  GripVertical,
  RotateCcw,
  Settings,
  Clock,
  Target
} from 'lucide-react';
import AgentNode from './shared/AgentNode';
import type { Agent, WorkflowConfig } from '../../types';

interface SequentialWorkflowVisualizationProps {
  agents: Agent[];
  workflow: WorkflowConfig;
  onUpdateWorkflow: (updates: Partial<WorkflowConfig>) => void;
  onUpdateAgent: (index: number, updates: Partial<Agent>) => void;
  onConfigureAgent?: (index: number) => void;
}

interface DragState {
  isDragging: boolean;
  draggedIndex: number | null;
  dropZoneIndex: number | null;
}

export function SequentialWorkflowVisualization({
  agents,
  workflow,
  onUpdateWorkflow,
  onConfigureAgent
}: SequentialWorkflowVisualizationProps) {
  
  // Drag and drop state
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedIndex: null,
    dropZoneIndex: null
  });

  // Helper function to find agent by ID or index
  const findAgentByIdentifier = React.useCallback((identifier: string) => {
    return agents.find(agent => 
      agent.id === identifier || 
      agent.name === identifier || 
      agents.indexOf(agent).toString() === identifier
    );
  }, [agents]);

  // Get current sequence or create default
  const currentSequence = React.useMemo(() => {
    if (workflow.sequence && workflow.sequence.length > 0) {
      // Return agent IDs directly, don't parse as integers
      return workflow.sequence;
    }
    // Auto-generate default sequence using agent IDs
    const defaultSequence = agents.map(agent => agent.id || agent.name);
    
    // Auto-update the workflow with the default sequence if it's empty
    if (agents.length > 0 && (!workflow.sequence || workflow.sequence.length === 0)) {
      // Use setTimeout to avoid updating state during render
      setTimeout(() => {
        onUpdateWorkflow({ sequence: defaultSequence });
      }, 0);
    }
    
    return defaultSequence;
  }, [workflow.sequence, agents, onUpdateWorkflow]);

  // Update sequence with agent IDs
  const updateSequence = useCallback((newSequence: string[]) => {
    onUpdateWorkflow({ sequence: newSequence });
  }, [onUpdateWorkflow]);

  // Move agent up in sequence
  const moveAgentUp = useCallback((sequenceIndex: number) => {
    if (sequenceIndex === 0) return;
    
    const newSequence = [...currentSequence];
    [newSequence[sequenceIndex - 1], newSequence[sequenceIndex]] = 
    [newSequence[sequenceIndex], newSequence[sequenceIndex - 1]];
    
    updateSequence(newSequence);
  }, [currentSequence, updateSequence]);

  // Move agent down in sequence
  const moveAgentDown = useCallback((sequenceIndex: number) => {
    if (sequenceIndex === currentSequence.length - 1) return;
    
    const newSequence = [...currentSequence];
    [newSequence[sequenceIndex], newSequence[sequenceIndex + 1]] = 
    [newSequence[sequenceIndex + 1], newSequence[sequenceIndex]];
    
    updateSequence(newSequence);
  }, [currentSequence, updateSequence]);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, sequenceIndex: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', sequenceIndex.toString());
    
    setDragState({
      isDragging: true,
      draggedIndex: sequenceIndex,
      dropZoneIndex: null
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, sequenceIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    setDragState(prev => ({
      ...prev,
      dropZoneIndex: sequenceIndex
    }));
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragState(prev => ({
      ...prev,
      dropZoneIndex: null
    }));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (dragIndex !== dropIndex) {
      const newSequence = [...currentSequence];
      const draggedAgent = newSequence[dragIndex];
      
      // Remove dragged agent
      newSequence.splice(dragIndex, 1);
      
      // Insert at new position
      const insertIndex = dragIndex < dropIndex ? dropIndex - 1 : dropIndex;
      newSequence.splice(insertIndex, 0, draggedAgent);
      
      updateSequence(newSequence);
    }
    
    setDragState({
      isDragging: false,
      draggedIndex: null,
      dropZoneIndex: null
    });
  }, [currentSequence, updateSequence]);

  const handleDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedIndex: null,
      dropZoneIndex: null
    });
  }, []);

  // Calculate execution metrics (2 minutes per agent)
  const calculateMetrics = () => {
    const executionTimePerAgent = 2; // 2 minutes per agent
    let cumulativeTime = 0;
    
    return currentSequence.map((agentId) => {
      const agent = findAgentByIdentifier(agentId);
      if (!agent) return { time: 0, label: 'Unknown', cumulativeTime: 0 };
      
      cumulativeTime += executionTimePerAgent;
      return {
        time: executionTimePerAgent,
        cumulativeTime,
        label: agent.name,
        hasHITL: agent.hitl_config?.enabled || false
      };
    });
  };

  const metrics = calculateMetrics();
  const totalTime = metrics[metrics.length - 1]?.cumulativeTime || 0;

  // Reset sequence to default order
  const resetSequence = useCallback(() => {
    const defaultSequence = agents.map(agent => agent.id || agent.name);
    updateSequence(defaultSequence);
  }, [agents, updateSequence]);

  return (
    <div className="space-y-6">
      {/* Sequential Flow Visualization - Horizontal Layout */}
      <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg">
        <div className="flex items-center gap-2 mb-6">
          <Play className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium text-blue-900 dark:text-blue-100">Sequential Execution Flow</h3>
          <Badge variant="outline" className="ml-auto">
            {currentSequence.length} agents, {totalTime} min total
          </Badge>
        </div>

        {/* Horizontal Flow Diagram */}
        <div className="relative overflow-x-auto">
          <div className="flex items-center gap-4 min-w-max pb-4">
            {/* Start Node */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-full flex items-center justify-center">
                <Play className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-xs text-green-600 mt-2">Start</div>
            </div>

            {/* Arrow to first agent */}
            <ArrowRight className="h-6 w-6 text-blue-600 flex-shrink-0" />

            {/* Sequential Agents */}
            {currentSequence.map((agentId, sequenceIndex) => {
              const agent = findAgentByIdentifier(agentId);
              if (!agent) return null;

              const agentIndex = agents.indexOf(agent);
              const metric = metrics[sequenceIndex];
              const isDragged = dragState.draggedIndex === sequenceIndex;
              const isDropZone = dragState.dropZoneIndex === sequenceIndex;
              const canMoveUp = sequenceIndex > 0;
              const canMoveDown = sequenceIndex < currentSequence.length - 1;

              return (
                <React.Fragment key={`seq-${agentId}-${sequenceIndex}`}>
                  {/* Drop Zone Indicator */}
                  {dragState.isDragging && isDropZone && (
                    <div className="absolute top-0 bottom-0 w-1 bg-blue-500 rounded-full z-10 -ml-2" />
                  )}

                  <div className="flex flex-col items-center relative">
                    {/* Agent Container */}
                    <div 
                      className={`relative bg-blue-100 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg p-3 min-w-[200px] mt-2 transition-all duration-200 ${
                        isDragged ? 'opacity-50 scale-95' : ''
                      } ${
                        isDropZone ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                      }`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, sequenceIndex)}
                      onDragOver={(e) => handleDragOver(e, sequenceIndex)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, sequenceIndex)}
                      onDragEnd={handleDragEnd}
                    >
                      {/* Sequence Number Badge */}
                      <Badge variant="default" className="absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                        {sequenceIndex + 1}
                      </Badge>

                      {/* Reorder Controls */}
                      <div className="absolute -top-2 -right-2 flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveAgentUp(sequenceIndex)}
                          disabled={!canMoveUp}
                          className="h-6 w-6 p-0"
                          title="Move left"
                        >
                          <ArrowUp className="h-3 w-3 transform -rotate-90" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveAgentDown(sequenceIndex)}
                          disabled={!canMoveDown}
                          className="h-6 w-6 p-0"
                          title="Move right"
                        >
                          <ArrowDown className="h-3 w-3 transform rotate-90" />
                        </Button>
                      </div>

                      {/* Drag Handle */}
                      <div className="absolute top-1 left-1/2 transform -translate-x-1/2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                        <GripVertical className="h-4 w-4" />
                      </div>

                      {/* Agent Content */}
                      <div className="pt-3">
                        <AgentNode
                          agent={agent}
                          index={agentIndex}
                          showMetrics={false}
                          showControls={false}
                          onClick={() => onConfigureAgent?.(agentIndex)}
                          className="w-full"
                        />
                        
                        {/* Agent Metrics */}
                        <div className="mt-2 pt-2 border-t border-blue-300 dark:border-blue-700">
                          <div className="flex items-center justify-between text-xs text-blue-700 dark:text-blue-300">
                            <span>Time: {metric?.time}min</span>
                            <span>Total: {metric?.cumulativeTime}min</span>
                            {agent.hitl_config?.enabled && (
                              <Badge variant="outline" className="text-xs">HITL</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step Label */}
                    <div className="text-xs text-blue-600 mt-2">
                      Step {sequenceIndex + 1}
                    </div>
                  </div>

                  {/* Arrow to next agent */}
                  {sequenceIndex < currentSequence.length - 1 && (
                    <div className="flex flex-col items-center">
                      <ArrowRight className="h-6 w-6 text-blue-600" />
                      <div className="text-xs text-blue-600 mt-2">then</div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}

            {/* Arrow to final result */}
            <ArrowRight className="h-6 w-6 text-blue-600 flex-shrink-0" />

            {/* Final Result */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-16 bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-800 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
                  <div className="text-xs font-medium text-green-900 dark:text-green-100">
                    Complete
                  </div>
                </div>
              </div>
              <div className="text-xs text-green-600 mt-2">Final Result</div>
            </div>
          </div>
        </div>

        {/* Drag & Drop Instructions */}
        <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <strong>💡 Tip:</strong> Drag agents to reorder sequence, or use the arrow buttons on each step
          </div>
        </div>
      </div>

      {/* Execution Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sequential Configuration */}
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-4 w-4" />
            <span className="font-medium">Sequential Settings</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Enable Checkpointing</Label>
                <div className="text-sm text-muted-foreground">
                  Save state after each step
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
                  Allow replay from any step
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

            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
              <div className="text-sm font-medium mb-2">Execution Summary:</div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>• {currentSequence.length} sequential steps</div>
                <div>• {totalTime} minutes total execution time</div>
                <div>• {metrics.filter(m => m.hasHITL).length} steps with HITL</div>
                <div>• Checkpointing: {workflow.enable_checkpointing ? 'Enabled' : 'Disabled'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Execution Timeline */}
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4" />
            <span className="font-medium">Execution Timeline</span>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {currentSequence.map((agentId, sequenceIndex) => {
              const agent = findAgentByIdentifier(agentId);
              const metric = metrics[sequenceIndex];
              if (!agent) return null;

              return (
                <div key={`timeline-${agentId}`} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                      {sequenceIndex + 1}
                    </Badge>
                    <span className="font-medium">{agent.name}</span>
                    <span className="text-muted-foreground capitalize">({agent.type})</span>
                    {agent.hitl_config?.enabled && (
                      <Badge variant="outline" className="text-xs">HITL</Badge>
                    )}
                  </div>
                  <div className="text-muted-foreground">
                    {metric?.time}min
                  </div>
                </div>
              );
            })}
            
            <div className="border-t pt-3 flex items-center justify-between font-medium">
              <span>Total Execution Time:</span>
              <span className="text-blue-600">{totalTime} minutes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={resetSequence}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Order
        </Button>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Configure All Agents
        </Button>
      </div>
    </div>
  );
}

export default SequentialWorkflowVisualization;
