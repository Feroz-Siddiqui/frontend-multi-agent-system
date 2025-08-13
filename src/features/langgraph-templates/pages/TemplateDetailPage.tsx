import { useParams } from 'react-router-dom'
import { 
  Bot,
  Workflow,
  History,
  Settings
} from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

import { ErrorDisplay } from '@/components/common/ErrorDisplay'
import { NotFoundDisplay } from '@/components/common/NotFoundDisplay'

import { useTemplateDetail } from '../hooks/useTemplateDetail'
import TemplateDetailHeader from '../components/template-detail/TemplateDetailHeader'
import TemplateMetricsOverview from '../components/template-detail/TemplateMetricsOverview'
import TemplateExecutionHistory from '../components/template-detail/TemplateExecutionHistory'
import { EnhancedAgentCard } from '../components/template-detail/EnhancedAgentCard'

// Import existing workflow visualization components
import { SequentialWorkflowVisualization } from '../components/workflow-visualizations/SequentialWorkflowVisualization'
import { ParallelWorkflowVisualization } from '../components/workflow-visualizations/ParallelWorkflowVisualization'
import { ConditionalWorkflowVisualization } from '../components/workflow-visualizations/ConditionalWorkflowVisualization'
import { LangGraphWorkflowVisualization } from '../components/workflow-visualizations/LangGraphWorkflowVisualization'

import type { Template, WorkflowMode } from '../types'


function WorkflowVisualization({ template }: { template: Template }) {
  const mode = template.workflow.mode as WorkflowMode

  // Create a no-op update function for read-only visualization
  const handleUpdateWorkflow = () => {
    // Read-only mode - no updates allowed
  }

  const handleUpdateAgent = () => {
    // Read-only mode - no updates allowed
  }

  const handleConfigureAgent = () => {
    // Read-only mode - no configuration allowed
  }

  switch (mode) {
    case 'sequential':
      return (
        <SequentialWorkflowVisualization
          agents={template.agents}
          workflow={template.workflow}
          onUpdateWorkflow={handleUpdateWorkflow}
          onUpdateAgent={handleUpdateAgent}
          onConfigureAgent={handleConfigureAgent}
        />
      )
    case 'parallel':
      return (
        <ParallelWorkflowVisualization
          agents={template.agents}
          workflow={template.workflow}
          onUpdateWorkflow={handleUpdateWorkflow}
          onUpdateAgent={handleUpdateAgent}
          onConfigureAgent={handleConfigureAgent}
        />
      )
    case 'conditional':
      return (
        <ConditionalWorkflowVisualization
          agents={template.agents}
          workflow={template.workflow}
          onUpdateWorkflow={handleUpdateWorkflow}
          onUpdateAgent={handleUpdateAgent}
          onConfigureAgent={handleConfigureAgent}
        />
      )
    case 'langgraph':
      return (
        <LangGraphWorkflowVisualization
          agents={template.agents}
          workflow={template.workflow}
          onUpdateWorkflow={handleUpdateWorkflow}
          onUpdateAgent={handleUpdateAgent}
          onConfigureAgent={handleConfigureAgent}
        />
      )
    default:
      return (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              <Workflow className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-lg font-medium mb-1">Workflow Visualization</p>
              <p className="text-sm">
                {template.workflow.mode.charAt(0).toUpperCase() + template.workflow.mode.slice(1)} workflow with {template.agents.length} agents
              </p>
            </div>
          </CardContent>
        </Card>
      )
  }
}

export function TemplateDetailPage() {
  const { templateId } = useParams<{ templateId: string }>()
  
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

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <TemplateDetailHeader template={template} />

      {/* Metrics Overview */}
      <TemplateMetricsOverview template={template} metrics={metrics} />

      {/* Main Content Tabs */}
      <Tabs defaultValue="agents" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="workflow" className="flex items-center gap-2">
            <Workflow className="w-4 h-4" />
            Workflow
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

        {/* Workflow Tab */}
        <TabsContent value="workflow" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Workflow Visualization
            </h3>
            <WorkflowVisualization template={template} />
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
