/**
 * LiveAgentTimeline Component
 * 
 * Real-time agent execution timeline with HITL support
 * Enhanced version of the ExecutionTimeline from execution history
 */

import { useEffect, useRef, useMemo } from 'react';
import { 
  Clock, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Play,
  Bot
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { CollapsibleAgentCard } from '../../execution-history/components/CollapsibleAgentCard';
import { PrintProvider } from '../../execution-history/contexts/PrintContext';
import type { WorkflowVisualization } from '../hooks/useTemplateExecution';
import type { ExecutionResult, InterventionRequest, InterventionResponse } from '../services/execution.service';

interface TimelineEvent {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'waiting_intervention';
  action: string;
  type: 'start' | 'progress' | 'complete' | 'error' | 'intervention';
  details?: string;
  duration?: number;
  cost?: number;
  tokens?: number;
}

interface LiveAgentTimelineProps {
  execution: ExecutionResult | null;
  workflow: WorkflowVisualization | null;
  pendingInterventions: InterventionRequest[];
  selectedAgentId: string | null;
  onAgentSelect: (agentId: string) => void;
  onResolveIntervention: (interventionId: string) => void;
  onInterventionSubmit: (response: InterventionResponse) => Promise<void>;
  className?: string;
}

export function LiveAgentTimeline({ 
  execution, 
  workflow, 
  pendingInterventions,
  selectedAgentId,
  onAgentSelect,
  onResolveIntervention,
  onInterventionSubmit,
  className 
}: LiveAgentTimelineProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastEventRef = useRef<HTMLDivElement>(null);

  // Generate timeline events from execution data
  const generateTimelineEvents = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    if (!execution && !workflow) return events;

    // Add execution start event
    if (execution?.started_at) {
      events.push({
        id: 'execution-start',
        timestamp: execution.started_at,
        agentId: 'system',
        agentName: 'System',
        status: execution.status === 'completed' ? 'completed' : 'running',
        action: 'Execution Started',
        type: 'start',
        details: `Template: ${execution.template_name || 'Unknown'}`
      });
    }

    // PRIORITY: Add events from actual agent results (SSE data)
    if (execution?.agent_results && execution.agent_results.length > 0) {
      execution.agent_results.forEach(agentResult => {
        // Agent started event
        if (agentResult.started_at) {
          events.push({
            id: `${agentResult.agent_id}-start`,
            timestamp: agentResult.started_at,
            agentId: agentResult.agent_id,
            agentName: agentResult.agent_name,
            status: 'running',
            action: 'Started',
            type: 'start',
            details: `Agent: ${agentResult.agent_name}`
          });
        }

        // Agent completed/failed event
        if (agentResult.completed_at) {
          events.push({
            id: `${agentResult.agent_id}-complete`,
            timestamp: agentResult.completed_at,
            agentId: agentResult.agent_id,
            agentName: agentResult.agent_name,
            status: agentResult.success ? 'completed' : 'failed',
            action: agentResult.success ? 'Completed ✅' : 'Failed ❌',
            type: agentResult.success ? 'complete' : 'error',
            details: agentResult.success 
              ? `Duration: ${agentResult.duration_seconds.toFixed(1)}s, Cost: $${agentResult.cost.toFixed(3)}, Tokens: ${agentResult.tokens_used}`
              : agentResult.error || 'Unknown error',
            duration: agentResult.duration_seconds,
            cost: agentResult.cost,
            tokens: agentResult.tokens_used
          });
        }
      });
    }

    // FALLBACK: Add workflow node events (for agents not yet in agent_results)
    if (workflow?.nodes) {
      workflow.nodes.forEach(node => {
        // Only add workflow events if we don't already have agent result events for this agent
        const hasAgentResult = execution?.agent_results?.some(ar => ar.agent_id === node.id);
        if (hasAgentResult) return; // Skip if we already have real agent result data

        // Agent started
        if (node.startedAt) {
          events.push({
            id: `${node.id}-start`,
            timestamp: node.startedAt,
            agentId: node.id,
            agentName: node.name,
            status: 'running',
            action: 'Started',
            type: 'start',
            details: `Agent Type: ${node.type}`
          });
        }

        // Agent progress (if running)
        if (node.status === 'running') {
          events.push({
            id: `${node.id}-progress`,
            timestamp: node.startedAt || new Date().toISOString(),
            agentId: node.id,
            agentName: node.name,
            status: 'running',
            action: 'Processing...',
            type: 'progress',
            details: `Progress: ${node.progress.toFixed(0)}%`
          });
        }

        // Agent waiting for intervention
        if (node.status === 'waiting_intervention') {
          const intervention = pendingInterventions.find(i => i.agent_id === node.id);
          events.push({
            id: `${node.id}-intervention`,
            timestamp: intervention?.requested_at || new Date().toISOString(),
            agentId: node.id,
            agentName: node.name,
            status: 'waiting_intervention',
            action: 'WAITING ⚠️ - HITL Required',
            type: 'intervention',
            details: intervention?.intervention_type || 'Human input required'
          });
        }

        // Agent completed (from workflow nodes)
        if (node.status === 'completed' && node.completedAt) {
          events.push({
            id: `${node.id}-complete`,
            timestamp: node.completedAt,
            agentId: node.id,
            agentName: node.name,
            status: 'completed',
            action: 'Completed ✅',
            type: 'complete',
            details: `Duration: ${node.duration.toFixed(1)}s, Cost: $${node.cost.toFixed(3)}`,
            duration: node.duration,
            cost: node.cost,
            tokens: node.tokens
          });
        }

        // Agent failed (from workflow nodes)
        if (node.status === 'failed' && node.completedAt) {
          events.push({
            id: `${node.id}-error`,
            timestamp: node.completedAt,
            agentId: node.id,
            agentName: node.name,
            status: 'failed',
            action: 'Failed ❌',
            type: 'error',
            details: node.error || 'Unknown error'
          });
        }
      });
    }

    // Add pending interventions that aren't covered by workflow nodes
    pendingInterventions.forEach(intervention => {
      const hasEvent = events.some(e => e.agentId === intervention.agent_id && e.type === 'intervention');
      if (!hasEvent) {
        events.push({
          id: `${intervention.agent_id}-intervention`,
          timestamp: intervention.requested_at,
          agentId: intervention.agent_id,
          agentName: `Agent ${intervention.agent_id}`,
          status: 'waiting_intervention',
          action: 'WAITING ⚠️ - HITL Required',
          type: 'intervention',
          details: intervention.intervention_type || 'Human input required'
        });
      }
    });

    // Add execution completion event
    if (execution?.completed_at && execution.status === 'completed') {
      events.push({
        id: 'execution-complete',
        timestamp: execution.completed_at,
        agentId: 'system',
        agentName: 'System',
        status: 'completed',
        action: 'Execution Completed ✅',
        type: 'complete',
        details: `Total duration: ${execution.total_duration.toFixed(1)}s, Cost: $${execution.total_cost.toFixed(3)}`
      });
    }

    // Add execution failure event
    if (execution?.completed_at && execution.status === 'failed') {
      events.push({
        id: 'execution-failed',
        timestamp: execution.completed_at,
        agentId: 'system',
        agentName: 'System',
        status: 'failed',
        action: 'Execution Failed ❌',
        type: 'error',
        details: execution.error_message || 'Unknown error occurred'
      });
    }

    // Sort by timestamp
    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const timelineEvents = useMemo(() => {
    console.log('🔄 Timeline regenerating events...', {
      execution_agent_results: execution?.agent_results?.length || 0,
      workflow_nodes: workflow?.nodes?.length || 0,
      pending_interventions: pendingInterventions.length
    });
    return generateTimelineEvents();
  }, [execution, workflow, pendingInterventions]);

  // Auto-scroll to latest events and agent results
  useEffect(() => {
    if (lastEventRef.current && timelineEvents.length > 0) {
      lastEventRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [timelineEvents.length]);

  // Auto-scroll when new agent results are added
  useEffect(() => {
    if (execution?.agent_results && execution.agent_results.length > 0) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        const agentResultsSection = document.querySelector('[data-agent-results]');
        if (agentResultsSection) {
          agentResultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [execution?.agent_results?.length]);

  const getEventIcon = (event: TimelineEvent) => {
    switch (event.type) {
      case 'start':
        return event.agentId === 'system' ? 
          <Play className="w-4 h-4 text-blue-600" /> : 
          <Bot className="w-4 h-4 text-blue-600" />;
      case 'progress':
        return <RefreshCw className="w-4 h-4 text-yellow-600 animate-spin" />;
      case 'intervention':
        return <AlertTriangle className="w-4 h-4 text-orange-600 animate-pulse" />;
      case 'complete':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getEventColor = (event: TimelineEvent) => {
    switch (event.status) {
      case 'running': return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20';
      case 'waiting_intervention': return 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/20';
      case 'completed': return 'border-l-green-500 bg-green-50 dark:bg-green-950/20';
      case 'failed': return 'border-l-red-500 bg-red-50 dark:bg-red-950/20';
      default: return 'border-l-gray-300 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  const getStatusBadge = (event: TimelineEvent) => {
    switch (event.status) {
      case 'running':
        return <Badge variant="secondary" className="text-blue-600 bg-blue-100">🟢 Running</Badge>;
      case 'waiting_intervention':
        return <Badge variant="destructive" className="animate-pulse">🟡 WAITING ⚠️</Badge>;
      case 'completed':
        return <Badge variant="default" className="text-green-600 bg-green-100">⚪ Done</Badge>;
      case 'failed':
        return <Badge variant="destructive">🔴 Failed</Badge>;
      default:
        return <Badge variant="outline">⚫ Pending</Badge>;
    }
  };

  const handleEventClick = (event: TimelineEvent) => {
    if (event.agentId !== 'system') {
      onAgentSelect(event.agentId);
    }
  };

  const getInterventionForAgent = (agentId: string) => {
    return pendingInterventions.find(i => i.agent_id === agentId);
  };

  if (timelineEvents.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Timeline / Event Feed</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4" />
            <p>No execution events yet. Start a template execution to see the timeline.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Timeline Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Timeline / Event Feed</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {timelineEvents.length} events
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div ref={scrollAreaRef} className="space-y-3">
              {timelineEvents.map((event, index) => {
                const isSelected = event.agentId === selectedAgentId;
                const intervention = getInterventionForAgent(event.agentId);
                const isLastEvent = index === timelineEvents.length - 1;
                
                return (
                  <div
                    key={event.id}
                    ref={isLastEvent ? lastEventRef : undefined}
                    className={`
                      flex items-start gap-3 p-3 rounded-lg border-l-4 cursor-pointer transition-all
                      ${getEventColor(event)}
                      ${isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
                      ${event.agentId !== 'system' ? 'hover:shadow-md' : ''}
                    `}
                    onClick={() => handleEventClick(event)}
                  >
                    {/* Timeline Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getEventIcon(event)}
                    </div>

                    {/* Event Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">
                            [{new Date(event.timestamp).toLocaleTimeString()}] {event.agentName}
                          </span>
                          {getStatusBadge(event)}
                        </div>
                      </div>
                      
                      {/* Inline Intervention Controls */}
                      {event.status === 'waiting_intervention' && intervention ? (
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-orange-800 dark:text-orange-300">
                            ⚠️ {intervention.intervention_type === 'approval' ? 'Approval Required' : intervention.intervention_type}
                          </div>
                          
                          {/* Intervention Context */}
                          <div className="text-xs text-orange-700 dark:text-orange-400">
                            {intervention.intervention_point === 'before_execution' && '🚀 Agent wants to start execution'}
                            {intervention.intervention_point === 'after_execution' && '✅ Agent completed - approve results?'}
                            {intervention.intervention_point === 'on_error' && '🔄 Error occurred - retry or skip?'}
                          </div>
                          
                          {/* Quick Action Buttons */}
                          <div className="flex items-center space-x-2 pt-1">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onInterventionSubmit({
                                  intervention_id: intervention.intervention_id,
                                  action: 'approve',
                                  human_feedback: 'Approved from timeline'
                                });
                              }}
                              className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700 text-white"
                            >
                              ✓ Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                onInterventionSubmit({
                                  intervention_id: intervention.intervention_id,
                                  action: 'reject',
                                  human_feedback: 'Rejected from timeline'
                                });
                              }}
                              className="h-7 px-3 text-xs border-red-500 text-red-600 hover:bg-red-50"
                            >
                              ✗ Reject
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                onResolveIntervention(intervention.intervention_id);
                              }}
                              className="h-7 px-3 text-xs"
                            >
                              📋 Details
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                            {event.action}
                          </div>
                          
                          {event.details && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {event.details}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Agent Result Cards - Show for completed agents */}
      {execution?.agent_results && execution.agent_results.length > 0 && (
        <PrintProvider>
          <div className="space-y-4" data-agent-results>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Agent Results
            </h3>
            {execution.agent_results.map((agentResult) => (
              <CollapsibleAgentCard
                key={agentResult.agent_id}
                agentResult={agentResult}
                defaultExpanded={false}
              />
            ))}
          </div>
        </PrintProvider>
      )}
    </div>
  );
}

export default LiveAgentTimeline;
