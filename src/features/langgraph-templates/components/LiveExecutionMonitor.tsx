/**
 * LiveExecutionMonitor Component
 * 
 * Clean, focused live execution view without workflow diagram clutter.
 * Shows real-time agent progress, metrics, and current status.
 */

import { Activity, Clock, DollarSign, Zap, Target, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import type { WorkflowVisualization } from '../hooks/useTemplateExecution';
import type { ExecutionResult } from '../services/execution.service';

interface LiveExecutionMonitorProps {
  execution: ExecutionResult | null;
  workflow: WorkflowVisualization | null;
  isExecuting: boolean;
  className?: string;
}

export function LiveExecutionMonitor({ execution, workflow, isExecuting, className }: LiveExecutionMonitorProps) {
  if (!execution && !workflow) {
    return (
      <div className={`text-center py-12 ${className || ''}`}>
        <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">No Active Execution</h3>
        <p className="text-sm text-muted-foreground">Start a template execution to see live monitoring data.</p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'waiting_intervention': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'waiting_intervention': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const runningAgents = workflow?.nodes.filter(node => node.status === 'running') || [];
  const completedAgents = workflow?.nodes.filter(node => node.status === 'completed') || [];
  const failedAgents = workflow?.nodes.filter(node => node.status === 'failed') || [];
  const interventionAgents = workflow?.nodes.filter(node => node.status === 'waiting_intervention') || [];

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Execution Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Live Execution Status</span>
            {isExecuting && (
              <Badge variant="secondary" className="ml-2 animate-pulse">
                Active
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Real-time monitoring of template execution progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          {execution && (
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{execution.progress_percentage?.toFixed(1) || 0}%</span>
                </div>
                <Progress value={execution.progress_percentage || 0} className="h-2" />
              </div>

              {/* Current Status */}
              <div className="flex items-center space-x-2">
                {getStatusIcon(execution.status)}
                <span className="font-medium capitalize">{execution.status.replace('_', ' ')}</span>
                {execution.current_agent && (
                  <Badge variant="outline" className="ml-2">
                    Current: {execution.current_agent}
                  </Badge>
                )}
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span>Cost</span>
                  </div>
                  <div className="text-lg font-semibold">${execution.total_cost?.toFixed(4) || '0.0000'}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground mb-1">
                    <Zap className="h-4 w-4" />
                    <span>Tokens</span>
                  </div>
                  <div className="text-lg font-semibold">{execution.total_tokens?.toLocaleString() || '0'}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground mb-1">
                    <Clock className="h-4 w-4" />
                    <span>Duration</span>
                  </div>
                  <div className="text-lg font-semibold">{execution.total_duration?.toFixed(1) || '0.0'}s</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground mb-1">
                    <Target className="h-4 w-4" />
                    <span>Confidence</span>
                  </div>
                  <div className="text-lg font-semibold">{execution.overall_confidence?.toFixed(1) || '0.0'}%</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agent Status Summary */}
      {workflow && (
        <Card>
          <CardHeader>
            <CardTitle>Agent Status Summary</CardTitle>
            <CardDescription>
              Current status of all agents in the workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Running Agents */}
              <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                  <span className="font-medium text-blue-800 dark:text-blue-300">Running</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">{runningAgents.length}</div>
                {runningAgents.length > 0 && (
                  <div className="text-xs text-blue-600 mt-1">
                    {runningAgents.map(agent => agent.name).join(', ')}
                  </div>
                )}
              </div>

              {/* Completed Agents */}
              <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800 dark:text-green-300">Completed</span>
                </div>
                <div className="text-2xl font-bold text-green-600">{completedAgents.length}</div>
              </div>

              {/* Failed Agents */}
              <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-800 dark:text-red-300">Failed</span>
                </div>
                <div className="text-2xl font-bold text-red-600">{failedAgents.length}</div>
                {failedAgents.length > 0 && (
                  <div className="text-xs text-red-600 mt-1">
                    {failedAgents.map(agent => agent.name).join(', ')}
                  </div>
                )}
              </div>

              {/* Intervention Agents */}
              <div className="text-center p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-orange-800 dark:text-orange-300">Intervention</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">{interventionAgents.length}</div>
                {interventionAgents.length > 0 && (
                  <div className="text-xs text-orange-600 mt-1">
                    {interventionAgents.map(agent => agent.name).join(', ')}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {workflow && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest agent completions and status changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workflow.nodes
                .filter(node => node.status !== 'pending')
                .sort((a, b) => {
                  const timeA = new Date(a.completedAt || a.startedAt || '').getTime();
                  const timeB = new Date(b.completedAt || b.startedAt || '').getTime();
                  return timeB - timeA;
                })
                .slice(0, 5)
                .map((node) => (
                  <div key={node.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                    {getStatusIcon(node.status)}
                    <div className="flex-1">
                      <div className="font-medium">{node.name}</div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {node.status.replace('_', ' ')}
                        {node.completedAt && (
                          <span className="ml-2">
                            • {new Date(node.completedAt).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(node.status)}`}>
                      {node.status.replace('_', ' ')}
                    </div>
                  </div>
                ))}
              
              {workflow.nodes.filter(node => node.status !== 'pending').length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2" />
                  <p>No activity yet. Execution will begin shortly.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default LiveExecutionMonitor;
