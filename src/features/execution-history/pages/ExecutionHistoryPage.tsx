/**
 * ExecutionHistoryPage Component
 * 
 * Beautiful execution history page matching TemplateListPage design exactly
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'

import { Button } from '../../../components/ui/button'
import { LoadingSpinner } from '../../../components/common/LoadingSpinner'
import { ErrorDisplay } from '../../../components/common/ErrorDisplay'
import { PageHeader } from '../../../components/common/PageHeader'

import { useExecutionHistory } from '../hooks/useExecutionHistory'
import { ExecutionCard } from '../components/ExecutionCard'
import type { ExecutionStatus } from '../types'

const STATUS_FILTERS = [
  'all',
  'completed',
  'failed', 
  'running',
  'pending',
  'cancelled'
]

export function ExecutionHistoryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch executions with filters and pagination (4 per page for compact cards)
  const {
    executions,
    totalCount,
    currentPage: page,
    totalPages,
    isLoading,
    isRefreshing,
    error,
    refresh,
    setPage
  } = useExecutionHistory({
    initialPage: currentPage,
    initialLimit: 4, // 4 per page for compact execution cards
    initialFilters: {
      status: statusFilter === 'all' ? undefined : statusFilter as ExecutionStatus,
      search: searchQuery || undefined
    },
    autoRefresh: false
  })

  const handleRefresh = () => {
    refresh()
  }

  if (error) {
    return <ErrorDisplay message="Failed to load execution history" onRetry={refresh} />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Execution History"
        description="View and manage your multi-agent execution history"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button asChild>
              <Link to="/templates">
                <Plus className="mr-2 h-4 w-4" />
                New Execution
              </Link>
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search executions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <div className="sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by execution status"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {STATUS_FILTERS.map((status) => (
              <option key={status} value={status}>
                {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {/* Executions Grid */}
      {!isLoading && (
        <>
          {executions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <div className="text-lg font-medium mb-2">No executions found</div>
                <div className="text-sm">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your filters or create a new execution.'
                    : 'Get started by creating your first execution.'}
                </div>
              </div>
              <Button asChild>
                <Link to="/templates">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Execution
                </Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Execution Cards Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {executions.map((execution) => (
                  <ExecutionCard
                    key={execution.execution_id}
                    execution={execution}
                  />
                ))}
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {((page - 1) * 4) + 1} to {Math.min(page * 4, totalCount)} of {totalCount} executions
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentPage(page - 1)
                        setPage(page - 1)
                      }}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <Button
                          key={pageNum}
                          variant={pageNum === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setCurrentPage(pageNum)
                            setPage(pageNum)
                          }}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      ))}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentPage(page + 1)
                        setPage(page + 1)
                      }}
                      disabled={page >= totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

export default ExecutionHistoryPage
