import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorDisplay } from '@/components/common/ErrorDisplay'
import { PageHeader } from '@/components/common/PageHeader'

import { useTemplateList } from '../hooks/useTemplateList'
import { TemplateFilters } from '../components/TemplateFilters'
import { TemplateGrid } from '../components/TemplateGrid'

const CATEGORIES = [
  'market_research',
  'risk_assessment',
  'data_analysis',
  'competitive_intelligence',
  'trend_analysis'
]

export function TemplateListPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [publicFilter, setPublicFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch templates with filters and pagination
  const {
    templates,
    total,
    page,
    limit,
    totalPages,
    hasNext,
    hasPrev,
    isLoading,
    error,
    refetch
  } = useTemplateList({
    category: categoryFilter === 'all' ? undefined : categoryFilter,
    is_public: publicFilter === 'all' ? undefined : publicFilter === 'public',
    search: searchQuery,
    page: currentPage,
    limit: 5
  })

  // Handle template execution
  const handleExecuteTemplate = (templateId: string) => {
    navigate(`/templates/execute?templateId=${templateId}`)
  }

  if (error) {
    return <ErrorDisplay message="Failed to load templates" onRetry={refetch} />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Templates"
        description="Manage your multi-agent workflow templates"
        actions={
          <Button asChild>
            <Link to="/templates/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Link>
          </Button>
        }
      />

      {/* Filters */}
      <TemplateFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        publicFilter={publicFilter}
        onPublicFilterChange={setPublicFilter}
        categories={CATEGORIES}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {/* Templates Grid */}
      {!isLoading && (
        <>
          <TemplateGrid
            templates={templates}
            onExecute={handleExecuteTemplate}
          />
          
          {/* Pagination Controls */}
          {totalPages >= 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} templates
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(page - 1)}
                  disabled={!hasPrev}
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
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(page + 1)}
                  disabled={!hasNext}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
