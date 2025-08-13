/**
 * Add Agent Dialog Component - Unified Layout without Card Wrappers
 * Modal dialog for adding new agents with maximum space utilization
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../../../components/ui/dialog';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Label } from '../../../../../components/ui/label';
import { Textarea } from '../../../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../components/ui/select';
import { Switch } from '../../../../../components/ui/switch';
import { Badge } from '../../../../../components/ui/badge';
import { User, Brain, Search, Settings, MessageSquare, Globe } from 'lucide-react';
import type { Agent, AgentType, LLMModel } from '../../../types';
import { DEFAULT_AGENT, AGENT_TYPE_CONFIGS, LLM_MODEL_CONFIGS } from '../../../types';

interface AddAgentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAgent: (agent: Omit<Agent, 'id'>) => void;
}

export function AddAgentDialog({ isOpen, onClose, onAddAgent }: AddAgentDialogProps) {
  const [formData, setFormData] = useState<Omit<Agent, 'id'>>({
    ...DEFAULT_AGENT,
    name: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Agent name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Agent name must be 100 characters or less';
    }
    
    if (formData.system_prompt.length < 10) {
      newErrors.system_prompt = 'System prompt must be at least 10 characters';
    } else if (formData.system_prompt.length > 2000) {
      newErrors.system_prompt = 'System prompt must be 2000 characters or less';
    }
    
    if (formData.user_prompt.length < 10) {
      newErrors.user_prompt = 'User prompt must be at least 10 characters';
    } else if (formData.user_prompt.length > 1000) {
      newErrors.user_prompt = 'User prompt must be 1000 characters or less';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Add agent
    onAddAgent(formData);
    
    // Reset form
    setFormData({
      ...DEFAULT_AGENT,
      name: '',
    });
    setErrors({});
    onClose();
  };

  const handleCancel = () => {
    setFormData({
      ...DEFAULT_AGENT,
      name: '',
    });
    setErrors({});
    onClose();
  };

  const updateFormData = (updates: Partial<Omit<Agent, 'id'>>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    // Clear related errors
    const newErrors = { ...errors };
    Object.keys(updates).forEach(key => {
      delete newErrors[key];
    });
    setErrors(newErrors);
  };

  const updateLLMConfig = (updates: Partial<Agent['llm_config']>) => {
    updateFormData({
      llm_config: { ...formData.llm_config, ...updates }
    });
  };

  const updateTavilyConfig = (updates: Partial<Agent['tavily_config']>) => {
    updateFormData({
      tavily_config: { ...formData.tavily_config, ...updates }
    });
  };

  const hasTavilyEnabled = formData.tavily_config.search_api || 
                          formData.tavily_config.extract_api || 
                          formData.tavily_config.crawl_api || 
                          formData.tavily_config.map_api;

  const enabledApisCount = [
    formData.tavily_config.search_api,
    formData.tavily_config.extract_api,
    formData.tavily_config.crawl_api,
    formData.tavily_config.map_api
  ].filter(Boolean).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[85vh]">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Add New Agent
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 grid grid-cols-2 gap-8 min-h-0">
          {/* Left Column: Basic Info + Prompts */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-4 w-4" />
                <span className="font-medium">Basic Information</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Agent Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateFormData({ name: e.target.value })}
                    placeholder="e.g., Research Agent"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Agent Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: AgentType) => updateFormData({ type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(AGENT_TYPE_CONFIGS).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Prompts Section */}
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4" />
                <span className="font-medium">Prompts</span>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="system_prompt">System Prompt *</Label>
                  <Textarea
                    id="system_prompt"
                    value={formData.system_prompt}
                    onChange={(e) => updateFormData({ system_prompt: e.target.value })}
                    placeholder="You are an expert research agent specializing in gathering comprehensive information from multiple sources."
                    rows={8}
                    className={`resize-none ${errors.system_prompt ? 'border-red-500' : ''}`}
                  />
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {errors.system_prompt && <span className="text-red-500">{errors.system_prompt}</span>}
                    </span>
                    <span className={`${formData.system_prompt.length > 1800 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                      {formData.system_prompt.length}/2000
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user_prompt">User Prompt *</Label>
                  <Textarea
                    id="user_prompt"
                    value={formData.user_prompt}
                    onChange={(e) => updateFormData({ user_prompt: e.target.value })}
                    placeholder="Research the following topic thoroughly: {query}"
                    rows={6}
                    className={`resize-none ${errors.user_prompt ? 'border-red-500' : ''}`}
                  />
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {errors.user_prompt && <span className="text-red-500">{errors.user_prompt}</span>}
                    </span>
                    <span className={`${formData.user_prompt.length > 900 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                      {formData.user_prompt.length}/1000
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: LLM Config + Tavily */}
          <div className="space-y-6">
            {/* LLM Configuration */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-4 w-4" />
                <span className="font-medium">LLM Configuration</span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Select
                    value={formData.llm_config.model}
                    onValueChange={(value: LLMModel) => updateLLMConfig({ model: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LLM_MODEL_CONFIGS).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input
                    id="temperature"
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={formData.llm_config.temperature}
                    onChange={(e) => updateLLMConfig({ temperature: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_tokens">Max Tokens</Label>
                  <Input
                    id="max_tokens"
                    type="number"
                    min="100"
                    max="4000"
                    step="100"
                    value={formData.llm_config.max_tokens}
                    onChange={(e) => updateLLMConfig({ max_tokens: parseInt(e.target.value) || 2500 })}
                  />
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timeout">Timeout (s)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    min="30"
                    max="3600"
                    value={formData.timeout_seconds}
                    onChange={(e) => updateFormData({ timeout_seconds: parseInt(e.target.value) || 600 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retry_count">Retry Count</Label>
                  <Input
                    id="retry_count"
                    type="number"
                    min="0"
                    max="3"
                    value={formData.retry_count}
                    onChange={(e) => updateFormData({ retry_count: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.priority}
                    onChange={(e) => updateFormData({ priority: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
            </div>

            {/* Tavily Integration */}
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Search className="h-4 w-4" />
                <span className="font-medium">Tavily Integration</span>
                {hasTavilyEnabled && (
                  <Badge variant="secondary" className="ml-2">
                    {enabledApisCount} API{enabledApisCount !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>

              {/* API Toggles */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-sm">Search API</span>
                  </div>
                  <Switch
                    checked={formData.tavily_config.search_api}
                    onCheckedChange={(checked) => updateTavilyConfig({ search_api: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-sm">Extract API</span>
                  </div>
                  <Switch
                    checked={formData.tavily_config.extract_api}
                    onCheckedChange={(checked) => updateTavilyConfig({ extract_api: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg opacity-75">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-orange-500" />
                    <span className="font-medium text-sm">Crawl API</span>
                  </div>
                  <Switch
                    checked={formData.tavily_config.crawl_api}
                    onCheckedChange={(checked) => updateTavilyConfig({ crawl_api: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg opacity-75">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-purple-500" />
                    <span className="font-medium text-sm">Map API</span>
                  </div>
                  <Switch
                    checked={formData.tavily_config.map_api}
                    onCheckedChange={(checked) => updateTavilyConfig({ map_api: checked })}
                  />
                </div>
              </div>

              {/* Search Settings (when Search API is enabled) */}
              {formData.tavily_config.search_api && (
                <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                  <div className="font-medium text-sm text-blue-800 dark:text-blue-200 mb-2">Search Settings</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Search Depth</Label>
                      <Select defaultValue="basic">
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Max Results</Label>
                      <Input type="number" defaultValue="3" min="1" max="50" className="h-8 text-xs" />
                    </div>
                  </div>
                </div>
              )}

              {/* Extract Settings (when Extract API is enabled) */}
              {formData.tavily_config.extract_api && (
                <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                  <div className="font-medium text-sm text-green-800 dark:text-green-200 mb-2">Extract Settings</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Format</Label>
                      <Select defaultValue="markdown">
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="markdown">Markdown</SelectItem>
                          <SelectItem value="text">Plain Text</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Timeout</Label>
                      <Input type="number" defaultValue="30" className="h-8 text-xs" />
                    </div>
                  </div>
                </div>
              )}

              {/* Cost Estimation */}
              {hasTavilyEnabled && (
                <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg text-center">
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    💰 ~{enabledApisCount * 2.5} credits per execution
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>

        <DialogFooter className="pt-4">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit}>
            Add Agent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
