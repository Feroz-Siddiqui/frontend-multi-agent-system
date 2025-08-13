/**
 * Agent List Panel Component
 * Scrollable panel for managing agents in the workflow
 */

import { useState } from 'react';
import { Button } from '../../../../../components/ui/button';
import { Badge } from '../../../../../components/ui/badge';
import { ScrollArea } from '../../../../../components/ui/scroll-area';
import { Separator } from '../../../../../components/ui/separator';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../../../../../components/ui/dropdown-menu';
import { 
  User, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Search, 
  MoreVertical,
  Grid3X3,
  ArrowRight,
  TreePine,
  Shuffle
} from 'lucide-react';
import type { Agent } from '../../../types';
import { AGENT_TYPE_CONFIGS } from '../../../types';
import { AddAgentDialog } from './AddAgentDialog';

interface AgentListPanelProps {
  agents: Agent[];
  onAddAgent: (agent: Omit<Agent, 'id'>) => void;
  onDeleteAgent: (agentId: string) => void;
  onDuplicateAgent: (agent: Agent) => void;
  onAutoLayout: (layoutType: 'grid' | 'chain' | 'tree' | 'smart') => void;
}

export function AgentListPanel({
  agents,
  onAddAgent,
  onDeleteAgent,
  onDuplicateAgent,
  onAutoLayout
}: AgentListPanelProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleAddAgent = (agentData: Omit<Agent, 'id'>) => {
    // Generate a unique ID for the agent
    const newAgent = {
      ...agentData,
      id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    onAddAgent(newAgent);
  };

  const handleDuplicateAgent = (agent: Agent) => {
    const duplicatedAgent = {
      ...agent,
      name: `${agent.name} (Copy)`,
      id: undefined // Remove ID so a new one gets generated
    };
    onDuplicateAgent(duplicatedAgent);
  };

  const getTavilyStatus = (agent: Agent) => {
    const config = agent.tavily_config;
    const enabledApis = [
      config.search_api && 'Search',
      config.extract_api && 'Extract',
      config.crawl_api && 'Crawl',
      config.map_api && 'Map'
    ].filter(Boolean);

    if (enabledApis.length === 0) return { enabled: false, label: 'None' };
    if (enabledApis.length === 1) return { enabled: true, label: enabledApis[0] };
    return { enabled: true, label: `${enabledApis.length} APIs` };
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="font-medium">Agent Configuration</span>
          <Badge variant="outline" className="text-xs">
            {agents.length}/15
          </Badge>
        </div>
      </div>

      {/* Add Agent Button */}
      <div className="p-4 border-b">
        <Button 
          onClick={() => setShowAddDialog(true)}
          className="w-full"
          size="sm"
          disabled={agents.length >= 15}
        >
          <Plus className="h-4 w-4 mr-2" />
          {agents.length >= 15 ? 'Maximum Agents Reached' : 'Add New Agent'}
        </Button>
        {agents.length >= 15 && (
          <p className="text-xs text-red-500 mt-2 text-center">
            Maximum of 15 agents allowed per template
          </p>
        )}
      </div>

      {/* Agent List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {agents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <div className="text-sm font-medium mb-1">No agents configured</div>
              <div className="text-xs">
                Click "Add New Agent" to get started
              </div>
            </div>
          ) : (
            agents.map((agent, index) => {
              const tavilyStatus = getTavilyStatus(agent);
              const agentTypeConfig = AGENT_TYPE_CONFIGS[agent.type];

              return (
                <div
                  key={agent.id || agent.name}
                  className="bg-card border rounded-lg p-3 space-y-2 hover:shadow-sm transition-shadow"
                >
                  {/* Agent Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">
                          {agent.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {agentTypeConfig.label}
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {/* TODO: Edit agent */}}>
                          <Edit className="h-3 w-3 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDuplicateAgent(agent)}
                          disabled={agents.length >= 15}
                        >
                          <Copy className="h-3 w-3 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDeleteAgent(agent.id || agent.name)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-3 w-3 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Agent Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Model:</span>
                      <span className="font-mono text-blue-600">
                        {agent.llm_config.model}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Temp:</span>
                      <span>{agent.llm_config.temperature}</span>
                    </div>
                  </div>

                  {/* Tavily Status */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Search className="h-3 w-3" />
                      Tavily:
                    </span>
                    <Badge 
                      variant={tavilyStatus.enabled ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {tavilyStatus.label}
                    </Badge>
                  </div>

                  {/* Advanced Settings Preview */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Timeout: {agent.timeout_seconds}s</span>
                    <span>Priority: {agent.priority}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Auto-Layout Tools */}
      {agents.length > 0 && (
        <>
          <Separator />
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Grid3X3 className="h-4 w-4" />
              <span className="font-medium text-sm">Auto-Layout</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAutoLayout('grid')}
                className="text-xs"
              >
                <Grid3X3 className="h-3 w-3 mr-1" />
                Grid
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAutoLayout('chain')}
                className="text-xs"
              >
                <ArrowRight className="h-3 w-3 mr-1" />
                Chain
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAutoLayout('tree')}
                className="text-xs"
              >
                <TreePine className="h-3 w-3 mr-1" />
                Tree
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAutoLayout('smart')}
                className="text-xs"
              >
                <Shuffle className="h-3 w-3 mr-1" />
                Smart
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Add Agent Dialog */}
      <AddAgentDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAddAgent={handleAddAgent}
      />
    </div>
  );
}
