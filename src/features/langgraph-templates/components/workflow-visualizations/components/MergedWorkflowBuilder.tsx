/**
 * Merged Workflow Builder
 * Combines agent configuration and workflow visualization in one interface
 */

import React, { useCallback, useMemo, useState } from 'react';
import { ReactFlowProvider } from 'reactflow';
import type { Node, Edge, Connection, NodeTypes, EdgeTypes } from 'reactflow';
import 'reactflow/dist/style.css';

import { CustomAgentNode } from '../reactflow/CustomAgentNode';
import { StartNode, EndNode } from '../reactflow/StartEndNodes';
import { UnifiedToolbar } from './UnifiedToolbar';
import { UnifiedConfigPanel } from './UnifiedConfigPanel';
import { EdgeConditionEditor } from './EdgeConditionEditor';
import { AgentListPanel } from './AgentListPanel';
import { WorkflowCanvasWithJSON } from './WorkflowCanvasWithJSON';
import { SequentialEdge } from '../edges/SequentialEdge';
import { ParallelEdge } from '../edges/ParallelEdge';
import { ConditionalEdge } from '../edges/ConditionalEdge';
import { CustomEdge } from '../edges/CustomEdge';
import { detectWorkflowType, createWorkflowTemplate } from '../utils/workflowUtils';
import { validateTemplate } from '../../../utils/comprehensive-validation';
import { Alert, AlertDescription } from '../../../../../components/ui/alert';
import { AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import type { Agent, WorkflowConfig, Template } from '../../../types';

// Unified node types for all workflow modes - defined outside component for performance
const nodeTypes: NodeTypes = {
  agentNode: CustomAgentNode,
  startNode: StartNode,
  endNode: EndNode,
};

// Unified edge types with different styles for different workflow types - defined outside component for performance
const edgeTypes: EdgeTypes = {
  sequential: SequentialEdge,
  parallel: ParallelEdge,
  conditional: ConditionalEdge,
  custom: CustomEdge,
};

interface MergedWorkflowBuilderProps {
  agents: Agent[];
  workflow: WorkflowConfig;
  onUpdateWorkflow: (updates: Partial<WorkflowConfig>) => void;
  onUpdateAgents: (agents: Agent[]) => void;
}

// Simple vertical positioning - clean and consistent
const calculateAgentPosition = (index: number) => {
  return { 
    x: 300,  // Fixed x position for clean vertical column
    y: 100 + index * 200  // 200px vertical spacing
  };
};

export function MergedWorkflowBuilder({
  agents,
  workflow,
  onUpdateWorkflow,
  onUpdateAgents
}: MergedWorkflowBuilderProps) {
  
  // Auto-detect current workflow type
  const workflowType = useMemo(() => 
    detectWorkflowType(workflow.graph_structure?.edges || [], workflow.graph_structure?.exit_points), 
    [workflow.graph_structure]
  );

  // Edge condition editor state
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [showConditionEditor, setShowConditionEditor] = useState(false);

  // State to store template-generated visual edges
  const [templateVisualEdges, setTemplateVisualEdges] = useState<Edge[]>([]);

  // State for node positions - this will trigger re-renders when positions change
  const [nodePositions, setNodePositions] = useState<{ [agentId: string]: { x: number; y: number } }>({});

  // Auto-create sequential workflow whenever agents are added
  React.useEffect(() => {
    if (agents.length > 0) {
      const agentIds = agents.map(agent => agent.id || agent.name);
      
      // Always create/update sequential workflow when agents change
      const template = createWorkflowTemplate('sequential', agents);
      
      const sequentialStructure = {
        nodes: agentIds,
        edges: template.edges,
        entry_point: agentIds[0],
        exit_points: [agentIds[agentIds.length - 1]],
        graph_id: workflow.graph_structure?.graph_id || `graph_${Date.now()}`,
        version: "1.0",
        is_valid: true,
        validation_errors: [],
        validation_warnings: []
      };
      
      onUpdateWorkflow({
        mode: 'sequential', // Always default to sequential
        graph_structure: sequentialStructure,
        entry_point: agentIds[0]
      });
      
      console.log(`✅ Auto-created sequential workflow for ${agents.length} agents`);
    } else if (agents.length === 0) {
      // Clear workflow when no agents
      onUpdateWorkflow({
        mode: 'sequential',
        graph_structure: undefined,
        entry_point: undefined
      });
    }
  }, [agents, onUpdateWorkflow]); // Remove workflow.graph_structure dependency to always update

  // Clean up - removed old visual edge restoration logic
  // All workflows now use unified backend edges

  // Transform agents to React Flow nodes
  const nodes = useMemo(() => {
    const nodeList: Node[] = [];
    
    // Start Node
    nodeList.push({
      id: 'start',
      type: 'startNode',
      position: { x: 50, y: 200 },
      data: { label: 'Start' },
      draggable: false,
      selectable: true
    });

    // Agent Nodes with smart positioning based on workflow type
    agents.forEach((agent, index) => {
      const agentId = agent.id || agent.name;
      
      // Calculate connection count from backend edges (unified for all workflow types)
      const connectionCount = (workflow.graph_structure?.edges || [])
        .filter(e => e.from_node === agentId || e.to_node === agentId).length;

      // Use custom position if available, otherwise use default calculation
      const position = nodePositions[agentId] || calculateAgentPosition(index);

      nodeList.push({
        id: agentId,
        type: 'agentNode',
        position,
        data: {
          ...agent,
          index,
          isEntryPoint: workflow.entry_point === agentId,
          connectionCount,
          workflowType
        },
        draggable: true,
        selectable: true
      });
    });

    // End Node - dynamic positioning to avoid overlaps with auto-layout
    const calculateEndPosition = () => {
      // Find the rightmost agent position
      let maxX = 300; // Default agent x position
      agents.forEach(agent => {
        const agentId = agent.id || agent.name;
        const position = nodePositions[agentId];
        if (position && position.x > maxX) {
          maxX = position.x;
        }
      });
      
      return { 
        x: maxX + 300,  // 300px to the right of rightmost agent
        y: 200
      };
    };

    nodeList.push({
      id: 'end',
      type: 'endNode',
      position: calculateEndPosition(),
      data: { label: 'End' },
      draggable: false,
      selectable: true
    });

    return nodeList;
  }, [agents, workflow.entry_point, workflow.graph_structure, workflowType, templateVisualEdges, nodePositions]);

  // Transform backend edges to React Flow edges with smart typing
  const edges = useMemo(() => {
    const edgeList: Edge[] = [];
    
    // Add backend edges with smart typing (includes all workflow types)
    if (workflow.graph_structure?.edges) {
      workflow.graph_structure.edges.forEach(edge => {
        const sourceAgent = agents.find(a => (a.id || a.name) === edge.from_node);
        const targetAgent = agents.find(a => (a.id || a.name) === edge.to_node);
        
        // Determine source and target names for display
        let sourceAgentName = sourceAgent?.name;
        let targetAgentName = targetAgent?.name;
        
        if (edge.from_node === 'start') {
          sourceAgentName = 'Start';
        }
        if (edge.to_node === 'end') {
          targetAgentName = 'End';
        }
        
        edgeList.push({
          id: edge.edge_id || `${edge.from_node}-${edge.to_node}`,
          source: edge.from_node,
          target: edge.to_node,
          type: edge.condition_type === 'always' ? workflowType : 'conditional',
          data: {
            condition_type: edge.condition_type || 'always',
            condition: edge.condition,
            sourceAgentName,
            targetAgentName,
            workflowType
          },
          animated: edge.condition_type === 'always'
        });
      });
    }

    // For non-parallel workflows without backend edges, add entry point edge
    if (workflow.entry_point && workflowType !== 'parallel' && (!workflow.graph_structure?.edges || workflow.graph_structure.edges.length === 0)) {
      edgeList.push({
        id: 'start-entry',
        source: 'start',
        target: workflow.entry_point,
        type: workflowType,
        data: {
          condition_type: 'always',
          sourceAgentName: 'Start',
          targetAgentName: agents.find(a => (a.id || a.name) === workflow.entry_point)?.name,
          workflowType
        },
        animated: true
      });
    }

    return edgeList;
  }, [agents, workflow.entry_point, workflow.graph_structure, workflowType]);

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
  }, [workflow.graph_structure, onUpdateWorkflow]);

  // Handle node clicks for entry point setting
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (node.type === 'agentNode') {
      const currentStructure = workflow.graph_structure;
      if (!currentStructure) return;

      onUpdateWorkflow({ 
        entry_point: node.id,
        graph_structure: {
          ...currentStructure,
          entry_point: node.id
        }
      });
    }
  }, [workflow.graph_structure, onUpdateWorkflow]);

  // Handle edge clicks for condition editing
  const onEdgeClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setShowConditionEditor(true);
  }, []);

  // Handle edge condition save - unified for all workflow types
  const handleSaveEdgeCondition = useCallback((edgeId: string, conditionData: Record<string, unknown>) => {
    const currentStructure = workflow.graph_structure;
    if (!currentStructure) return;

    // Update backend edges (unified for all workflow types)
    const updatedEdges = currentStructure.edges.map(edge => {
      if (edge.edge_id === edgeId || `${edge.from_node}-${edge.to_node}` === edgeId) {
        return {
          ...edge,
          condition_type: conditionData.condition_type as 'always' | 'success' | 'failure' | 'custom' | 'conditional',
          condition: conditionData.condition as string,
          condition_data: conditionData.condition_data as Record<string, unknown>
        };
      }
      return edge;
    });

    onUpdateWorkflow({
      graph_structure: {
        ...currentStructure,
        edges: updatedEdges
      }
    });
  }, [workflow.graph_structure, onUpdateWorkflow]);

  // Workflow template creation handlers
  const handleCreateTemplate = useCallback((templateType: 'sequential' | 'parallel' | 'conditional' | 'custom') => {
    const template = createWorkflowTemplate(templateType, agents);
    const agentIds = agents.map(agent => agent.id || agent.name);
    
    // Set exit points based on template type
    let exitPoints: string[] = [];
    let entryPoint = '';
    
    if (templateType === 'parallel') {
      // For parallel, all agents are exit points, first agent is entry point
      exitPoints = agentIds;
      entryPoint = agentIds[0] || '';
    } else if (templateType === 'conditional') {
      // For conditional, first agent is entry point, determine exit points from edges
      entryPoint = agentIds[0] || '';
      // Exit points are agents with no outgoing edges (except to 'end')
      const agentsWithOutgoing = new Set(template.edges.map(e => e.from_node).filter(node => node !== 'start'));
      exitPoints = agentIds.filter(id => !agentsWithOutgoing.has(id));
      if (exitPoints.length === 0) {
        exitPoints = [agentIds[agentIds.length - 1] || ''];
      }
    } else if (templateType === 'custom') {
      // For custom, set first agent as entry point, last as exit point (user can modify)
      entryPoint = agentIds[0] || '';
      exitPoints = agentIds.length > 0 ? [agentIds[agentIds.length - 1]] : [];
    } else {
      // For sequential, first is entry, last is exit
      entryPoint = agentIds[0] || '';
      exitPoints = agentIds.length > 0 ? [agentIds[agentIds.length - 1]] : [];
    }
    
    // Clear visual edges - now all templates use backend edges
    setTemplateVisualEdges([]);
    
    // FIXED: Map custom workflows to conditional mode (backend compatibility)
    // Custom workflows use conditional mode with graph_structure for execution
    const workflowMode = templateType === 'custom' ? 'conditional' : templateType;
    
    onUpdateWorkflow({
      mode: workflowMode,
      entry_point: entryPoint, // ✅ ALWAYS set entry point
      graph_structure: {
        ...workflow.graph_structure,
        nodes: agentIds, // ONLY agent nodes - backend requirement
        edges: template.edges, // Template-specific edges (can reference virtual nodes)
        entry_point: entryPoint, // ✅ ALWAYS set entry point in graph structure too
        exit_points: exitPoints
      }
    });
    
    console.log(`✅ Created ${templateType} workflow template with entry point: ${entryPoint}, edges: ${template.edges.length}`);
  }, [agents, workflow.graph_structure, onUpdateWorkflow]);

  // Agent management handlers
  const handleAddAgent = useCallback((newAgent: Omit<Agent, 'id'>) => {
    const agentWithId = {
      ...newAgent,
      id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    const updatedAgents = [...agents, agentWithId];
    onUpdateAgents(updatedAgents);
    
    // Update graph structure - only include agent nodes
    const currentStructure = workflow.graph_structure;
    if (currentStructure) {
      const agentNodes = updatedAgents.map(a => a.id || a.name);
      onUpdateWorkflow({
        graph_structure: {
          ...currentStructure,
          nodes: agentNodes
        }
      });
    }
  }, [agents, onUpdateAgents, workflow.graph_structure, onUpdateWorkflow]);

  const handleDeleteAgent = useCallback((agentId: string) => {
    const updatedAgents = agents.filter(agent => (agent.id || agent.name) !== agentId);
    onUpdateAgents(updatedAgents);
    
    // Update graph structure - only include agent nodes
    const currentStructure = workflow.graph_structure;
    if (currentStructure) {
      const agentNodes = updatedAgents.map(a => a.id || a.name);
      const filteredEdges = currentStructure.edges.filter(
        edge => edge.from_node !== agentId && edge.to_node !== agentId
      );
      
      onUpdateWorkflow({
        graph_structure: {
          ...currentStructure,
          nodes: agentNodes,
          edges: filteredEdges
        }
      });
    }
  }, [agents, onUpdateAgents, workflow.graph_structure, onUpdateWorkflow]);

  const handleDuplicateAgent = useCallback((agent: Agent) => {
    const duplicatedAgent = {
      ...agent,
      name: `${agent.name} (Copy)`,
      id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    const updatedAgents = [...agents, duplicatedAgent];
    onUpdateAgents(updatedAgents);
  }, [agents, onUpdateAgents]);

  // Auto-layout handlers - IMPLEMENTED: actual layout algorithms with ReactFlow integration
  const handleAutoLayout = useCallback((layoutType: 'grid' | 'chain' | 'tree' | 'smart') => {
    if (agents.length === 0) return;
    
    // Calculate new positions based on layout type
    const newPositions: { [agentId: string]: { x: number; y: number } } = {};
    
    switch (layoutType) {
      case 'grid': {
        const cols = Math.ceil(Math.sqrt(agents.length));
        const spacing = 250;
        const startX = 300;
        const startY = 100;
        
        agents.forEach((agent, index) => {
          const row = Math.floor(index / cols);
          const col = index % cols;
          const agentId = agent.id || agent.name;
          newPositions[agentId] = {
            x: startX + col * spacing,
            y: startY + row * spacing
          };
        });
        break;
      }
      case 'chain': {
        const spacing = 300;
        const startX = 300;
        const y = 200;
        
        agents.forEach((agent, index) => {
          const agentId = agent.id || agent.name;
          newPositions[agentId] = {
            x: startX + index * spacing,
            y: y
          };
        });
        break;
      }
      case 'tree': {
        // Simple tree layout - root at top, children below
        const levelHeight = 200;
        const nodeSpacing = 250;
        const startX = 300;
        const startY = 100;
        
        if (agents.length === 1) {
          const agentId = agents[0].id || agents[0].name;
          newPositions[agentId] = { x: startX, y: startY };
        } else {
          // First agent as root
          const rootId = agents[0].id || agents[0].name;
          newPositions[rootId] = { x: startX, y: startY };
          
          // Rest as children
          const childrenCount = agents.length - 1;
          const totalWidth = (childrenCount - 1) * nodeSpacing;
          const childStartX = startX - totalWidth / 2;
          
          agents.slice(1).forEach((agent, index) => {
            const agentId = agent.id || agent.name;
            newPositions[agentId] = {
              x: childStartX + index * nodeSpacing,
              y: startY + levelHeight
            };
          });
        }
        break;
      }
      case 'smart': {
        // Smart layout based on workflow type
        if (workflowType === 'parallel') {
          // Parallel: arrange in columns
          const cols = Math.min(3, agents.length);
          const spacing = 200;
          const startX = 300;
          const startY = 100;
          
          agents.forEach((agent, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            const agentId = agent.id || agent.name;
            newPositions[agentId] = {
              x: startX + col * spacing,
              y: startY + row * spacing
            };
          });
        } else {
          // Sequential/conditional: vertical chain
          const spacing = 200;
          const x = 300;
          const startY = 100;
          
          agents.forEach((agent, index) => {
            const agentId = agent.id || agent.name;
            newPositions[agentId] = {
              x: x,
              y: startY + index * spacing
            };
          });
        }
        break;
      }
    }
    
    // ✅ IMPLEMENTED: Apply the positions to the nodes via state update
    setNodePositions(newPositions);
    console.log(`✅ Applied ${layoutType} layout positioning to ${agents.length} agents`);
  }, [agents, workflowType]);

  // JSON paste handler
  const handlePasteWorkflow = useCallback((templateData: Partial<Template>) => {
    if (templateData.agents) {
      // Generate new IDs for pasted agents
      const pastedAgents = templateData.agents.map(agent => ({
        ...agent,
        id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }));
      
      onUpdateAgents(pastedAgents);
      
      if (templateData.workflow) {
        onUpdateWorkflow(templateData.workflow);
      }
    }
  }, [onUpdateAgents, onUpdateWorkflow]);

  // Validation for the current template
  const validationResult = useMemo(() => {
    const template: Template = {
      id: '',
      name: 'Current Workflow',
      description: 'Workflow being built',
      agents,
      workflow,
      created_by: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
      is_public: false
    };
    return validateTemplate(template);
  }, [agents, workflow]);

  // Check for critical validation issues
  const hasErrors = validationResult.errors.length > 0;
  const hasWarnings = validationResult.warnings.length > 0;
  const criticalErrors = validationResult.errors.filter(error => 
    error.field.includes('entry_point') || 
    error.field.includes('edges') ||
    error.field.includes('graph_structure') ||
    error.field.includes('agents')
  );

  // Validation Banner Component - Only show when there are agents or meaningful validation
  const ValidationBanner = () => {
    // Don't show validation errors when starting with 0 agents - this is expected
    if (agents.length === 0) {
      return (
        <Alert className="border-blue-200 bg-blue-50">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="font-medium">Ready to build your workflow</div>
            <div className="text-sm mt-1">Add agents to get started, then use the template buttons to create workflow connections</div>
          </AlertDescription>
        </Alert>
      );
    }

    // Show validation results only when there are agents
    if (!hasErrors && !hasWarnings) {
      return (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Workflow is valid and ready for execution
          </AlertDescription>
        </Alert>
      );
    }

    if (hasErrors) {
      return (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="space-y-1">
              <div className="font-medium">
                {criticalErrors.length} critical error{criticalErrors.length !== 1 ? 's' : ''} found:
              </div>
              <ul className="text-sm space-y-1">
                {criticalErrors.slice(0, 3).map((error, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-600">•</span>
                    <span>{error.message}</span>
                  </li>
                ))}
                {criticalErrors.length > 3 && (
                  <li className="text-sm text-red-600">
                    ... and {criticalErrors.length - 3} more error{criticalErrors.length - 3 !== 1 ? 's' : ''}
                  </li>
                )}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    if (hasWarnings) {
      return (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div className="space-y-1">
              <div className="font-medium">
                {validationResult.warnings.length} warning{validationResult.warnings.length !== 1 ? 's' : ''} found:
              </div>
              <ul className="text-sm space-y-1">
                {validationResult.warnings.slice(0, 2).map((warning, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-yellow-600">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
                {validationResult.warnings.length > 2 && (
                  <li className="text-sm text-yellow-600">
                    ... and {validationResult.warnings.length - 2} more warning{validationResult.warnings.length - 2 !== 1 ? 's' : ''}
                  </li>
                )}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  return (
    <ReactFlowProvider>
      <div className="space-y-6">
        {/* Validation Banner - Show above workflow canvas */}
        <div className="lg:col-start-2 lg:col-span-3">
          <ValidationBanner />
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Agent Configuration Panel */}
          <div className="lg:col-span-1">
            <div className="h-[700px] border-2 border-gray-200 rounded-lg bg-white">
              <AgentListPanel
                agents={agents}
                onAddAgent={handleAddAgent}
                onDeleteAgent={handleDeleteAgent}
                onDuplicateAgent={handleDuplicateAgent}
                onAutoLayout={handleAutoLayout}
              />
            </div>
          </div>

          {/* Workflow Canvas */}
          <div className="lg:col-span-3">
            <div className="h-[700px] w-full border-2 border-gray-200 rounded-lg bg-gray-50 relative">
              <WorkflowCanvasWithJSON
                nodes={nodes}
                edges={edges}
                agents={agents}
                workflow={workflow}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onNodesChange={() => {}} // TODO: Implement node changes
                onEdgesChange={() => {}} // TODO: Implement edge changes
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onEdgeClick={onEdgeClick}
                onPasteWorkflow={handlePasteWorkflow}
                workflowType={workflowType}
              />
              
              {/* Unified Creation Toolbar */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
                <UnifiedToolbar 
                  onCreateSequential={() => handleCreateTemplate('sequential')}
                  onCreateParallel={() => handleCreateTemplate('parallel')}
                  onCreateConditional={() => handleCreateTemplate('conditional')}
                  onCreateCustom={() => handleCreateTemplate('custom')}
                  currentWorkflowType={workflowType}
                  agentCount={agents.length}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Unified Configuration Panel */}
        <UnifiedConfigPanel
          agents={agents}
          workflow={workflow}
          workflowType={workflowType}
          onUpdateWorkflow={onUpdateWorkflow}
        />

        {/* Edge Condition Editor Modal */}
        <EdgeConditionEditor
          isOpen={showConditionEditor}
          onClose={() => setShowConditionEditor(false)}
          edge={selectedEdge}
          onSave={handleSaveEdgeCondition}
          sourceAgentName={selectedEdge?.data?.sourceAgentName}
          targetAgentName={selectedEdge?.data?.targetAgentName}
        />
      </div>
    </ReactFlowProvider>
  );
}

export default MergedWorkflowBuilder;
