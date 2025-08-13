/**
 * useTemplateExecution Hook
 * 
 * Hook for template execution with real-time streaming and workflow visualization
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { executionService } from '../services/execution.service';
import type { 
  ExecutionRequest, 
  ExecutionResponse, 
  ExecutionResult, 
  StreamingEvent, 
  ParallelProgress,
  InterventionRequest,
  InterventionResponse 
} from '../services/execution.service';
import type { Template } from '../types';

export interface WorkflowNode {
  id: string;
  name: string;
  type: 'research' | 'analysis' | 'synthesis' | 'validation' | 'custom';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'waiting_intervention';
  progress: number;
  cost: number;
  tokens: number;
  tavilyCredits: number;
  duration: number;
  confidence: number;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface WorkflowVisualization {
  nodes: WorkflowNode[];
  edges: Array<{ from: string; to: string }>;
  currentNode?: string;
  completedNodes: string[];
  failedNodes: string[];
}

interface UseTemplateExecutionOptions {
  enableRealTimeUpdates?: boolean;
  autoReconnect?: boolean;
  reconnectDelay?: number;
}

interface UseTemplateExecutionReturn {
  // Execution state
  execution: ExecutionResult | null;
  isExecuting: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Workflow visualization
  workflow: WorkflowVisualization | null;
  parallelProgress: ParallelProgress | null;
  
  // Streaming state
  isConnected: boolean;
  connectionId: string | null;
  lastEventTime: Date | null;
  
  // Intervention state
  pendingInterventions: InterventionRequest[];
  
  // Actions
  executeTemplate: (request: ExecutionRequest) => Promise<string | null>;
  cancelExecution: () => Promise<void>;
  submitIntervention: (response: InterventionResponse) => Promise<void>;
  reconnectStream: () => void;
  
  // Template management
  availableTemplates: Template[];
  selectedTemplate: Template | null;
  loadTemplate: (templateId: string) => Promise<void>;
  validateQuery: (query: string) => Promise<{ isValid: boolean; errors: string[] }>;
}

export function useTemplateExecution(
  options: UseTemplateExecutionOptions = {}
): UseTemplateExecutionReturn {
  const {
    enableRealTimeUpdates = true,
    autoReconnect = true,
    reconnectDelay = 5000,
  } = options;

  // State
  const [execution, setExecution] = useState<ExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [workflow, setWorkflow] = useState<WorkflowVisualization | null>(null);
  const [parallelProgress, setParallelProgress] = useState<ParallelProgress | null>(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [lastEventTime, setLastEventTime] = useState<Date | null>(null);
  
  const [pendingInterventions, setPendingInterventions] = useState<InterventionRequest[]>([]);
  
  const [availableTemplates, setAvailableTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Refs
  const streamCleanupRef = useRef<(() => void) | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentExecutionIdRef = useRef<string | null>(null);

  // Initialize workflow from template
  const initializeWorkflow = useCallback((template: Template): WorkflowVisualization => {
    const nodes: WorkflowNode[] = template.agents.map(agent => ({
      id: agent.id || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: agent.name,
      type: agent.type,
      status: 'pending',
      progress: 0,
      cost: 0,
      tokens: 0,
      tavilyCredits: 0,
      duration: 0,
      confidence: 0,
    }));

    // Create edges based on workflow configuration
    const edges: Array<{ from: string; to: string }> = [];
    
    if (template.workflow.mode === 'sequential' && template.workflow.sequence) {
      for (let i = 0; i < template.workflow.sequence.length - 1; i++) {
        edges.push({
          from: template.workflow.sequence[i],
          to: template.workflow.sequence[i + 1],
        });
      }
    } else if (template.workflow.mode === 'parallel' && template.workflow.parallel_groups) {
      // For parallel workflows, create edges within groups
      template.workflow.parallel_groups.forEach(group => {
        for (let i = 0; i < group.length - 1; i++) {
          edges.push({
            from: group[i],
            to: group[i + 1],
          });
        }
      });
    }

    return {
      nodes,
      edges,
      completedNodes: [],
      failedNodes: [],
    };
  }, []);

  // Update workflow node
  const updateWorkflowNode = useCallback((nodeId: string, updates: Partial<WorkflowNode>) => {
    setWorkflow(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        nodes: prev.nodes.map(node => 
          node.id === nodeId ? { ...node, ...updates } : node
        ),
        currentNode: updates.status === 'running' ? nodeId : prev.currentNode,
        completedNodes: updates.status === 'completed' 
          ? [...prev.completedNodes.filter(id => id !== nodeId), nodeId]
          : prev.completedNodes,
        failedNodes: updates.status === 'failed'
          ? [...prev.failedNodes.filter(id => id !== nodeId), nodeId]
          : prev.failedNodes,
      };
    });
  }, []);

  // Handle streaming events
  const handleStreamingEvent = useCallback((event: StreamingEvent) => {
    setLastEventTime(new Date());
    setError(null);

    switch (event.type) {
      case 'connection_established':
        setIsConnected(true);
        setConnectionId(event.data.connection_id);
        console.log('SSE connection established:', event.data.connection_id);
        break;

      case 'agent_started':
        updateWorkflowNode(event.data.agent_id, {
          status: 'running',
          startedAt: event.data.timestamp,
        });
        break;

      case 'agent_result': {
        const agentResult = event.data.agent_result;
        console.log('🎯 SSE Agent Result Received:', {
          agent_id: agentResult.agent_id,
          agent_name: agentResult.agent_name,
          success: agentResult.success,
          completed_at: agentResult.completed_at,
          cost: agentResult.cost,
          tokens: agentResult.tokens_used
        });
        
        updateWorkflowNode(agentResult.agent_id, {
          status: agentResult.success ? 'completed' : 'failed',
          progress: 100,
          cost: agentResult.cost,
          tokens: agentResult.tokens_used,
          tavilyCredits: agentResult.tavily_credits,
          duration: agentResult.duration_seconds,
          confidence: agentResult.confidence_score * 100,
          error: agentResult.error,
          completedAt: agentResult.completed_at,
        });
        
        // Store the structured agent result in the execution state
        setExecution(prev => {
          if (!prev) return null;
          
          const updatedAgentResults = [...prev.agent_results];
          const existingIndex = updatedAgentResults.findIndex(r => r.agent_id === agentResult.agent_id);
          
          if (existingIndex >= 0) {
            updatedAgentResults[existingIndex] = agentResult;
          } else {
            updatedAgentResults.push(agentResult);
          }
          
          const updatedExecution = {
            ...prev,
            agent_results: updatedAgentResults,
            total_cost: prev.total_cost + agentResult.cost,
            total_tokens: prev.total_tokens + agentResult.tokens_used,
            total_tavily_credits: prev.total_tavily_credits + agentResult.tavily_credits,
          };
          
          console.log('✅ Execution State Updated:', {
            agent_results_count: updatedExecution.agent_results.length,
            latest_agent: agentResult.agent_name,
            total_cost: updatedExecution.total_cost
          });
          
          return updatedExecution;
        });
        break;
      }

      case 'execution_status':
        setExecution(prev => prev ? {
          ...prev,
          status: event.data.status,
          progress_percentage: event.data.progress_percentage || prev.progress_percentage,
          current_agent: event.data.current_agent,
        } : null);
        break;

      case 'parallel_progress':
        setParallelProgress(event.data);
        break;

      case 'execution_completed':
        setIsExecuting(false);
        // Replace with complete execution data from the event
        setExecution(prev => prev ? {
          ...prev,
          status: 'completed',
          agent_results: event.data.agent_results || prev.agent_results,
          final_result: event.data.final_result,
          total_cost: event.data.total_cost,
          total_duration: event.data.total_duration,
          overall_confidence: event.data.overall_confidence,
          total_tokens: event.data.total_tokens || prev.total_tokens,
          total_tavily_credits: event.data.total_tavily_credits || prev.total_tavily_credits,
          progress_percentage: event.data.progress_percentage || 100.0,
          current_agent: event.data.current_agent,
          error_message: event.data.error_message,
          failed_agent: event.data.failed_agent,
          completed_at: event.data.completed_at,
        } : null);
        break;

      case 'execution_error':
        setIsExecuting(false);
        setError(event.data.error_message);
        setExecution(prev => prev ? {
          ...prev,
          status: 'failed',
          error_message: event.data.error_message,
          failed_agent: event.data.failed_agent,
        } : null);
        break;

      case 'intervention_required':
        setPendingInterventions(prev => [...prev, event.data]);
        updateWorkflowNode(event.data.agent_id, {
          status: 'waiting_intervention',
        });
        break;

      case 'heartbeat':
        // Keep connection alive
        break;

      default:
        console.log('Unknown streaming event:', event.type, event.data);
    }
  }, [updateWorkflowNode]);

  // Start streaming
  const startStreaming = useCallback((executionId: string) => {
    if (streamCleanupRef.current) {
      streamCleanupRef.current();
    }

    if (enableRealTimeUpdates) {
      try {
        const cleanup = executionService.createExecutionStream(executionId, handleStreamingEvent);
        streamCleanupRef.current = cleanup;
      } catch (error) {
        console.error('Failed to start streaming:', error);
        setError('Failed to establish real-time connection');
      }
    }
  }, [enableRealTimeUpdates, handleStreamingEvent]);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    if (streamCleanupRef.current) {
      streamCleanupRef.current();
      streamCleanupRef.current = null;
    }
    setIsConnected(false);
    setConnectionId(null);
  }, []);

  // Execute template
  const executeTemplate = useCallback(async (request: ExecutionRequest): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);
      setIsExecuting(true);

      const response: ExecutionResponse = await executionService.executeTemplate(request);
      
      if (response.execution_id) {
        currentExecutionIdRef.current = response.execution_id;
        
        // Initialize execution state
        setExecution({
          execution_id: response.execution_id,
          template_id: request.template_id,
          template_name: selectedTemplate?.name || 'Unknown Template',
          query: request.query,
          status: 'pending',
          agent_results: [],
          total_cost: 0,
          total_duration: 0,
          overall_confidence: 0,
          total_tokens: 0,
          total_tavily_credits: 0,
          progress_percentage: 0,
          started_at: new Date().toISOString(),
          user_id: '', // Will be set by backend
        });

        // Start streaming with real execution ID immediately
        startStreaming(response.execution_id);

        return response.execution_id;
      }

      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute template');
      setIsExecuting(false);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [selectedTemplate, startStreaming, enableRealTimeUpdates, handleStreamingEvent]);

  // Cancel execution
  const cancelExecution = useCallback(async () => {
    if (!currentExecutionIdRef.current) return;

    try {
      await executionService.cancelExecution(currentExecutionIdRef.current);
      setIsExecuting(false);
      stopStreaming();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to cancel execution');
    }
  }, [stopStreaming]);

  // Submit intervention response
  const submitIntervention = useCallback(async (response: InterventionResponse) => {
    try {
      await executionService.submitInterventionResponse(response);
      
      // Remove the processed intervention from the queue
      setPendingInterventions(prev => 
        prev.filter(intervention => intervention.intervention_id !== response.intervention_id)
      );
      
      // Find the intervention to update workflow node status
      const intervention = pendingInterventions.find(i => i.intervention_id === response.intervention_id);
      if (intervention) {
        updateWorkflowNode(intervention.agent_id, {
          status: response.action === 'approve' ? 'running' : 'failed',
        });
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to submit intervention');
    }
  }, [pendingInterventions, updateWorkflowNode]);

  // Reconnect stream
  const reconnectStream = useCallback(() => {
    if (currentExecutionIdRef.current && !isConnected) {
      startStreaming(currentExecutionIdRef.current);
    }
  }, [isConnected, startStreaming]);

  // Load available templates
  const loadAvailableTemplates = useCallback(async () => {
    try {
      const templates = await executionService.getAvailableTemplates();
      setAvailableTemplates(templates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  }, []);

  // Load specific template
  const loadTemplate = useCallback(async (templateId: string) => {
    try {
      setIsLoading(true);
      const template = await executionService.getTemplateForExecution(templateId);
      setSelectedTemplate(template);
      
      // Initialize workflow visualization
      const workflowViz = initializeWorkflow(template);
      setWorkflow(workflowViz);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load template');
    } finally {
      setIsLoading(false);
    }
  }, [initializeWorkflow]);

  // Validate query
  const validateQuery = useCallback(async (query: string): Promise<{ isValid: boolean; errors: string[] }> => {
    if (!selectedTemplate?.id) {
      return { isValid: false, errors: ['No template selected'] };
    }

    try {
      return await executionService.validateQuery(selectedTemplate.id, query);
    } catch (error) {
      return { isValid: false, errors: ['Validation failed'] };
    }
  }, [selectedTemplate]);

  // Auto-reconnect on connection loss
  useEffect(() => {
    if (!isConnected && isExecuting && autoReconnect && currentExecutionIdRef.current) {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('Attempting to reconnect...');
        reconnectStream();
      }, reconnectDelay);
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isConnected, isExecuting, autoReconnect, reconnectDelay, reconnectStream]);

  // Load templates on mount
  useEffect(() => {
    loadAvailableTemplates();
  }, [loadAvailableTemplates]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStreaming();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [stopStreaming]);

  return {
    // Execution state
    execution,
    isExecuting,
    isLoading,
    error,
    
    // Workflow visualization
    workflow,
    parallelProgress,
    
    // Streaming state
    isConnected,
    connectionId,
    lastEventTime,
    
    // Intervention state
    pendingInterventions,
    
    // Actions
    executeTemplate,
    cancelExecution,
    submitIntervention,
    reconnectStream,
    
    // Template management
    availableTemplates,
    selectedTemplate,
    loadTemplate,
    validateQuery,
  };
}

export default useTemplateExecution;
