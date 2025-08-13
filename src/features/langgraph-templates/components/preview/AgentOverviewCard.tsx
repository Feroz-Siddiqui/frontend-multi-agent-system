/**
 * Agent Overview Card Component
 * Shows detailed agent configuration in preview
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../../../components/ui/collapsible';
import { Button } from '../../../../components/ui/button';
import { 
  Bot, 
  ChevronDown,
  ChevronRight,
  Clock,
  Thermometer,
  Zap,
  Search
} from 'lucide-react';

import type { Agent } from '../../types';

interface AgentOverviewCardProps {
  agents: Agent[];
}

function AgentItem({ agent, index }: { agent: Agent; index: number }) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border rounded-lg p-3">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                {index + 1}
              </div>
              <div className="text-left">
                <div className="font-medium">{agent.name}</div>
                <div className="text-sm text-muted-foreground">
                  {agent.type} • {agent.llm_config.model}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {agent.type}
              </Badge>
              {agent.tavily_config && (
                <Badge variant="secondary" className="text-xs">
                  <Search className="w-3 h-3 mr-1" />
                  Tavily
                </Badge>
              )}
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-3 pt-3 border-t">
          <div className="space-y-3 text-sm">
            {/* System Prompt */}
            <div>
              <div className="font-medium text-muted-foreground mb-1">System Prompt</div>
              <div className="text-xs bg-gray-50 p-2 rounded border">
                {agent.system_prompt}
              </div>
            </div>

            {/* User Prompt */}
            <div>
              <div className="font-medium text-muted-foreground mb-1">User Prompt</div>
              <div className="text-xs bg-gray-50 p-2 rounded border">
                {agent.user_prompt}
              </div>
            </div>

            {/* Configuration */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-orange-500" />
                <span className="text-xs">Temp: {agent.llm_config.temperature}</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-500" />
                <span className="text-xs">Tokens: {agent.llm_config.max_tokens}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-500" />
                <span className="text-xs">Timeout: {agent.timeout_seconds}s</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 text-center text-purple-500 font-bold text-xs">#</span>
                <span className="text-xs">Priority: {agent.priority}</span>
              </div>
            </div>

            {/* Tavily Configuration */}
            {agent.tavily_config && (
              <div>
                <div className="font-medium text-muted-foreground mb-1">Tavily Configuration</div>
                <div className="text-xs space-y-1">
                  <div>Search Depth: {agent.tavily_config.search_depth}</div>
                  <div>Max Results: {agent.tavily_config.max_results}</div>
                  <div>Include Answer: {agent.tavily_config.include_answer ? 'Yes' : 'No'}</div>
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function AgentOverviewCard({ agents }: AgentOverviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Bot className="h-4 w-4" />
          Agents ({agents.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {agents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No agents configured</p>
          </div>
        ) : (
          <div className="space-y-3">
            {agents.map((agent, index) => (
              <AgentItem key={agent.id || index} agent={agent} index={index} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
