import { useQuery } from '@tanstack/react-query'
import { templateService } from '../services/template.service'

export interface UseTemplateListParams {
  category?: string
  is_public?: boolean
  search?: string
  page?: number
  limit?: number
}

export function useTemplateList(params: UseTemplateListParams = {}) {
  const {
    data: response,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['templates-paginated', params.category, params.is_public, params.page, params.limit],
    queryFn: () => templateService.listTemplatesPaginated({
      category: params.category,
      is_public: params.is_public,
      page: params.page || 1,
      limit: params.limit || 5
    }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Client-side search filtering if search query is provided
  const templates = response?.templates || []
  const filteredTemplates = params.search 
    ? templates.filter(template =>
        template.name.toLowerCase().includes(params.search!.toLowerCase()) ||
        template.description.toLowerCase().includes(params.search!.toLowerCase())
      )
    : templates

  return {
    templates: filteredTemplates,
    total: response?.total || 0,
    page: response?.page || 1,
    limit: response?.limit || 5,
    totalPages: Math.ceil((response?.total || 0) / (response?.limit || 5)),
    hasNext: response ? response.page * response.limit < response.total : false,
    hasPrev: response ? response.page > 1 : false,
    isLoading,
    error,
    refetch
  }
}

export function useTemplateCategories() {
  return useQuery({
    queryKey: ['template-categories'],
    queryFn: () => templateService.getCategories(),
    staleTime: 1000 * 60 * 30, // 30 minutes
  })
}

export function useTemplateSearch(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['template-search', query],
    queryFn: () => templateService.searchTemplates(query),
    enabled: enabled && query.length > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}
