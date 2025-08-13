import { useQuery } from '@tanstack/react-query'
import { templateService } from '../services/template.service'
import { executionService } from '../services/execution.service'
import type { Template } from '../types'
import type { ExecutionResult } from '../services/execution.service'

export interface TemplateMetrics {
  usage_count: number
  success_rate: number
  average_duration: number
  average_cost: number
  last_used: string | null
}

export interface UseTemplateDetailReturn {
  template: Template | null
  isLoading: boolean
  error: string | null
  executionHistory: ExecutionResult[]
  metrics: TemplateMetrics | null
  refetch: () => void
}

export function useTemplateDetail(templateId: string): UseTemplateDetailReturn {
  // Main template data
  const {
    data: template = null,
    isLoading: templateLoading,
    error: templateError,
    refetch: refetchTemplate
  } = useQuery({
    queryKey: ['template', templateId],
    queryFn: () => templateService.getTemplate(templateId),
    enabled: !!templateId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Template statistics
  const {
    data: metrics = null,
    isLoading: metricsLoading,
    error: metricsError
  } = useQuery({
    queryKey: ['template-stats', templateId],
    queryFn: () => templateService.getTemplateStats(templateId),
    enabled: !!templateId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })

  // Execution history (recent executions for this template)
  const {
    data: executionHistory = [],
    isLoading: historyLoading,
    error: historyError
  } = useQuery({
    queryKey: ['template-executions', templateId],
    queryFn: async () => {
      // This would be a new endpoint to get executions for a specific template
      // For now, we'll return empty array as this endpoint doesn't exist yet
      try {
        const response = await executionService.getExecutionMetrics(30)
        // Filter executions for this template (if the API supports it)
        return response?.executions?.filter((exec: ExecutionResult) => exec.template_id === templateId) || []
      } catch (error) {
        console.warn('Execution history not available:', error)
        return []
      }
    },
    enabled: !!templateId,
    staleTime: 1000 * 60 * 1, // 1 minute
  })

  const isLoading = templateLoading || metricsLoading || historyLoading
  const error = templateError?.message || metricsError?.message || historyError?.message || null

  const refetch = () => {
    refetchTemplate()
  }

  return {
    template,
    isLoading,
    error,
    executionHistory,
    metrics,
    refetch
  }
}

export default useTemplateDetail
