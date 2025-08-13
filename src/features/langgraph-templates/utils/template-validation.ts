/**
 * Enhanced Template Validation
 * 
 * Complete validation system matching backend POJO constraints exactly
 * Includes all enum validations and HITL configuration
 */

import type { 
  Template, 
  Agent, 
  WorkflowConfig, 
  ValidationResult, 
  ValidationError,
  AgentType,
  LLMModel,
  WorkflowMode,
  CompletionStrategy,
  InterventionType,
  InterventionPoint,
  TavilySearchDepth,
  TavilyTimeRange,
  TavilyFormat
} from '../types';

// Valid enum values - must match backend exactly
const VALID_AGENT_TYPES: AgentType[] = ['research', 'analysis', 'synthesis', 'validation'];
const VALID_LLM_MODELS: LLMModel[] = ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo'];
const VALID_WORKFLOW_MODES: WorkflowMode[] = ['sequential', 'parallel', 'conditional'];
const VALID_COMPLETION_STRATEGIES: CompletionStrategy[] = ['all', 'majority', 'any', 'threshold', 'first_success'];
const VALID_INTERVENTION_TYPES: InterventionType[] = ['approval', 'input', 'review', 'modify', 'decision'];
const VALID_INTERVENTION_POINTS: InterventionPoint[] = ['before_execution', 'after_execution', 'on_error', 'conditional'];
const VALID_TAVILY_SEARCH_DEPTHS: TavilySearchDepth[] = ['basic', 'advanced'];
const VALID_TAVILY_TIME_RANGES: TavilyTimeRange[] = ['day', 'week', 'month', 'year'];
const VALID_TAVILY_FORMATS: TavilyFormat[] = ['markdown', 'text'];

/**
 * Validate template according to backend POJO constraints
 */
export function validateTemplate(template: Template): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // Basic template validation
  validateBasicInfo(template, errors);
  
  // Agent validation
  validateAgents(template.agents, errors, warnings);
  
  // Workflow validation
  validateWorkflow(template.workflow, template.agents, errors, warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate basic template information
 */
function validateBasicInfo(template: Template, errors: ValidationError[]): void {
  // Name validation - matches backend: min_length=1, max_length=200
  if (!template.name || template.name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: 'Template name is required',
      type: 'required',
    });
  } else if (template.name.length > 200) {
    errors.push({
      field: 'name',
      message: 'Template name must be 200 characters or less',
      type: 'maxLength',
    });
  }

  // Description validation - matches backend: max_length=1000
  if (!template.description || template.description.trim().length === 0) {
    errors.push({
      field: 'description',
      message: 'Template description is required',
      type: 'required',
    });
  } else if (template.description.length > 1000) {
    errors.push({
      field: 'description',
      message: 'Template description must be 1000 characters or less',
      type: 'maxLength',
    });
  }

  // Note: Category validation removed as Template type doesn't include category property
}

/**
 * Validate agents array
 */
function validateAgents(agents: Agent[], errors: ValidationError[], warnings: string[]): void {
  // Agents array validation - matches backend: min_items=1, max_items=5
  if (agents.length === 0) {
    errors.push({
      field: 'agents',
      message: 'At least one agent is required',
      type: 'required',
    });
    return; // No point validating individual agents if none exist
  }

  if (agents.length > 5) {
    errors.push({
      field: 'agents',
      message: 'Maximum of 5 agents allowed',
      type: 'range',
    });
  }

  // Validate each agent
  agents.forEach((agent, index) => {
    validateAgent(agent, index, errors, warnings);
  });

  // Check for duplicate agent names
  const agentNames = agents.map(a => a.name.trim().toLowerCase()).filter(Boolean);
  const duplicateNames = agentNames.filter((name, index) => agentNames.indexOf(name) !== index);
  if (duplicateNames.length > 0) {
    errors.push({
      field: 'agents',
      message: 'Agent names must be unique',
      type: 'custom',
    });
  }
}

/**
 * Validate individual agent
 */
function validateAgent(agent: Agent, index: number, errors: ValidationError[], warnings: string[]): void {
  const fieldPrefix = `agents.${index}`;

  // Name validation - matches backend: min_length=1, max_length=100
  if (!agent.name || agent.name.trim().length === 0) {
    errors.push({
      field: `${fieldPrefix}.name`,
      message: 'Agent name is required',
      type: 'required',
    });
  } else if (agent.name.length > 100) {
    errors.push({
      field: `${fieldPrefix}.name`,
      message: 'Agent name must be 100 characters or less',
      type: 'maxLength',
    });
  }

  // Type validation - matches backend enum
  if (!VALID_AGENT_TYPES.includes(agent.type)) {
    errors.push({
      field: `${fieldPrefix}.type`,
      message: `Invalid agent type. Must be one of: ${VALID_AGENT_TYPES.join(', ')}`,
      type: 'enum',
    });
  }

  // System prompt validation - matches backend: min_length=10, max_length=2000
  if (!agent.system_prompt || agent.system_prompt.trim().length === 0) {
    errors.push({
      field: `${fieldPrefix}.system_prompt`,
      message: 'System prompt is required',
      type: 'required',
    });
  } else if (agent.system_prompt.length < 10) {
    errors.push({
      field: `${fieldPrefix}.system_prompt`,
      message: 'System prompt must be at least 10 characters',
      type: 'minLength',
    });
  } else if (agent.system_prompt.length > 2000) {
    errors.push({
      field: `${fieldPrefix}.system_prompt`,
      message: 'System prompt must be 2000 characters or less',
      type: 'maxLength',
    });
  }

  // User prompt validation - matches backend: min_length=10, max_length=1000
  if (!agent.user_prompt || agent.user_prompt.trim().length === 0) {
    errors.push({
      field: `${fieldPrefix}.user_prompt`,
      message: 'User prompt is required',
      type: 'required',
    });
  } else if (agent.user_prompt.length < 10) {
    errors.push({
      field: `${fieldPrefix}.user_prompt`,
      message: 'User prompt must be at least 10 characters',
      type: 'minLength',
    });
  } else if (agent.user_prompt.length > 1000) {
    errors.push({
      field: `${fieldPrefix}.user_prompt`,
      message: 'User prompt must be 1000 characters or less',
      type: 'maxLength',
    });
  }

  // LLM config validation
  validateLLMConfig(agent.llm_config, `${fieldPrefix}.llm_config`, errors);

  // Tavily config validation
  validateTavilyConfig(agent.tavily_config, `${fieldPrefix}.tavily_config`, errors, warnings);

  // HITL config validation
  if (agent.hitl_config) {
    validateHITLConfig(agent.hitl_config, `${fieldPrefix}.hitl_config`, errors, warnings);
  }

  // Timeout validation - matches backend: ge=30, le=3600
  if (agent.timeout_seconds < 30 || agent.timeout_seconds > 3600) {
    errors.push({
      field: `${fieldPrefix}.timeout_seconds`,
      message: 'Agent timeout must be between 30 and 3600 seconds',
      type: 'range',
    });
  }

  // Retry count validation - matches backend: ge=0, le=3
  if (agent.retry_count < 0 || agent.retry_count > 3) {
    errors.push({
      field: `${fieldPrefix}.retry_count`,
      message: 'Retry count must be between 0 and 3',
      type: 'range',
    });
  }

  // Priority validation - matches backend: ge=1, le=10
  if (agent.priority < 1 || agent.priority > 10) {
    errors.push({
      field: `${fieldPrefix}.priority`,
      message: 'Agent priority must be between 1 and 10',
      type: 'range',
    });
  }
}

/**
 * Validate LLM configuration
 */
function validateLLMConfig(llmConfig: Agent['llm_config'], fieldPrefix: string, errors: ValidationError[]): void {
  // Model validation - matches backend enum
  if (!VALID_LLM_MODELS.includes(llmConfig.model)) {
    errors.push({
      field: `${fieldPrefix}.model`,
      message: `Invalid LLM model. Must be one of: ${VALID_LLM_MODELS.join(', ')}`,
      type: 'enum',
    });
  }

  // Temperature validation - matches backend: ge=0.0, le=2.0
  if (llmConfig.temperature < 0.0 || llmConfig.temperature > 2.0) {
    errors.push({
      field: `${fieldPrefix}.temperature`,
      message: 'Temperature must be between 0.0 and 2.0',
      type: 'range',
    });
  }

  // Max tokens validation - matches backend: ge=100, le=4000
  if (llmConfig.max_tokens < 100 || llmConfig.max_tokens > 4000) {
    errors.push({
      field: `${fieldPrefix}.max_tokens`,
      message: 'Max tokens must be between 100 and 4000',
      type: 'range',
    });
  }
}

/**
 * Validate Tavily configuration
 */
function validateTavilyConfig(
  tavilyConfig: Agent['tavily_config'], 
  fieldPrefix: string, 
  errors: ValidationError[], 
  warnings: string[]
): void {
  // Max results validation - matches backend: ge=1, le=50
  if (tavilyConfig.max_results < 1 || tavilyConfig.max_results > 50) {
    errors.push({
      field: `${fieldPrefix}.max_results`,
      message: 'Max results must be between 1 and 50',
      type: 'range',
    });
  }

  // Search depth validation
  if (!VALID_TAVILY_SEARCH_DEPTHS.includes(tavilyConfig.search_depth)) {
    errors.push({
      field: `${fieldPrefix}.search_depth`,
      message: `Invalid search depth. Must be one of: ${VALID_TAVILY_SEARCH_DEPTHS.join(', ')}`,
      type: 'enum',
    });
  }

  // Time range validation (optional)
  if (tavilyConfig.time_range && !VALID_TAVILY_TIME_RANGES.includes(tavilyConfig.time_range)) {
    errors.push({
      field: `${fieldPrefix}.time_range`,
      message: `Invalid time range. Must be one of: ${VALID_TAVILY_TIME_RANGES.join(', ')}`,
      type: 'enum',
    });
  }

  // Format validation
  if (!VALID_TAVILY_FORMATS.includes(tavilyConfig.format)) {
    errors.push({
      field: `${fieldPrefix}.format`,
      message: `Invalid format. Must be one of: ${VALID_TAVILY_FORMATS.join(', ')}`,
      type: 'enum',
    });
  }

  // Crawl depth validation - matches backend: ge=1, le=5
  if (tavilyConfig.max_crawl_depth < 1 || tavilyConfig.max_crawl_depth > 5) {
    errors.push({
      field: `${fieldPrefix}.max_crawl_depth`,
      message: 'Max crawl depth must be between 1 and 5',
      type: 'range',
    });
  }

  // Crawl limit validation - matches backend: ge=1, le=100
  if (tavilyConfig.crawl_limit < 1 || tavilyConfig.crawl_limit > 100) {
    errors.push({
      field: `${fieldPrefix}.crawl_limit`,
      message: 'Crawl limit must be between 1 and 100',
      type: 'range',
    });
  }

  // Map depth validation - matches backend: ge=1, le=3
  if (tavilyConfig.max_map_depth < 1 || tavilyConfig.max_map_depth > 3) {
    errors.push({
      field: `${fieldPrefix}.max_map_depth`,
      message: 'Max map depth must be between 1 and 3',
      type: 'range',
    });
  }

  // Credits validation - matches backend: ge=1, le=50
  if (tavilyConfig.max_credits_per_agent < 1 || tavilyConfig.max_credits_per_agent > 50) {
    errors.push({
      field: `${fieldPrefix}.max_credits_per_agent`,
      message: 'Max credits per agent must be between 1 and 50',
      type: 'range',
    });
  }

  // Timeout validation - matches backend: ge=10, le=120
  if (tavilyConfig.timeout_seconds < 10 || tavilyConfig.timeout_seconds > 120) {
    errors.push({
      field: `${fieldPrefix}.timeout_seconds`,
      message: 'Tavily timeout must be between 10 and 120 seconds',
      type: 'range',
    });
  }

  // Retry attempts validation - matches backend: ge=0, le=3
  if (tavilyConfig.retry_attempts < 0 || tavilyConfig.retry_attempts > 3) {
    errors.push({
      field: `${fieldPrefix}.retry_attempts`,
      message: 'Retry attempts must be between 0 and 3',
      type: 'range',
    });
  }

  // API selection warnings
  const enabledAPIs = [
    tavilyConfig.search_api,
    tavilyConfig.extract_api,
    tavilyConfig.crawl_api,
    tavilyConfig.map_api
  ].filter(Boolean).length;

  if (enabledAPIs === 0) {
    warnings.push('No Tavily APIs enabled - agent will not have search capabilities');
  }

  if (tavilyConfig.crawl_api || tavilyConfig.map_api) {
    warnings.push('Using BETA Tavily APIs (Crawl/Map) - may have limited availability');
  }
}

/**
 * Validate HITL configuration
 */
function validateHITLConfig(
  hitlConfig: NonNullable<Agent['hitl_config']>, 
  fieldPrefix: string, 
  errors: ValidationError[], 
  warnings: string[]
): void {
  // Intervention type validation
  if (!VALID_INTERVENTION_TYPES.includes(hitlConfig.intervention_type)) {
    errors.push({
      field: `${fieldPrefix}.intervention_type`,
      message: `Invalid intervention type. Must be one of: ${VALID_INTERVENTION_TYPES.join(', ')}`,
      type: 'enum',
    });
  }

  // Intervention points validation
  hitlConfig.intervention_points.forEach((point, index) => {
    if (!VALID_INTERVENTION_POINTS.includes(point)) {
      errors.push({
        field: `${fieldPrefix}.intervention_points.${index}`,
        message: `Invalid intervention point. Must be one of: ${VALID_INTERVENTION_POINTS.join(', ')}`,
        type: 'enum',
      });
    }
  });

  // Timeout validation - matches backend: ge=30, le=3600
  if (hitlConfig.timeout_seconds < 30 || hitlConfig.timeout_seconds > 3600) {
    errors.push({
      field: `${fieldPrefix}.timeout_seconds`,
      message: 'HITL timeout must be between 30 and 3600 seconds',
      type: 'range',
    });
  }

  // Intervention points warnings
  if (hitlConfig.intervention_points.length === 0) {
    warnings.push('HITL enabled but no intervention points selected');
  }

  if (hitlConfig.intervention_points.includes('conditional') && hitlConfig.intervention_type !== 'decision') {
    warnings.push('Conditional intervention point works best with decision intervention type');
  }
}

/**
 * Validate workflow configuration
 */
function validateWorkflow(
  workflow: WorkflowConfig, 
  agents: Agent[], 
  errors: ValidationError[], 
  warnings: string[]
): void {
  const fieldPrefix = 'workflow';

  // Mode validation
  if (!VALID_WORKFLOW_MODES.includes(workflow.mode)) {
    errors.push({
      field: `${fieldPrefix}.mode`,
      message: `Invalid workflow mode. Must be one of: ${VALID_WORKFLOW_MODES.join(', ')}`,
      type: 'enum',
    });
  }

  // Completion strategy validation
  if (!VALID_COMPLETION_STRATEGIES.includes(workflow.completion_strategy)) {
    errors.push({
      field: `${fieldPrefix}.completion_strategy`,
      message: `Invalid completion strategy. Must be one of: ${VALID_COMPLETION_STRATEGIES.join(', ')}`,
      type: 'enum',
    });
  }

  // Max concurrent agents validation - matches backend: ge=1, le=10
  if (workflow.max_concurrent_agents < 1 || workflow.max_concurrent_agents > 10) {
    errors.push({
      field: `${fieldPrefix}.max_concurrent_agents`,
      message: 'Max concurrent agents must be between 1 and 10',
      type: 'range',
    });
  }

  // Timeout validation - matches backend: ge=60, le=7200
  if (workflow.timeout_seconds < 60 || workflow.timeout_seconds > 7200) {
    errors.push({
      field: `${fieldPrefix}.timeout_seconds`,
      message: 'Workflow timeout must be between 60 and 7200 seconds',
      type: 'range',
    });
  }

  // Required completions validation (for threshold strategy)
  if (workflow.completion_strategy === 'threshold') {
    if (!workflow.required_completions || workflow.required_completions < 1 || workflow.required_completions > agents.length) {
      errors.push({
        field: `${fieldPrefix}.required_completions`,
        message: `Required completions must be between 1 and ${agents.length} for threshold strategy`,
        type: 'range',
      });
    }
  }

  // Failure threshold validation
  if (workflow.failure_threshold && (workflow.failure_threshold < 1 || workflow.failure_threshold > agents.length)) {
    errors.push({
      field: `${fieldPrefix}.failure_threshold`,
      message: `Failure threshold must be between 1 and ${agents.length}`,
      type: 'range',
    });
  }

  // Mode-specific validation
  validateWorkflowModeSpecific(workflow, agents, fieldPrefix, errors, warnings);
}

/**
 * Validate mode-specific workflow configuration
 */
function validateWorkflowModeSpecific(
  workflow: WorkflowConfig, 
  agents: Agent[], 
  fieldPrefix: string, 
  errors: ValidationError[], 
  warnings: string[]
): void {
  switch (workflow.mode) {
    case 'sequential':
      if (!workflow.sequence || workflow.sequence.length === 0) {
        errors.push({
          field: `${fieldPrefix}.sequence`,
          message: 'Sequential workflow requires at least one agent in sequence',
          type: 'required',
        });
      } else {
        // Check that all agents in sequence exist
        workflow.sequence.forEach((agentId, index) => {
          if (!agents.find(a => a.id === agentId)) {
            errors.push({
              field: `${fieldPrefix}.sequence.${index}`,
              message: `Agent with ID ${agentId} not found`,
              type: 'custom',
            });
          }
        });

        // Check for duplicate agents in sequence
        const duplicates = workflow.sequence.filter((id, index) => workflow.sequence!.indexOf(id) !== index);
        if (duplicates.length > 0) {
          errors.push({
            field: `${fieldPrefix}.sequence`,
            message: 'Duplicate agents in sequence',
            type: 'custom',
          });
        }
      }
      break;

    case 'parallel':
      if (!workflow.parallel_groups || workflow.parallel_groups.length === 0) {
        errors.push({
          field: `${fieldPrefix}.parallel_groups`,
          message: 'Parallel workflow requires at least one group',
          type: 'required',
        });
      } else {
        // Validate each group
        workflow.parallel_groups.forEach((group, groupIndex) => {
          if (group.length === 0) {
            errors.push({
              field: `${fieldPrefix}.parallel_groups.${groupIndex}`,
              message: 'Parallel group cannot be empty',
              type: 'required',
            });
          }

          // Check that all agents in group exist
          group.forEach((agentId, agentIndex) => {
            if (!agents.find(a => a.id === agentId)) {
              errors.push({
                field: `${fieldPrefix}.parallel_groups.${groupIndex}.${agentIndex}`,
                message: `Agent with ID ${agentId} not found`,
                type: 'custom',
              });
            }
          });
        });
      }
      break;

    case 'conditional':
      if (!workflow.conditions) {
        warnings.push('Conditional workflow has no routing conditions defined');
      }
      break;
  }
}

/**
 * Get workflow summary for display
 */
export function getWorkflowSummary(workflow: WorkflowConfig, agents: Agent[]): string {
  switch (workflow.mode) {
    case 'sequential':
      return `Sequential execution of ${workflow.sequence?.length || 0} agents`;
    case 'parallel': {
      const groupCount = workflow.parallel_groups?.length || 0;
      const totalAgents = workflow.parallel_groups?.flat().length || 0;
      return `Parallel execution: ${groupCount} group${groupCount !== 1 ? 's' : ''}, ${totalAgents} agents total`;
    }
    case 'conditional':
      return `Conditional routing with ${agents.length} available agents`;
    default:
      return 'No workflow configured';
  }
}

/**
 * Check if template is ready for execution
 */
export function isTemplateExecutable(template: Template): boolean {
  const validation = validateTemplate(template);
  return validation.isValid && template.agents.length > 0;
}

/**
 * Get validation summary for display
 */
export function getValidationSummary(validation: ValidationResult): string {
  if (validation.isValid) {
    return 'Template is valid and ready to save';
  }

  const errorCount = validation.errors.length;
  const warningCount = validation.warnings.length;
  
  let summary = `${errorCount} error${errorCount !== 1 ? 's' : ''}`;
  if (warningCount > 0) {
    summary += `, ${warningCount} warning${warningCount !== 1 ? 's' : ''}`;
  }
  
  return summary;
}

/**
 * Step-by-step validation for template creation flow
 */
export interface StepValidationResult {
  isValid: boolean;
  canProceed: boolean;
  errors: ValidationError[];
  warnings: string[];
  suggestions: string[];
  completionPercentage: number;
}

/**
 * Validate basic info step
 */
export function validateBasicInfoStep(template: Template): StepValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Basic validation
  validateBasicInfo(template, errors);

  // Suggestions for improvement
  if (template.name && template.name.length < 10) {
    suggestions.push('Consider a more descriptive template name');
  }
  
  if (template.description && template.description.length < 50) {
    suggestions.push('Add more detail to the description for better understanding');
  }

  // Note: Template doesn't have metadata in current type definition
  // This would be handled in the form component directly

  const completionPercentage = calculateBasicInfoCompletion(template);

  return {
    isValid: errors.length === 0,
    canProceed: errors.length === 0 && !!template.name && !!template.description,
    errors,
    warnings,
    suggestions,
    completionPercentage,
  };
}

/**
 * Validate agents step
 */
export function validateAgentsStep(template: Template): StepValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Agent validation
  validateAgents(template.agents, errors, warnings);

  // Step-specific validation
  if (template.agents.length === 0) {
    errors.push({
      field: 'agents',
      message: 'At least one agent is required to proceed',
      type: 'required',
    });
    suggestions.push('Add your first agent to begin building the workflow');
  }

  // Suggestions for improvement
  if (template.agents.length === 1) {
    suggestions.push('Consider adding more agents for complex workflows');
  }

  const hitlAgents = template.agents.filter(a => a.hitl_config?.enabled);
  if (hitlAgents.length === 0 && template.agents.length > 1) {
    suggestions.push('Consider enabling HITL for critical decision points');
  }

  const uniqueTypes = new Set(template.agents.map(a => a.type));
  if (uniqueTypes.size === 1 && template.agents.length > 1) {
    suggestions.push('Consider using different agent types for specialized tasks');
  }

  const completionPercentage = calculateAgentsCompletion(template);

  return {
    isValid: errors.length === 0,
    canProceed: errors.length === 0 && template.agents.length > 0,
    errors,
    warnings,
    suggestions,
    completionPercentage,
  };
}

/**
 * Validate workflow step with cyclic flow detection
 */
export function validateWorkflowStep(template: Template): StepValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Basic workflow validation
  validateWorkflow(template.workflow, template.agents, errors, warnings);

  // Step-specific validation
  if (template.agents.length === 0) {
    errors.push({
      field: 'workflow',
      message: 'Configure agents before setting up workflow',
      type: 'required',
    });
  }

  // Cyclic flow detection
  const cyclicFlows = detectCyclicFlows(template.workflow);
  cyclicFlows.forEach(cycle => {
    errors.push({
      field: 'workflow.cycle',
      message: `Cyclic flow detected: ${cycle}`,
      type: 'custom',
    });
  });

  // Mode-specific suggestions
  switch (template.workflow.mode) {
    case 'sequential':
      if (!template.workflow.sequence || template.workflow.sequence.length === 0) {
        errors.push({
          field: 'workflow.sequence',
          message: 'Define agent execution order for sequential workflow',
          type: 'required',
        });
      } else if (template.workflow.sequence.length < template.agents.length) {
        suggestions.push('Consider including all agents in the sequence');
      }
      break;

    case 'parallel':
      if (!template.workflow.parallel_groups || template.workflow.parallel_groups.length === 0) {
        errors.push({
          field: 'workflow.parallel_groups',
          message: 'Define parallel groups for parallel workflow',
          type: 'required',
        });
      } else {
        const totalAgentsInGroups = template.workflow.parallel_groups.flat().length;
        if (totalAgentsInGroups < template.agents.length) {
          suggestions.push('Consider including all agents in parallel groups');
        }
        
        if (template.workflow.completion_strategy === 'all' && template.workflow.parallel_groups.length > 1) {
          warnings.push('All completion strategy with multiple groups may cause delays');
        }
      }
      break;

    case 'conditional':
      if (template.agents.length < 2) {
        warnings.push('Conditional workflows work best with multiple agents');
      }
      suggestions.push('Define routing conditions after template creation');
      break;
  }

  // Performance suggestions
  if (template.workflow.timeout_seconds > 3600) {
    warnings.push('Long timeout may impact user experience');
  }

  if (template.workflow.max_concurrent_agents > template.agents.length) {
    suggestions.push('Max concurrent agents exceeds total agent count');
  }

  const completionPercentage = calculateWorkflowCompletion(template);

  return {
    isValid: errors.length === 0,
    canProceed: errors.length === 0 && template.agents.length > 0,
    errors,
    warnings,
    suggestions,
    completionPercentage,
  };
}

/**
 * Detect cyclic flows in workflow configuration
 */
function detectCyclicFlows(workflow: WorkflowConfig): string[] {
  const cycles: string[] = [];

  switch (workflow.mode) {
    case 'sequential':
      // Sequential workflows are inherently acyclic
      break;

    case 'parallel':
      // Check for agents appearing in multiple groups
      if (workflow.parallel_groups) {
        const allAgents = workflow.parallel_groups.flat();
        const duplicates = allAgents.filter((agent, index) => allAgents.indexOf(agent) !== index);
        if (duplicates.length > 0) {
          cycles.push(`Agent(s) ${duplicates.join(', ')} appear in multiple parallel groups`);
        }
      }
      break;

    case 'conditional':
      // Conditional workflows need runtime analysis - warn about potential cycles
      if (workflow.conditions && Object.keys(workflow.conditions).length > 0) {
        cycles.push('Conditional workflows may create cycles - review routing logic carefully');
      }
      break;
  }

  return cycles;
}

/**
 * Calculate completion percentage for basic info
 */
function calculateBasicInfoCompletion(template: Template): number {
  let completed = 0;
  const total = 3; // name, description, metadata (handled in form)

  if (template.name) completed++;
  if (template.description) completed++;
  // Note: Additional metadata is handled in the form component, not in Template type
  // For now, we'll base completion on core fields only
  completed++; // Assume metadata completion is handled elsewhere

  return Math.round((completed / total) * 100);
}

/**
 * Calculate completion percentage for agents
 */
function calculateAgentsCompletion(template: Template): number {
  if (template.agents.length === 0) return 0;

  let totalScore = 0;
  const maxScorePerAgent = 8; // name, type, prompts, llm_config, tavily_config, hitl_config, timeout, priority

  template.agents.forEach(agent => {
    let agentScore = 0;
    
    if (agent.name) agentScore++;
    if (agent.type) agentScore++;
    if (agent.system_prompt && agent.system_prompt.length >= 10) agentScore++;
    if (agent.user_prompt && agent.user_prompt.length >= 10) agentScore++;
    if (agent.llm_config) agentScore++;
    if (agent.tavily_config) agentScore++;
    if (agent.hitl_config?.enabled) agentScore++;
    if (agent.timeout_seconds >= 30) agentScore++;

    totalScore += agentScore;
  });

  return Math.round((totalScore / (template.agents.length * maxScorePerAgent)) * 100);
}

/**
 * Calculate completion percentage for workflow
 */
function calculateWorkflowCompletion(template: Template): number {
  let completed = 0;
  const total = 6; // mode, configuration, strategy, timeout, failure handling, optimization

  if (template.workflow.mode) completed++;
  
  // Mode-specific configuration
  switch (template.workflow.mode) {
    case 'sequential':
      if (template.workflow.sequence && template.workflow.sequence.length > 0) completed++;
      break;
    case 'parallel':
      if (template.workflow.parallel_groups && template.workflow.parallel_groups.length > 0) completed++;
      break;
    case 'conditional':
      completed++; // Conditional is configured after creation
      break;
  }

  if (template.workflow.completion_strategy) completed++;
  if (template.workflow.timeout_seconds >= 60) completed++;
  if (typeof template.workflow.continue_on_failure === 'boolean') completed++;
  if (template.workflow.max_concurrent_agents >= 1) completed++;

  return Math.round((completed / total) * 100);
}

/**
 * Get step-specific validation
 */
export function getStepValidation(step: string, template: Template): StepValidationResult {
  switch (step) {
    case 'basic':
      return validateBasicInfoStep(template);
    case 'agents':
      return validateAgentsStep(template);
    case 'workflow':
      return validateWorkflowStep(template);
    case 'preview': {
      const validation = validateTemplate(template);
      return {
        isValid: validation.isValid,
        canProceed: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
        suggestions: validation.isValid ? ['Template is ready to save!'] : ['Fix all errors before saving'],
        completionPercentage: validation.isValid ? 100 : 75,
      };
    }
    default:
      return {
        isValid: false,
        canProceed: false,
        errors: [],
        warnings: [],
        suggestions: [],
        completionPercentage: 0,
      };
  }
}
