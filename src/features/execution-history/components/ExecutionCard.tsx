/**
 * ExecutionCard Component
 * 
 * Beautiful execution card matching TemplateCard design exactly
 */

import { useNavigate } from 'react-router-dom';
import { 
  Clock,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';

import type { ExecutionResult } from '../types';

interface ExecutionCardProps {
  execution: ExecutionResult;
}

// Status configurations matching template card style
const STATUS_CONFIG = {
  completed: {
    icon: CheckCircle2,
    color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
    iconColor: 'text-green-600 dark:text-green-400'
  },
  failed: {
    icon: XCircle,
    color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
    iconColor: 'text-red-600 dark:text-red-400'
  },
  running: {
    icon: RefreshCw,
    color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400'
  },
  pending: {
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
    iconColor: 'text-yellow-600 dark:text-yellow-400'
  },
  cancelled: {
    icon: AlertCircle,
    color: 'bg-muted text-muted-foreground border-border',
    iconColor: 'text-muted-foreground'
  }
} as const;

export function ExecutionCard({ execution }: ExecutionCardProps) {
  const navigate = useNavigate();
  const statusConfig = STATUS_CONFIG[execution.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  const handleViewDetails = () => {
    navigate(`/execution-history/${execution.execution_id}`);
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };

  const formatCost = (cost: number) => {
    if (cost === 0) return '$0.00';
    if (cost < 0.01) return '<$0.01';
    return `$${cost.toFixed(3)}`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  // Calculate success rate for agent results
  const successfulAgents = execution.agent_results.filter(result => result.success).length;
  const totalAgents = execution.agent_results.length;
  const agentSuccessRate = totalAgents > 0 ? Math.round((successfulAgents / totalAgents) * 100) : 0;

  return (
    <Card className="group h-full flex flex-col transition-all duration-200 hover:shadow-lg hover:shadow-blue-100 dark:hover:shadow-blue-900/20 hover:-translate-y-1 border hover:border-blue-300 dark:hover:border-blue-700">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`${statusConfig.color} font-medium text-xs px-2 py-1 transition-colors`}>
                <StatusIcon className={`w-3 h-3 mr-1 ${statusConfig.iconColor} ${execution.status === 'running' ? 'animate-spin' : ''}`} />
                {execution.status.charAt(0).toUpperCase() + execution.status.slice(1)}
              </Badge>
              
              {execution.overall_confidence > 0 && (
                <Badge 
                  variant="secondary"
                  className={`text-xs px-2 py-1 ${
                    execution.overall_confidence >= 0.8 
                      ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' 
                      : execution.overall_confidence >= 0.6
                      ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
                      : 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                  }`}
                >
                  {Math.round(execution.overall_confidence * 100)}% confidence
                </Badge>
              )}
            </div>
            
            <CardTitle className="text-lg font-semibold line-clamp-1 text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {execution.template_name}
            </CardTitle>
            <CardDescription className="line-clamp-1 mt-1 text-sm text-muted-foreground">
              {execution.query}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-2 space-y-3">
        {/* Progress Bar (for running executions) - Compact */}
        {(execution.status === 'running' || execution.status === 'pending') && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{execution.progress_percentage.toFixed(1)}%</span>
            </div>
            <Progress value={execution.progress_percentage} className="h-1.5" />
          </div>
        )}

        {/* Performance Metrics - Same as Template Card */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
            <span className="font-medium">
              {execution.total_duration ? formatDuration(execution.total_duration) : 'N/A'}
            </span>
            <span>duration</span>
          </div>
          
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <DollarSign className="w-3.5 h-3.5 text-green-500 dark:text-green-400" />
            <span className="font-medium">{formatCost(execution.total_cost)}</span>
            <span>cost</span>
          </div>
          
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            <span className="font-medium">{successfulAgents}/{totalAgents}</span>
            <span>agents</span>
          </div>
          
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="w-3.5 h-3.5 text-center text-purple-500 dark:text-purple-400 font-bold text-xs">T</span>
            <span className="font-medium">{execution.total_tokens > 0 ? execution.total_tokens.toLocaleString() : '0'}</span>
            <span>tokens</span>
          </div>
        </div>

        {/* Compact Agent Results & Error - Combined */}
        <div className="space-y-2">
          {/* Agent Success Rate - Compact */}
          {execution.agent_results.length > 0 && agentSuccessRate < 100 && (
            <div className="text-xs text-muted-foreground">
              Agent success: {agentSuccessRate}%
            </div>
          )}
          
          {/* Error Message - Compact */}
          {execution.error_message && (
            <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded border border-red-200 dark:border-red-800">
              <span className="font-medium">Error:</span> <span className="line-clamp-1">{execution.error_message}</span>
            </div>
          )}
        </div>

        {/* Timestamp - Moved to bottom like Template Card */}
        <div className="text-xs text-muted-foreground border-t pt-2">
          Started {formatDateTime(execution.started_at)}
        </div>
      </CardContent>

      <CardFooter className="pt-2 border-t bg-muted/50 mt-auto">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleViewDetails}
          className="w-full hover:bg-blue-50/50 dark:hover:bg-blue-900/10 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}

export default ExecutionCard;
