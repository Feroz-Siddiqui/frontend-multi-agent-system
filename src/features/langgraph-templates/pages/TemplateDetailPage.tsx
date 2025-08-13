import { useParams, useNavigate } from 'react-router-dom'
import { 
  Bot,
  Workflow,
  History,
  Settings,
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

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { ErrorDisplay } from '@/components/common/ErrorDisplay'
import { NotFoundDisplay } from '@/components/common/NotFoundDisplay'
import { PageHeader } from '@/components/common/PageHeader'

import { useTemplateDetail } from '../hooks/useTemplateDetail'
import TemplateMetricsOverview from '../components/template-detail/TemplateMetricsOverview'
import TemplateExecutionHistory from '../components/template-detail/TemplateExecutionHistory'
import { EnhancedAgentCard } from '../components/template-detail/EnhancedAgentCard'

// Import workflow preview component for read-only visualization
import { WorkflowPreview } from '../components/workflow-visualizations/components/WorkflowPreview'

import type { Template, WorkflowMode } from '../types'


function WorkflowVisualization({ template }: { template: Template }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Workflow Preview */}
      <div className="lg:col-span-2">
        <div className="h-[500px] w-full border rounded-lg bg-gray-50 overflow-hidden">
          <WorkflowPreview
            agents={template.agents}
            workflow={template.workflow}
            className="h-full w-full"
          />
        </div>
      </div>
      
      {/* Additional Workflow Information */}
      <div className="lg:col-span-1 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workflow Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-600">Mode:</span>
              <span className="font-medium capitalize">{template.workflow.mode}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-600">Agents:</span>
              <span className="font-medium">{template.agents.length}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-600">Connections:</span>
              <span className="font-medium">{template.workflow.graph_structure?.edges?.length || 0}</span>
            </div>
            {template.workflow.entry_point && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Entry Point:</span>
                <span className="font-medium">
                  {template.agents.find(a => (a.id || a.name) === template.workflow.entry_point)?.name || 'Unknown'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Execution Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Checkpointing:</span>
              <Badge variant="outline" className="text-xs">
                {template.workflow.enable_checkpointing ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Streaming:</span>
              <Badge variant="outline" className="text-xs">
                {template.workflow.enable_streaming ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Time Travel:</span>
              <Badge variant="outline" className="text-xs">
                {template.workflow.enable_time_travel ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
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

export function TemplateDetailPage() {
  const { templateId } = useParams<{ templateId: string }>()
  const navigate = useNavigate()
  
  // Move hook call to top level to avoid conditional calling
  const { template, isLoading, error, metrics, refetch } = useTemplateDetail(templateId || '')

  if (!templateId) {
    return <NotFoundDisplay message="Template ID not provided" />
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-96" />
          <Skeleton className="h-8 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-18" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <ErrorDisplay 
          message={error} 
          onRetry={refetch}
        />
      </div>
    )
  }

  if (!template) {
    return <NotFoundDisplay message="Template not found" />
  }

  const workflowConfig = WORKFLOW_MODE_CONFIG[template.workflow.mode as WorkflowMode]
  const WorkflowIcon = workflowConfig.icon

  const handleExecute = () => {
    // Navigate to execution page
    navigate(`/templates/execute?templateId=${template.id}`)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={template.name}
        description={template.description || undefined}
        actions={
          <Button 
            size="lg" 
            onClick={handleExecute}
            disabled={!template.is_active}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all px-6"
          >
            <Play className="w-5 h-5 mr-2" />
            Execute Template
          </Button>
        }
      />

      {/* Template Status Badges */}
      <div className="flex items-center gap-2 mb-6">
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

      {/* Additional Template Info */}
      <div className="flex items-center gap-6 text-sm text-gray-500 pb-6 border-b border-gray-100">
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

      {/* Metrics Overview */}
      <TemplateMetricsOverview template={template} metrics={metrics} />

      {/* Main Content Tabs */}
      <Tabs defaultValue="workflow" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="workflow" className="flex items-center gap-2">
            <Workflow className="w-4 h-4" />
            Workflow
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configuration
          </TabsTrigger>
        </TabsList>

        {/* Workflow Tab */}
        <TabsContent value="workflow" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Workflow Visualization
            </h3>
            <WorkflowVisualization template={template} />
          </div>
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Agent Configuration ({template.agents.length})
            </h3>
            <div className="space-y-6">
              {template.agents.map((agent, index) => (
                <EnhancedAgentCard key={agent.id || index} agent={agent} />
              ))}
            </div>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Execution History
            </h3>
            <TemplateExecutionHistory template={template} />
          </div>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Template Configuration
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-gray-600">Name:</span>
                    <span className="col-span-2 font-medium">{template.name}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-gray-600">Description:</span>
                    <span className="col-span-2">{template.description || 'No description'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span className="col-span-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        template.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {template.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-gray-600">Visibility:</span>
                    <span className="col-span-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        template.is_public 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {template.is_public ? 'Public' : 'Private'}
                      </span>
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Workflow Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Workflow Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-gray-600">Mode:</span>
                    <span className="col-span-2 font-medium capitalize">{template.workflow.mode}</span>
                  </div>
                  
                  {template.workflow.mode === 'parallel' && template.workflow.max_concurrent_agents && (
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <span className="text-gray-600">Max Concurrent:</span>
                      <span className="col-span-2 font-medium">{template.workflow.max_concurrent_agents}</span>
                    </div>
                  )}
                  
                  {template.workflow.mode === 'sequential' && template.workflow.sequence && (
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <span className="text-gray-600">Sequence:</span>
                      <span className="col-span-2 text-xs text-gray-500">
                        {template.workflow.sequence.join(' → ')}
                      </span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-gray-600">Total Agents:</span>
                    <span className="col-span-2 font-medium">{template.agents.length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default TemplateDetailPage
