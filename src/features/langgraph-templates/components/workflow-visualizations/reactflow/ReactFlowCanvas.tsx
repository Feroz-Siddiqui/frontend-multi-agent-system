/**
 * React Flow Canvas Component
 * Professional interactive workflow builder with drag-and-drop
 */

import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ConnectionMode,
  Panel
} from 'reactflow';
import type { Node, Edge, Connection, NodeTypes, EdgeTypes } from 'reactflow';
import 'reactflow/dist/style.css';

import { CustomAgentNode } from './CustomAgentNode';
import { StartNode, EndNode } from './StartEndNodes';
import { CustomWorkflowEdge } from './CustomWorkflowEdge';
import { Button } from '../../../../../components/ui/button';
import { RotateCcw, Download, Network } from 'lucide-react';
import type { Agent, WorkflowConfig } from '../../../types';

interface ReactFlowCanvasProps {
  agents: Agent[];
  workflow: WorkflowConfig;
  onUpdateWorkflow: (updates: Partial<WorkflowConfig>) => void;
  onSetEntryPoint: (agentId: string) => void;
}

// Node types for React Flow
const nodeTypes: NodeTypes = {
  agentNode: CustomAgentNode,
  startNode: StartNode,
  endNode: EndNode,
};

// Edge types for React Flow
const edgeTypes: EdgeTypes = {
  workflowEdge: CustomWorkflowEdge,
};

// Smart positioning algorithm - Default to vertical layout
const calculateAgentPosition = (index: number, totalAgents: number) => {
  if (totalAgents <= 4) {
    // Vertical layout (default)
    return { x: 300, y: 100 + index * 150 };
  } else if (totalAgents <= 8) {
    // Two-column layout
    const col = Math.floor(index / 4);
    const row = index % 4;
    return { x: 300 + col * 250, y: 100 + row * 150 };
  } else {
    // Grid layout
    const cols = Math.ceil(Math.sqrt(totalAgents));
    const row = Math.floor(index / cols);
    const col = index % cols;
    return { x: 300 + col * 200, y: 100 + row * 150 };
  }
};

export function ReactFlowCanvas({
  agents,
  workflow,
  onUpdateWorkflow,
  onSetEntryPoint
}: ReactFlowCanvasProps) {
  
  // Transform agents to React Flow nodes
  const initialNodes = useMemo(() => {
    const nodes: Node[] = [];
    
    // Start Node
    nodes.push({
      id: 'start',
      type: 'startNode',
      position: { x: 50, y: 200 },
      data: { label: 'Start' },
      draggable: false,
      selectable: true
    });

    // Agent Nodes
    agents.forEach((agent, index) => {
      const agentId = agent.id || agent.name;
      const connectionCount = (workflow.graph_structure?.edges || [])
        .filter(e => e.from_node === agentId || e.to_node === agentId).length;

      nodes.push({
        id: agentId,
        type: 'agentNode',
        position: calculateAgentPosition(index, agents.length),
        data: {
          ...agent,
          index,
          isEntryPoint: workflow.entry_point === agentId,
          connectionCount
        },
        draggable: true,
        selectable: true
      });
    });

    // End Node - Position based on vertical layout
    const endY = agents.length <= 4 
      ? 100 + agents.length * 150 + 100  // Below the last agent
      : 600; // Fixed position for larger layouts
    nodes.push({
      id: 'end',
      type: 'endNode',
      position: { x: 600, y: endY },
      data: { label: 'End' },
      draggable: false,
      selectable: true
    });

    return nodes;
  }, [agents, workflow.entry_point, workflow.graph_structure]);

  // Transform backend edges to React Flow edges
  const initialEdges = useMemo(() => {
    const edges: Edge[] = [];
    
    // Add entry point edge
    if (workflow.entry_point) {
      edges.push({
        id: 'start-entry',
        source: 'start',
        target: workflow.entry_point,
        type: 'workflowEdge',
        data: {
          condition_type: 'always',
          sourceAgentName: 'Start',
          targetAgentName: agents.find(a => (a.id || a.name) === workflow.entry_point)?.name
        },
        animated: true
      });
    }

    // Add backend edges
    if (workflow.graph_structure?.edges) {
      workflow.graph_structure.edges.forEach(edge => {
        const sourceAgent = agents.find(a => (a.id || a.name) === edge.from_node);
        const targetAgent = agents.find(a => (a.id || a.name) === edge.to_node);
        
        edges.push({
          id: edge.edge_id || `${edge.from_node}-${edge.to_node}`,
          source: edge.from_node,
          target: edge.to_node,
          type: 'workflowEdge',
          data: {
            condition_type: edge.condition_type || 'always',
            condition: edge.condition,
            sourceAgentName: sourceAgent?.name,
            targetAgentName: targetAgent?.name || (edge.to_node === 'end' ? 'End' : edge.to_node)
          },
          animated: edge.condition_type === 'always'
        });
      });
    }

    return edges;
  }, [agents, workflow.entry_point, workflow.graph_structure]);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Handle new connections
  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;

    // Create new edge in backend format
    const newEdge = {
      from_node: connection.source,
      to_node: connection.target,
      condition_type: 'always' as const,
      condition: undefined,
      condition_data: undefined,
      edge_id: `edge_${Date.now()}`,
      description: `${connection.source} → ${connection.target}`,
      weight: 1.0
    };

    // Update backend
    const currentStructure = workflow.graph_structure;
    if (currentStructure) {
      const updatedEdges = [...(currentStructure.edges || []), newEdge];
      onUpdateWorkflow({
        graph_structure: {
          ...currentStructure,
          edges: updatedEdges
        }
      });
    }

    // Update React Flow
    const reactFlowEdge = {
      id: newEdge.edge_id,
      source: connection.source,
      target: connection.target,
      type: 'workflowEdge',
      data: {
        condition_type: 'always' as const,
        sourceAgentName: agents.find(a => (a.id || a.name) === connection.source)?.name,
        targetAgentName: connection.target === 'end' ? 'End' : agents.find(a => (a.id || a.name) === connection.target)?.name
      },
      animated: true
    };

    setEdges((eds) => addEdge(reactFlowEdge, eds));
  }, [agents, workflow.graph_structure, onUpdateWorkflow, setEdges]);

  // Handle node clicks for entry point setting
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (node.type === 'agentNode') {
      onSetEntryPoint(node.id);
    }
  }, [onSetEntryPoint]);

  // Auto-layout function
  const autoLayout = useCallback(() => {
    const layoutedNodes = nodes.map((node) => {
      if (node.type === 'startNode') {
        return { ...node, position: { x: 50, y: 200 } };
      } else if (node.type === 'endNode') {
        const endY = agents.length <= 4 
          ? 100 + agents.length * 150 + 100  // Below the last agent
          : 600; // Fixed position for larger layouts
        return { ...node, position: { x: 600, y: endY } };
      } else if (node.type === 'agentNode') {
        const agentIndex = agents.findIndex(a => (a.id || a.name) === node.id);
        return { 
          ...node, 
          position: calculateAgentPosition(agentIndex, agents.length) 
        };
      }
      return node;
    });
    
    setNodes(layoutedNodes);
  }, [nodes, agents, setNodes]);

  // Export function
  const exportWorkflow = useCallback(() => {
    // This would implement export functionality
    console.log('Export workflow:', { nodes, edges });
  }, [nodes, edges]);

  return (
    <div className="h-[600px] w-full border-2 border-gray-200 rounded-lg bg-gray-50 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        attributionPosition="bottom-left"
        className="bg-white"
      >
        {/* Controls */}
        <Controls className="bg-white border border-gray-200 rounded-lg shadow-sm" />
        
        {/* MiniMap */}
        <MiniMap 
          className="bg-white border border-gray-200 rounded-lg shadow-sm"
          nodeColor={(node) => {
            if (node.type === 'startNode') return '#10b981';
            if (node.type === 'endNode') return '#ef4444';
            return '#3b82f6';
          }}
        />
        
        {/* Background */}
        <Background gap={20} size={1} className="bg-gray-50" />

        {/* Header Panel */}
        <Panel position="top-left" className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Workflow Builder</h3>
          </div>
        </Panel>

        {/* Toolbar Panel */}
        <Panel position="top-right" className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={autoLayout}
            className="bg-white shadow-sm"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Auto Layout
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportWorkflow}
            className="bg-white shadow-sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </Panel>

        {/* Instructions Panel */}
        <Panel position="bottom-center" className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <div className="text-xs text-gray-600 text-center">
            <div className="font-medium mb-1">💡 How to use:</div>
            <div>• <strong>Drag agents</strong> to reposition • <strong>Connect handles</strong> to create edges • <strong>Click agents</strong> to set entry point</div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
