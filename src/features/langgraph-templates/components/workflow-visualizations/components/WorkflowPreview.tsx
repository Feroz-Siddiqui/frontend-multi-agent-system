/**
 * Workflow Preview Component
 * Adaptive visualization: detailed for small workflows, compact for large ones
 */

import React from 'react';
import { ArrowRight, Play, Square } from 'lucide-react';
import type { Agent, WorkflowConfig } from '../../../types';

interface WorkflowPreviewProps {
  agents: Agent[];
  workflow: WorkflowConfig;
  className?: string;
}

export function WorkflowPreview({ agents, workflow, className = '' }: WorkflowPreviewProps) {
  
  const getFlowType = () => {
    if (workflow.mode === 'parallel') return 'parallel';
    if (workflow.mode === 'conditional') return 'conditional';
    return 'sequential';
  };

  const flowType = getFlowType();
  const agentCount = agents.length;
  
  // Adaptive rendering: detailed for small workflows, compact for large ones
  const isDetailedMode = agentCount <= 4;

  if (agentCount === 0) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center text-gray-400">
          <div className="w-4 h-4 rounded-full bg-gray-300 mx-auto mb-2"></div>
          <p className="text-xs">No workflow</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
      {/* Flow Type Label */}
      <div className="text-xs text-gray-500 mb-4 capitalize font-medium">
        {flowType} • {agentCount} agent{agentCount !== 1 ? 's' : ''}
      </div>

      {/* Adaptive Flow Visualization */}
      <div className="flex items-center justify-center w-full">
        {isDetailedMode ? (
          // DETAILED MODE: Large nodes with full information (≤3 agents)
          <div className="space-y-4">
            {flowType === 'parallel' ? (
              // Detailed Parallel Flow
              <div className="flex flex-col items-center space-y-3">
                {/* Start Node */}
                <div className="flex items-center gap-3 px-4 py-2 bg-green-50 border border-green-200 rounded-lg shadow-sm">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <Play className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm font-medium text-green-700">Start</span>
                </div>
                
                {/* Connecting Line */}
                <div className="w-px h-4 bg-gray-300" />
                
                {/* Parallel Agent Nodes */}
                <div className="flex items-center space-x-6">
                  {agents.map((agent, index) => (
                    <div key={agent.id || agent.name} className="flex flex-col items-center">
                      <div className="relative group px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer min-w-[120px]">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                            {index + 1}
                          </div>
                          <span className="text-sm font-medium text-blue-700 truncate max-w-[80px]" title={agent.name}>{agent.name}</span>
                        </div>
                        <div className="text-xs text-blue-600">{agent.type}</div>
                        <div className="text-xs text-gray-500">{agent.llm_config.model}</div>
                        {/* Agent Node Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                          {agent.name} ({agent.type})
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Connecting Line */}
                <div className="w-px h-4 bg-gray-300" />
                
                {/* End Node */}
                <div className="flex items-center gap-3 px-4 py-2 bg-red-50 border border-red-200 rounded-lg shadow-sm">
                  <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                    <Square className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm font-medium text-red-700">End</span>
                </div>
              </div>
            ) : (
              // Detailed Sequential/Conditional Flow
              <div className="flex items-center space-x-4">
                {/* Start Node */}
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg shadow-sm">
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <Play className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm font-medium text-green-700">Start</span>
                </div>
                
                {/* Agent Nodes */}
                {agents.map((agent, index) => (
                  <React.Fragment key={agent.id || agent.name}>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                    <div className={`relative group px-4 py-3 border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer min-w-[120px] ${
                      flowType === 'conditional' 
                        ? 'bg-orange-50 border-orange-200' 
                        : 'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          flowType === 'conditional' ? 'bg-orange-500' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        <span className={`text-sm font-medium truncate max-w-[80px] ${
                          flowType === 'conditional' ? 'text-orange-700' : 'text-blue-700'
                        }`} title={agent.name}>{agent.name}</span>
                      </div>
                      <div className={`text-xs ${
                        flowType === 'conditional' ? 'text-orange-600' : 'text-blue-600'
                      }`}>{agent.type}</div>
                      <div className="text-xs text-gray-500">{agent.llm_config.model}</div>
                      {/* Agent Node Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                        {agent.name} ({agent.type})
                      </div>
                    </div>
                  </React.Fragment>
                ))}
                
                <ArrowRight className="h-5 w-5 text-gray-400" />
                
                {/* End Node */}
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg shadow-sm">
                  <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                    <Square className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm font-medium text-red-700">End</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          // COMPACT MODE: Small nodes for overview (4+ agents)
          <div className="space-y-3">
            {flowType === 'parallel' ? (
              // Compact Parallel Flow
              <div className="flex flex-col items-center space-y-2">
                {/* Start */}
                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center" title="Start">
                  <Play className="h-2 w-2 text-white" />
                </div>
                
                <div className="w-px h-3 bg-gray-300" />
                
                {/* Compact Agent Grid */}
                <div className="grid grid-cols-3 gap-2 max-w-[120px]">
                  {agents.map((agent, index) => (
                    <div 
                      key={agent.id || agent.name} 
                      className="relative group w-6 h-6 rounded bg-blue-500 flex items-center justify-center text-white text-xs font-bold hover:scale-110 transition-transform cursor-pointer"
                    >
                      {index + 1}
                      {/* Custom Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                        {agent.name} ({agent.type})
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="w-px h-3 bg-gray-300" />
                
                {/* End */}
                <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center" title="End">
                  <Square className="h-2 w-2 text-white" />
                </div>
              </div>
            ) : (
              // Compact Sequential/Conditional Flow
              <div className="flex items-center space-x-2 flex-wrap justify-center">
                {/* Start */}
                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center" title="Start">
                  <Play className="h-2 w-2 text-white" />
                </div>
                
                {/* Compact Agent Chain */}
                {agents.map((agent, index) => (
                  <React.Fragment key={agent.id || agent.name}>
                    <div className="w-3 h-px bg-gray-300" />
                    <div 
                      className={`relative group w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold hover:scale-110 transition-transform cursor-pointer ${
                        flowType === 'conditional' ? 'bg-orange-500' : 'bg-blue-500'
                      }`}
                    >
                      {index + 1}
                      {/* Custom Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                        {agent.name} ({agent.type})
                      </div>
                    </div>
                  </React.Fragment>
                ))}
                
                <div className="w-3 h-px bg-gray-300" />
                
                {/* End */}
                <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center" title="End">
                  <Square className="h-2 w-2 text-white" />
                </div>
              </div>
            )}
            
            {/* Compact Mode Summary */}
            <div className="text-center text-xs text-gray-400 mt-2">
              Hover nodes for details
            </div>
          </div>
        )}
      </div>

      {/* Mode Indicator */}
      <div className="mt-3 text-xs text-gray-400 text-center">
        {isDetailedMode ? '' : 'Overview Mode'}
      </div>
    </div>
  );
}

export default WorkflowPreview;
