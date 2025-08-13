/**
 * AgentResultDetailPage Component
 * 
 * Detailed view of a single agent result with structured data display
 */

import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { Button } from '../../../components/ui/button';
import { Skeleton } from '../../../components/ui/skeleton';

import { ErrorDisplay } from '../../../components/common/ErrorDisplay';
import { NotFoundDisplay } from '../../../components/common/NotFoundDisplay';
import { PageHeader } from '../../../components/common/PageHeader';

import { useExecutionDetail } from '../hooks';
import { StructuredAgentResult } from '../components/StructuredAgentResult';

export function AgentResultDetailPage() {
  const { executionId, agentId } = useParams<{ executionId: string; agentId: string }>();
  const navigate = useNavigate();
  
  const { 
    execution, 
    isLoading, 
    error, 
    refresh,
  } = useExecutionDetail({
    executionId: executionId || '',
    enableRealTimeMonitoring: false,
    autoStopOnComplete: false,
  });

  if (!executionId || !agentId) {
    return <NotFoundDisplay message="Execution ID or Agent ID not provided" />;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <ErrorDisplay 
          message={error} 
          onRetry={refresh}
        />
      </div>
    );
  }

  if (!execution) {
    return <NotFoundDisplay message="Execution not found" />;
  }

  // Find the specific agent result
  const agentResult = execution.agent_results.find(result => result.agent_id === agentId);

  if (!agentResult) {
    return <NotFoundDisplay message="Agent result not found" />;
  }

  const handleBack = () => {
    navigate(`/execution-history/${executionId}`);
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <PageHeader
        title={agentResult.agent_name}
        description={`Detailed view of agent execution results from ${execution.template_name}`}
        actions={
          <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Execution
          </Button>
        }
      />

      {/* Structured Agent Result */}
      <StructuredAgentResult agentResult={agentResult} />
    </div>
  );
}

export default AgentResultDetailPage;
