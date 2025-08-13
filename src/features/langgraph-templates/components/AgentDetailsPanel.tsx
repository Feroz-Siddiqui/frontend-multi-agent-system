/**
 * AgentDetailsPanel Component
 * 
 * Right-side panel showing selected agent details with HITL forms at the top
 */

import { useEffect, useRef } from 'react';
import { 
  Bot, 
  Clock, 
  DollarSign, 
  Zap, 
  Target, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { ScrollArea } from '../../../components/ui/scroll-area';
import type { WorkflowVisualization } from '../hooks/useTemplateExecution';
import type { InterventionRequest, ExecutionResult } from '../services/execution.service';

interface AgentDetailsPanelProps {
  selectedAgentId: string | null;
  workflow: WorkflowVisualization | null;
  pendingInterventions: InterventionRequest[];
  execution?: ExecutionResult | null;
  className?: string;
}

export function AgentDetailsPanel({ 
  selectedAgentId, 
  workflow, 
  pendingInterventions,
  execution,
  className 
}: AgentDetailsPanelProps) {
  // Find the selected agent
  const selectedAgent = workflow?.nodes.find(node => node.id === selectedAgentId);
  
  // Find intervention for this agent
  const agentIntervention = pendingInterventions.find(i => i.agent_id === selectedAgentId);

  // Ref for auto-scrolling to agent results
  const agentResultsRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to agent results when they appear
  useEffect(() => {
    if (selectedAgent?.status === 'completed' && execution?.agent_results && selectedAgentId) {
      const agentResult = execution.agent_results.find(r => r.agent_id === selectedAgentId);
      if (agentResult && agentResult.result && agentResultsRef.current) {
        // Small delay to ensure the DOM is updated
        setTimeout(() => {
          agentResultsRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }, 100);
      }
    }
  }, [selectedAgent?.status, execution?.agent_results, selectedAgentId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'waiting_intervention': return <AlertTriangle className="h-4 w-4 text-orange-600 animate-pulse" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'waiting_intervention': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Generate logs for the selected agent or system-level logs
  const generateLogs = () => {
    const logs: Array<{
      timestamp: string;
      level: 'info' | 'warning' | 'error' | 'success';
      message: string;
      details: string;
    }> = [];
    
    if (selectedAgent) {
      // Agent-specific logs
      if (selectedAgent.startedAt) {
        logs.push({
          timestamp: selectedAgent.startedAt,
          level: 'info' as const,
          message: `Agent ${selectedAgent.name} started execution`,
          details: `Agent Type: ${selectedAgent.type}`
        });
      }

      if (selectedAgent.status === 'running') {
        logs.push({
          timestamp: new Date().toISOString(),
          level: 'info' as const,
          message: `Processing... (${selectedAgent.progress.toFixed(0)}% complete)`,
          details: `Current operation in progress`
        });
      }

      if (selectedAgent.status === 'waiting_intervention') {
        logs.push({
          timestamp: agentIntervention?.requested_at || new Date().toISOString(),
          level: 'warning' as const,
          message: 'Waiting for human intervention',
          details: agentIntervention?.intervention_type || 'Human input required'
        });
      }

      if (selectedAgent.status === 'completed' && selectedAgent.completedAt) {
        logs.push({
          timestamp: selectedAgent.completedAt,
          level: 'success' as const,
          message: 'Agent execution completed successfully',
          details: `Duration: ${selectedAgent.duration.toFixed(1)}s, Cost: $${selectedAgent.cost.toFixed(3)}`
        });
      }

      if (selectedAgent.status === 'failed' && selectedAgent.completedAt) {
        logs.push({
          timestamp: selectedAgent.completedAt,
          level: 'error' as const,
          message: 'Agent execution failed',
          details: selectedAgent.error || 'Unknown error occurred'
        });
      }
    } else if (workflow) {
      // System-level logs showing all agents when no specific agent is selected
      workflow.nodes.forEach(node => {
        if (node.startedAt) {
          logs.push({
            timestamp: node.startedAt,
            level: 'info' as const,
            message: `Agent ${node.name} started execution`,
            details: `Agent Type: ${node.type}`
          });
        }

        if (node.status === 'completed' && node.completedAt) {
          logs.push({
            timestamp: node.completedAt,
            level: 'success' as const,
            message: `Agent ${node.name} execution completed successfully`,
            details: `Duration: ${node.duration.toFixed(1)}s, Cost: $${node.cost.toFixed(3)}`
          });
        }

        if (node.status === 'failed' && node.completedAt) {
          logs.push({
            timestamp: node.completedAt,
            level: 'error' as const,
            message: `Agent ${node.name} execution failed`,
            details: node.error || 'Unknown error occurred'
          });
        }
      });
      
      // Add system execution logs
      if (workflow.nodes.length > 0) {
        const firstStartTime = workflow.nodes
          .filter(n => n.startedAt)
          .map(n => n.startedAt!)
          .sort()[0];
        
        if (firstStartTime) {
          logs.push({
            timestamp: firstStartTime,
            level: 'info' as const,
            message: 'Multi-agent execution started',
            details: `${workflow.nodes.length} agents in workflow`
          });
        }
        
        // Check if all agents are completed
        const completedNodes = workflow.nodes.filter(n => n.status === 'completed');
        const failedNodes = workflow.nodes.filter(n => n.status === 'failed');
        
        if (completedNodes.length + failedNodes.length === workflow.nodes.length) {
          const lastCompletionTime = [...completedNodes, ...failedNodes]
            .filter(n => n.completedAt)
            .map(n => n.completedAt!)
            .sort()
            .pop();
          
          if (lastCompletionTime) {
            const totalCost = workflow.nodes.reduce((sum, n) => sum + n.cost, 0);
            const totalDuration = workflow.nodes.reduce((max, n) => Math.max(max, n.duration), 0);
            
            logs.push({
              timestamp: lastCompletionTime,
              level: failedNodes.length > 0 ? 'warning' as const : 'success' as const,
              message: failedNodes.length > 0 
                ? `Execution completed with ${failedNodes.length} failed agents`
                : 'All agents completed successfully',
              details: `Total Cost: $${totalCost.toFixed(3)}, Max Duration: ${totalDuration.toFixed(1)}s`
            });
          }
        }
      }
    }

    return logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  if (!selectedAgentId) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5" />
            <span>Agent Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-4" />
            <p>Select an agent from the timeline to view details</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!selectedAgent) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5" />
            <span>Agent Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <XCircle className="h-12 w-12 mx-auto mb-4" />
            <p>Agent not found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const agentLogs = generateLogs();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5" />
            <span>{selectedAgent.name} Details</span>
          </div>
          <Badge className={getStatusColor(selectedAgent.status)}>
            {getStatusIcon(selectedAgent.status)}
            <span className="ml-1 capitalize">{selectedAgent.status.replace('_', ' ')}</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Agent Status Overview */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Status Overview</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Type:</span>
              <span className="font-medium">{selectedAgent.type}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Status:</span>
              <span className="font-medium capitalize">{selectedAgent.status.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        {selectedAgent.status !== 'pending' && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Performance Metrics</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center justify-center space-x-1 text-xs text-gray-500 mb-1">
                  <DollarSign className="h-3 w-3" />
                  <span>Cost</span>
                </div>
                <div className="text-sm font-semibold">${selectedAgent.cost.toFixed(4)}</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center justify-center space-x-1 text-xs text-gray-500 mb-1">
                  <Zap className="h-3 w-3" />
                  <span>Tokens</span>
                </div>
                <div className="text-sm font-semibold">{selectedAgent.tokens.toLocaleString()}</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center justify-center space-x-1 text-xs text-gray-500 mb-1">
                  <Clock className="h-3 w-3" />
                  <span>Duration</span>
                </div>
                <div className="text-sm font-semibold">{selectedAgent.duration.toFixed(1)}s</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center justify-center space-x-1 text-xs text-gray-500 mb-1">
                  <Target className="h-3 w-3" />
                  <span>Confidence</span>
                </div>
                <div className="text-sm font-semibold">{selectedAgent.confidence.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar for Running Agents */}
        {selectedAgent.status === 'running' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{selectedAgent.progress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${selectedAgent.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Agent Results - Show when agent is completed */}
        {selectedAgent.status === 'completed' && execution?.agent_results && (
          <div ref={agentResultsRef} className="space-y-3">
            <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Agent Results</h4>
            {(() => {
              const agentResult = execution.agent_results.find(r => r.agent_id === selectedAgentId);
              if (!agentResult || !agentResult.result) return null;
              
              return (
                <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-900 space-y-3">
                  {agentResult.result.llm_response ? (
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400">LLM Response</h5>
                      <div className="text-sm bg-white dark:bg-gray-800 p-2 rounded border max-h-32 overflow-y-auto">
                        {(() => {
                          const response = agentResult.result.llm_response;
                          if (typeof response === 'string') {
                            return response.substring(0, 200) + (response.length > 200 ? '...' : '');
                          }
                          return JSON.stringify(response).substring(0, 200) + '...';
                        })()}
                      </div>
                    </div>
                  ) : null}
                  
                  {agentResult.result.tavily_data && typeof agentResult.result.tavily_data === 'object' && Object.keys(agentResult.result.tavily_data as Record<string, unknown>).length > 0 ? (
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400">Tavily Data</h5>
                      <div className="text-sm bg-white dark:bg-gray-800 p-2 rounded border max-h-32 overflow-y-auto">
                        {JSON.stringify(agentResult.result.tavily_data, null, 2).substring(0, 200)}...
                      </div>
                    </div>
                  ) : null}
                  
                  {agentResult.result.key_findings && Array.isArray(agentResult.result.key_findings) && agentResult.result.key_findings.length > 0 ? (
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400">Key Findings</h5>
                      <div className="text-sm space-y-1">
                        {agentResult.result.key_findings.slice(0, 3).map((finding: unknown, index: number) => (
                          <div key={index} className="flex items-start space-x-2">
                            <span className="text-blue-600">•</span>
                            <span>{String(finding)}</span>
                          </div>
                        ))}
                        {agentResult.result.key_findings.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{agentResult.result.key_findings.length - 3} more findings
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })()}
          </div>
        )}

        {/* Agent Logs */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Execution Logs</h4>
          <ScrollArea className="h-[200px] w-full border rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
            <div className="space-y-3">
              {agentLogs.map((log, index) => (
                <div key={index} className="flex items-start space-x-3 text-sm">
                  <div className="flex-shrink-0 mt-0.5">
                    {log.level === 'info' && <Clock className="h-3 w-3 text-blue-600" />}
                    {log.level === 'warning' && <AlertTriangle className="h-3 w-3 text-orange-600" />}
                    {log.level === 'error' && <XCircle className="h-3 w-3 text-red-600" />}
                    {log.level === 'success' && <CheckCircle2 className="h-3 w-3 text-green-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {log.message}
                    </div>
                    {log.details && (
                      <div className="text-xs text-gray-500 mt-1">
                        {log.details}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Timestamps */}
        <div className="space-y-2 text-xs text-gray-500 border-t pt-3">
          {selectedAgent.startedAt && (
            <div className="flex justify-between">
              <span>Started:</span>
              <span>{new Date(selectedAgent.startedAt).toLocaleString()}</span>
            </div>
          )}
          {selectedAgent.completedAt && (
            <div className="flex justify-between">
              <span>Completed:</span>
              <span>{new Date(selectedAgent.completedAt).toLocaleString()}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default AgentDetailsPanel;
