/**
 * ExecutionMetricsOverview Component
 * 
 * Beautiful metrics overview matching TemplateMetricsOverview exactly
 */

import { 
  Clock, 
  DollarSign, 
  Target, 
  CheckCircle2,
  TrendingUp,
  Zap
} from 'lucide-react';

import { Card } from '../../../components/ui/card';

import type { ExecutionResult } from '../types';

interface ExecutionMetricsOverviewProps {
  execution: ExecutionResult;
}

export function ExecutionMetricsOverview({ execution }: ExecutionMetricsOverviewProps) {
  const formatCost = (cost: number) => {
    if (cost === 0) return '$0.00';
    if (cost < 0.01) return '<$0.01';
    return `$${cost.toFixed(3)}`;
  };

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return '0s';
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };

  const formatTokens = (tokens: number) => {
    if (tokens === 0) return '0';
    if (tokens < 1000) return tokens.toString();
    if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`;
    return `${(tokens / 1000000).toFixed(1)}M`;
  };

  // Calculate agent success rate
  const totalAgents = execution.agent_results.length;
  const successfulAgents = execution.agent_results.filter(agent => agent.success).length;
  const successRate = totalAgents > 0 ? (successfulAgents / totalAgents) * 100 : 0;

  const metrics = [
    {
      title: 'Duration',
      value: formatDuration(execution.total_duration),
      icon: Clock,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
      description: 'Total execution time'
    },
    {
      title: 'Cost',
      value: formatCost(execution.total_cost),
      icon: DollarSign,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      description: 'Total execution cost'
    },
    {
      title: 'Success Rate',
      value: `${successRate.toFixed(0)}%`,
      icon: CheckCircle2,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      description: `${successfulAgents}/${totalAgents} agents succeeded`
    },
    {
      title: 'Confidence',
      value: execution.overall_confidence > 0 ? `${Math.round(execution.overall_confidence * 100)}%` : 'N/A',
      icon: Target,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
      description: 'Overall confidence score'
    }
  ];

  // Additional metrics if available
  const additionalMetrics = [];
  
  if (execution.total_tokens > 0) {
    additionalMetrics.push({
      title: 'Tokens',
      value: formatTokens(execution.total_tokens),
      icon: TrendingUp,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      borderColor: 'border-indigo-200 dark:border-indigo-800',
      description: 'Total tokens used'
    });
  }

  if (execution.total_tavily_credits > 0) {
    additionalMetrics.push({
      title: 'Tavily Credits',
      value: execution.total_tavily_credits.toString(),
      icon: Zap,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      description: 'Tavily API credits used'
    });
  }

  const allMetrics = [...metrics, ...additionalMetrics];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {allMetrics.map((metric, index) => {
        const Icon = metric.icon;
        
        return (
          <Card key={index} className={`border ${metric.borderColor} hover:shadow-md transition-shadow p-3`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${metric.bgColor}`}>
                <Icon className={`h-3 w-3 ${metric.color}`} />
              </div>
              <span className="text-xs font-medium text-muted-foreground truncate">
                {metric.title}
              </span>
            </div>
            <div className="text-lg font-bold text-foreground mb-1">
              {metric.value}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {metric.description}
            </p>
          </Card>
        );
      })}
    </div>
  );
}

export default ExecutionMetricsOverview;
