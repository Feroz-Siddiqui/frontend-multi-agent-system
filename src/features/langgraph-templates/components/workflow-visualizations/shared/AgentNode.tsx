/**
 * Reusable Agent Node Component
 * 
 * Used across all workflow visualizations to display agent information
 * with consistent styling and interactive features.
 */

import React from 'react';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { 
  Clock, 
  DollarSign, 
  User, 
  AlertTriangle, 
  CheckCircle,
  Settings,
  Zap
} from 'lucide-react';
import type { Agent } from '../../../types';

interface AgentNodeProps {
  agent: Agent;
  index: number;
  isSelected?: boolean;
  showMetrics?: boolean;
  showControls?: boolean;
  className?: string;
  onClick?: () => void;
  onConfigure?: () => void;
  style?: React.CSSProperties;
}

const AGENT_TYPE_COLORS: Record<string, string> = {
  research: 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-100',
  analysis: 'bg-green-50 border-green-200 text-green-900 dark:bg-green-950/20 dark:border-green-800 dark:text-green-100',
  synthesis: 'bg-purple-50 border-purple-200 text-purple-900 dark:bg-purple-950/20 dark:border-purple-800 dark:text-purple-100',
  validation: 'bg-orange-50 border-orange-200 text-orange-900 dark:bg-orange-950/20 dark:border-orange-800 dark:text-orange-100'
};

const AGENT_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  research: Zap,
  analysis: CheckCircle,
  synthesis: Settings,
  validation: AlertTriangle
};

export function AgentNode({
  agent,
  index,
  isSelected = false,
  showMetrics = true,
  showControls = false,
  className = '',
  onClick,
  onConfigure,
  style
}: AgentNodeProps) {
  const typeColor = AGENT_TYPE_COLORS[agent.type] || AGENT_TYPE_COLORS.research;
  const TypeIcon = AGENT_TYPE_ICONS[agent.type] || AGENT_TYPE_ICONS.research;

  // Calculate estimated metrics
  const estimatedDuration = Math.round(agent.timeout_seconds / 60); // Convert to minutes
  const estimatedCost = (agent.llm_config.max_tokens * 0.00002).toFixed(3); // Rough estimate

  return (
    <div
      className={`
        relative p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer
        ${typeColor}
        ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
        ${onClick ? 'hover:shadow-md hover:scale-105' : ''}
        ${className}
      `}
      onClick={onClick}
      style={style}
    >
      {/* Agent Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TypeIcon className="h-4 w-4" />
          <Badge variant="secondary" className="text-xs">
            {index + 1}
          </Badge>
        </div>
        {showControls && onConfigure && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onConfigure();
            }}
            className="h-6 w-6 p-0"
          >
            <Settings className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Agent Name */}
      <div className="font-medium text-sm mb-1 truncate" title={agent.name}>
        {agent.name}
      </div>

      {/* Agent Type */}
      <div className="text-xs opacity-75 capitalize mb-2">
        {agent.type} Agent
      </div>

      {/* Status Indicators */}
      <div className="flex flex-wrap gap-1 mb-2">
        {agent.hitl_config?.enabled && (
          <Badge variant="outline" className="text-xs px-1 py-0">
            <User className="h-3 w-3 mr-1" />
            HITL
          </Badge>
        )}
        {agent.depends_on && agent.depends_on.length > 0 && (
          <Badge variant="outline" className="text-xs px-1 py-0">
            Deps: {agent.depends_on.length}
          </Badge>
        )}
        {agent.retry_count > 0 && (
          <Badge variant="outline" className="text-xs px-1 py-0">
            Retry: {agent.retry_count}
          </Badge>
        )}
      </div>

      {/* Metrics */}
      {showMetrics && (
        <div className="flex items-center justify-between text-xs opacity-75">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{estimatedDuration}min</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            <span>${estimatedCost}</span>
          </div>
        </div>
      )}

      {/* LLM Model Badge */}
      <div className="absolute -top-1 -right-1">
        <Badge variant="secondary" className="text-xs px-1 py-0">
          {agent.llm_config.model.replace('gpt-', '')}
        </Badge>
      </div>
    </div>
  );
}

export default AgentNode;
