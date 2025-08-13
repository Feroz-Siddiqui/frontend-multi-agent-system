/**
 * ExecutionDetailHeader Component
 * 
 * Beautiful header for execution detail page matching TemplateDetailHeader exactly
 */

import { 
  RefreshCw, 
  Play, 
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';

import type { ExecutionResult } from '../types';
import { executionHistoryService } from '../services/execution-history.service';
import { usePrintMode } from '../contexts/PrintContext';

interface ExecutionDetailHeaderProps {
  execution: ExecutionResult;
  onRefresh?: () => void;
  onRerun?: () => void;
  isRefreshing?: boolean;
}

// Status configurations matching ExecutionCard
const STATUS_CONFIG = {
  completed: {
    icon: CheckCircle2,
    color: 'bg-green-100 text-green-800 border-green-200',
    iconColor: 'text-green-600'
  },
  failed: {
    icon: XCircle,
    color: 'bg-red-100 text-red-800 border-red-200',
    iconColor: 'text-red-600'
  },
  running: {
    icon: RefreshCw,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    iconColor: 'text-blue-600'
  },
  pending: {
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    iconColor: 'text-yellow-600'
  },
  cancelled: {
    icon: AlertCircle,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    iconColor: 'text-gray-600'
  }
} as const;

export function ExecutionDetailHeader({ 
  execution, 
  onRefresh, 
  onRerun, 
  isRefreshing = false 
}: ExecutionDetailHeaderProps) {
  const { isExporting, setExporting } = usePrintMode();
  const statusConfig = STATUS_CONFIG[execution.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await executionHistoryService.exportExecutionToPDF(execution.execution_id);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      // You could add a toast notification here
    } finally {
      setExporting(false);
    }
  };

  const canRerun = execution.status === 'completed' || execution.status === 'failed' || execution.status === 'cancelled';

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="space-y-3">
              {/* Title and Status */}
              <div className="flex items-center gap-3">
                <Badge className={`${statusConfig.color} font-medium text-sm px-3 py-1`}>
                  <StatusIcon className={`w-4 h-4 mr-2 ${statusConfig.iconColor} ${execution.status === 'running' ? 'animate-spin' : ''}`} />
                  {execution.status.charAt(0).toUpperCase() + execution.status.slice(1)}
                </Badge>
                
                {execution.overall_confidence > 0 && (
                  <Badge 
                    variant="secondary"
                    className={`text-sm px-3 py-1 ${
                      execution.overall_confidence >= 0.8 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : execution.overall_confidence >= 0.6
                        ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {Math.round(execution.overall_confidence * 100)}% confidence
                  </Badge>
                )}
              </div>

              {/* Template Name */}
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-1">
                  {execution.template_name}
                </CardTitle>
                <CardDescription className="text-base text-gray-600 max-w-2xl">
                  {execution.query}
                </CardDescription>
              </div>

              {/* Execution Info */}
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <span>ID:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                    {execution.execution_id}
                  </code>
                </div>
                <div>
                  Started: {formatDateTime(execution.started_at)}
                </div>
                {execution.completed_at && (
                  <div>
                    Completed: {formatDateTime(execution.completed_at)}
                  </div>
                )}
                {execution.total_duration > 0 && (
                  <div>
                    Duration: {formatDuration(execution.total_duration)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {execution.status === 'running' && (
              <Badge variant="secondary" className="animate-pulse">
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Live
              </Badge>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            {canRerun && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRerun}
              >
                <Play className="h-4 w-4 mr-2" />
                Re-run
              </Button>
            )}

            {execution.status === 'completed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={isExporting}
              >
                <Download className={`h-4 w-4 mr-2 ${isExporting ? 'animate-spin' : ''}`} />
                {isExporting ? 'Exporting...' : 'Export PDF'}
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar for Running Executions */}
        {(execution.status === 'running' || execution.status === 'pending') && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{execution.progress_percentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${execution.progress_percentage}%` }}
              />
            </div>
            {execution.current_agent && (
              <p className="text-sm text-gray-500">
                Current agent: <span className="font-medium">{execution.current_agent}</span>
              </p>
            )}
          </div>
        )}

        {/* Error Message */}
        {execution.error_message && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start gap-2">
              <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-red-800">Execution Failed</div>
                <div className="text-sm text-red-700 mt-1">{execution.error_message}</div>
                {execution.failed_agent && (
                  <div className="text-xs text-red-600 mt-1">
                    Failed at agent: {execution.failed_agent}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardHeader>
    </Card>
  );
}

export default ExecutionDetailHeader;
