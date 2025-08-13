/**
 * Live Execution Monitor Component
 * 
 * Displays live executions using ExecutionCard pattern with real-time controls
 */

import { Link } from 'react-router-dom';
import { 
  Activity,
  Clock,
  DollarSign,
  Pause,
  Play,
  Square,
  Eye,
  RefreshCw
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';

import type { LiveExecutionMonitorProps, LiveExecution, ExecutionStatus } from '../types';

interface ExecutionStatusBadgeProps {
  status: ExecutionStatus;
}

function ExecutionStatusBadge({ status }: ExecutionStatusBadgeProps) {
  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pending' },
    running: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Running' },
    completed: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Completed' },
    failed: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Failed' },
    cancelled: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Cancelled' },
    paused: { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Paused' }
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <Badge className={`${config.color} font-medium text-xs`}>
      {config.label}
    </Badge>
  );
}

interface LiveExecutionCardProps {
  execution: LiveExecution;
  onStop: (executionId: string) => Promise<void>;
  onPause: (executionId: string) => Promise<void>;
  onResume: (executionId: string) => Promise<void>;
  onViewDetails: (executionId: string) => void;
}

function LiveExecutionCard({ execution, onStop, onPause, onResume, onViewDetails }: LiveExecutionCardProps) {
  const formatCost = (cost: number) => {
    if (cost === 0) return '$0.00';
    if (cost < 0.01) return '<$0.01';
    return `$${cost.toFixed(3)}`;
  };

  const formatDuration = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds}s`;
    const minutes = Math.floor(diffSeconds / 60);
    const seconds = diffSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  const getEstimatedCompletion = () => {
    if (execution.estimatedCompletion) {
      const estimated = new Date(execution.estimatedCompletion);
      const now = new Date();
      const diffMs = estimated.getTime() - now.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      if (diffMinutes <= 0) return 'Soon';
      if (diffMinutes < 60) return `~${diffMinutes}m`;
      const hours = Math.floor(diffMinutes / 60);
      return `~${hours}h ${diffMinutes % 60}m`;
    }
    return 'Unknown';
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold truncate mb-1">
              {execution.templateName}
            </CardTitle>
            <div className="flex items-center gap-2 mb-2">
              <ExecutionStatusBadge status={execution.status} />
              {execution.currentAgent && (
                <Badge variant="outline" className="text-xs">
                  {execution.currentAgent}
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(execution.id)}
            className="flex-shrink-0"
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress Bar */}
        {execution.status === 'running' && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Progress</span>
              <span>{execution.progress.toFixed(1)}%</span>
            </div>
            <Progress value={execution.progress} className="h-2" />
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-gray-500" />
            <span className="text-gray-600">{formatDuration(execution.startedAt)}</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-gray-500" />
            <span className="text-gray-600">{formatCost(execution.costSoFar)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-gray-500" />
            <span className="text-gray-600">{execution.tokensUsed.toLocaleString()}</span>
          </div>
        </div>

        {/* Estimated Completion */}
        {execution.status === 'running' && execution.estimatedCompletion && (
          <div className="text-xs text-gray-500 mb-4">
            Estimated completion: {getEstimatedCompletion()}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {execution.status === 'running' && execution.canPause && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPause(execution.id)}
              className="flex-1"
            >
              <Pause className="w-3 h-3 mr-1" />
              Pause
            </Button>
          )}
          
          {execution.status === 'paused' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onResume(execution.id)}
              className="flex-1"
            >
              <Play className="w-3 h-3 mr-1" />
              Resume
            </Button>
          )}

          {(execution.status === 'running' || execution.status === 'paused') && execution.canCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStop(execution.id)}
              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Square className="w-3 h-3 mr-1" />
              Stop
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            asChild
            className="flex-shrink-0"
          >
            <Link to={`/executions/${execution.id}`}>
              <Eye className="w-3 h-3 mr-1" />
              Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function LiveExecutionMonitor({ 
  executions, 
  isLoading, 
  onStop, 
  onPause, 
  onResume, 
  onViewDetails 
}: LiveExecutionMonitorProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Live Executions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
                    </div>
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="h-2 bg-gray-200 rounded animate-pulse" />
                  <div className="flex gap-2">
                    <div className="h-8 bg-gray-200 rounded flex-1 animate-pulse" />
                    <div className="h-8 bg-gray-200 rounded flex-1 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Live Executions
            {executions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {executions.length}
              </Badge>
            )}
          </CardTitle>
          {executions.some(e => e.status === 'running') && (
            <div className="flex items-center gap-1 text-sm text-green-600">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
              Live
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {executions.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Executions</h3>
            <p className="text-gray-500 mb-4">
              All executions have completed. Start a new execution to see live monitoring.
            </p>
            <Button asChild>
              <Link to="/templates">
                Browse Templates
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {executions.map((execution) => (
              <LiveExecutionCard
                key={execution.id}
                execution={execution}
                onStop={onStop}
                onPause={onPause}
                onResume={onResume}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default LiveExecutionMonitor;
