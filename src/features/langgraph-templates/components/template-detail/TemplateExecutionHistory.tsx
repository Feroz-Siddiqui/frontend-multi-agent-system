/**
 * Template Execution History Component
 * 
 * Shows execution history filtered by template ID
 */

import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  History, 
  Play, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Plus
} from 'lucide-react'

import { useExecutionHistory } from '../../../execution-history/hooks'
import type { ExecutionResult } from '../../../execution-history/types'
import type { Template } from '../../types'

interface TemplateExecutionHistoryProps {
  template: Template
}

// Status configurations
const STATUS_CONFIG = {
  completed: {
    icon: CheckCircle,
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
} as const

function ExecutionHistoryCard({ execution }: { execution: ExecutionResult }) {
  const navigate = useNavigate()
  const statusConfig = STATUS_CONFIG[execution.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending
  const StatusIcon = statusConfig.icon

  const handleViewDetails = () => {
    navigate(`/execution-history/${execution.execution_id}`)
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`
  }

  const formatCost = (cost: number) => {
    if (cost === 0) return '$0.00'
    if (cost < 0.01) return '<$0.01'
    return `$${cost.toFixed(3)}`
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    return date.toLocaleDateString()
  }

  // Calculate success rate for agent results
  const successfulAgents = execution.agent_results.filter(result => result.success).length
  const totalAgents = execution.agent_results.length
  const agentSuccessRate = totalAgents > 0 ? Math.round((successfulAgents / totalAgents) * 100) : 0

  return (
    <Card className="group h-full flex flex-col transition-all duration-200 hover:shadow-lg hover:shadow-blue-100 dark:hover:shadow-blue-900/20 hover:-translate-y-1 border hover:border-blue-300 dark:hover:border-blue-700">
      <CardHeader className="pb-3">
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
            
            <CardTitle className="text-lg font-semibold line-clamp-2 text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {execution.query}
            </CardTitle>
            <div className="text-sm text-muted-foreground mt-1">
              {formatDateTime(execution.started_at)}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3 space-y-4">
        {/* Performance Metrics */}
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
            <CheckCircle className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            <span className="font-medium">{successfulAgents}/{totalAgents}</span>
            <span>agents</span>
          </div>
          
          {execution.total_tokens > 0 && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-3.5 h-3.5 text-center text-purple-500 dark:text-purple-400 font-bold text-xs">T</span>
              <span className="font-medium">{execution.total_tokens.toLocaleString()}</span>
              <span>tokens</span>
            </div>
          )}
        </div>

        {/* Agent Results Summary */}
        {execution.agent_results.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-foreground">Agent Results:</div>
            <div className="flex flex-wrap gap-1">
              {execution.agent_results.slice(0, 4).map((result, index) => (
                <Badge 
                  key={index}
                  variant="outline" 
                  className={`text-xs px-1.5 py-0.5 ${
                    result.success 
                      ? 'border-green-200 text-green-700 bg-green-50 dark:border-green-800 dark:text-green-400 dark:bg-green-900/20' 
                      : 'border-red-200 text-red-700 bg-red-50 dark:border-red-800 dark:text-red-400 dark:bg-red-900/20'
                  }`}
                >
                  {result.agent_name}
                </Badge>
              ))}
              {execution.agent_results.length > 4 && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5 text-muted-foreground">
                  +{execution.agent_results.length - 4} more
                </Badge>
              )}
            </div>
            
            {agentSuccessRate < 100 && totalAgents > 0 && (
              <div className="text-xs text-muted-foreground">
                Success rate: {agentSuccessRate}%
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {execution.error_message && (
          <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800">
            <div className="font-medium">Error:</div>
            <div className="line-clamp-2">{execution.error_message}</div>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t bg-muted/50 mt-auto">
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
  )
}

export function TemplateExecutionHistory({ template }: TemplateExecutionHistoryProps) {
  const navigate = useNavigate()
  
  // Use execution history hook with template filter
  const {
    executions,
    isLoading,
    error,
    refresh,
    isRefreshing
  } = useExecutionHistory({
    initialFilters: { template_id: template.id },
    autoRefresh: false
  })

  const handleExecuteTemplate = () => {
    navigate(`/templates/execute?templateId=${template.id}`)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-full max-w-md" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-16" />
                ))}
              </div>
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load execution history: {error}
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            className="ml-2"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (executions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-lg font-medium mb-1">No execution history available</p>
            <p className="text-sm mb-4">
              Execute this template to see detailed execution history and results.
            </p>
            <Button onClick={handleExecuteTemplate} className="mt-2">
              <Play className="w-4 h-4 mr-2" />
              Execute Template
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {executions.length} execution{executions.length !== 1 ? 's' : ''} found
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleExecuteTemplate}>
            <Plus className="w-4 h-4 mr-2" />
            New Execution
          </Button>
        </div>
      </div>

      {/* Execution Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {executions.map((execution) => (
          <ExecutionHistoryCard
            key={execution.execution_id}
            execution={execution}
          />
        ))}
      </div>
    </div>
  )
}

export default TemplateExecutionHistory
