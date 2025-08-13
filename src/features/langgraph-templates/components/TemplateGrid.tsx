import { TemplateCard } from './TemplateCard'
import type { Template } from '../types'

interface TemplateGridProps {
  templates: Template[]
  isLoading?: boolean
  onExecute?: (templateId: string) => void
}

export function TemplateGrid({ templates, isLoading, onExecute }: TemplateGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-64 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground text-lg mb-2">No templates found</div>
        <div className="text-sm text-muted-foreground">
          Try adjusting your search criteria or create a new template.
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          onExecute={onExecute}
        />
      ))}
    </div>
  )
}
