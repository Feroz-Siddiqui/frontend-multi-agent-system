/**
 * Comprehensive Template Validation
 * 
 * Implements all 12+ validation rules for LangGraph templates
 * Provides real-time validation with detailed error messages
 */

import type {
  Template,
  Agent,
  WorkflowConfig,
  ValidationResult,
  ValidationError,
  GraphStructure,
  Edge
} from '../types';

export interface ValidationContext {
  showErrors?: boolean;
  validateAsync?: boolean;
  strictMode?: boolean;
}

export class TemplateValidator {
  private errors: ValidationError[] = [];
  private warnings: string[] = [];

  constructor(_context: ValidationContext = {}) {
    // Context parameter reserved for future validation enhancements
  }

  /**
   * Validate complete template
   */
  validateTemplate(template: Template): ValidationResult {
    this.reset();

    // Basic validation
    this.validateBasicInfo(template);
    this.validateAgents(template.agents);
    this.validateWorkflow(template.workflow, template.agents);

    // Advanced validation
    this.validateWorkflowModeConsistency(template.workflow);
    this.validateCompletionStrategyLogic(template.workflow, template.agents);
    this.validateTimeoutConfiguration(template.workflow, template.agents);
    this.validateHITLConfiguration(template.workflow, template.agents);

    // LangGraph-native validation
    if (template.workflow.mode === 'langgraph' && template.workflow.graph_structure) {
      this.validateLangGraphStructure(template.workflow.graph_structure, template.agents);
    }

    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  /**
   * 1. Basic Template Information Validation
   */
  private validateBasicInfo(template: Template): void {
    if (!template.name?.trim()) {
      this.addError('name', 'Template name is required', 'required');
    } else if (template.name.length > 200) {
      this.addError('name', 'Template name must be less than 200 characters', 'maxLength');
    }

    if (!template.description?.trim()) {
      this.addError('description', 'Template description is required', 'required');
    } else if (template.description.length > 1000) {
      this.addError('description', 'Template description must be less than 1000 characters', 'maxLength');
    }
  }

  /**
   * 2. Agent Configuration Validation
   */
  private validateAgents(agents: Agent[]): void {
    if (agents.length === 0) {
      this.addError('agents', 'At least one agent is required', 'required');
      return;
    }

    if (agents.length > 5) {
      this.addError('agents', 'Maximum 5 agents allowed', 'range');
    }

    // NOTE: Removed duplicate ID validation - backend handles unique ID generation
    // Agent names can be duplicated (they're just display labels)
    // Only validate that agents have actual IDs if they exist
    const agentsWithIds = agents.filter(agent => agent.id);
    if (agentsWithIds.length > 0) {
      const agentIds = agentsWithIds.map(agent => agent.id!);
      const duplicates = agentIds.filter((id, index) => agentIds.indexOf(id) !== index);
      if (duplicates.length > 0) {
        this.addError('agents', `Duplicate agent IDs found: ${duplicates.join(', ')}`, 'custom');
      }
    }

    // Validate each agent
    agents.forEach((agent, index) => {
      this.validateAgent(agent, index, agents);
    });
  }

  private validateAgent(agent: Agent, index: number, allAgents: Agent[]): void {
    const prefix = `agents[${index}]`;

    // Basic agent validation
    if (!agent.name?.trim()) {
      this.addError(`${prefix}.name`, 'Agent name is required', 'required');
    } else if (agent.name.length > 100) {
      this.addError(`${prefix}.name`, 'Agent name must be less than 100 characters', 'maxLength');
    }

    if (!agent.system_prompt?.trim()) {
      this.addError(`${prefix}.system_prompt`, 'System prompt is required', 'required');
    } else if (agent.system_prompt.length < 10) {
      this.addError(`${prefix}.system_prompt`, 'System prompt must be at least 10 characters', 'minLength');
    } else if (agent.system_prompt.length > 2000) {
      this.addError(`${prefix}.system_prompt`, 'System prompt must be less than 2000 characters', 'maxLength');
    }

    if (!agent.user_prompt?.trim()) {
      this.addError(`${prefix}.user_prompt`, 'User prompt is required', 'required');
    } else if (agent.user_prompt.length < 10) {
      this.addError(`${prefix}.user_prompt`, 'User prompt must be at least 10 characters', 'minLength');
    } else if (agent.user_prompt.length > 1000) {
      this.addError(`${prefix}.user_prompt`, 'User prompt must be less than 1000 characters', 'maxLength');
    }

    // 7. DEPENDENCY REFERENCE VALIDATION
    if (agent.depends_on && agent.depends_on.length > 0) {
      const allAgentIds = allAgents.map(a => a.id || a.name).filter(Boolean);
      agent.depends_on.forEach(depId => {
        if (!allAgentIds.includes(depId)) {
          this.addError(`${prefix}.depends_on`, `Dependency '${depId}' references non-existent agent`, 'custom');
        }
      });

      // 2. SELF-REFERENCING NODES
      const currentAgentId = agent.id || agent.name;
      if (agent.depends_on.includes(currentAgentId)) {
        this.addError(`${prefix}.depends_on`, 'Agent cannot depend on itself', 'custom');
      }
    }

    // Timeout validation
    if (agent.timeout_seconds < 30) {
      this.addError(`${prefix}.timeout_seconds`, 'Agent timeout must be at least 30 seconds', 'range');
    } else if (agent.timeout_seconds > 3600) {
      this.addError(`${prefix}.timeout_seconds`, 'Agent timeout must be less than 3600 seconds (1 hour)', 'range');
    }

    // LLM configuration validation
    if (agent.llm_config.temperature < 0 || agent.llm_config.temperature > 2) {
      this.addError(`${prefix}.llm_config.temperature`, 'Temperature must be between 0 and 2', 'range');
    }

    if (agent.llm_config.max_tokens < 100 || agent.llm_config.max_tokens > 4000) {
      this.addError(`${prefix}.llm_config.max_tokens`, 'Max tokens must be between 100 and 4000', 'range');
    }

    // Tavily configuration validation
    if (agent.tavily_config.max_results < 1 || agent.tavily_config.max_results > 50) {
      this.addError(`${prefix}.tavily_config.max_results`, 'Tavily max results must be between 1 and 50', 'range');
    }
  }

  /**
   * 3. Workflow Configuration Validation
   */
  private validateWorkflow(workflow: WorkflowConfig, agents: Agent[]): void {
    // 1. CYCLIC DEPENDENCIES - COVERED
    this.validateCyclicDependencies(agents);

    // 3. UNREACHABLE NODES - COVERED
    this.validateUnreachableNodes(workflow, agents);

    // 5. PARALLEL GROUP VIOLATIONS - COVERED
    if (workflow.mode === 'parallel' && workflow.parallel_groups) {
      this.validateParallelGroups(workflow.parallel_groups, agents);
    }

    // 6. EMPTY WORKFLOW PATHS - COVERED
    this.validateEmptyWorkflowPaths(workflow, agents);
  }

  /**
   * 8. WORKFLOW MODE CONSISTENCY
   * Updated to be more lenient during mode transitions and focus on required fields
   */
  private validateWorkflowModeConsistency(workflow: WorkflowConfig): void {
    switch (workflow.mode) {
      case 'sequential':
        // For sequential mode, we need either a sequence or agents to auto-generate sequence
        // Don't error on other mode fields being present - they'll be ignored
        if (workflow.parallel_groups && workflow.parallel_groups.length > 0) {
          this.addWarning('Sequential mode ignores parallel_groups configuration');
        }
        if (workflow.conditions && Object.keys(workflow.conditions).length > 0) {
          this.addWarning('Sequential mode ignores conditions configuration');
        }
        if (workflow.graph_structure) {
          this.addWarning('Sequential mode ignores graph_structure configuration');
        }
        break;

      case 'parallel':
        // For parallel mode, we need parallel_groups
        if (!workflow.parallel_groups || workflow.parallel_groups.length === 0) {
          this.addError('workflow.parallel_groups', 'Parallel mode requires parallel_groups configuration', 'required');
        }
        // Don't error on other mode fields - just warn they'll be ignored
        if (workflow.sequence && workflow.sequence.length > 0) {
          this.addWarning('Parallel mode ignores sequence configuration');
        }
        if (workflow.conditions && Object.keys(workflow.conditions).length > 0) {
          this.addWarning('Parallel mode ignores conditions configuration');
        }
        if (workflow.graph_structure) {
          this.addWarning('Parallel mode ignores graph_structure configuration');
        }
        break;

      case 'conditional':
        // For conditional mode, we need conditions or agent dependencies
        if ((!workflow.conditions || Object.keys(workflow.conditions).length === 0)) {
          // Check if agents have dependencies as an alternative
          // This will be validated in the agent validation section
        }
        // Don't error on other mode fields - just warn they'll be ignored
        if (workflow.sequence && workflow.sequence.length > 0) {
          this.addWarning('Conditional mode ignores sequence configuration');
        }
        if (workflow.parallel_groups && workflow.parallel_groups.length > 0) {
          this.addWarning('Conditional mode ignores parallel_groups configuration');
        }
        if (workflow.graph_structure) {
          this.addWarning('Conditional mode ignores graph_structure configuration');
        }
        break;

      case 'langgraph':
        // For LangGraph mode, we need graph_structure
        if (!workflow.graph_structure) {
          this.addError('workflow.graph_structure', 'LangGraph mode requires graph_structure configuration', 'required');
        }
        // Legacy configurations are just warnings, not errors
        if (workflow.sequence && workflow.sequence.length > 0) {
          this.addWarning('LangGraph mode should not use legacy sequence configuration');
        }
        if (workflow.parallel_groups && workflow.parallel_groups.length > 0) {
          this.addWarning('LangGraph mode should not use legacy parallel_groups configuration');
        }
        break;
    }
  }

  /**
   * 9. COMPLETION STRATEGY LOGIC
   */
  private validateCompletionStrategyLogic(workflow: WorkflowConfig, agents: Agent[]): void {
    const totalAgents = agents.length;

    // Validate max_concurrent_agents
    if (totalAgents > 0 && workflow.max_concurrent_agents > totalAgents) {
      this.addError('workflow.max_concurrent_agents', `Max concurrent agents (${workflow.max_concurrent_agents}) cannot exceed total agents (${totalAgents})`, 'custom');
    }

    if (workflow.max_concurrent_agents < 1) {
      this.addError('workflow.max_concurrent_agents', 'Max concurrent agents must be at least 1', 'range');
    } else if (workflow.max_concurrent_agents > 10) {
      this.addError('workflow.max_concurrent_agents', 'Max concurrent agents must be less than or equal to 10', 'range');
    }

    switch (workflow.completion_strategy) {
      case 'threshold':
        if (!workflow.required_completions) {
          this.addError('workflow.required_completions', 'Threshold strategy requires required_completions to be set', 'required');
        } else if (workflow.required_completions > totalAgents) {
          this.addError('workflow.required_completions', `Required completions (${workflow.required_completions}) cannot exceed total agents (${totalAgents})`, 'custom');
        } else if (workflow.required_completions < 1) {
          this.addError('workflow.required_completions', 'Required completions must be at least 1', 'range');
        }
        break;

      case 'majority':
        if (totalAgents < 1) {
          this.addError('workflow.completion_strategy', 'Majority strategy requires at least 1 agent', 'custom');
        }
        break;

      case 'first_success':
        if (workflow.mode !== 'parallel') {
          this.addError('workflow.completion_strategy', 'First success strategy is only valid with parallel mode', 'custom');
        }
        break;

      case 'all':
      case 'any':
        // These are always valid
        break;
    }
  }

  /**
   * 10. PARALLEL GROUP CONSTRAINTS
   */
  private validateParallelGroups(parallelGroups: string[][], agents: Agent[]): void {
    const agentIds = agents.map(a => a.id || a.name).filter(Boolean);
    const allGroupAgents: string[] = [];

    parallelGroups.forEach((group, groupIndex) => {
      if (group.length === 0) {
        this.addError(`workflow.parallel_groups[${groupIndex}]`, 'Each parallel group must have at least 1 agent', 'custom');
      }

      group.forEach(agentId => {
        if (!agentIds.includes(agentId)) {
          this.addError(`workflow.parallel_groups[${groupIndex}]`, `Agent '${agentId}' not found in template agents`, 'custom');
        }

        if (allGroupAgents.includes(agentId)) {
          this.addError(`workflow.parallel_groups[${groupIndex}]`, `Agent '${agentId}' appears in multiple groups`, 'custom');
        }

        allGroupAgents.push(agentId);
      });
    });

    // Check max_concurrent_agents constraint
    const totalAgents = agents.length;
    if (totalAgents > 0 && totalAgents < 10) { // Only validate if we have a reasonable number of agents
      if (totalAgents < 10) { // Reasonable upper bound check
        // This validation is more complex and depends on the specific use case
        // For now, we'll just warn if max_concurrent_agents seems too high
      }
    }
  }

  /**
   * 11. TIMEOUT VALIDATION
   */
  private validateTimeoutConfiguration(workflow: WorkflowConfig, agents: Agent[]): void {
    // Workflow timeout validation
    if (workflow.timeout_seconds < 60) {
      this.addError('workflow.timeout_seconds', 'Workflow timeout must be at least 60 seconds', 'range');
    } else if (workflow.timeout_seconds > 7200) {
      this.addError('workflow.timeout_seconds', 'Workflow timeout must be less than 7200 seconds (2 hours)', 'range');
    }

    // Check agent timeouts vs workflow timeout
    agents.forEach((agent, index) => {
      if (agent.timeout_seconds >= workflow.timeout_seconds) {
        this.addError(`agents[${index}].timeout_seconds`, `Agent timeout (${agent.timeout_seconds}s) must be less than workflow timeout (${workflow.timeout_seconds}s)`, 'custom');
      }
    });

    // For sequential workflows, check if sum of agent timeouts is reasonable
    if (workflow.mode === 'sequential' && workflow.sequence) {
      const sequentialAgents = agents.filter(a => workflow.sequence!.includes(a.id || a.name));
      const totalAgentTime = sequentialAgents.reduce((sum, agent) => sum + agent.timeout_seconds, 0);
      
      if (totalAgentTime > workflow.timeout_seconds) {
        this.addWarning(`Sequential workflow timeout (${workflow.timeout_seconds}s) may be too short for sum of agent timeouts (${totalAgentTime}s)`);
      }
    }
  }

  /**
   * 12. HITL INTERVENTION CONFLICTS
   */
  private validateHITLConfiguration(workflow: WorkflowConfig, agents: Agent[]): void {
    agents.forEach((agent, index) => {
      if (agent.hitl_config?.enabled) {
        // HITL timeout vs workflow timeout
        if (agent.hitl_config.timeout_seconds >= workflow.timeout_seconds) {
          this.addError(`agents[${index}].hitl_config.timeout_seconds`, `HITL timeout (${agent.hitl_config.timeout_seconds}s) must be less than workflow timeout (${workflow.timeout_seconds}s)`, 'custom');
        }

        // HITL with first_success strategy warning
        if (workflow.completion_strategy === 'first_success') {
          this.addWarning(`Agent '${agent.name}' has HITL enabled with first_success strategy - intervention might never be reached`);
        }

        // HITL timeout validation
        if (agent.hitl_config.timeout_seconds < 30) {
          this.addError(`agents[${index}].hitl_config.timeout_seconds`, 'HITL timeout must be at least 30 seconds', 'range');
        } else if (agent.hitl_config.timeout_seconds > 3600) {
          this.addError(`agents[${index}].hitl_config.timeout_seconds`, 'HITL timeout must be less than 3600 seconds (1 hour)', 'range');
        }
      }
    });
  }

  /**
   * LangGraph-Native Structure Validation
   */
  private validateLangGraphStructure(graphStructure: GraphStructure, agents: Agent[]): void {
    const agentIds = agents.map(a => a.id || a.name).filter(Boolean);

    // Validate entry point
    if (!graphStructure.entry_point) {
      this.addError('workflow.graph_structure.entry_point', 'Entry point is required for LangGraph structure', 'required');
    } else if (!graphStructure.nodes.includes(graphStructure.entry_point)) {
      this.addError('workflow.graph_structure.entry_point', `Entry point '${graphStructure.entry_point}' not found in graph nodes`, 'custom');
    }

    // Validate nodes
    graphStructure.nodes.forEach(nodeId => {
      if (!agentIds.includes(nodeId) && !this.isVirtualNode(nodeId)) {
        this.addError('workflow.graph_structure.nodes', `Graph node '${nodeId}' has no corresponding agent`, 'custom');
      }
    });

    // Validate edges
    graphStructure.edges.forEach((edge, index) => {
      this.validateEdge(edge, index, graphStructure);
    });

    // Check for cycles
    if (this.hasCycles(graphStructure)) {
      this.addError('workflow.graph_structure', 'Graph contains cycles which may cause infinite loops', 'custom');
    }

    // Check for unreachable nodes
    const unreachableNodes = this.findUnreachableNodes(graphStructure);
    if (unreachableNodes.length > 0) {
      this.addWarning(`Unreachable nodes detected: ${unreachableNodes.join(', ')}`);
    }
  }

  private validateEdge(edge: Edge, index: number, graphStructure: GraphStructure): void {
    const prefix = `workflow.graph_structure.edges[${index}]`;

    if (!edge.from_node) {
      this.addError(`${prefix}.from_node`, 'Edge from_node is required', 'required');
    } else if (!graphStructure.nodes.includes(edge.from_node)) {
      this.addError(`${prefix}.from_node`, `Edge from_node '${edge.from_node}' not found in graph nodes`, 'custom');
    }

    if (!edge.to_node) {
      this.addError(`${prefix}.to_node`, 'Edge to_node is required', 'required');
    } else if (!graphStructure.nodes.includes(edge.to_node)) {
      this.addError(`${prefix}.to_node`, `Edge to_node '${edge.to_node}' not found in graph nodes`, 'custom');
    }

    // Validate condition for custom edges
    if (edge.condition_type === 'custom' && !edge.condition?.trim()) {
      this.addError(`${prefix}.condition`, 'Custom edge condition is required', 'required');
    }

    // Validate weight
    if (edge.weight !== undefined && (edge.weight < 0 || edge.weight > 10)) {
      this.addError(`${prefix}.weight`, 'Edge weight must be between 0 and 10', 'range');
    }
  }

  /**
   * Utility Methods
   */
  private validateCyclicDependencies(agents: Agent[]): void {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const hasCycleDFS = (agentId: string, agentMap: Map<string, Agent>): boolean => {
      visited.add(agentId);
      recStack.add(agentId);

      const agent = agentMap.get(agentId);
      if (agent?.depends_on) {
        for (const depId of agent.depends_on) {
          if (!visited.has(depId)) {
            if (hasCycleDFS(depId, agentMap)) return true;
          } else if (recStack.has(depId)) {
            return true;
          }
        }
      }

      recStack.delete(agentId);
      return false;
    };

    const agentMap = new Map(agents.map(a => [a.id || a.name, a]));
    
    for (const agent of agents) {
      const agentId = agent.id || agent.name;
      if (!visited.has(agentId)) {
        if (hasCycleDFS(agentId, agentMap)) {
          this.addError('agents', 'Cyclic dependencies detected in agent dependencies', 'custom');
          break;
        }
      }
    }
  }

  private validateUnreachableNodes(workflow: WorkflowConfig, agents: Agent[]): void {
    if (workflow.mode === 'conditional') {
      // For conditional workflows, check if all agents are reachable
      const agentIds = agents.map(a => a.id || a.name);
      const entryAgents = agents.filter(a => !a.depends_on || a.depends_on.length === 0);
      
      if (entryAgents.length === 0 && agents.length > 0) {
        this.addError('workflow', 'No entry agents found - all agents have dependencies', 'custom');
      }

      // Simple reachability check - in a real implementation, this would be more sophisticated
      const reachableAgents = new Set(entryAgents.map(a => a.id || a.name));
      let changed = true;
      
      while (changed) {
        changed = false;
        for (const agent of agents) {
          const agentId = agent.id || agent.name;
          if (!reachableAgents.has(agentId) && agent.depends_on) {
            if (agent.depends_on.every(depId => reachableAgents.has(depId))) {
              reachableAgents.add(agentId);
              changed = true;
            }
          }
        }
      }

      const unreachable = agentIds.filter(id => !reachableAgents.has(id));
      if (unreachable.length > 0) {
        this.addWarning(`Unreachable agents in conditional workflow: ${unreachable.join(', ')}`);
      }
    }
  }

  private validateEmptyWorkflowPaths(workflow: WorkflowConfig, agents: Agent[]): void {
    if (agents.length === 0) {
      this.addError('agents', 'Workflow cannot be empty - at least one agent is required', 'required');
    }

    switch (workflow.mode) {
      case 'sequential':
        // For sequential mode, sequence can be auto-generated from agents if empty
        // Only error if we have agents but sequence is explicitly set to empty array
        if (agents.length > 0 && workflow.sequence && workflow.sequence.length === 0) {
          this.addError('workflow.sequence', 'Sequential workflow requires a sequence of agents', 'required');
        }
        break;

      case 'parallel':
        if (!workflow.parallel_groups || workflow.parallel_groups.length === 0) {
          this.addError('workflow.parallel_groups', 'Parallel workflow requires parallel groups', 'required');
        }
        break;

      case 'langgraph':
        if (!workflow.graph_structure || workflow.graph_structure.nodes.length === 0) {
          this.addError('workflow.graph_structure', 'LangGraph workflow requires graph structure with nodes', 'required');
        }
        break;
    }
  }

  private isVirtualNode(nodeId: string): boolean {
    return nodeId.startsWith('parallel_') || nodeId.startsWith('start_') || nodeId.startsWith('end_');
  }

  private hasCycles(graphStructure: GraphStructure): boolean {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const hasCycleDFS = (nodeId: string): boolean => {
      visited.add(nodeId);
      recStack.add(nodeId);

      const outgoingEdges = graphStructure.edges.filter(e => e.from_node === nodeId);
      for (const edge of outgoingEdges) {
        if (!visited.has(edge.to_node)) {
          if (hasCycleDFS(edge.to_node)) return true;
        } else if (recStack.has(edge.to_node)) {
          return true;
        }
      }

      recStack.delete(nodeId);
      return false;
    };

    for (const nodeId of graphStructure.nodes) {
      if (!visited.has(nodeId)) {
        if (hasCycleDFS(nodeId)) return true;
      }
    }

    return false;
  }

  private findUnreachableNodes(graphStructure: GraphStructure): string[] {
    const reachable = new Set<string>();
    const toVisit = [graphStructure.entry_point];

    while (toVisit.length > 0) {
      const current = toVisit.pop()!;
      if (reachable.has(current)) continue;

      reachable.add(current);

      const outgoingEdges = graphStructure.edges.filter(e => e.from_node === current);
      for (const edge of outgoingEdges) {
        if (!reachable.has(edge.to_node)) {
          toVisit.push(edge.to_node);
        }
      }
    }

    return graphStructure.nodes.filter(nodeId => !reachable.has(nodeId));
  }

  private addError(field: string, message: string, type: ValidationError['type'] = 'custom'): void {
    this.errors.push({ field, message, type });
  }

  private addWarning(message: string): void {
    this.warnings.push(message);
  }

  private reset(): void {
    this.errors = [];
    this.warnings = [];
  }
}

/**
 * Convenience function for template validation
 */
export function validateTemplate(template: Template, context?: ValidationContext): ValidationResult {
  const validator = new TemplateValidator(context);
  return validator.validateTemplate(template);
}

/**
 * Real-time field validation
 */
export function validateField(template: Template, fieldPath: string, context?: ValidationContext): ValidationError[] {
  const result = validateTemplate(template, context);
  return result.errors.filter(error => error.field.startsWith(fieldPath));
}

/**
 * Check if template can proceed to next step
 */
export function canProceedToStep(template: Template, step: string): boolean {
  const result = validateTemplate(template);
  
  switch (step) {
    case 'basic':
      return !result.errors.some(e => e.field.startsWith('name') || e.field.startsWith('description'));
    case 'agents':
      return template.agents.length > 0 && !result.errors.some(e => e.field.startsWith('agents'));
    case 'workflow':
      return template.agents.length > 0 && !result.errors.some(e => e.field.startsWith('workflow'));
    case 'preview':
      return result.isValid;
    default:
      return false;
  }
}
