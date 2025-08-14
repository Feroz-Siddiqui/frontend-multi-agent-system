/**
 * Simplified Template Validation
 * 
 * Clean, focused validation that only checks what's actually required for execution
 */

import type {
  Template,
  Agent,
  WorkflowConfig,
  ValidationResult,
  ValidationError
} from '../types';

export interface ValidationContext {
  showErrors?: boolean;
  validateAsync?: boolean;
  strictMode?: boolean;
}

export class TemplateValidator {
  private errors: ValidationError[] = [];
  private warnings: string[] = [];

  constructor(context: ValidationContext = {}) {
    void context; // Reserved for future use
  }

  /**
   * Main validation entry point
   */
  validateTemplate(template: Template): ValidationResult {
    this.reset();

    // Only validate what's actually required for execution
    this.validateBasicInfo(template);
    this.validateAgents(template.agents);
    this.validateWorkflowExecution(template.workflow, template.agents);

    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  /**
   * 1. Basic Information - Always Required
   */
  private validateBasicInfo(template: Template): void {
    if (!template.name?.trim()) {
      this.addError('name', 'Template name is required', 'required');
    }

    if (!template.description?.trim()) {
      this.addError('description', 'Template description is required', 'required');
    }
  }

  /**
   * 2. Agent Validation - Simple and Clear
   */
  private validateAgents(agents: Agent[]): void {
    if (agents.length === 0) {
      this.addError('agents', 'At least one agent is required', 'required');
      return;
    }

    if (agents.length > 15) {
      this.addError('agents', 'Maximum 15 agents allowed', 'range');
    }

    // Validate each agent
    agents.forEach((agent, index) => {
      this.validateAgent(agent, index);
    });
  }

  private validateAgent(agent: Agent, index: number): void {
    const prefix = `agents[${index}]`;

    if (!agent.name?.trim()) {
      this.addError(`${prefix}.name`, 'Agent name is required', 'required');
    }

    if (!agent.system_prompt?.trim()) {
      this.addError(`${prefix}.system_prompt`, 'System prompt is required', 'required');
    }

    if (!agent.user_prompt?.trim()) {
      this.addError(`${prefix}.user_prompt`, 'User prompt is required', 'required');
    }

    // Basic range validation
    if (agent.timeout_seconds < 30 || agent.timeout_seconds > 3600) {
      this.addError(`${prefix}.timeout_seconds`, 'Agent timeout must be between 30 and 3600 seconds', 'range');
    }

    if (agent.llm_config.temperature < 0 || agent.llm_config.temperature > 2) {
      this.addError(`${prefix}.llm_config.temperature`, 'Temperature must be between 0 and 2', 'range');
    }

    if (agent.llm_config.max_tokens < 100 || agent.llm_config.max_tokens > 4000) {
      this.addError(`${prefix}.llm_config.max_tokens`, 'Max tokens must be between 100 and 4000', 'range');
    }
  }

  /**
   * 3. Workflow Execution Validation - Only What's Actually Needed
   */
  private validateWorkflowExecution(workflow: WorkflowConfig, agents: Agent[]): void {
    const agentCount = agents.length;
    
    // Skip workflow validation if no agents
    if (agentCount === 0) return;

    // Only validate if workflow has been configured (has edges or specific mode settings)
    const isWorkflowConfigured = this.isWorkflowConfigured(workflow);
    
    if (!isWorkflowConfigured) {
      // Workflow not configured yet - this is fine, user is still building
      return;
    }

    // Now validate the configured workflow
    switch (workflow.mode) {
      case 'sequential':
        this.validateSequentialWorkflow(workflow, agents);
        break;
      case 'parallel':
        this.validateParallelWorkflow(workflow, agents);
        break;
      case 'conditional':
        this.validateConditionalWorkflow(workflow, agents);
        break;
      default:
        // Unknown mode - treat as conditional (our backend default)
        this.validateConditionalWorkflow(workflow, agents);
        break;
    }
  }

  /**
   * Check if workflow has been actually configured by user
   */
  private isWorkflowConfigured(workflow: WorkflowConfig): boolean {
    // Workflow is considered configured if:
    // 1. Has graph structure with edges, OR
    // 2. Has legacy configuration (sequence, parallel_groups, conditions)
    
    const hasGraphStructure = workflow.graph_structure && workflow.graph_structure.edges.length > 0;
    const hasLegacySequence = workflow.sequence && workflow.sequence.length > 0;
    const hasLegacyParallelGroups = workflow.parallel_groups && workflow.parallel_groups.length > 0;
    const hasLegacyConditions = workflow.conditions && Object.keys(workflow.conditions).length > 0;
    
    return Boolean(hasGraphStructure || hasLegacySequence || hasLegacyParallelGroups || hasLegacyConditions);
  }

  /**
   * Sequential Workflow Validation
   */
  private validateSequentialWorkflow(workflow: WorkflowConfig, agents: Agent[]): void {
    if (agents.length < 2) {
      this.addWarning('Sequential workflows work best with 2+ agents');
    }

    // Check if we have proper configuration
    const hasGraphStructure = workflow.graph_structure && workflow.graph_structure.edges.length > 0;
    const hasSequence = workflow.sequence && workflow.sequence.length > 0;

    if (!hasGraphStructure && !hasSequence) {
      this.addError('workflow.graph_structure', 'Sequential workflow requires edge configuration', 'required');
      return;
    }

    // Validate graph structure if present
    if (hasGraphStructure) {
      if (!workflow.graph_structure?.entry_point) {
        this.addError('workflow.graph_structure.entry_point', 'Sequential workflow requires an entry point', 'required');
      }
    }
  }

  /**
   * Parallel Workflow Validation
   */
  private validateParallelWorkflow(workflow: WorkflowConfig, agents: Agent[]): void {
    if (agents.length < 2) {
      this.addWarning('Parallel workflows work best with 2+ agents');
    }

    // Check if we have proper configuration
    const hasGraphStructure = workflow.graph_structure && workflow.graph_structure.edges.length > 0;
    const hasParallelGroups = workflow.parallel_groups && workflow.parallel_groups.length > 0;

    if (!hasGraphStructure && !hasParallelGroups) {
      this.addError('workflow.graph_structure', 'Parallel workflow requires edge configuration', 'required');
      return;
    }

    // Validate graph structure if present
    if (hasGraphStructure) {
      if (!workflow.graph_structure?.entry_point) {
        this.addError('workflow.graph_structure.entry_point', 'Parallel workflow requires an entry point', 'required');
      }
    }
  }

  /**
   * Conditional Workflow Validation
   */
  private validateConditionalWorkflow(workflow: WorkflowConfig, agents: Agent[]): void {
    // Check if we have proper configuration
    const hasGraphStructure = workflow.graph_structure && workflow.graph_structure.edges.length > 0;
    const hasConditions = workflow.conditions && Object.keys(workflow.conditions).length > 0;
    const hasAgentDependencies = agents.some(agent => agent.depends_on && agent.depends_on.length > 0) || false;

    if (!hasGraphStructure && !hasConditions && !hasAgentDependencies) {
      this.addError('workflow.graph_structure', 'Conditional workflow requires edge configuration', 'required');
      return;
    }

    // Validate graph structure if present
    if (hasGraphStructure) {
      if (!workflow.graph_structure?.entry_point) {
        this.addError('workflow.graph_structure.entry_point', 'Conditional workflow requires an entry point', 'required');
      }
    }
  }

  /**
   * Utility Methods
   */
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
