/**
 * TemplateExecutionPage Component
 * 
 * Timeline-based execution page with explicit HITL handling
 * Clean, focused interface that makes interventions impossible to miss
 */

import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Play, Square, RefreshCw, AlertTriangle, Wifi, WifiOff, ArrowLeft, ExternalLink } from 'lucide-react';
import { useTemplateExecution } from '../hooks/useTemplateExecution';
import { LiveAgentTimeline } from '../components/LiveAgentTimeline';
import { ExecutionResultsDisplay } from '../components/ExecutionResultsDisplay';
import { executionService } from '../services/execution.service';
import type { ExecutionRequest, InterventionResponse } from '../services/execution.service';

// shadcn/ui components
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';
import { PageHeader } from '../../../components/common/PageHeader';

interface TemplateExecutionPageProps {
  className?: string;
}

export function TemplateExecutionPage({ className }: TemplateExecutionPageProps) {
  const [searchParams] = useSearchParams();
  
  // Form state
  const [query, setQuery] = useState<string>('');
  const [queryErrors, setQueryErrors] = useState<string[]>([]);
  
  // UI state
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Template execution hook
  const {
    execution,
    isExecuting,
    isLoading,
    error,
    workflow,
    isConnected,
    pendingInterventions,
    executeTemplate,
    cancelExecution,
    submitIntervention,
    selectedTemplate,
    loadTemplate,
    validateQuery,
  } = useTemplateExecution({
    enableRealTimeUpdates: true,
    autoReconnect: true,
    reconnectDelay: 5000,
  });

  // Load template and query from URL parameters on mount
  useEffect(() => {
    const templateId = searchParams.get('templateId');
    const prefilledQuery = searchParams.get('query');
    
    if (templateId) {
      loadTemplate(templateId);
    }
    
    if (prefilledQuery) {
      setQuery(decodeURIComponent(prefilledQuery));
    }
  }, [searchParams, loadTemplate]);

  // Handle query validation
  const handleQueryChange = async (newQuery: string) => {
    setQuery(newQuery);
    
    if (newQuery.trim().length > 10 && selectedTemplate) {
      const validation = await validateQuery(newQuery);
      setQueryErrors(validation.errors);
    } else {
      setQueryErrors([]);
    }
  };

  // Handle execution start
  const handleExecute = async () => {
    if (!selectedTemplate || !query.trim()) return;

    const validation = await validateQuery(query);
    if (!validation.isValid) {
      setQueryErrors(validation.errors);
      return;
    }

    const request: ExecutionRequest = {
      template_id: selectedTemplate.id!,
      query: query.trim(),
      custom_parameters: {},
    };

    const executionId = await executeTemplate(request);
    if (executionId) {
      // Optionally navigate to execution detail page
      // navigate(`/execution-history/${executionId}`);
    }
  };

  // Handle execution cancellation
  const handleCancel = async () => {
    await cancelExecution();
  };

  // Handle intervention resolution (from pending actions bar)
  const handleResolveIntervention = (interventionId: string) => {
    const intervention = pendingInterventions.find(i => i.intervention_id === interventionId);
    if (intervention) {
      setSelectedAgentId(intervention.agent_id);
    }
  };

  // Handle intervention submission
  const handleInterventionSubmit = async (response: InterventionResponse) => {
    await submitIntervention(response);
  };

  // Handle PDF export
  const handleExportPDF = async () => {
    if (!execution?.execution_id) return;
    
    setIsExporting(true);
    try {
      await executionService.exportExecution(execution.execution_id, 'pdf');
    } catch (error) {
      console.error('Failed to export PDF:', error);
      // You could add a toast notification here
    } finally {
      setIsExporting(false);
    }
  };

  const canExecute = selectedTemplate && query.trim().length > 10 && queryErrors.length === 0 && !isExecuting;

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Page Header */}
      <PageHeader
        title="Multi-Agent Execution"
        description="Timeline-based execution with explicit HITL handling"
        actions={
          <div className="flex items-center space-x-2">
            {/* Navigation to Execution Detail Page */}
            {execution?.execution_id && (
              <Button variant="outline" size="sm" asChild>
                <Link to={`/execution-history/${execution.execution_id}`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </Button>
            )}
            
            <Badge variant={isConnected ? "secondary" : "destructive"} className="flex items-center space-x-1">
              {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              <span>{isConnected ? "Connected" : "Disconnected"}</span>
            </Badge>
          </div>
        }
      />

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Top Section: Connection Status & Template Info */}
      <div className="space-y-4">
        {/* Connection Status & Back Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {!isConnected && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/templates">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Templates
                </Link>
              </Button>
            )}
            {isConnected && (
              <div className="text-sm text-green-600 font-medium">
                ✅ Connected - Execution Ready
              </div>
            )}
          </div>
        </div>

        {/* Template Info - Full Width */}
        {selectedTemplate && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Execute: {selectedTemplate.name}</span>
                <Badge variant="secondary" className="capitalize">
                  {selectedTemplate.workflow.mode} workflow
                </Badge>
              </CardTitle>
              <CardDescription>
                {selectedTemplate.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>{selectedTemplate.agents.length} agent{selectedTemplate.agents.length !== 1 ? 's' : ''}</span>
                <span>{selectedTemplate.workflow.mode} workflow</span>
              </div>
            </CardContent>
          </Card>
        )}

        {!selectedTemplate && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <p>No template selected. Please select a template from the templates page.</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link to="/templates">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go to Templates
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Query Input Section - Full Width */}
      <Card>
        <CardHeader>
          <CardTitle>Query Input</CardTitle>
          <CardDescription>
            Enter your query for the selected template
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="query">Query</Label>
            <Textarea
              id="query"
              placeholder="Enter your query here... (minimum 10 characters)"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              rows={4}
              disabled={isExecuting}
            />
            {queryErrors.length > 0 && (
              <div className="space-y-1">
                {queryErrors.map((error, index) => (
                  <p key={index} className="text-sm text-red-600">{error}</p>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={handleExecute}
              disabled={!canExecute || isLoading}
              className="flex-1 max-w-xs"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {isExecuting ? 'Executing...' : 'Execute Template'}
            </Button>
            
            {isExecuting && (
              <Button variant="destructive" onClick={handleCancel}>
                <Square className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Interventions are now integrated directly into the timeline below */}

      {/* MAIN CONTENT: FULL WIDTH TIMELINE */}
      {(execution || workflow || isExecuting) && (
        <LiveAgentTimeline
          execution={execution}
          workflow={workflow}
          pendingInterventions={pendingInterventions}
          selectedAgentId={selectedAgentId}
          onAgentSelect={setSelectedAgentId}
          onResolveIntervention={handleResolveIntervention}
          onInterventionSubmit={handleInterventionSubmit}
        />
      )}

      {/* Beautiful Execution Results Display */}
      {execution && execution.status === 'completed' && (
        <ExecutionResultsDisplay
          execution={execution}
          onExport={handleExportPDF}
          isExporting={isExporting}
          onRunAgain={() => {
            // Reset and run again with same query
            if (selectedTemplate && query) {
              handleExecute();
            }
          }}
        />
      )}
    </div>
  );
}

export default TemplateExecutionPage;
