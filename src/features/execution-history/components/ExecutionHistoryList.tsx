/**
 * ExecutionHistoryList Component
 * 
 * Main component for execution history display with shadcn components
 */

import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Skeleton } from '../../../components/ui/skeleton';
import { RefreshCw, Plus, AlertCircle } from 'lucide-react';
import { ExecutionCard } from './ExecutionCard';
import { ExecutionMetrics } from './ExecutionMetrics';
import { ExecutionFilters } from './ExecutionFilters';
import { useExecutionHistory, useExecutionActions } from '../hooks';
import type { ExecutionResult } from '../types';

interface ExecutionHistoryListProps {
  onExecutionSelect?: (execution: ExecutionResult) => void;
  onCreateNew?: () => void;
  showMetrics?: boolean;
  showFilters?: boolean;
  autoRefresh?: boolean;
  className?: string;
}

export function ExecutionHistoryList({
  onExecutionSelect: _onExecutionSelect, // eslint-disable-line @typescript-eslint/no-unused-vars
  onCreateNew,
  showMetrics = true,
  showFilters = true,
  autoRefresh = true,
  className,
}: ExecutionHistoryListProps) {
  // Hooks
  const {
    executions,
    metrics,
    currentPage,
    totalPages,
    totalCount,
    hasMore,
    filters,
    setFilters,
    clearFilters,
    isLoading,
    isLoadingMore,
    isRefreshing,
    error,
    loadMore,
    refresh,
  } = useExecutionHistory({
    autoRefresh,
    refreshInterval: 30000, // 30 seconds
  });

  const {
    isPerformingAction,
    currentAction,
    error: actionError,
    performAction: _performAction, // eslint-disable-line @typescript-eslint/no-unused-vars
    clearError: clearActionError,
  } = useExecutionActions({
    onSuccess: (action, result) => {
      console.log(`Action ${action} completed:`, result);
      // Refresh data after successful action
      refresh();
      clearActionError();
    },
    onError: (action, error) => {
      console.error(`Action ${action} failed:`, error);
    },
  });


  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      loadMore();
    }
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-full max-w-md" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-24" />
              ))}
            </div>
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-16" />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Execution History</h1>
          <p className="text-muted-foreground mt-1">
            {totalCount > 0 ? `${totalCount} total executions` : 'No executions found'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={refresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {onCreateNew && (
            <Button onClick={onCreateNew} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Execution
            </Button>
          )}
        </div>
      </div>

      {/* Metrics */}
      {showMetrics && metrics && (
        <ExecutionMetrics metrics={metrics} isLoading={isLoading} />
      )}

      {/* Error Display */}
      {(error || actionError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || actionError}
            {actionError && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearActionError}
                className="ml-2"
              >
                Dismiss
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="lg:col-span-1">
            <ExecutionFilters
              filters={filters}
              onFiltersChange={setFilters}
              onReset={clearFilters}
            />
          </div>
        )}

        {/* Executions List */}
        <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
          {isLoading ? (
            <LoadingSkeleton />
          ) : executions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">No executions found</h3>
                  <p className="text-muted-foreground">
                    {Object.keys(filters).length > 0
                      ? 'Try adjusting your filters or create a new execution.'
                      : 'Get started by creating your first execution.'}
                  </p>
                  {onCreateNew && (
                    <Button onClick={onCreateNew} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Execution
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Executions Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {executions.map((execution) => (
                  <ExecutionCard
                    key={execution.execution_id}
                    execution={execution}
                  />
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="flex items-center gap-2"
                  >
                    {isLoadingMore ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}

              {/* Pagination Info */}
              {totalPages > 1 && (
                <div className="text-center text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages} • {totalCount} total executions
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Status */}
      {isPerformingAction && currentAction && (
        <div className="fixed bottom-4 right-4 z-50">
          <Card className="shadow-lg">
            <CardContent className="flex items-center gap-2 py-3">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">
                Performing {currentAction}...
              </span>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default ExecutionHistoryList;
