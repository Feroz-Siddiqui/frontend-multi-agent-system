/**
 * ExecutionMetrics Component
 * 
 * Shadcn Cards component for execution metrics display
 */

import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  Clock, 
  Zap,
  TrendingUp 
} from 'lucide-react';
import type { ExecutionMetricsProps } from '../types';

export function ExecutionMetrics({ metrics, isLoading }: ExecutionMetricsProps) {
  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 7 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const {
    total_executions,
    successful_executions,
    failed_executions,
    total_cost,
    total_tokens,
    average_duration,
    success_rate,
  } = metrics;

  // Format functions
  const formatCost = (cost: number) => `$${cost.toFixed(4)}`;
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const metricsData = [
    {
      title: 'Total Executions',
      value: total_executions.toString(),
      description: 'All time executions',
      icon: Activity,
      color: 'text-blue-600',
    },
    {
      title: 'Success Rate',
      value: `${(success_rate * 100).toFixed(1)}%`,
      description: `${successful_executions} successful`,
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      title: 'Failed Executions',
      value: failed_executions.toString(),
      description: 'Total failures',
      icon: XCircle,
      color: 'text-red-600',
    },
    {
      title: 'Total Cost',
      value: formatCost(total_cost),
      description: 'All time spending',
      icon: DollarSign,
      color: 'text-yellow-600',
    },
    {
      title: 'Average Duration',
      value: formatDuration(average_duration),
      description: 'Per execution',
      icon: Clock,
      color: 'text-purple-600',
    },
    {
      title: 'Total Tokens',
      value: formatNumber(total_tokens),
      description: 'Tokens processed',
      icon: Zap,
      color: 'text-orange-600',
    },
    {
      title: 'Efficiency',
      value: `${(total_tokens / Math.max(total_cost * 1000, 1)).toFixed(0)}`,
      description: 'Tokens per $0.001',
      icon: TrendingUp,
      color: 'text-indigo-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metricsData.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metric.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default ExecutionMetrics;
