import { Link } from 'react-router-dom'
import { 
  Eye, 
  Play, 
  Clock,
  DollarSign,
  Lock,
  Globe,
  Users,
  Zap, 
  ArrowRight, 
  GitMerge, 
  Network,
  Search,
  BarChart3,
  Link as LinkIcon,
  Shield,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

import type { Template, WorkflowMode, AgentType } from '../types'

interface TemplateCardProps {
  template: Template
  onExecute?: (templateId: string) => void
}

// Workflow mode configurations with icons and colors
const WORKFLOW_MODE_CONFIG = {
  sequential: {
    icon: ArrowRight,
    label: 'Sequential',
    color: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400'
  },
  parallel: {
    icon: Zap,
    label: 'Parallel',
    color: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400'
  },
  conditional: {
    icon: GitMerge,
    label: 'Conditional',
    color: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-900/30',
    iconColor: 'text-orange-600 dark:text-orange-400'
  },
  langgraph: {
    icon: Network,
    label: 'LangGraph',
    color: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400'
  }
} as const

// Agent type configurations with icons
const AGENT_TYPE_CONFIG = {
  research: {
    icon: Search,
    label: 'Research',
    color: 'text-blue-600 dark:text-blue-400'
  },
  analysis: {
    icon: BarChart3,
    label: 'Analysis',
    color: 'text-green-600 dark:text-green-400'
  },
  synthesis: {
    icon: LinkIcon,
    label: 'Synthesis',
    color: 'text-purple-600 dark:text-purple-400'
  },
  validation: {
    icon: Shield,
    label: 'Validation',
    color: 'text-orange-600 dark:text-orange-400'
  }
} as const

export function TemplateCard({ template, onExecute }: TemplateCardProps) {
  const workflowConfig = WORKFLOW_MODE_CONFIG[template.workflow.mode as WorkflowMode]
  const WorkflowIcon = workflowConfig.icon
  
  // Calculate success rate percentage for progress bar
  const successRate = Math.round((template.success_rate || 0) * 100)
  
  // Get success rate color
  const getSuccessRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 dark:text-green-400'
    if (rate >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }
  
  // Format cost
  const formatCost = (cost: number) => {
    if (cost === 0) return '$0.00'
    if (cost < 0.01) return '<$0.01'
    return `$${cost.toFixed(3)}`
  }
  
  // Format duration
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`
  }
  
  // Get agent type distribution
  const agentTypes = template.agents.reduce((acc, agent) => {
    acc[agent.type] = (acc[agent.type] || 0) + 1
    return acc
  }, {} as Record<AgentType, number>)
  
  // Get primary agent type (most common)
  const primaryAgentType = Object.entries(agentTypes).reduce((a, b) => 
    agentTypes[a[0] as AgentType] > agentTypes[b[0] as AgentType] ? a : b
  )[0] as AgentType
  
  const PrimaryAgentIcon = AGENT_TYPE_CONFIG[primaryAgentType]?.icon || Users
  
  // Format last updated
  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return '1 day ago'
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    return `${Math.floor(diffInDays / 30)} months ago`
  }

  // Handle execute click
  const handleExecuteClick = () => {
    if (onExecute && template.id) {
      onExecute(template.id)
    }
  }

  return (
    <Card className="group h-full flex flex-col transition-all duration-200 hover:shadow-lg hover:shadow-blue-100 dark:hover:shadow-blue-900/20 hover:-translate-y-1 border hover:border-blue-300 dark:hover:border-blue-700">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge 
                variant="secondary" 
                className={`${workflowConfig.color} font-medium text-xs px-2 py-1 transition-colors`}
              >
                <WorkflowIcon className={`w-3 h-3 mr-1 ${workflowConfig.iconColor}`} />
                {workflowConfig.label}
              </Badge>
              
              <Badge 
                variant={template.is_active ? "default" : "secondary"}
                className={`text-xs px-2 py-1 ${
                  template.is_active 
                    ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' 
                    : 'bg-muted text-muted-foreground border-border'
                }`}
              >
                {template.is_active ? (
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                ) : (
                  <AlertCircle className="w-3 h-3 mr-1" />
                )}
                {template.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            
            <CardTitle className="text-lg font-semibold line-clamp-1 text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {template.name}
            </CardTitle>
            <CardDescription className="line-clamp-2 mt-1 text-sm text-muted-foreground">
              {template.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3 space-y-4">
        {/* Agent Information */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <PrimaryAgentIcon className={`w-4 h-4 ${AGENT_TYPE_CONFIG[primaryAgentType]?.color || 'text-muted-foreground'}`} />
            <span className="font-medium">{template.agents.length}</span>
            <span>{template.agents.length === 1 ? 'Agent' : 'Agents'}</span>
          </div>
          
          {template.workflow.max_concurrent_agents && template.workflow.mode === 'parallel' && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              <span className="text-xs">Max {template.workflow.max_concurrent_agents} concurrent</span>
            </div>
          )}
        </div>

        {/* Performance Metrics */}
        <div className="space-y-3">
          {/* Success Rate with Progress Bar */}
          {template.execution_count && template.execution_count > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Success Rate</span>
                <span className={`font-semibold ${getSuccessRateColor(successRate)}`}>
                  {successRate}%
                </span>
              </div>
              <Progress 
                value={successRate} 
                className="h-2"
              />
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Play className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
              <span className="font-medium">{template.execution_count || 0}</span>
              <span>runs</span>
            </div>
            
            {template.avg_cost !== undefined && template.avg_cost > 0 && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <DollarSign className="w-3.5 h-3.5 text-green-500 dark:text-green-400" />
                <span className="font-medium">{formatCost(template.avg_cost)}</span>
                <span>avg</span>
              </div>
            )}
            
            {template.avg_duration !== undefined && template.avg_duration > 0 && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
                <span className="font-medium">{formatDuration(template.avg_duration)}</span>
                <span>avg</span>
              </div>
            )}
            
            <div className="flex items-center gap-1.5 text-muted-foreground">
              {template.is_public ? (
                <>
                  <Globe className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                  <span>Public</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Private</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Last Updated */}
        {template.updated_at && (
          <div className="text-xs text-muted-foreground border-t pt-3">
            Updated {formatLastUpdated(template.updated_at)}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t bg-muted/50 mt-auto">
        <div className="flex gap-2 w-full">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-700 dark:hover:text-blue-400 transition-colors" 
            asChild
          >
            <Link to={`/templates/${template.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </Button>
          
          <Button 
            size="sm" 
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all" 
            onClick={handleExecuteClick}
            disabled={!template.is_active}
          >
            <Play className="mr-2 h-4 w-4" />
            Execute
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
