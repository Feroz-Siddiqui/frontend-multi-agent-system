/**
 * Advanced Tavily Configuration Panel
 * 
 * Comprehensive configuration for all Tavily APIs with token management
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Switch } from '../../../components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Separator } from '../../../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { 
  Search, 
  FileText, 
  Globe, 
  Map, 
  Settings, 
  AlertTriangle,
  Info,
  Zap,
  DollarSign,
  Clock
} from 'lucide-react';
import type { TavilyConfig } from '../types';

interface TavilyConfigurationPanelProps {
  config: TavilyConfig;
  onUpdate: (updates: Partial<TavilyConfig>) => void;
  agentModel?: string;
}

const CONFIGURATION_PRESETS = {
  basic: {
    name: 'Basic Research',
    config: {
      search_api: true,
      extract_api: false,
      crawl_api: false,
      map_api: false,
      max_results: 3,
      search_depth: 'basic' as const,
      max_credits_per_agent: 5,
    }
  },
  comprehensive: {
    name: 'Comprehensive Analysis',
    config: {
      search_api: true,
      extract_api: true,
      crawl_api: false,
      map_api: false,
      max_results: 5,
      search_depth: 'advanced' as const,
      extract_depth: 'advanced' as const,
      max_credits_per_agent: 15,
    }
  },
  full: {
    name: 'Full Suite',
    config: {
      search_api: true,
      extract_api: true,
      crawl_api: true,
      map_api: true,
      max_results: 5,
      search_depth: 'advanced' as const,
      extract_depth: 'advanced' as const,
      max_crawl_depth: 2,
      max_map_depth: 2,
      max_credits_per_agent: 25,
    }
  }
};

export function TavilyConfigurationPanel({ 
  config, 
  onUpdate, 
  agentModel = 'gpt-4' 
}: TavilyConfigurationPanelProps) {
  const [activeTab, setActiveTab] = useState('apis');

  // Calculate estimated token usage
  const estimateTokenUsage = () => {
    let tokens = 0;
    if (config.search_api) {
      tokens += config.max_results * (config.search_depth === 'advanced' ? 150 : 100);
    }
    if (config.extract_api) {
      tokens += config.extract_depth === 'advanced' ? 800 : 400;
    }
    if (config.crawl_api) {
      tokens += config.max_crawl_depth * 300;
    }
    if (config.map_api) {
      tokens += config.max_map_depth * 100;
    }
    return tokens;
  };

  // Get model-specific warnings
  const getModelWarnings = () => {
    const estimatedTokens = estimateTokenUsage();
    const warnings = [];
    
    if (agentModel === 'gpt-3.5-turbo' && estimatedTokens > 3000) {
      warnings.push('High token usage may cause context overflow with GPT-3.5');
    }
    if (agentModel === 'gpt-4' && estimatedTokens > 6000) {
      warnings.push('Very high token usage - consider reducing API scope');
    }
    
    return warnings;
  };

  const handleUpdate = (field: keyof TavilyConfig, value: string | number | boolean | string[] | null | undefined) => {
    onUpdate({ [field]: value });
  };

  const applyPreset = (presetKey: keyof typeof CONFIGURATION_PRESETS) => {
    const preset = CONFIGURATION_PRESETS[presetKey];
    onUpdate(preset.config);
  };

  const enabledAPIs = [
    config.search_api && 'Search',
    config.extract_api && 'Extract',
    config.crawl_api && 'Crawl',
    config.map_api && 'Map'
  ].filter(Boolean);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Tavily API Configuration
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Configure web search and data extraction capabilities
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {enabledAPIs.length} API{enabledAPIs.length !== 1 ? 's' : ''} enabled
            </Badge>
            <Badge variant="secondary" className="text-xs">
              ~{estimateTokenUsage()} tokens
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Configuration Presets */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Quick Presets</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.entries(CONFIGURATION_PRESETS).map(([key, preset]) => (
              <Button
                key={key}
                variant="outline"
                size="sm"
                onClick={() => applyPreset(key as keyof typeof CONFIGURATION_PRESETS)}
                className="h-auto p-3 text-left"
              >
                <div className="font-medium text-xs">{preset.name}</div>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Model Warnings */}
        {getModelWarnings().length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <div className="space-y-1">
                {getModelWarnings().map((warning, index) => (
                  <div key={index}>• {warning}</div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Configuration Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="apis" className="text-xs">APIs</TabsTrigger>
            <TabsTrigger value="search" className="text-xs">Search</TabsTrigger>
            <TabsTrigger value="advanced" className="text-xs">Advanced</TabsTrigger>
            <TabsTrigger value="limits" className="text-xs">Limits</TabsTrigger>
          </TabsList>

          {/* API Selection Tab */}
          <TabsContent value="apis" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search API */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-blue-600" />
                      <Label className="font-medium">Search API</Label>
                    </div>
                    <Switch
                      checked={config.search_api}
                      onCheckedChange={(checked) => handleUpdate('search_api', checked)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Real-time web search with AI-powered results
                  </p>
                  {config.search_api && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      ~{config.max_results * (config.search_depth === 'advanced' ? 150 : 100)} tokens
                    </Badge>
                  )}
                </CardContent>
              </Card>

              {/* Extract API */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-green-600" />
                      <Label className="font-medium">Extract API</Label>
                    </div>
                    <Switch
                      checked={config.extract_api}
                      onCheckedChange={(checked) => handleUpdate('extract_api', checked)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Extract clean content from web pages
                  </p>
                  {config.extract_api && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      ~{config.extract_depth === 'advanced' ? 800 : 400} tokens
                    </Badge>
                  )}
                </CardContent>
              </Card>

              {/* Crawl API */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-orange-600" />
                      <Label className="font-medium">Crawl API</Label>
                      <Badge variant="outline" className="text-xs">BETA</Badge>
                    </div>
                    <Switch
                      checked={config.crawl_api}
                      onCheckedChange={(checked) => handleUpdate('crawl_api', checked)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Deep crawl websites for comprehensive data
                  </p>
                  {config.crawl_api && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      ~{config.max_crawl_depth * 300} tokens
                    </Badge>
                  )}
                </CardContent>
              </Card>

              {/* Map API */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Map className="h-4 w-4 text-purple-600" />
                      <Label className="font-medium">Map API</Label>
                      <Badge variant="outline" className="text-xs">BETA</Badge>
                    </div>
                    <Switch
                      checked={config.map_api}
                      onCheckedChange={(checked) => handleUpdate('map_api', checked)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Generate site maps and navigation structure
                  </p>
                  {config.map_api && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      ~{config.max_map_depth * 100} tokens
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Search Configuration Tab */}
          <TabsContent value="search" className="space-y-4">
            {config.search_api ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Search Depth</Label>
                    <Select 
                      value={config.search_depth} 
                      onValueChange={(value: 'basic' | 'advanced') => handleUpdate('search_depth', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic (faster, fewer tokens)</SelectItem>
                        <SelectItem value="advanced">Advanced (comprehensive, more tokens)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Max Results</Label>
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      value={config.max_results}
                      onChange={(e) => {
                        const value = e.target.value;
                        handleUpdate('max_results', value === '' ? 3 : parseInt(value) || 3);
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Time Range</Label>
                    <Select 
                      value={config.time_range || 'none'} 
                      onValueChange={(value) => handleUpdate('time_range', value === 'none' ? null : value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No restriction</SelectItem>
                        <SelectItem value="day">Past day</SelectItem>
                        <SelectItem value="week">Past week</SelectItem>
                        <SelectItem value="month">Past month</SelectItem>
                        <SelectItem value="year">Past year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Input
                      placeholder="e.g., US, UK, CA"
                      value={config.country || ''}
                      onChange={(e) => handleUpdate('country', e.target.value || undefined)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Search Options</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Include AI Answer</Label>
                      <Switch
                        checked={config.include_answer}
                        onCheckedChange={(checked) => handleUpdate('include_answer', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Include Images</Label>
                      <Switch
                        checked={config.include_images}
                        onCheckedChange={(checked) => handleUpdate('include_images', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Include Raw Content</Label>
                      <Switch
                        checked={config.include_raw_content}
                        onCheckedChange={(checked) => handleUpdate('include_raw_content', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Enable Search API to configure search options.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Advanced Configuration Tab */}
          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-4">
              {/* Extract API Settings */}
              {config.extract_api && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Extract API Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Extract Depth</Label>
                        <Select 
                          value={config.extract_depth} 
                          onValueChange={(value: 'basic' | 'advanced') => handleUpdate('extract_depth', value)}
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
                        <Label>Format</Label>
                        <Select 
                          value={config.format} 
                          onValueChange={(value: 'markdown' | 'text') => handleUpdate('format', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="markdown">Markdown</SelectItem>
                            <SelectItem value="text">Plain Text</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Crawl API Settings */}
              {config.crawl_api && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Crawl API Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Max Crawl Depth</Label>
                        <Input
                          type="number"
                          min="1"
                          max="5"
                          value={config.max_crawl_depth}
                          onChange={(e) => {
                            const value = e.target.value;
                            handleUpdate('max_crawl_depth', value === '' ? 3 : parseInt(value) || 3);
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Crawl Limit</Label>
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          value={config.crawl_limit}
                          onChange={(e) => {
                            const value = e.target.value;
                            handleUpdate('crawl_limit', value === '' ? 50 : parseInt(value) || 50);
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Crawl Instructions</Label>
                      <Textarea
                        placeholder="Optional instructions for crawling behavior..."
                        value={config.crawl_instructions || ''}
                        onChange={(e) => handleUpdate('crawl_instructions', e.target.value || undefined)}
                        className="min-h-[60px]"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Map API Settings */}
              {config.map_api && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Map API Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Max Map Depth</Label>
                        <Input
                          type="number"
                          min="1"
                          max="3"
                          value={config.max_map_depth}
                          onChange={(e) => {
                            const value = e.target.value;
                            handleUpdate('max_map_depth', value === '' ? 2 : parseInt(value) || 2);
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Map Instructions</Label>
                      <Textarea
                        placeholder="Optional instructions for site mapping..."
                        value={config.map_instructions || ''}
                        onChange={(e) => handleUpdate('map_instructions', e.target.value || undefined)}
                        className="min-h-[60px]"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Limits & Performance Tab */}
          <TabsContent value="limits" className="space-y-4">
            <div className="space-y-4">
              {/* Cost Management */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Cost Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Max Credits per Agent</Label>
                      <Input
                        type="number"
                        min="1"
                        max="50"
                        value={config.max_credits_per_agent}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleUpdate('max_credits_per_agent', value === '' ? 10 : parseInt(value) || 10);
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Estimated Credits</Label>
                      <Input
                        type="number"
                        min="0"
                        value={config.estimated_credits || 0}
                        onChange={(e) => handleUpdate('estimated_credits', parseInt(e.target.value) || 0)}
                        disabled
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Settings */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Performance Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Timeout (seconds)</Label>
                      <Input
                        type="number"
                        min="10"
                        max="120"
                        value={config.timeout_seconds}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleUpdate('timeout_seconds', value === '' ? 30 : parseInt(value) || 30);
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Retry Attempts</Label>
                      <Input
                        type="number"
                        min="0"
                        max="3"
                        value={config.retry_attempts}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleUpdate('retry_attempts', value === '' ? 2 : parseInt(value) || 2);
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Fallback Configuration */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Fallback Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Enable Fallback</Label>
                      <Switch
                        checked={config.fallback_enabled}
                        onCheckedChange={(checked) => handleUpdate('fallback_enabled', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Continue Without Tavily</Label>
                      <Switch
                        checked={config.continue_without_tavily}
                        onCheckedChange={(checked) => handleUpdate('continue_without_tavily', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Summary */}
        <Alert>
          <Zap className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <div className="space-y-1">
              <div>
                <strong>Configuration Summary:</strong> {enabledAPIs.join(', ') || 'No APIs enabled'}
              </div>
              <div>
                <strong>Estimated Token Usage:</strong> ~{estimateTokenUsage()} tokens
              </div>
              <div>
                <strong>Max Credits:</strong> {config.max_credits_per_agent} credits per agent
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

export default TavilyConfigurationPanel;
