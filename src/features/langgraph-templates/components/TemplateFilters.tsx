import { Search, Filter } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface TemplateFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  categoryFilter: string
  onCategoryChange: (category: string) => void
  publicFilter: string
  onPublicFilterChange: (filter: string) => void
  categories?: string[]
}

export function TemplateFilters({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  publicFilter,
  onPublicFilterChange,
  categories = []
}: TemplateFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {/* Category Filter */}
      <Select value={categoryFilter} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-full sm:w-48">
          <Filter className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category} value={category} className="capitalize">
              {category.replace('_', ' ')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Public/Private Filter */}
      <Select value={publicFilter} onValueChange={onPublicFilterChange}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Visibility" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Templates</SelectItem>
          <SelectItem value="public">Public</SelectItem>
          <SelectItem value="private">Private</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
