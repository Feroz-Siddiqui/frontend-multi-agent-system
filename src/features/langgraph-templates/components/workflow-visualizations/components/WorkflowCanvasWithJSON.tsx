/**
 * Workflow Canvas with Keyboard Shortcuts
 * Enhanced ReactFlow canvas with Ctrl+C/Ctrl+V and download functionality
 */

import React, { useCallback, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  Panel,
  ConnectionMode,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  type EdgeTypes,
  type NodeChange,
  type EdgeChange
} from 'reactflow';
import { Button } from '../../../../../components/ui/button';
import { Download, Zap } from 'lucide-react';
import type { Agent, WorkflowConfig, Template } from '../../../types';

interface WorkflowCanvasWithJSONProps {
  nodes: Node[];
  edges: Edge[];
  agents: Agent[];
  workflow: WorkflowConfig;
  nodeTypes: NodeTypes;
  edgeTypes: EdgeTypes;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onNodeClick?: (event: React.MouseEvent, node: Node) => void;
  onEdgeClick?: (event: React.MouseEvent, edge: Edge) => void;
  onPasteWorkflow?: (templateData: Partial<Template>) => void;
  workflowType: string;
  className?: string;
}

export function WorkflowCanvasWithJSON({
  nodes,
  edges,
  agents,
  workflow,
  nodeTypes,
  edgeTypes,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onEdgeClick,
  onPasteWorkflow,
  workflowType,
  className
}: WorkflowCanvasWithJSONProps) {

  // Generate complete template JSON for copy/paste
  const generateTemplateJSON = useCallback(() => {
    // Get agent IDs
    const agentIds = agents.map(a => a.id || a.name);
    
    // Keep complete graph structure including start/end edges for proper workflow recreation
    const cleanedGraphStructure = workflow.graph_structure ? {
      ...workflow.graph_structure,
      // Include actual agent nodes
      nodes: agentIds,
      // Keep ALL edges including start/end for complete workflow recreation
      edges: workflow.graph_structure.edges,
      // Preserve entry point and exit points
      entry_point: workflow.graph_structure.entry_point || agentIds[0] || '',
      exit_points: workflow.graph_structure.exit_points || [agentIds[agentIds.length - 1] || '']
    } : {
      nodes: agentIds,
      edges: [],
      entry_point: agentIds[0] || '',
      exit_points: agentIds.slice(-1), // Last agent as exit point
      graph_id: `graph_${Date.now()}`,
      version: "1.0",
      is_valid: true,
      validation_errors: [],
      validation_warnings: []
    };

    const templateData: Partial<Template> = {
      name: `Workflow Template - ${new Date().toLocaleDateString()}`,
      description: `${workflowType} workflow with ${agents.length} agents`,
      agents: agents.map(agent => ({
        ...agent,
        // Ensure we have clean agent data
        id: agent.id || `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      })),
      workflow: {
        ...workflow,
        // Use cleaned graph structure without virtual nodes
        graph_structure: cleanedGraphStructure,
        // Ensure entry_point matches the graph structure
        entry_point: cleanedGraphStructure.entry_point
      }
    };

    return templateData;
  }, [agents, workflow, workflowType]);

  // Copy workflow as JSON
  const handleCopyJSON = useCallback(async () => {
    try {
      const templateData = generateTemplateJSON();
      const jsonString = JSON.stringify(templateData, null, 2);
      
      await navigator.clipboard.writeText(jsonString);
      
      console.log(`✅ Workflow copied: ${agents.length} agents`);
    } catch (error) {
      console.error('Failed to copy workflow:', error);
    }
  }, [generateTemplateJSON, agents.length]);

  // Paste workflow from JSON
  const handlePasteJSON = useCallback(async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      
      if (!clipboardText.trim()) {
        console.warn('Clipboard is empty');
        return;
      }

      // Parse JSON
      let templateData: Partial<Template>;
      try {
        templateData = JSON.parse(clipboardText);
      } catch {
        console.error('Invalid JSON in clipboard');
        return;
      }

      // Validate template structure
      if (!templateData.agents || !Array.isArray(templateData.agents)) {
        console.error('Invalid template structure');
        return;
      }

      // Apply the pasted workflow
      if (onPasteWorkflow) {
        onPasteWorkflow(templateData);
        console.log(`✅ Workflow pasted: ${templateData.agents.length} agents`);
      }
    } catch (error) {
      console.error('Failed to paste workflow:', error);
    }
  }, [onPasteWorkflow]);

  // Download workflow as JSON file
  const handleDownloadJSON = useCallback(() => {
    try {
      const templateData = generateTemplateJSON();
      const jsonString = JSON.stringify(templateData, null, 2);
      
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `workflow-${workflowType}-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      console.log('✅ Workflow downloaded as JSON');
    } catch (error) {
      console.error('Failed to download workflow:', error);
    }
  }, [generateTemplateJSON, workflowType]);

  // Keyboard shortcuts for copy/paste
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle copy/paste when canvas is focused
      const canvasElement = document.querySelector('.react-flow');
      const isCanvasFocused = canvasElement?.contains(document.activeElement) || 
                             canvasElement?.matches(':hover');
      
      if (!isCanvasFocused) return;
      
      // Check for Ctrl+C or Cmd+C (Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        event.preventDefault();
        handleCopyJSON();
      }
      
      // Check for Ctrl+V or Cmd+V (Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
        event.preventDefault();
        handlePasteJSON();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleCopyJSON, handlePasteJSON]);

  return (
    <div className={`relative h-full w-full ${className}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.4, maxZoom: 0.8 }}
        attributionPosition="bottom-left"
        className="bg-white"
      >

        {/* Download Panel */}
        <Panel position="bottom-right" className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadJSON}
            className="text-xs"
            title="Download workflow as JSON file"
          >
            <Download className="h-3 w-3 mr-1" />
            Download JSON
          </Button>
        </Panel>

        {/* Controls & MiniMap */}
        <Controls className="bg-white border border-gray-200 rounded-lg shadow-sm" />
        <MiniMap 
          className="bg-white border border-gray-200 rounded-lg shadow-sm"
          nodeColor={(node) => {
            if (node.type === 'startNode') return '#10b981';
            if (node.type === 'endNode') return '#ef4444';
            return '#3b82f6';
          }}
        />
        <Background gap={20} size={1} className="bg-gray-50" />

        {/* Instructions */}
        <Panel position="bottom-center" className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <div className="text-xs text-gray-600 text-center">
            <div className="font-medium mb-1 flex items-center justify-center gap-1">
              <Zap className="h-3 w-3" />
              Workflow Builder
            </div>
            <div>
              • <strong>Drag agents</strong> to reposition • <strong>Connect handles</strong> for custom flows • <strong>Ctrl+C/Ctrl+V</strong> to copy/paste workflows
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
