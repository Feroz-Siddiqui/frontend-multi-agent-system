/**
 * EnhancedAgentCard Component
 * 
 * Comprehensive agent configuration display showing ALL settings:
 * - Complete Tavily API configuration
 * - HITL settings
 * - Agent execution constraints
 * - Prompt previews
 * - Dependencies
 */

import { useState } from 'react';
import { 
  Bot,
  Settings,
  Search,
  FileText,
  Globe,
  BarChart3,
  Clock,
  RefreshCw,
  Target,
  Users,
  ChevronDown,
  ChevronRight,
  Eye,
  CheckCircle2,
  XCircle,
  Shield,
  DollarSign,
  Timer
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { ScrollArea } from '../../../../components/ui/scroll-area';

import type { Agent, AgentType, TavilyConfig, HITLConfig } from '../../types/template.types';

interface EnhancedAgentCardProps {
  agent: Agent;
}

// Agent type configurations with enhanced styling
const AGENT_TYPE_CONFIG = {
  research: {
    icon: '🔍',
    label: 'Research',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200'
  },
  analysis: {
    icon: '📊',
    label: 'Analysis', 
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200'
  },
  synthesis: {
    icon: '🔗',
    label: 'Synthesis',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200'
  },
  validation: {
    icon: '🛡️',
    label: 'Validation',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200'
  }
} as const;

function TavilyConfigurationPanel({ config }: { config: TavilyConfig }) {
  const enabledAPIs = [
    config.search_api && 'Search',
    config.extract_api && 'Extract',
    config.crawl_api && 'Crawl',
    config.map_api && 'Map'
  ].filter(Boolean);

  const getAPIStatus = (enabled: boolean) => (
    <div className={`flex items-center gap-1 text-xs ${enabled ? 'text-green-600' : 'text-gray-400'}`}>
      {enabled ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {enabled ? 'Enabled' : 'Disabled'}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* API Status Overview */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-600 flex items-center gap-1">
            <Search className="w-3 h-3" />
            Search API
          </div>
          {getAPIStatus(config.search_api)}
        </div>
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-600 flex items-center gap-1">
            <FileText className="w-3 h-3" />
            Extract API
          </div>
          {getAPIStatus(config.extract_api)}
        </div>
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-600 flex items-center gap-1">
            <Globe className="w-3 h-3" />
            Crawl API
          </div>
          {getAPIStatus(config.crawl_api)}
        </div>
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-600 flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />
            Map API
          </div>
          {getAPIStatus(config.map_api)}
        </div>
      </div>

      {enabledAPIs.length > 0 && (
        <Tabs defaultValue="search" className="space-y-3">
          <TabsList className="grid w-full grid-cols-4 h-8">
            <TabsTrigger value="search" disabled={!config.search_api} className="text-xs">
              Search
            </TabsTrigger>
            <TabsTrigger value="extract" disabled={!config.extract_api} className="text-xs">
              Extract
            </TabsTrigger>
            <TabsTrigger value="crawl" disabled={!config.crawl_api} className="text-xs">
              Crawl
            </TabsTrigger>
            <TabsTrigger value="map" disabled={!config.map_api} className="text-xs">
              Map
            </TabsTrigger>
          </TabsList>

          {/* Search API Configuration */}
          {config.search_api && (
            <TabsContent value="search" className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  <span className="text-gray-600">Max Results:</span>
                  <span className="font-medium">{config.max_results}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-600">Depth:</span>
                  <span className="font-medium capitalize">{config.search_depth}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-600">Include Answer:</span>
                  <span className="font-medium">{config.include_answer ? 'Yes' : 'No'}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-600">Include Images:</span>
                  <span className="font-medium">{config.include_images ? 'Yes' : 'No'}</span>
                </div>
              </div>
              {config.time_range && (
                <div className="text-xs">
                  <span className="text-gray-600">Time Range: </span>
                  <Badge variant="outline" className="text-xs">{config.time_range}</Badge>
                </div>
              )}
              {config.include_domains && config.include_domains.length > 0 && (
                <div className="text-xs">
                  <span className="text-gray-600">Include Domains: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {config.include_domains.slice(0, 3).map(domain => (
                      <Badge key={domain} variant="secondary" className="text-xs">{domain}</Badge>
                    ))}
                    {config.include_domains.length > 3 && (
                      <Badge variant="outline" className="text-xs">+{config.include_domains.length - 3} more</Badge>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          )}

          {/* Extract API Configuration */}
          {config.extract_api && (
            <TabsContent value="extract" className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  <span className="text-gray-600">Depth:</span>
                  <span className="font-medium capitalize">{config.extract_depth}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-600">Format:</span>
                  <span className="font-medium capitalize">{config.format}</span>
                </div>
              </div>
            </TabsContent>
          )}

          {/* Crawl API Configuration */}
          {config.crawl_api && (
            <TabsContent value="crawl" className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  <span className="text-gray-600">Max Depth:</span>
                  <span className="font-medium">{config.max_crawl_depth}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-600">Crawl Limit:</span>
                  <span className="font-medium">{config.crawl_limit}</span>
                </div>
              </div>
              {config.crawl_instructions && (
                <div className="text-xs">
                  <span className="text-gray-600">Instructions: </span>
                  <p className="text-gray-700 mt-1 p-2 bg-gray-50 rounded text-xs">
                    {config.crawl_instructions.length > 100 
                      ? `${config.crawl_instructions.substring(0, 100)}...` 
                      : config.crawl_instructions
                    }
                  </p>
                </div>
              )}
            </TabsContent>
          )}

          {/* Map API Configuration */}
          {config.map_api && (
            <TabsContent value="map" className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  <span className="text-gray-600">Max Depth:</span>
                  <span className="font-medium">{config.max_map_depth}</span>
                </div>
              </div>
              {config.map_instructions && (
                <div className="text-xs">
                  <span className="text-gray-600">Instructions: </span>
                  <p className="text-gray-700 mt-1 p-2 bg-gray-50 rounded text-xs">
                    {config.map_instructions.length > 100 
                      ? `${config.map_instructions.substring(0, 100)}...` 
                      : config.map_instructions
                    }
                  </p>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      )}

      {/* Cost and Performance Settings */}
      <div className="pt-2 border-t space-y-2">
        <div className="text-xs font-medium text-gray-700">Cost & Performance</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-gray-400" />
            <span className="text-gray-600">Max Credits:</span>
            <span className="font-medium">{config.max_credits_per_agent}</span>
          </div>
          <div className="flex items-center gap-1">
            <Timer className="w-3 h-3 text-gray-400" />
            <span className="text-gray-600">Timeout:</span>
            <span className="font-medium">{config.timeout_seconds}s</span>
          </div>
          <div className="flex items-center gap-1">
            <RefreshCw className="w-3 h-3 text-gray-400" />
            <span className="text-gray-600">Retries:</span>
            <span className="font-medium">{config.retry_attempts}</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-gray-400" />
            <span className="text-gray-600">Fallback:</span>
            <span className="font-medium">{config.fallback_enabled ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function HITLConfigurationDisplay({ config }: { config: HITLConfig }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm font-medium text-green-700">Human-in-the-Loop Enabled</span>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <span className="text-gray-600">Type:</span>
          <Badge variant="secondary" className="text-xs capitalize">
            {config.intervention_type}
          </Badge>
        </div>
        <div className="space-y-1">
          <span className="text-gray-600">Timeout:</span>
          <span className="font-medium">{config.timeout_seconds}s</span>
        </div>
        <div className="space-y-1">
          <span className="text-gray-600">Auto Approve:</span>
          <span className="font-medium">{config.auto_approve_after_timeout ? 'Yes' : 'No'}</span>
        </div>
      </div>

      {config.intervention_points && config.intervention_points.length > 0 && (
        <div className="space-y-1">
          <span className="text-xs text-gray-600">Intervention Points:</span>
          <div className="flex flex-wrap gap-1">
            {config.intervention_points.map(point => (
              <Badge key={point} variant="outline" className="text-xs">
                {point.replace('_', ' ')}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {config.required_fields && config.required_fields.length > 0 && (
        <div className="space-y-1">
          <span className="text-xs text-gray-600">Required Fields:</span>
          <div className="flex flex-wrap gap-1">
            {config.required_fields.map(field => (
              <Badge key={field} variant="outline" className="text-xs">{field}</Badge>
            ))}
          </div>
        </div>
      )}

      {config.custom_prompt && (
        <div className="space-y-1">
          <span className="text-xs text-gray-600">Custom Prompt:</span>
          <p className="text-xs text-gray-700 p-2 bg-gray-50 rounded">
            {config.custom_prompt.length > 100 
              ? `${config.custom_prompt.substring(0, 100)}...` 
              : config.custom_prompt
            }
          </p>
        </div>
      )}
    </div>
  );
}

function PromptPreview({ title, prompt, maxLength }: { title: string; prompt: string; maxLength: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = prompt.length > 100;
  const displayPrompt = isExpanded || !isLong ? prompt : `${prompt.substring(0, 100)}...`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700">{title}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {prompt.length}/{maxLength}
          </span>
          {isLong && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 px-2 text-xs"
            >
              <Eye className="w-3 h-3 mr-1" />
              {isExpanded ? 'Less' : 'More'}
            </Button>
          )}
        </div>
      </div>
      <ScrollArea className={`w-full border rounded p-2 bg-gray-50 ${isExpanded ? 'h-32' : 'h-16'}`}>
        <p className="text-xs text-gray-700 whitespace-pre-wrap">
          {displayPrompt}
        </p>
      </ScrollArea>
    </div>
  );
}

export function EnhancedAgentCard({ agent }: EnhancedAgentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = AGENT_TYPE_CONFIG[agent.type as AgentType] || AGENT_TYPE_CONFIG.research;

  // Check if Tavily is configured
  const hasTavilyConfig = agent.tavily_config && (
    agent.tavily_config.search_api || 
    agent.tavily_config.extract_api || 
    agent.tavily_config.crawl_api || 
    agent.tavily_config.map_api
  );

  // Check configuration completeness
  const configurationScore = [
    agent.name?.length > 0,
    agent.system_prompt?.length > 10,
    agent.user_prompt?.length > 10,
    agent.llm_config?.model,
    hasTavilyConfig || true, // Optional
    true // Always count as complete for basic setup
  ].filter(Boolean).length;

  const maxScore = 6;
  const completionPercentage = Math.round((configurationScore / maxScore) * 100);

  return (
    <Card className={`w-full border ${config.border} transition-all duration-200`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-lg ${config.bg} flex items-center justify-center text-lg`}>
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold truncate">
              {agent.name}
            </CardTitle>
            <CardDescription className={`text-sm ${config.color} font-medium`}>
              {config.label}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-xs text-gray-500">Config</div>
              <div className={`text-sm font-medium ${completionPercentage >= 80 ? 'text-green-600' : completionPercentage >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                {completionPercentage}%
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Basic Configuration - Always Visible */}
        <div className="space-y-3">
          {/* LLM Configuration */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Bot className="w-4 h-4" />
              LLM Configuration
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <span className="text-gray-600">Model:</span>
                <Badge variant="secondary" className="text-xs">{agent.llm_config.model}</Badge>
              </div>
              <div className="space-y-1">
                <span className="text-gray-600">Temperature:</span>
                <span className="font-medium">{agent.llm_config.temperature}</span>
              </div>
              <div className="space-y-1">
                <span className="text-gray-600">Max Tokens:</span>
                <span className="font-medium">{agent.llm_config.max_tokens}</span>
              </div>
            </div>
          </div>

          {/* Agent Execution Settings */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Execution Settings
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-gray-600">Timeout:</span>
                <span className="font-medium">{agent.timeout_seconds}s</span>
              </div>
              <div className="flex items-center gap-1">
                <RefreshCw className="w-3 h-3 text-gray-400" />
                <span className="text-gray-600">Retries:</span>
                <span className="font-medium">{agent.retry_count}</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="w-3 h-3 text-gray-400" />
                <span className="text-gray-600">Priority:</span>
                <span className="font-medium">{agent.priority}</span>
              </div>
            </div>
          </div>

          {/* Dependencies */}
          {agent.depends_on && agent.depends_on.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Dependencies
              </div>
              <div className="flex flex-wrap gap-1">
                {agent.depends_on.map(depId => (
                  <Badge key={depId} variant="outline" className="text-xs">
                    {depId}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Status Indicators */}
          <div className="flex items-center gap-4 text-xs">
            {hasTavilyConfig && (
              <div className="flex items-center gap-1 text-blue-600">
                <Search className="w-3 h-3" />
                <span>Tavily Enabled</span>
              </div>
            )}
            {agent.hitl_config?.enabled && (
              <div className="flex items-center gap-1 text-green-600">
                <Shield className="w-3 h-3" />
                <span>HITL Enabled</span>
              </div>
            )}
          </div>
        </div>

        {/* Expanded Configuration */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t">
            <Tabs defaultValue="prompts" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="prompts">Prompts</TabsTrigger>
                <TabsTrigger value="tavily" disabled={!hasTavilyConfig}>Tavily</TabsTrigger>
                <TabsTrigger value="hitl" disabled={!agent.hitl_config?.enabled}>HITL</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              {/* Prompts Tab */}
              <TabsContent value="prompts" className="space-y-4">
                <PromptPreview 
                  title="System Prompt" 
                  prompt={agent.system_prompt} 
                  maxLength={2000}
                />
                <PromptPreview 
                  title="User Prompt" 
                  prompt={agent.user_prompt} 
                  maxLength={1000}
                />
              </TabsContent>

              {/* Tavily Tab */}
              {hasTavilyConfig && (
                <TabsContent value="tavily">
                  <TavilyConfigurationPanel config={agent.tavily_config} />
                </TabsContent>
              )}

              {/* HITL Tab */}
              {agent.hitl_config?.enabled && (
                <TabsContent value="hitl">
                  <HITLConfigurationDisplay config={agent.hitl_config} />
                </TabsContent>
              )}

              {/* Advanced Tab */}
              <TabsContent value="advanced" className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="font-medium text-gray-700">Performance</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Timeout:</span>
                        <span className="font-medium">{agent.timeout_seconds}s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Retry Count:</span>
                        <span className="font-medium">{agent.retry_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Priority:</span>
                        <span className="font-medium">{agent.priority}/10</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="font-medium text-gray-700">Configuration</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Agent ID:</span>
                        <span className="font-mono text-xs">{agent.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium capitalize">{agent.type}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EnhancedAgentCard;
