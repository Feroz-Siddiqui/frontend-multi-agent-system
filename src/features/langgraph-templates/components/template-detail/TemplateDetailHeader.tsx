import { Link, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft,
  Play,
  Zap, 
  ArrowRight, 
  GitMerge, 
  Network,
  CheckCircle2,
  AlertCircle,
  Lock,
  Globe,
  Users
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'

import type { Template, WorkflowMode } from '../../types'

interface TemplateDetailHeaderProps {
  template: Template
  onExecute?: () => void
}

// Workflow mode configurations
const WORKFLOW_MODE_CONFIG = {
  sequential: {
    icon: ArrowRight,
    label: 'Sequential',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    iconColor: 'text-blue-600'
  },
  parallel: {
    icon: Zap,
    label: 'Parallel',
    color: 'bg-green-50 text-green-700 border-green-200',
    iconColor: 'text-green-600'
  },
  conditional: {
    icon: GitMerge,
    label: 'Conditional',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    iconColor: 'text-orange-600'
  },
  langgraph: {
    icon: Network,
    label: 'LangGraph',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    iconColor: 'text-purple-600'
  }
} as const

export function TemplateDetailHeader({ template, onExecute }: TemplateDetailHeaderProps) {
  const navigate = useNavigate()
  const workflowConfig = WORKFLOW_MODE_CONFIG[template.workflow.mode as WorkflowMode]
  const WorkflowIcon = workflowConfig.icon

  const handleExecute = () => {
    if (onExecute) {
      onExecute()
    } else {
      // Navigate to execution page
      navigate(`/templates/execute?templateId=${template.id}`)
    }
  }

  const handleBack = () => {
    navigate('/templates')
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/templates">Templates</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium">
                {template.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleBack}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Templates
        </Button>
      </div>

      {/* Template Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Template Name */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {template.name}
          </h1>

          {/* Status Badges */}
          <div className="flex items-center gap-2 mb-3">
            <Badge 
              variant="secondary" 
              className={`${workflowConfig.color} font-medium text-sm px-3 py-1`}
            >
              <WorkflowIcon className={`w-4 h-4 mr-1.5 ${workflowConfig.iconColor}`} />
              {workflowConfig.label}
            </Badge>
            
            <Badge 
              variant={template.is_active ? "default" : "secondary"}
              className={`text-sm px-3 py-1 ${
                template.is_active 
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : 'bg-gray-50 text-gray-600 border-gray-200'
              }`}
            >
              {template.is_active ? (
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
              ) : (
                <AlertCircle className="w-4 h-4 mr-1.5" />
              )}
              {template.is_active ? 'Active' : 'Inactive'}
            </Badge>

            <Badge 
              variant="outline" 
              className="text-sm px-3 py-1 text-gray-600 border-gray-200"
            >
              {template.is_public ? (
                <>
                  <Globe className="w-4 h-4 mr-1.5 text-blue-500" />
                  Public
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-1.5 text-gray-500" />
                  Private
                </>
              )}
            </Badge>

            <Badge 
              variant="outline" 
              className="text-sm px-3 py-1 text-gray-600 border-gray-200"
            >
              <Users className="w-4 h-4 mr-1.5 text-purple-500" />
              {template.agents.length} {template.agents.length === 1 ? 'Agent' : 'Agents'}
            </Badge>
          </div>

          {/* Description */}
          {template.description && (
            <p className="text-gray-600 text-base leading-relaxed max-w-3xl">
              {template.description}
            </p>
          )}
        </div>

        {/* Execute Button */}
        <div className="flex-shrink-0">
          <Button 
            size="lg" 
            onClick={handleExecute}
            disabled={!template.is_active}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all px-6"
          >
            <Play className="w-5 h-5 mr-2" />
            Execute Template
          </Button>
        </div>
      </div>

      {/* Additional Template Info */}
      <div className="flex items-center gap-6 text-sm text-gray-500 pt-2 border-t border-gray-100">
        <div>
          <span className="font-medium">Created:</span>{' '}
          {template.created_at ? new Date(template.created_at).toLocaleDateString() : 'Unknown'}
        </div>
        <div>
          <span className="font-medium">Updated:</span>{' '}
          {template.updated_at ? new Date(template.updated_at).toLocaleDateString() : 'Unknown'}
        </div>
        {template.created_by && (
          <div>
            <span className="font-medium">Created by:</span>{' '}
            <span className="text-gray-700">
              {template.created_by_name || template.created_by}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default TemplateDetailHeader
