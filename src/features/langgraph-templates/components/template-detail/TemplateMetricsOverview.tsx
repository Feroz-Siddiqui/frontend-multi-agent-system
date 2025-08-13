import { 
  DollarSign,
  Clock,
  Play,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

import type { Template } from '../../types'
import type { TemplateMetrics } from '../../hooks/useTemplateDetail'

interface TemplateMetricsOverviewProps {
  template: Template
  metrics: TemplateMetrics | null
}

export function TemplateMetricsOverview({ template, metrics }: TemplateMetricsOverviewProps) {
  // Use template data as fallback if metrics service is not available
  const successRate = metrics?.success_rate ?? template.success_rate ?? 0
  const avgCost = metrics?.average_cost ?? template.avg_cost ?? 0
  const avgDuration = metrics?.average_duration ?? template.avg_duration ?? 0
  const executionCount = metrics?.usage_count ?? template.execution_count ?? 0

  // Calculate success rate percentage
  const successRatePercent = Math.round(successRate * 100)

  // Format cost
  const formatCost = (cost: number) => {
    if (cost === 0) return '$0.00'
    if (cost < 0.01) return '<$0.01'
    return `$${cost.toFixed(3)}`
  }

  // Format duration
  const formatDuration = (seconds: number) => {
    if (seconds === 0) return '0s'
    if (seconds < 60) return `${seconds.toFixed(1)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`
  }

  // Get success rate color and status
  const getSuccessRateStatus = (rate: number) => {
    if (rate >= 80) return { color: 'text-green-600', bg: 'bg-green-50', status: 'Excellent' }
    if (rate >= 60) return { color: 'text-yellow-600', bg: 'bg-yellow-50', status: 'Good' }
    if (rate > 0) return { color: 'text-red-600', bg: 'bg-red-50', status: 'Needs Improvement' }
    return { color: 'text-gray-600', bg: 'bg-gray-50', status: 'No Data' }
  }

  const successStatus = getSuccessRateStatus(successRatePercent)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Success Rate Card */}
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Success Rate
          </CardTitle>
          <div className={`p-2 rounded-full ${successStatus.bg}`}>
            {successRatePercent >= 80 ? (
              <CheckCircle className={`h-4 w-4 ${successStatus.color}`} />
            ) : (
              <AlertTriangle className={`h-4 w-4 ${successStatus.color}`} />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <div className={`text-2xl font-bold ${successStatus.color}`}>
                {successRatePercent}%
              </div>
              <Badge 
                variant="secondary" 
                className={`text-xs ${successStatus.bg} ${successStatus.color} border-0`}
              >
                {successStatus.status}
              </Badge>
            </div>
            
            {executionCount > 0 && (
              <div className="space-y-2">
                <Progress 
                  value={successRatePercent} 
                  className="h-2"
                />
                <p className="text-xs text-gray-500">
                  Based on {executionCount} execution{executionCount !== 1 ? 's' : ''}
                </p>
              </div>
            )}
            
            {executionCount === 0 && (
              <p className="text-xs text-gray-500">
                No executions yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Average Cost Card */}
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Average Cost
          </CardTitle>
          <div className="p-2 rounded-full bg-blue-50">
            <DollarSign className="h-4 w-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-blue-600">
                {formatCost(avgCost)}
              </div>
              {avgCost > 0 && (
                <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                  per run
                </Badge>
              )}
            </div>
            
            {avgCost > 0 ? (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Cost efficiency</span>
                  <span className="font-medium">
                    {avgCost < 0.05 ? 'Excellent' : avgCost < 0.1 ? 'Good' : 'Standard'}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Total spent: {formatCost(avgCost * executionCount)}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                No cost data available
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Average Duration Card */}
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Average Duration
          </CardTitle>
          <div className="p-2 rounded-full bg-orange-50">
            <Clock className="h-4 w-4 text-orange-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-orange-600">
                {formatDuration(avgDuration)}
              </div>
              {avgDuration > 0 && (
                <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
                  avg
                </Badge>
              )}
            </div>
            
            {avgDuration > 0 ? (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Performance</span>
                  <span className="font-medium">
                    {avgDuration < 30 ? 'Fast' : avgDuration < 120 ? 'Good' : 'Standard'}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Total time: {formatDuration(avgDuration * executionCount)}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                No duration data available
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Total Executions Card */}
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total Executions
          </CardTitle>
          <div className="p-2 rounded-full bg-purple-50">
            <Play className="h-4 w-4 text-purple-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-purple-600">
                {executionCount.toLocaleString()}
              </div>
              <Badge variant="outline" className="text-xs text-purple-600 border-purple-200">
                runs
              </Badge>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Usage level</span>
                <span className="font-medium">
                  {executionCount === 0 ? 'Unused' : 
                   executionCount < 5 ? 'New' : 
                   executionCount < 20 ? 'Active' : 'Popular'}
                </span>
              </div>
              
              {metrics?.last_used ? (
                <div className="text-xs text-gray-500">
                  Last used: {new Date(metrics.last_used).toLocaleDateString()}
                </div>
              ) : template.updated_at ? (
                <div className="text-xs text-gray-500">
                  Created: {new Date(template.updated_at).toLocaleDateString()}
                </div>
              ) : (
                <div className="text-xs text-gray-500">
                  Ready to execute
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default TemplateMetricsOverview
