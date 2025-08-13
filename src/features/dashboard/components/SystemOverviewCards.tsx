/**
 * System Overview Cards Component
 * 
 * Displays key system metrics in card format, reusing ExecutionMetricsOverview pattern
 */

import React from 'react';
import { 
  Activity,
  CheckCircle2,
  DollarSign,
  Server,
  TrendingUp,
  Users,
  Zap,
  AlertTriangle
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';

import type { SystemOverviewCardsProps, SystemHealthStatus } from '../types';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  onClick?: () => void;
}

function MetricCard({ title, value, change, trend, icon: Icon, color = 'blue', onClick }: MetricCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    green: 'text-green-600 bg-green-50 border-green-200',
    red: 'text-red-600 bg-red-50 border-red-200',
    yellow: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200'
  };

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-muted-foreground'
  };

  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-md ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground mb-1">
          {typeof value === 'number' && value > 1000 
            ? value.toLocaleString() 
            : value
          }
        </div>
        {change && trend && (
          <div className={`text-xs ${trendColors[trend]} flex items-center gap-1`}>
            {trend === 'up' && <TrendingUp className="w-3 h-3" />}
            {trend === 'down' && <TrendingUp className="w-3 h-3 rotate-180" />}
            <span>{change}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SystemHealthBadge({ status }: { status: SystemHealthStatus }) {
  const statusConfig = {
    healthy: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Healthy' },
    warning: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Warning' },
    critical: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Critical' },
    unknown: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Unknown' }
  };

  const config = statusConfig[status] || statusConfig.unknown;

  return (
    <Badge className={`${config.color} font-medium`}>
      {config.label}
    </Badge>
  );
}

export function SystemOverviewCards({ data, isLoading }: SystemOverviewCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
              <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2 animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="col-span-full">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">System overview data unavailable</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate trends (simplified - in real app you'd compare with previous data)
  const getTrend = (value: number): 'up' | 'down' | 'neutral' => {
    if (!value || isNaN(value)) return 'neutral';
    if (value > 80) return 'up';
    if (value < 50) return 'down';
    return 'neutral';
  };

  const formatCurrency = (value: number) => {
    if (!value || isNaN(value) || value === 0) return '$0.00';
    if (value < 0.01) return '<$0.01';
    return `$${value.toFixed(2)}`;
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0s';
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };

  // Safe number formatting with defaults
  const safeNumber = (value: number | undefined, defaultValue: number = 0): number => {
    return value !== undefined && !isNaN(value) ? value : defaultValue;
  };

  const safePercentage = (value: number | undefined): string => {
    const num = safeNumber(value);
    return `${num.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Executions"
          value={safeNumber(data.activeExecutions)}
          change={safeNumber(data.activeExecutions) > 0 ? `${safeNumber(data.activeExecutions)} running` : 'None active'}
          trend={safeNumber(data.activeExecutions) > 0 ? 'up' : 'neutral'}
          icon={Activity}
          color="blue"
        />

        <MetricCard
          title="Success Rate"
          value={safePercentage(data.successRate)}
          change={`${getTrend(safeNumber(data.successRate))} performance`}
          trend={getTrend(safeNumber(data.successRate))}
          icon={CheckCircle2}
          color={safeNumber(data.successRate) > 80 ? 'green' : safeNumber(data.successRate) > 60 ? 'yellow' : 'red'}
        />

        <MetricCard
          title="Total Templates"
          value={safeNumber(data.totalTemplates)}
          change={`${safeNumber(data.totalTemplates)} available`}
          trend="neutral"
          icon={Server}
          color="purple"
        />

        <MetricCard
          title="Cost Efficiency"
          value={safePercentage(data.costEfficiency)}
          change={`${getTrend(safeNumber(data.costEfficiency))} efficiency`}
          trend={getTrend(safeNumber(data.costEfficiency))}
          icon={DollarSign}
          color={safeNumber(data.costEfficiency) > 80 ? 'green' : safeNumber(data.costEfficiency) > 60 ? 'yellow' : 'red'}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Activity
            </CardTitle>
            <Users className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Executions</span>
                <span className="font-medium text-foreground">{safeNumber(data.totalExecutionsToday)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Cost</span>
                <span className="font-medium text-foreground">{formatCurrency(safeNumber(data.totalCostToday))}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Performance
            </CardTitle>
            <Zap className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg Duration</span>
                <span className="font-medium text-foreground">{formatDuration(safeNumber(data.averageExecutionTime))}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Efficiency</span>
                <span className="font-medium text-foreground">{safePercentage(data.costEfficiency)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              System Health
            </CardTitle>
            <Server className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <SystemHealthBadge status={data.systemHealth} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default SystemOverviewCards;
