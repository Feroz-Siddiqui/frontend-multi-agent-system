/**
 * Comprehensive LangGraph Workflow Validation System
 * 
 * Implements all critical validations to prevent LangGraph execution failures:
 * 1-6: Basic validations (cycles, self-refs, unreachable nodes, etc.)
 * 7-12: Advanced LangGraph execution validations
 */

import type { Template, Agent, WorkflowConfig } from '../types';

export interface ValidationError {
  field: string;
  message: string;
  type?: 'required' | 'minLength' | 'maxLength' | 'range' | 'enum' | 'custom';
  severity?: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

/**
 * 7. Dependency Reference Validation
 * Ensures all agent dependencies reference existing agents
 */
function validateDependencyReferences(agents: Agent[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const validAgentIds = new Set(agents.map(a => a.id).filter(Boolean));
  
  agents.forEach((agent, index) => {
    if (agent.depends_on) {
      agent.depends_on.forEach(depId => {
        if (!validAgentIds.has(depId)) {
          errors.push({
            field: `agents[${index}].depends_on`,
            message: `Agent "${agent.name}" depends on non-existent agent ID: ${depId}`,
            type: 'custom',
            severity: 'error'
          });
        }
      });
    }
  });
  
  return errors;
}

/**
 * Helper function to extract parallel groups from graph structure
 */
function extractParallelGroupsFromGraph(workflow: WorkflowConfig): string[][] {
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
 * 8. Workflow Mode Consistency
 * Updated to handle both legacy and modern workflow configurations
 */
function validateModeConsistency(workflow: WorkflowConfig): ValidationError[] {
  const errors: ValidationError[] = [];
  
  switch (workflow.mode) {
    case 'sequential': {
      // Sequential mode can use graph_structure (modern approach) or sequence (legacy)
      const hasSequence = workflow.sequence && workflow.sequence.length > 0;
      const hasGraphStructure = workflow.graph_structure && workflow.graph_structure.nodes.length > 0;
      
      // Warn about unused legacy configurations
      if (workflow.parallel_groups && workflow.parallel_groups.length > 0) {
        errors.push({
          field: 'workflow.parallel_groups',
          message: 'Sequential mode ignores parallel_groups configuration',
          type: 'custom',
          severity: 'warning'
        });
      }
      if (workflow.conditions && Object.keys(workflow.conditions).length > 0) {
        errors.push({
          field: 'workflow.conditions',
          message: 'Sequential mode ignores conditions configuration',
          type: 'custom',
          severity: 'warning'
        });
      }
      
      // Sequential mode is valid with either sequence OR graph_structure
      if (!hasSequence && !hasGraphStructure) {
        errors.push({
          field: 'workflow.sequence',
          message: 'Sequential mode requires either sequence or graph_structure configuration',
          type: 'required',
          severity: 'error'
        });
      }
      break;
    }
      
    case 'parallel': {
      // For parallel mode, we accept either parallel_groups OR graph_structure
      const hasParallelGroups = workflow.parallel_groups && workflow.parallel_groups.length > 0;
      const hasGraphStructure = workflow.graph_structure && workflow.graph_structure.nodes.length > 0;
      
      if (!hasParallelGroups && !hasGraphStructure) {
        errors.push({
          field: 'workflow.parallel_groups',
          message: 'Parallel mode requires either parallel_groups or graph_structure configuration',
          type: 'required',
          severity: 'error'
        });
      }
      
      // If using graph_structure, validate it can be used for parallel execution
      if (hasGraphStructure && !hasParallelGroups) {
        const extractedGroups = extractParallelGroupsFromGraph(workflow);
        if (extractedGroups.length === 0) {
          errors.push({
            field: 'workflow.graph_structure',
            message: 'Graph structure does not define valid parallel execution paths',
            type: 'custom',
            severity: 'error'
          });
        }
      }
      
      // Don't error on other mode fields - just warn they'll be ignored
      if (workflow.sequence && workflow.sequence.length > 0) {
        errors.push({
          field: 'workflow.sequence',
          message: 'Parallel mode ignores sequence configuration',
          type: 'custom',
          severity: 'warning'
        });
      }
      if (workflow.conditions && Object.keys(workflow.conditions).length > 0) {
        errors.push({
          field: 'workflow.conditions',
          message: 'Parallel mode ignores conditions configuration',
          type: 'custom',
          severity: 'warning'
        });
      }
      break;
    }
      
    case 'conditional': {
      // Conditional mode can use graph_structure (modern) or conditions/dependencies (legacy)
      const hasConditions = workflow.conditions && Object.keys(workflow.conditions).length > 0;
      const hasGraphStructure = workflow.graph_structure && workflow.graph_structure.nodes.length > 0;
      
      // Warn about unused legacy configurations
      if (workflow.sequence && workflow.sequence.length > 0) {
        errors.push({
          field: 'workflow.sequence',
          message: 'Conditional mode ignores sequence configuration',
          type: 'custom',
          severity: 'warning'
        });
      }
      if (workflow.parallel_groups && workflow.parallel_groups.length > 0) {
        errors.push({
          field: 'workflow.parallel_groups',
          message: 'Conditional mode ignores parallel_groups configuration',
          type: 'custom',
          severity: 'warning'
        });
      }
      
      // Conditional mode is valid with either conditions OR graph_structure
      // Agent dependencies will be validated separately
      if (!hasConditions && !hasGraphStructure) {
        errors.push({
          field: 'workflow.conditions',
          message: 'Conditional mode requires either conditions or graph_structure configuration',
          type: 'required',
          severity: 'error'
        });
      }
      break;
    }
      
    case 'langgraph': {
      // NOTE: LangGraph mode is mapped to 'conditional' for backend execution
      // This validation ensures custom workflows have proper graph structure
      if (!workflow.graph_structure) {
        errors.push({
          field: 'workflow.graph_structure',
          message: 'Custom workflow requires graph_structure configuration',
          type: 'required',
          severity: 'error'
        });
      } else {
        // Additional validation for custom workflows
        const hasNodes = workflow.graph_structure.nodes && workflow.graph_structure.nodes.length > 0;
        const hasEdges = workflow.graph_structure.edges && workflow.graph_structure.edges.length > 0;
        const hasEntryPoint = workflow.graph_structure.entry_point;
        
        if (!hasNodes) {
          errors.push({
            field: 'workflow.graph_structure.nodes',
            message: 'Custom workflow requires at least one node in graph structure',
            type: 'required',
            severity: 'error'
          });
        }
        
        if (!hasEntryPoint) {
          errors.push({
            field: 'workflow.graph_structure.entry_point',
            message: 'Custom workflow requires an entry point',
            type: 'required',
            severity: 'error'
          });
        }
        
        // For custom workflows, edges are optional initially but warn if missing
        if (!hasEdges) {
          errors.push({
            field: 'workflow.graph_structure.edges',
            message: 'Custom workflow has no connections between agents - add edges to define workflow flow',
            type: 'custom',
            severity: 'warning'
          });
        }
      }
      
      // Legacy configurations are just warnings, not errors
      if (workflow.sequence && workflow.sequence.length > 0) {
        errors.push({
          field: 'workflow.sequence',
          message: 'Custom workflow should not use legacy sequence configuration',
          type: 'custom',
          severity: 'warning'
        });
      }
      if (workflow.parallel_groups && workflow.parallel_groups.length > 0) {
        errors.push({
          field: 'workflow.parallel_groups',
          message: 'Custom workflow should not use legacy parallel_groups configuration',
          type: 'custom',
          severity: 'warning'
        });
      }
      break;
    }
  }
  
  return errors;
}

/**
 * 9. Completion Strategy Logic
 * Validates completion strategy configuration
 */
function validateCompletionStrategy(workflow: WorkflowConfig, agentCount: number): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (workflow.mode === 'parallel') {
    switch (workflow.completion_strategy) {
      case 'threshold':
        if (!workflow.required_completions) {
          errors.push({
            field: 'workflow.required_completions',
            message: 'Threshold strategy requires required_completions to be set',
            type: 'required',
            severity: 'error'
          });
        } else if (workflow.required_completions > agentCount) {
          errors.push({
            field: 'workflow.required_completions',
            message: `Required completions (${workflow.required_completions}) cannot exceed total agents (${agentCount})`,
            type: 'range',
            severity: 'error'
          });
        } else if (workflow.required_completions < 1) {
          errors.push({
            field: 'workflow.required_completions',
            message: 'Required completions must be at least 1',
            type: 'range',
            severity: 'error'
          });
        }
        break;
        
      case 'majority':
        if (agentCount < 1) {
          errors.push({
            field: 'workflow.completion_strategy',
            message: 'Majority strategy requires at least 1 agent',
            type: 'custom',
            severity: 'error'
          });
        }
        break;
        
      case 'first_success':
        if (workflow.mode !== 'parallel') {
          errors.push({
            field: 'workflow.completion_strategy',
            message: 'First success strategy only valid with parallel mode',
            type: 'custom',
            severity: 'error'
          });
        }
        break;
    }
  }
  
  return errors;
}

/**
 * 10. Parallel Group Constraints
 * Validates parallel group configuration
 */
function validateParallelGroupConstraints(workflow: WorkflowConfig, agents: Agent[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (workflow.mode === 'parallel') {
    // Max concurrent validation
    if (workflow.max_concurrent_agents > agents.length) {
      errors.push({
        field: 'workflow.max_concurrent_agents',
        message: `Max concurrent agents (${workflow.max_concurrent_agents}) cannot exceed total agents (${agents.length})`,
        type: 'range',
        severity: 'error'
      });
    }
    
    // Group validation
    if (workflow.parallel_groups) {
      const allGroupAgents = workflow.parallel_groups.flat();
      const uniqueAgents = new Set(allGroupAgents);
      
      // Check for duplicates across groups
      if (allGroupAgents.length !== uniqueAgents.size) {
        errors.push({
          field: 'workflow.parallel_groups',
          message: 'Agents cannot appear in multiple parallel groups',
          type: 'custom',
          severity: 'error'
        });
      }
      
      // Check all agents are assigned
      const agentIds = new Set(agents.map(a => a.id).filter(Boolean) as string[]);
      const missingAgents = [...agentIds].filter(id => !uniqueAgents.has(id));
      if (missingAgents.length > 0) {
        errors.push({
          field: 'workflow.parallel_groups',
          message: `Agents not assigned to groups: ${missingAgents.join(', ')}`,
          type: 'custom',
          severity: 'error'
        });
      }
      
      // Check empty groups
      workflow.parallel_groups.forEach((group, index) => {
        if (group.length === 0) {
          errors.push({
            field: `workflow.parallel_groups[${index}]`,
            message: `Parallel group ${index + 1} cannot be empty`,
            type: 'custom',
            severity: 'error'
          });
        }
      });
    }
  }
  
  return errors;
}

/**
 * 11. Timeout Validation
 * Validates timeout constraints
 */
function validateTimeouts(workflow: WorkflowConfig, agents: Agent[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Workflow timeout bounds
  if (workflow.timeout_seconds < 60) {
    errors.push({
      field: 'workflow.timeout_seconds',
      message: 'Workflow timeout must be at least 60 seconds',
      type: 'range',
      severity: 'error'
    });
  }
  
  if (workflow.timeout_seconds > 7200) {
    errors.push({
      field: 'workflow.timeout_seconds',
      message: 'Workflow timeout cannot exceed 7200 seconds (2 hours)',
      type: 'range',
      severity: 'error'
    });
  }
  
  // Agent timeout validation
  agents.forEach((agent, index) => {
    if (agent.timeout_seconds < 30) {
      errors.push({
        field: `agents[${index}].timeout_seconds`,
        message: `Agent "${agent.name}" timeout must be at least 30 seconds`,
        type: 'range',
        severity: 'error'
      });
    }
    
    if (agent.timeout_seconds >= workflow.timeout_seconds) {
      errors.push({
        field: `agents[${index}].timeout_seconds`,
        message: `Agent "${agent.name}" timeout (${agent.timeout_seconds}s) must be less than workflow timeout (${workflow.timeout_seconds}s)`,
        type: 'range',
        severity: 'error'
      });
    }
  });
  
  // Sequential mode: sum of agent timeouts
  if (workflow.mode === 'sequential') {
    const totalAgentTime = agents.reduce((sum, agent) => sum + agent.timeout_seconds, 0);
    if (totalAgentTime >= workflow.timeout_seconds) {
      errors.push({
        field: 'workflow.timeout_seconds',
        message: `Workflow timeout (${workflow.timeout_seconds}s) must exceed sum of agent timeouts (${totalAgentTime}s)`,
        type: 'range',
        severity: 'error'
      });
    }
  }
  
  return errors;
}

/**
 * 12. HITL Intervention Conflicts
 * Validates HITL configuration compatibility
 */
function validateHITLConflicts(workflow: WorkflowConfig, agents: Agent[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  agents.forEach((agent, index) => {
    if (agent.hitl_config?.enabled) {
      // HITL timeout vs workflow timeout
      if (agent.hitl_config.timeout_seconds >= workflow.timeout_seconds) {
        errors.push({
          field: `agents[${index}].hitl_config.timeout_seconds`,
          message: `Agent "${agent.name}" HITL timeout must be less than workflow timeout`,
          type: 'range',
          severity: 'error'
        });
      }
      
      // HITL conflicts with completion strategies
      if (workflow.mode === 'parallel') {
        if (workflow.completion_strategy === 'first_success') {
          errors.push({
            field: `agents[${index}].hitl_config`,
            message: `Agent "${agent.name}" HITL may never trigger with "first_success" strategy`,
            type: 'custom',
            severity: 'warning'
          });
        }
        
        const hitlAgentCount = agents.filter(a => a.hitl_config?.enabled).length;
        if (workflow.completion_strategy === 'any' && hitlAgentCount > 1) {
          errors.push({
            field: `agents[${index}].hitl_config`,
            message: `Multiple HITL agents with "any" completion strategy may cause conflicts`,
            type: 'custom',
            severity: 'warning'
          });
        }
      }
      
      // HITL intervention point validation
      if (agent.hitl_config.intervention_points?.includes('after_execution') && 
          workflow.mode === 'parallel' && 
          workflow.completion_strategy === 'first_success') {
        errors.push({
          field: `agents[${index}].hitl_config.intervention_points`,
          message: `Agent "${agent.name}" after_execution HITL incompatible with first_success strategy`,
          type: 'custom',
          severity: 'warning'
        });
      }
    }
  });
  
  return errors;
}

/**
 * 13. LangGraph Structure Validation
 * Validates LangGraph-native workflow structures
 */
function validateLangGraphStructure(template: Template): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (template.workflow.mode !== 'langgraph') {
    return errors; // Only validate LangGraph mode
  }
  
  const graph = template.workflow.graph_structure;
  if (!graph) {
    errors.push({
      field: 'workflow.graph_structure',
      message: 'LangGraph mode requires graph_structure',
      type: 'required',
      severity: 'error'
    });
    return errors;
  }
  
  const agentIds = new Set(template.agents.map(a => a.id).filter(Boolean) as string[]);
  
  // Validate entry point
  if (!graph.entry_point) {
    errors.push({
      field: 'workflow.graph_structure.entry_point',
      message: 'Graph structure missing entry_point',
      type: 'required',
      severity: 'error'
    });
  } else if (!agentIds.has(graph.entry_point)) {
    errors.push({
      field: 'workflow.graph_structure.entry_point',
      message: `Entry point '${graph.entry_point}' must be a valid agent ID`,
      type: 'custom',
      severity: 'error'
    });
  }
  
  // Validate nodes (should only contain agent IDs)
  graph.nodes.forEach((nodeId, index) => {
    if (!agentIds.has(nodeId)) {
      errors.push({
        field: `workflow.graph_structure.nodes[${index}]`,
        message: `Node '${nodeId}' must be a valid agent ID`,
        type: 'custom',
        severity: 'error'
      });
    }
  });
  
  // Validate edges (can reference virtual nodes like 'start', 'end')
  graph.edges.forEach((edge, index) => {
    // Validate from_node
    if (!agentIds.has(edge.from_node) && 
        !['start', 'end'].includes(edge.from_node) && 
        !edge.from_node.startsWith('parallel_')) {
      errors.push({
        field: `workflow.graph_structure.edges[${index}].from_node`,
        message: `Edge from_node '${edge.from_node}' must be a valid agent ID or virtual node`,
        type: 'custom',
        severity: 'error'
      });
    }
    
    // Validate to_node
    if (!agentIds.has(edge.to_node) && 
        !['start', 'end'].includes(edge.to_node) && 
        !edge.to_node.startsWith('parallel_')) {
      errors.push({
        field: `workflow.graph_structure.edges[${index}].to_node`,
        message: `Edge to_node '${edge.to_node}' must be a valid agent ID or virtual node`,
        type: 'custom',
        severity: 'error'
      });
    }
    
    // Validate edge has required fields
    if (!edge.edge_id) {
      errors.push({
        field: `workflow.graph_structure.edges[${index}].edge_id`,
        message: 'Edge must have an edge_id',
        type: 'required',
        severity: 'error'
      });
    }
    
    if (!edge.condition_type) {
      errors.push({
        field: `workflow.graph_structure.edges[${index}].condition_type`,
        message: 'Edge must have a condition_type',
        type: 'required',
        severity: 'error'
      });
    }
  });
  
  // Check for unreachable nodes (warning only)
  const reachableNodes = new Set<string>();
  const toVisit = [graph.entry_point];
  
  while (toVisit.length > 0) {
    const current = toVisit.pop()!;
    if (reachableNodes.has(current)) continue;
    
    reachableNodes.add(current);
    
    // Find all nodes reachable from current
    graph.edges.forEach(edge => {
      if (edge.from_node === current && !reachableNodes.has(edge.to_node)) {
        toVisit.push(edge.to_node);
      }
    });
  }
  
  // Check for unreachable agent nodes
  const unreachableAgents = [...agentIds].filter(agentId => !reachableNodes.has(agentId));
  if (unreachableAgents.length > 0) {
    unreachableAgents.forEach(agentId => {
      const agent = template.agents.find(a => a.id === agentId);
      errors.push({
        field: 'workflow.graph_structure',
        message: `Unreachable nodes detected: ${agent?.name || agentId}`,
        type: 'custom',
        severity: 'warning'
      });
    });
  }
  
  return errors;
}

/**
 * 1-6. Basic Workflow Validations
 * Updated to handle LangGraph mode properly
 */
function validateBasicWorkflow(template: Template): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Basic validation
  if (template.agents.length === 0) {
    errors.push({
      field: 'agents',
      message: 'Template must have at least one agent',
      type: 'required',
      severity: 'error'
    });
  }
  
  if (template.agents.length > 5) {
    errors.push({
      field: 'agents',
      message: 'Template cannot have more than 5 agents',
      type: 'range',
      severity: 'error'
    });
  }

  // Mode-specific validation (skip legacy modes if using LangGraph)
  if (template.workflow.mode === 'langgraph') {
    // LangGraph validation is handled separately
    return errors;
  }

  // Legacy mode validations
  if (template.workflow.mode === 'sequential') {
    if (!template.workflow.sequence || template.workflow.sequence.length === 0) {
      errors.push({
        field: 'workflow.sequence',
        message: 'Sequential workflow must have agent sequence',
        type: 'required',
        severity: 'error'
      });
    } else if (template.workflow.sequence.length !== template.agents.length) {
      errors.push({
        field: 'workflow.sequence',
        message: 'Sequence must include all agents',
        type: 'custom',
        severity: 'error'
      });
    }
  }

  if (template.workflow.mode === 'parallel') {
    // Accept either parallel_groups OR graph_structure for parallel workflows
    const hasParallelGroups = template.workflow.parallel_groups && template.workflow.parallel_groups.length > 0;
    const hasGraphStructure = template.workflow.graph_structure && template.workflow.graph_structure.nodes.length > 0;
    
    if (!hasParallelGroups && !hasGraphStructure) {
      errors.push({
        field: 'workflow.parallel_groups',
        message: 'Parallel workflow requires either parallel_groups or graph_structure configuration',
        type: 'required',
        severity: 'error'
      });
    }
  }

  // Check for circular dependencies
  if (template.workflow.mode === 'conditional') {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (agentId: string): boolean => {
      if (recursionStack.has(agentId)) return true;
      if (visited.has(agentId)) return false;
      
      visited.add(agentId);
      recursionStack.add(agentId);
      
      const agent = template.agents.find(a => a.id === agentId);
      if (agent?.depends_on) {
        for (const depId of agent.depends_on) {
          if (hasCycle(depId)) return true;
        }
      }
      
      recursionStack.delete(agentId);
      return false;
    };
    
    for (const agent of template.agents) {
      if (agent.id && hasCycle(agent.id)) {
        errors.push({
          field: 'workflow.conditions',
          message: 'Circular dependencies detected in conditional workflow',
          type: 'custom',
          severity: 'error'
        });
        break;
      }
    }
  }

  // Check for self-dependencies
  template.agents.forEach((agent, index) => {
    if (agent.depends_on?.includes(agent.id!)) {
      errors.push({
        field: `agents[${index}].depends_on`,
        message: `Agent "${agent.name}" cannot depend on itself`,
        type: 'custom',
        severity: 'error'
      });
    }
  });

  return errors;
}

/**
 * Master Validation Function
 * Combines all validation rules
 */
export function validateWorkflow(template: Template): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  
  // 1-6: Basic validations
  errors.push(...validateBasicWorkflow(template));
  
  // 7: Dependency reference validation
  errors.push(...validateDependencyReferences(template.agents));
  
  // 8: Workflow mode consistency
  errors.push(...validateModeConsistency(template.workflow));
  
  // 9: Completion strategy logic
  errors.push(...validateCompletionStrategy(template.workflow, template.agents.length));
  
  // 10: Parallel group constraints
  errors.push(...validateParallelGroupConstraints(template.workflow, template.agents));
  
  // 11: Timeout validation
  errors.push(...validateTimeouts(template.workflow, template.agents));
  
  // 12: HITL intervention conflicts
  errors.push(...validateHITLConflicts(template.workflow, template.agents));
  
  // 13: LangGraph structure validation
  errors.push(...validateLangGraphStructure(template));
  
  // Separate warnings from errors
  const actualErrors = errors.filter(e => e.severity !== 'warning');
  const warningErrors = errors.filter(e => e.severity === 'warning');
  warnings.push(...warningErrors.map(e => e.message));
  
  return {
    isValid: actualErrors.length === 0,
    errors: actualErrors,
    warnings
  };
}

/**
 * Real-time validation for specific fields
 */
export function validateField(template: Template, field: string): ValidationError[] {
  const fullValidation = validateWorkflow(template);
  return fullValidation.errors.filter(error => error.field.startsWith(field));
}

/**
 * Quick validation for UI feedback
 */
export function getValidationSummary(template: Template): {
  hasErrors: boolean;
  hasWarnings: boolean;
  errorCount: number;
  warningCount: number;
} {
  const result = validateWorkflow(template);
  return {
    hasErrors: !result.isValid,
    hasWarnings: result.warnings.length > 0,
    errorCount: result.errors.length,
    warningCount: result.warnings.length
  };
}
