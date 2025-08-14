/**
 * Enhanced Agent Configuration Form
 *
 * Complete agent configuration with vertical tabs, HITL support, and all enums
 * Uses only shadcn/ui components with clean validation
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Checkbox } from '../../../components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Bot, 
  Settings, 
  AlertCircle,
  User,
  Brain,
  Search,
} from 'lucide-react';

import type {
  Agent,
  AgentType,
  ValidationResult,
  LLMModel,
  TavilySearchDepth
} from '../types';

import {
  AGENT_TYPE_CONFIGS,
  LLM_MODEL_CONFIGS
} from '../types';

interface AgentConfigurationFormV2Props {
  agents: Agent[];
  onUpdateAgent: (index: number, updates: Partial<Agent>) => void;
  onAddAgent: (agent?: Partial<Agent>) => void;
  onRemoveAgent: (index: number) => void;
  onReorderAgent?: (fromIndex: number, toIndex: number) => void;
  validation: ValidationResult;
}

function AgentConfigurationForm({
  agents, 
  onUpdateAgent, 
  onAddAgent, 
  onRemoveAgent,
  validation 
}: AgentConfigurationFormV2Props) {
  const [activeAgentIndex, setActiveAgentIndex] = useState<number>(0);

  // Ensure we have at least one agent - let the hook handle proper naming
  React.useEffect(() => {
    if (agents.length === 0) {
      onAddAgent({
        type: 'research',
        system_prompt: AGENT_TYPE_CONFIGS.research.defaultSystemPrompt,
        user_prompt: AGENT_TYPE_CONFIGS.research.defaultUserPrompt,
      });
    }
  }, [agents.length, onAddAgent]);

  // Get field-specific errors
  const getFieldError = (field: string) => {
    return validation.errors.find(error => error.field === field)?.message;
  };

  const getAgentErrors = (index: number) => {
    return validation.errors.filter(error => error.field.startsWith(`agents.${index}`));
  };

  const handleAgentUpdate = (index: number, field: keyof Agent, value: string | boolean | number) => {
    onUpdateAgent(index, { [field]: value });
  };

  const handleLLMConfigUpdate = (index: number, field: keyof Agent['llm_config'], value: string | number) => {
    const agent = agents[index];
    onUpdateAgent(index, {
      llm_config: {
        ...agent.llm_config,
        [field]: value,
      },
    });
  };

  const handleTavilyConfigUpdate = (index: number, field: keyof Agent['tavily_config'], value: string | number | boolean) => {
    const agent = agents[index];
    onUpdateAgent(index, {
      tavily_config: {
        ...agent.tavily_config,
        [field]: value,
      },
    });
  };


  const handleAgentTypeChange = (index: number, type: AgentType) => {
    const config = AGENT_TYPE_CONFIGS[type];
    
    // Suggest a name based on agent type if current name is generic
    const currentName = agents[index].name;
    const isGenericName = !currentName || currentName.match(/^Agent \d+$/) || currentName === 'Research Agent';
    
    const suggestedNames = {
      research: 'Market Research Specialist',
      analysis: 'Data Analysis Expert',
      synthesis: 'Content Synthesis Agent',
      validation: 'Quality Validation Agent',
      custom: 'Custom Agent'
    };
    
    onUpdateAgent(index, {
      type,
      name: isGenericName ? suggestedNames[type] : currentName,
      system_prompt: config.defaultSystemPrompt,
      user_prompt: config.defaultUserPrompt,
    });
  };


  const currentAgent = agents[activeAgentIndex];
  const agentErrors = currentAgent ? getAgentErrors(activeAgentIndex) : [];

  if (!currentAgent) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Bot className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No agents configured</h3>
          <p className="text-muted-foreground text-center mb-4">
            Add your first agent to get started with your multi-agent workflow
          </p>
          <Button onClick={() => onAddAgent()} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add First Agent
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Agent Tabs - Vertical */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Agents ({agents.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {agents.map((agent, index) => {
                const isActive = index === activeAgentIndex;
                const hasErrors = getAgentErrors(index).length > 0;
                const hasHITL = agent.hitl_config?.enabled;
                
                return (
                  <div
                    key={agent.id || index}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isActive 
                        ? 'border-primary bg-primary/5' 
                        : hasErrors
                        ? 'border-red-200 bg-red-50'
                        : 'border-muted hover:border-primary/50'
                    }`}
                    onClick={() => setActiveAgentIndex(index)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-sm truncate">
                        {agent.name || `Agent ${index + 1}`}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {agent.type}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {hasHITL && (
                          <Badge variant="secondary" className="text-xs">
                            <User className="h-3 w-3 mr-1" />
                            HITL
                          </Badge>
                        )}
                        {hasErrors ? (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="h-3 w-3" />
                          </Badge>
                        ) : (
                          <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                            ✓
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Agent Controls - Only Delete */}
                    <div className="flex items-center justify-end mt-2 pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveAgent(index);
                          if (activeAgentIndex >= agents.length - 1) {
                            setActiveAgentIndex(Math.max(0, agents.length - 2));
                          }
                        }}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Agent Configuration Panel */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-blue-600" />
                  {currentAgent.name || `Agent ${activeAgentIndex + 1}`}
                </CardTitle>
                {agentErrors.length > 0 && (
                  <Badge variant="destructive">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {agentErrors.length} Error{agentErrors.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basic" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic" className="flex items-center gap-1">
                    <Settings className="h-3 w-3" />
                    Basic
                  </TabsTrigger>
                  <TabsTrigger value="prompts" className="flex items-center gap-1">
                    <Brain className="h-3 w-3" />
                    Prompts
                  </TabsTrigger>
                  <TabsTrigger value="llm" className="flex items-center gap-1">
                    <Bot className="h-3 w-3" />
                    LLM
                  </TabsTrigger>
                  <TabsTrigger value="tools" className="flex items-center gap-1">
                    <Search className="h-3 w-3" />
                    Tools
                  </TabsTrigger>
                </TabsList>

                {/* Basic Information */}
                <TabsContent value="basic" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`agent-${activeAgentIndex}-name`}>
                        Agent Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id={`agent-${activeAgentIndex}-name`}
                        placeholder="e.g., Market Research Specialist, Data Analyst, Content Creator..."
                        value={currentAgent.name}
                        onChange={(e) => handleAgentUpdate(activeAgentIndex, 'name', e.target.value)}
                        className={getFieldError(`agents.${activeAgentIndex}.name`) ? 'border-red-500' : ''}
                      />
                      {getFieldError(`agents.${activeAgentIndex}.name`) && (
                        <Alert variant="destructive" className="py-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            {getFieldError(`agents.${activeAgentIndex}.name`)}
                          </AlertDescription>
                        </Alert>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Give your agent a descriptive name that reflects its role and purpose. Agent ID will be auto-generated.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`agent-${activeAgentIndex}-type`}>Agent Type</Label>
                      <Select
                        value={currentAgent.type}
                        onValueChange={(value: AgentType) => handleAgentTypeChange(activeAgentIndex, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select agent type" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(AGENT_TYPE_CONFIGS).map(([type, config]) => (
                            <SelectItem key={type} value={type}>
                              <div className="flex flex-col">
                                <span className="font-medium">{config.label}</span>
                                <span className="text-xs text-muted-foreground">
                                  {config.description}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`agent-${activeAgentIndex}-priority`}>
                          Priority (1-10)
                        </Label>
                        <Input
                          id={`agent-${activeAgentIndex}-priority`}
                          type="number"
                          min="1"
                          max="10"
                          value={currentAgent.priority}
                          onChange={(e) => {
                            const value = e.target.value;
                            handleAgentUpdate(activeAgentIndex, 'priority', value === '' ? 1 : parseInt(value) || 1);
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          Higher priority agents execute first in parallel workflows
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`agent-${activeAgentIndex}-timeout`}>
                          Timeout (seconds)
                        </Label>
                        <Input
                          id={`agent-${activeAgentIndex}-timeout`}
                          type="number"
                          min="30"
                          max="3600"
                          value={currentAgent.timeout_seconds}
                          onChange={(e) => {
                            const value = e.target.value;
                            handleAgentUpdate(activeAgentIndex, 'timeout_seconds', value === '' ? 600 : parseInt(value) || 600);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Prompts */}
                <TabsContent value="prompts" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`agent-${activeAgentIndex}-system-prompt`}>
                        System Prompt <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id={`agent-${activeAgentIndex}-system-prompt`}
                        placeholder="You are a helpful AI assistant..."
                        value={currentAgent.system_prompt}
                        onChange={(e) => handleAgentUpdate(activeAgentIndex, 'system_prompt', e.target.value)}
                        className={`min-h-[100px] ${getFieldError(`agents.${activeAgentIndex}.system_prompt`) ? 'border-red-500' : ''}`}
                      />
                      {getFieldError(`agents.${activeAgentIndex}.system_prompt`) && (
                        <Alert variant="destructive" className="py-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            {getFieldError(`agents.${activeAgentIndex}.system_prompt`)}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`agent-${activeAgentIndex}-user-prompt`}>
                        User Prompt Template <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id={`agent-${activeAgentIndex}-user-prompt`}
                        placeholder="Research the following topic: {query}"
                        value={currentAgent.user_prompt}
                        onChange={(e) => handleAgentUpdate(activeAgentIndex, 'user_prompt', e.target.value)}
                        className={`min-h-[80px] ${getFieldError(`agents.${activeAgentIndex}.user_prompt`) ? 'border-red-500' : ''}`}
                      />
                      {getFieldError(`agents.${activeAgentIndex}.user_prompt`) && (
                        <Alert variant="destructive" className="py-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            {getFieldError(`agents.${activeAgentIndex}.user_prompt`)}
                          </AlertDescription>
                        </Alert>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Use {`{query}`} to reference the user's input
                      </p>
                    </div>
                  </div>
                </TabsContent>

                {/* LLM Configuration */}
                <TabsContent value="llm" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`agent-${activeAgentIndex}-model`}>Model</Label>
                      <Select 
                        value={currentAgent.llm_config.model} 
                        onValueChange={(value: LLMModel) => handleLLMConfigUpdate(activeAgentIndex, 'model', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(LLM_MODEL_CONFIGS).map(([model, config]) => (
                            <SelectItem key={model} value={model}>
                              <div className="flex flex-col">
                                <span className="font-medium">{config.label}</span>
                                <span className="text-xs text-muted-foreground">
                                  {config.description}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`agent-${activeAgentIndex}-temperature`}>Temperature</Label>
                      <Input
                        id={`agent-${activeAgentIndex}-temperature`}
                        type="number"
                        min="0"
                        max="2"
                        step="0.1"
                        value={currentAgent.llm_config.temperature}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleLLMConfigUpdate(activeAgentIndex, 'temperature', value === '' ? 0.3 : parseFloat(value) || 0.3);
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`agent-${activeAgentIndex}-max-tokens`}>Max Tokens</Label>
                      <Input
                        id={`agent-${activeAgentIndex}-max-tokens`}
                        type="number"
                        min="100"
                        max="4000"
                        value={currentAgent.llm_config.max_tokens}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleLLMConfigUpdate(activeAgentIndex, 'max_tokens', value === '' ? 2500 : parseInt(value) || 2500);
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`agent-${activeAgentIndex}-retry`}>Retry Count</Label>
                      <Input
                        id={`agent-${activeAgentIndex}-retry`}
                        type="number"
                        min="0"
                        max="3"
                        value={currentAgent.retry_count}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleAgentUpdate(activeAgentIndex, 'retry_count', value === '' ? 0 : parseInt(value) || 0);
                        }}
                      />
                    </div>
                  </div>
                </TabsContent>


                {/* Tools (Tavily) */}
                <TabsContent value="tools" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Tavily Search Integration</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Configure external search and data extraction capabilities
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">API Selection</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {[
                            { key: 'search_api', label: 'Search API', description: 'Web search capabilities' },
                            { key: 'extract_api', label: 'Extract API', description: 'Content extraction' },
                            { key: 'crawl_api', label: 'Crawl API (BETA)', description: 'Website crawling' },
                            { key: 'map_api', label: 'Map API (BETA)', description: 'Site mapping' },
                          ].map(({ key, label, description }) => (
                            <div key={key} className="flex items-center space-x-2 p-2 border rounded">
                              <Checkbox
                                id={`tavily-${key}`}
                                checked={currentAgent.tavily_config[key as keyof typeof currentAgent.tavily_config] as boolean}
                                onCheckedChange={(checked) => 
                                  handleTavilyConfigUpdate(activeAgentIndex, key as keyof typeof currentAgent.tavily_config, checked)
                                }
                              />
                              <div>
                                <Label htmlFor={`tavily-${key}`} className="text-sm font-medium">
                                  {label}
                                </Label>
                                <p className="text-xs text-muted-foreground">{description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {currentAgent.tavily_config.search_api && (
                        <div className="space-y-4 p-4 border rounded-lg">
                          <h5 className="font-medium">Search Configuration</h5>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Search Depth</Label>
                              <Select
                                value={currentAgent.tavily_config.search_depth}
                                onValueChange={(value: TavilySearchDepth) => 
                                  handleTavilyConfigUpdate(activeAgentIndex, 'search_depth', value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="basic">Basic</SelectItem>
                                  <SelectItem value="advanced">Advanced</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Max Results</Label>
                              <Input
                                type="number"
                                min="1"
                                max="50"
                                value={currentAgent.tavily_config.max_results}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  handleTavilyConfigUpdate(activeAgentIndex, 'max_results', value === '' ? 3 : parseInt(value) || 3);
                                }}
                              />
                            </div>
                          </div>

                          {/* Additional Search Options */}
                          <div className="space-y-3">
                            <Label className="text-sm font-medium">Search Options</Label>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex items-center space-x-2 p-2 border rounded">
                                <Checkbox
                                  id={`tavily-include-answer-${activeAgentIndex}`}
                                  checked={currentAgent.tavily_config.include_answer}
                                  onCheckedChange={(checked) => 
                                    handleTavilyConfigUpdate(activeAgentIndex, 'include_answer', checked)
                                  }
                                />
                                <div>
                                  <Label htmlFor={`tavily-include-answer-${activeAgentIndex}`} className="text-sm font-medium">
                                    Include Answer
                                  </Label>
                                  <p className="text-xs text-muted-foreground">Get direct answers from search</p>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2 p-2 border rounded bg-green-50 border-green-200">
                                <Checkbox
                                  id={`tavily-include-images-${activeAgentIndex}`}
                                  checked={true}
                                  disabled={true}
                                />
                                <div>
                                  <Label htmlFor={`tavily-include-images-${activeAgentIndex}`} className="text-sm font-medium text-green-700">
                                    Include Images ✓
                                  </Label>
                                  <p className="text-xs text-green-600">Always enabled for better results</p>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2 p-2 border rounded">
                                <Checkbox
                                  id={`tavily-include-raw-${activeAgentIndex}`}
                                  checked={currentAgent.tavily_config.include_raw_content}
                                  onCheckedChange={(checked) => 
                                    handleTavilyConfigUpdate(activeAgentIndex, 'include_raw_content', checked)
                                  }
                                />
                                <div>
                                  <Label htmlFor={`tavily-include-raw-${activeAgentIndex}`} className="text-sm font-medium">
                                    Include Raw Content
                                  </Label>
                                  <p className="text-xs text-muted-foreground">Get full page content</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Summary */}
      {agents.length > 0 && (
        <Alert>
          <Bot className="h-4 w-4" />
          <AlertDescription>
            {agents.length} agent{agents.length !== 1 ? 's' : ''} configured.
            {agents.filter(a => a.hitl_config?.enabled).length > 0 && (
              <> {agents.filter(a => a.hitl_config?.enabled).length} with HITL enabled.</>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export { AgentConfigurationForm };
export default AgentConfigurationForm;
