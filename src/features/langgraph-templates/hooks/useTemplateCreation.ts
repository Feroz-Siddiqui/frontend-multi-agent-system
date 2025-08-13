/**
 * Template Creation Hook
 * 
 * Clean state management for template creation with robust validation
 */

import { useState, useCallback, useMemo } from 'react';
import type { 
  Template, 
  Agent, 
  WorkflowConfig, 
  ValidationResult
} from '../types';
import {
  DEFAULT_TEMPLATE_CREATION_DATA,
  DEFAULT_AGENT
} from '../types';
import { getWorkflowSummary } from '../utils/template-validation';
import { templateService } from '../services';

interface UseTemplateCreationOptions {
  initialTemplate?: Partial<Template>;
  onSave?: (template: Template) => Promise<void>;
  onSuccess?: () => void;
}

interface UseTemplateCreationReturn {
  // Template state
  template: Template;
  
  // Validation
  validation: ValidationResult;
  isValid: boolean;
  
  // Actions
  updateTemplate: (updates: Partial<Template>) => void;
  updateAgent: (index: number, updates: Partial<Agent>) => void;
  addAgent: (agent?: Partial<Agent>) => void;
  removeAgent: (index: number) => void;
  reorderAgents: (fromIndex: number, toIndex: number) => void;
  updateWorkflow: (workflow: Partial<WorkflowConfig>) => void;
  
  // Field interaction tracking
  markFieldTouched: () => void;
  
  // Workflow helpers
  workflowSummary: string;
  canSave: boolean;
  
  // Form state
  isSubmitting: boolean;
  
  // Actions
  save: () => Promise<void>;
  reset: () => void;
  loadTemplate: (template: Template) => void;
}

export function useTemplateCreation(options: UseTemplateCreationOptions = {}): UseTemplateCreationReturn {
  const { initialTemplate, onSave } = options;

  // Initialize template with defaults
  const [template, setTemplate] = useState<Template>(() => ({
    ...DEFAULT_TEMPLATE_CREATION_DATA,
    // Set default workflow to sequential since we removed workflow step
    workflow: {
      mode: 'sequential',
      sequence: [],
      max_concurrent_agents: 3,
      completion_strategy: 'all',
      timeout_seconds: 1800,
      retry_failed_agents: false,
      continue_on_failure: true,
    },
    // Ensure templates are active by default
    is_active: true,
    is_public: false,
    ...initialTemplate,
  }));

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Remove automatic validation - make it manual only
  const validation: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  const isValid = true; // Always true since we removed automatic validation
  
  // Simple canSave logic - just check basic requirements and validation
  const canSave = useMemo(() => {
    return (
      Boolean(template.name.trim()) &&           // Has name
      Boolean(template.description.trim()) &&    // Has description
      template.agents.length > 0 &&              // Has at least 1 agent
      !isSubmitting                              // Not currently saving
    );
  }, [template.name, template.description, template.agents.length, isSubmitting]);

  // Get workflow summary
  const workflowSummary = useMemo(() => {
    return getWorkflowSummary(template.workflow, template.agents);
  }, [template.workflow, template.agents]);

  // Update template
  const updateTemplate = useCallback((updates: Partial<Template>) => {
    setTemplate(prev => ({ ...prev, ...updates }));
  }, []);

  // Helper function to create smart groups by dividing agents into groups of specified size
  const createSmartGroups = useCallback((agents: Agent[], groupSize: number = 2) => {
    const groups = [];
    
    for (let i = 0; i < agents.length; i += groupSize) {
      const group = agents
        .slice(i, i + groupSize)
        .map(agent => agent.id || agent.name);
      groups.push(group);
    }
    
    return groups;
  }, []);

  // Helper function to calculate appropriate workflow timeout based on agents and mode
  const calculateWorkflowTimeout = useCallback((agents: Agent[], mode: string) => {
    if (agents.length === 0) return 1800; // 30 min default
    
    switch (mode) {
      case 'sequential': {
        // Sum of all agent timeouts + 20% buffer
        const totalTime = agents.reduce((sum, agent) => sum + agent.timeout_seconds, 0);
        return Math.max(Math.ceil(totalTime * 1.2), 3600); // 20% buffer, min 1 hour
      }
        
      case 'parallel': {
        // For parallel with smart grouping, calculate based on group stages
        // Each group runs sequentially, but agents within groups run concurrently
        const maxAgentTime = Math.max(...agents.map(agent => agent.timeout_seconds));
        const numGroups = Math.ceil(agents.length / 2); // Groups of 2
        const totalTime = maxAgentTime * numGroups; // Each group stage takes max agent time
        return Math.max(Math.ceil(totalTime * 1.2), 1800); // 20% buffer, min 30 min
      }
        
      case 'conditional': {
        // Conservative estimate based on potential dependency chains
        const avgTime = agents.reduce((sum, agent) => sum + agent.timeout_seconds, 0) / agents.length;
        return Math.max(Math.ceil(avgTime * agents.length * 0.7), 2400); // 70% of sequential, min 40 min
      }
        
      case 'langgraph':
        // Conservative estimate for graph execution
        return Math.max(agents.length * 300, 1800); // 5 min per agent, min 30 min
        
      default:
        return 1800;
    }
  }, []);

  // Agent management
  const updateAgent = useCallback((index: number, updates: Partial<Agent>) => {
    setTemplate(prev => {
      const newAgents = prev.agents.map((agent, i) => 
        i === index ? { ...agent, ...updates } : agent
      );
      
      const newWorkflow = { ...prev.workflow };
      
      // If agent timeout was updated, recalculate workflow timeout
      if ('timeout_seconds' in updates) {
        const calculatedTimeout = calculateWorkflowTimeout(newAgents, prev.workflow.mode);
        if (calculatedTimeout > newWorkflow.timeout_seconds) {
          newWorkflow.timeout_seconds = calculatedTimeout;
        }
      }
      
      return {
        ...prev,
        agents: newAgents,
        workflow: newWorkflow,
      };
    });
  }, [calculateWorkflowTimeout]);

  const addAgent = useCallback((agentData: Partial<Agent> = {}) => {
    setTemplate(prev => {
      const newAgent: Agent = {
        ...DEFAULT_AGENT,
        // Generate temporary ID for frontend validation - backend will replace with real ID
        id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `Agent ${prev.agents.length + 1}`,
        ...agentData,
      };

      const newAgents = [...prev.agents, newAgent];
      const newWorkflow = { ...prev.workflow };
      
      // Auto-update sequence for sequential workflow
      if (prev.workflow.mode === 'sequential') {
        newWorkflow.sequence = newAgents.map(agent => agent.id || agent.name);
      }
      
      // Auto-update parallel groups with smart grouping (groups of 2)
      if (prev.workflow.mode === 'parallel') {
        newWorkflow.parallel_groups = createSmartGroups(newAgents, 2);
      }

      // Auto-adjust max_concurrent_agents to not exceed total agents
      if (newWorkflow.max_concurrent_agents > newAgents.length) {
        newWorkflow.max_concurrent_agents = newAgents.length;
      }

      // Auto-calculate and update workflow timeout to prevent validation errors
      const calculatedTimeout = calculateWorkflowTimeout(newAgents, prev.workflow.mode);
      if (calculatedTimeout > newWorkflow.timeout_seconds) {
        newWorkflow.timeout_seconds = calculatedTimeout;
      }

      return {
        ...prev,
        agents: newAgents,
        workflow: newWorkflow,
      };
    });
  }, [createSmartGroups, calculateWorkflowTimeout]);

  const reorderAgents = useCallback((fromIndex: number, toIndex: number) => {
    setTemplate(prev => {
      const newAgents = [...prev.agents];
      const [movedAgent] = newAgents.splice(fromIndex, 1);
      newAgents.splice(toIndex, 0, movedAgent);
      
      return {
        ...prev,
        agents: newAgents,
      };
    });
  }, []);

  const removeAgent = useCallback((index: number) => {
    setTemplate(prev => {
      const newAgents = prev.agents.filter((_, i) => i !== index);
      const removedAgent = prev.agents[index];
      
      // Update workflow to handle removed agent
      const newWorkflow = { ...prev.workflow };
      
      // Handle sequential workflow sequence
      if (prev.workflow.mode === 'sequential' && prev.workflow.sequence) {
        if (removedAgent.id) {
          // For existing agents with IDs, filter by ID
          newWorkflow.sequence = prev.workflow.sequence.filter(
            id => id !== removedAgent.id
          );
        } else {
          // For new agents without IDs, filter by index and adjust remaining indices
          const indexStr = index.toString();
          newWorkflow.sequence = prev.workflow.sequence
            .filter(id => id !== indexStr)
            .map(id => {
              // If it's a numeric index and greater than removed index, decrement it
              if (id.match(/^\d+$/)) {
                const idNum = parseInt(id);
                return idNum > index ? (idNum - 1).toString() : id;
              }
              return id;
            });
        }
      }
      
      // Handle parallel workflow groups - regenerate smart groups after removal
      if (prev.workflow.mode === 'parallel') {
        newWorkflow.parallel_groups = createSmartGroups(newAgents, 2);
      }

      // Handle conditional workflow dependencies
      if (prev.workflow.mode === 'conditional') {
        newAgents.forEach((agent) => {
          if (agent.depends_on) {
            if (removedAgent.id) {
              // For existing agents with IDs, filter by ID
              agent.depends_on = agent.depends_on.filter(depId => depId !== removedAgent.id);
            } else {
              // For new agents without IDs, filter by index and adjust remaining indices
              const indexStr = index.toString();
              agent.depends_on = agent.depends_on
                .filter(depId => depId !== indexStr)
                .map(depId => {
                  // If it's a numeric index and greater than removed index, decrement it
                  if (depId.match(/^\d+$/)) {
                    const depNum = parseInt(depId);
                    return depNum > index ? (depNum - 1).toString() : depId;
                  }
                  return depId;
                });
            }
          }
        });
      }

      // Auto-adjust max_concurrent_agents to not exceed total agents
      if (newWorkflow.max_concurrent_agents > newAgents.length) {
        newWorkflow.max_concurrent_agents = newAgents.length;
      }

      return {
        ...prev,
        agents: newAgents,
        workflow: newWorkflow,
      };
    });
  }, []);

  // Workflow management with complete replacement support
  const updateWorkflow = useCallback((workflowUpdates: Partial<WorkflowConfig>) => {
    setTemplate(prev => {
      let newWorkflow: WorkflowConfig;
      
      // If the update contains a 'mode' change, treat it as a complete replacement
      // to ensure clean state transitions between workflow modes
      if ('mode' in workflowUpdates && workflowUpdates.mode !== prev.workflow.mode) {
        // Complete replacement for mode changes
        newWorkflow = workflowUpdates as WorkflowConfig;
      } else {
        // Partial update for same-mode changes
        newWorkflow = { ...prev.workflow, ...workflowUpdates };
      }
      
      // Auto-calculate timeout if mode changed or if current timeout is insufficient
      if ('mode' in workflowUpdates && prev.agents.length > 0) {
        const calculatedTimeout = calculateWorkflowTimeout(prev.agents, newWorkflow.mode);
        if (calculatedTimeout > newWorkflow.timeout_seconds) {
          newWorkflow.timeout_seconds = calculatedTimeout;
        }
      }
      
      return {
        ...prev,
        workflow: newWorkflow,
      };
    });
  }, [calculateWorkflowTimeout]);

  // Save template with enhanced error handling and success feedback
  const save = useCallback(async () => {
    if (!canSave) return;

    setIsSubmitting(true);
    try {
      let savedTemplate: Template;
      
      if (onSave) {
        // Use custom save handler if provided
        await onSave(template);
        // For custom handlers, we assume success if no error is thrown
        console.log('✅ Template saved successfully via custom handler');
      } else {
        // Use default template service with detailed logging
        if (template.id) {
          console.log('🔄 Updating existing template:', template.id);
          savedTemplate = await templateService.updateTemplate(template.id, template);
          console.log('✅ Template updated successfully:', savedTemplate);
        } else {
          console.log('🔄 Creating new template:', template.name);
          savedTemplate = await templateService.createTemplate(template);
          console.log('✅ Template created successfully:', savedTemplate);
          
          // Update local template state with the created template (including real ID)
          setTemplate(savedTemplate);
        }
      }
      
      // Success - template has been saved to backend
      console.log('🎉 Template save operation completed successfully');
      
    } catch (error) {
      console.error('❌ Failed to save template:', error);
      
      // Re-throw the error so the UI can handle it appropriately
      // This will prevent navigation if the save failed
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [canSave, onSave, template, setTemplate]);

  // Reset template
  const reset = useCallback(() => {
    setTemplate({ ...DEFAULT_TEMPLATE_CREATION_DATA, ...initialTemplate });
    setIsSubmitting(false);
  }, [initialTemplate]);

  // Load template
  const loadTemplate = useCallback((newTemplate: Template) => {
    setTemplate(newTemplate);
    setIsSubmitting(false);
  }, []);

  // Mark field as touched - simplified (no-op for now)
  const markFieldTouched = useCallback(() => {
    // Simplified - no field touch tracking needed
  }, []);


  return {
    // Template state
    template,
    
    // Validation
    validation,
    isValid,
    
    // Actions
    updateTemplate,
    updateAgent,
    addAgent,
    removeAgent,
    reorderAgents,
    updateWorkflow,
    
    // Field interaction tracking
    markFieldTouched,
    
    // Workflow helpers
    workflowSummary,
    canSave,
    
    // Form state
    isSubmitting,
    
    // Actions
    save,
    reset,
    loadTemplate,
  };
}
