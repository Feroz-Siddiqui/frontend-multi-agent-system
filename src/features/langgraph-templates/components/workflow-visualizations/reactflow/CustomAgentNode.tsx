/**
 * Custom Agent Node for React Flow
 * Professional draggable agent component with handles
 */

import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { Badge } from '../../../../../components/ui/badge';
import { User, Zap, Search } from 'lucide-react';
import type { Agent } from '../../../types';

interface AgentNodeData extends Agent {
  index: number;
  isEntryPoint: boolean;
  connectionCount: number;
}

export function CustomAgentNode({ data, selected }: NodeProps<AgentNodeData>) {
  // Check if agent has Tavily tools enabled
  const hasTavilyTools = data.tavily_config && (
    data.tavily_config.search_api || 
    data.tavily_config.extract_api || 
    data.tavily_config.crawl_api || 
    data.tavily_config.map_api
  );

  return (
    <div className={`
      bg-white border-2 rounded-lg shadow-lg min-w-[180px] p-3 relative
      ${selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'}
      ${data.isEntryPoint ? 'border-green-500 bg-green-50' : ''}
      hover:shadow-xl transition-all duration-200 cursor-move
    `}>
      {/* Agent Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
          {data.index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-gray-800 truncate">
            {data.name}
          </div>
          <div className="text-xs text-gray-500 capitalize flex items-center gap-1">
            <User className="h-3 w-3" />
            {data.type}
          </div>
        </div>
      </div>

      {/* Agent Details */}
      <div className="space-y-1 text-xs text-gray-600 mb-2">
        <div className="flex justify-between items-center">
          <span>Model:</span>
          <span className="font-mono text-blue-600">{data.llm_config.model}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Temperature:</span>
          <span>{data.llm_config.temperature}</span>
        </div>
        {data.connectionCount > 0 && (
          <div className="flex justify-between items-center">
            <span>Connections:</span>
            <Badge variant="outline" className="text-xs">
              {data.connectionCount}
            </Badge>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span>Tools:</span>
          <Badge 
            variant={hasTavilyTools ? "secondary" : "outline"} 
            className="text-xs flex items-center gap-1"
          >
            <Search className="h-3 w-3" />
            {hasTavilyTools ? "Tavily" : "None"}
          </Badge>
        </div>
      </div>

      {/* Entry Point Badge */}
      {data.isEntryPoint && (
        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
          <Zap className="h-3 w-3" />
          Entry
        </div>
      )}

      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500 border-2 border-white hover:bg-blue-600 transition-colors"
        style={{ left: -6 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-500 border-2 border-white hover:bg-blue-600 transition-colors"
        style={{ right: -6 }}
      />

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-blue-50 opacity-0 hover:opacity-10 rounded-lg transition-opacity pointer-events-none" />
    </div>
  );
}
