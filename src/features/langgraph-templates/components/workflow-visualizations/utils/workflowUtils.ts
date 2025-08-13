/**
 * Workflow Utilities
 * Helper functions for workflow detection and template creation
 */

import type { Agent, WorkflowConfig } from '../../../types';

/**
 * Extract parallel groups from graph structure for validation compatibility
 */
export function extractParallelGroupsFromGraph(workflow: WorkflowConfig): string[][] {
  if (!workflow.graph_structure) return [];
  
  const graph = workflow.graph_structure;
  const parallelGroups: string[][] = [];
  
  // Find nodes that start from 'start' node (parallel execution)
  const startEdges = graph.edges.filter(edge => edge.from_node === 'start');
  if (startEdges.length > 1) {
    // Multiple edges from start = parallel execution
    const parallelAgents = startEdges.map(edge => edge.to_node);
    parallelGroups.push(parallelAgents);
  } else {
    // Single group with all agents
    const agentNodes = graph.nodes.filter(node => !['start', 'end'].includes(node));
    if (agentNodes.length > 0) {
      parallelGroups.push(agentNodes);
    }
  }
  
  return parallelGroups;
}

/**
 * Generate parallel_groups from graph_structure for backward compatibility
 */
export function generateParallelGroupsFromGraph(workflow: WorkflowConfig): string[][] {
  return extractParallelGroupsFromGraph(workflow);
}

// Detect workflow type based on edge patterns
export function detectWorkflowType(edges: Array<{ condition_type?: string; from_node?: string; to_node?: string }>, exitPoints?: string[]): string {
  if (!edges || edges.length === 0) {
    // If no edges but multiple exit points, it's parallel
    if (exitPoints && exitPoints.length > 1) return 'parallel';
    return 'custom';
  }
  
  // Check for conditional edges first (highest priority)
  const hasConditionalEdges = edges.some(edge => 
    edge.condition_type && edge.condition_type !== 'always'
  );
  if (hasConditionalEdges) return 'conditional';
  
  // Check for parallel structure (multiple exit points + multiple start edges)
  if (exitPoints && exitPoints.length > 1) {
    const startEdges = edges.filter(edge => edge.from_node === 'start');
    if (startEdges.length > 1) return 'parallel';
  }
  
  // Check for sequential structure (start→agent chain→end pattern)
  const hasStartEdge = edges.some(edge => edge.from_node === 'start');
  const hasEndEdge = edges.some(edge => edge.to_node === 'end');
  const hasAgentChain = edges.some(edge => 
    edge.from_node !== 'start' && edge.to_node !== 'end' && 
    edge.condition_type === 'always'
  );
  
  if (hasStartEdge && hasEndEdge && hasAgentChain) return 'sequential';
  
  // If has start/end but no agent chain, could be simple sequential
  if (hasStartEdge && hasEndEdge) return 'sequential';
  
  return 'custom';
}

// Create workflow templates
export function createWorkflowTemplate(
  templateType: 'sequential' | 'parallel' | 'conditional' | 'custom',
  agents: Agent[]
) {
  const agentIds = agents.map(agent => agent.id || agent.name);
  
  switch (templateType) {
    case 'sequential':
      return createSequentialTemplate(agentIds);
    case 'parallel':
      return createParallelTemplate(agentIds);
    case 'conditional':
      return createConditionalTemplate(agentIds);
    case 'custom':
    default:
      return createCustomTemplate();
  }
}

// Sequential template: Start → Agent1 → Agent2 → Agent3 → End
function createSequentialTemplate(agentIds: string[]) {
  const edges: Array<{
    from_node: string;
    to_node: string;
    condition_type: 'always' | 'success' | 'failure' | 'custom' | 'conditional';
    condition?: string;
    condition_data?: Record<string, unknown>;
    edge_id: string;
    description: string;
    weight: number;
  }> = [];
  
  const reactFlowEdges: Array<{
    id: string;
    source: string;
    target: string;
    type: string;
    data: { condition_type: string; workflowType: string };
    animated: boolean;
  }> = [];
  
  if (agentIds.length === 0) return { edges, reactFlowEdges };
  
  // Start → First Agent
  const startEdge = {
    from_node: 'start',
    to_node: agentIds[0],
    condition_type: 'always' as const,
    condition: undefined,
    condition_data: undefined,
    edge_id: `edge_start_${agentIds[0]}_${Date.now()}`,
    description: `Start → ${agentIds[0]}`,
    weight: 1.0
  };
  edges.push(startEdge);
  
  reactFlowEdges.push({
    id: startEdge.edge_id,
    source: 'start',
    target: agentIds[0],
    type: 'sequential',
    data: { condition_type: 'always', workflowType: 'sequential' },
    animated: true
  });
  
  // Create chain connections between agents
  for (let i = 0; i < agentIds.length - 1; i++) {
    const edge = {
      from_node: agentIds[i],
      to_node: agentIds[i + 1],
      condition_type: 'always' as const,
      condition: undefined,
      condition_data: undefined,
      edge_id: `edge_seq_${i}_${Date.now()}`,
      description: `${agentIds[i]} → ${agentIds[i + 1]}`,
      weight: 1.0
    };
    edges.push(edge);
    
    reactFlowEdges.push({
      id: edge.edge_id,
      source: agentIds[i],
      target: agentIds[i + 1],
      type: 'sequential',
      data: { condition_type: 'always', workflowType: 'sequential' },
      animated: true
    });
  }
  
  // Last Agent → End
  const endEdge = {
    from_node: agentIds[agentIds.length - 1],
    to_node: 'end',
    condition_type: 'always' as const,
    condition: undefined,
    condition_data: undefined,
    edge_id: `edge_end_${agentIds[agentIds.length - 1]}_${Date.now()}`,
    description: `${agentIds[agentIds.length - 1]} → End`,
    weight: 1.0
  };
  edges.push(endEdge);
  
  reactFlowEdges.push({
    id: endEdge.edge_id,
    source: agentIds[agentIds.length - 1],
    target: 'end',
    type: 'sequential',
    data: { condition_type: 'always', workflowType: 'sequential' },
    animated: true
  });
  
  return { edges, reactFlowEdges };
}

// Parallel template: All agents run independently (create REAL backend edges like sequential)
function createParallelTemplate(agentIds: string[]) {
  const edges: Array<{
    from_node: string;
    to_node: string;
    condition_type: 'always' | 'success' | 'failure' | 'custom' | 'conditional';
    condition?: string;
    condition_data?: Record<string, unknown>;
    edge_id: string;
    description: string;
    weight: number;
  }> = [];
  
  const reactFlowEdges: Array<{
    id: string;
    source: string;
    target: string;
    type: string;
    data: { condition_type: string; workflowType: string };
    animated: boolean;
  }> = [];
  
  // Create REAL backend edges for parallel workflow (like sequential does)
  // This ensures the Edge Configuration UI works properly
  
  // Backend edges: Start → All Agents (using special start node)
  agentIds.forEach((agentId) => {
    const startEdge = {
      from_node: 'start',
      to_node: agentId,
      condition_type: 'always' as const,
      condition: undefined,
      condition_data: undefined,
      edge_id: `edge_start_${agentId}_${Date.now()}`,
      description: `Start → ${agentId}`,
      weight: 1.0
    };
    edges.push(startEdge);
    
    // Corresponding ReactFlow edge
    reactFlowEdges.push({
      id: startEdge.edge_id,
      source: 'start',
      target: agentId,
      type: 'parallel',
      data: { condition_type: 'always', workflowType: 'parallel' },
      animated: true
    });
  });
  
  // Backend edges: All Agents → End (using special end node)
  agentIds.forEach((agentId) => {
    const endEdge = {
      from_node: agentId,
      to_node: 'end',
      condition_type: 'always' as const,
      condition: undefined,
      condition_data: undefined,
      edge_id: `edge_end_${agentId}_${Date.now()}`,
      description: `${agentId} → End`,
      weight: 1.0
    };
    edges.push(endEdge);
    
    // Corresponding ReactFlow edge
    reactFlowEdges.push({
      id: endEdge.edge_id,
      source: agentId,
      target: 'end',
      type: 'parallel',
      data: { condition_type: 'always', workflowType: 'parallel' },
      animated: true
    });
  });
  
  return { edges, reactFlowEdges };
}

// Conditional template: Agent1 → success/failure branches with proper defaults
function createConditionalTemplate(agentIds: string[]) {
  const edges: Array<{
    from_node: string;
    to_node: string;
    condition_type: 'always' | 'success' | 'failure' | 'custom' | 'conditional';
    condition?: string;
    condition_data?: Record<string, unknown>;
    edge_id: string;
    description: string;
    weight: number;
  }> = [];
  
  const reactFlowEdges: Array<{
    id: string;
    source: string;
    target: string;
    type: string;
    data: { condition_type: string; workflowType: string };
    animated: boolean;
  }> = [];
  
  if (agentIds.length >= 3) {
    // First agent to success branch
    const successEdge = {
      from_node: agentIds[0],
      to_node: agentIds[1],
      condition_type: 'success' as const,
      condition: 'On success',
      condition_data: undefined,
      edge_id: `edge_success_${Date.now()}`,
      description: `${agentIds[0]} → ${agentIds[1]} (success)`,
      weight: 1.0
    };
    edges.push(successEdge);
    
    reactFlowEdges.push({
      id: successEdge.edge_id,
      source: agentIds[0],
      target: agentIds[1],
      type: 'conditional',
      data: { condition_type: 'success', workflowType: 'conditional' },
      animated: false
    });
    
    // First agent to failure branch
    const failureEdge = {
      from_node: agentIds[0],
      to_node: agentIds[2],
      condition_type: 'failure' as const,
      condition: 'On failure',
      condition_data: undefined,
      edge_id: `edge_failure_${Date.now()}`,
      description: `${agentIds[0]} → ${agentIds[2]} (failure)`,
      weight: 1.0
    };
    edges.push(failureEdge);
    
    reactFlowEdges.push({
      id: failureEdge.edge_id,
      source: agentIds[0],
      target: agentIds[2],
      type: 'conditional',
      data: { condition_type: 'failure', workflowType: 'conditional' },
      animated: false
    });
  } else if (agentIds.length >= 2) {
    // If only 2 agents, create simple conditional connection
    const conditionalEdge = {
      from_node: agentIds[0],
      to_node: agentIds[1],
      condition_type: 'success' as const,
      condition: 'On success',
      condition_data: undefined,
      edge_id: `edge_conditional_${Date.now()}`,
      description: `${agentIds[0]} → ${agentIds[1]} (conditional)`,
      weight: 1.0
    };
    edges.push(conditionalEdge);
    
    reactFlowEdges.push({
      id: conditionalEdge.edge_id,
      source: agentIds[0],
      target: agentIds[1],
      type: 'conditional',
      data: { condition_type: 'success', workflowType: 'conditional' },
      animated: false
    });
  } else if (agentIds.length === 1) {
    // Single agent - create basic edge for validation
    const singleEdge = {
      from_node: agentIds[0],
      to_node: agentIds[0], // Self-loop for single agent
      condition_type: 'always' as const,
      condition: 'Always execute',
      condition_data: undefined,
      edge_id: `edge_single_${Date.now()}`,
      description: `${agentIds[0]} (single agent)`,
      weight: 1.0
    };
    edges.push(singleEdge);
    
    reactFlowEdges.push({
      id: singleEdge.edge_id,
      source: agentIds[0],
      target: agentIds[0],
      type: 'conditional',
      data: { condition_type: 'always', workflowType: 'conditional' },
      animated: false
    });
  }
  
  return { edges, reactFlowEdges };
}

// Custom template: Clear slate for manual connections
function createCustomTemplate() {
  return { edges: [], reactFlowEdges: [] };
}
