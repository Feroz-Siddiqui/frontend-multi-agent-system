/**
 * ExecutionDetailPage Component
 * 
 * Beautiful execution detail page matching TemplateDetailPage design exactly
 */

import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Bot,
  Activity,
  FileText,
  Settings,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  Lightbulb,
  Globe,
  ExternalLink
} from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { ErrorDisplay } from '../../../components/common/ErrorDisplay';
import { NotFoundDisplay } from '../../../components/common/NotFoundDisplay';
import { PageHeader } from '../../../components/common/PageHeader';

import { useExecutionDetail } from '../hooks';
import { ExecutionMetricsOverview } from '../components/ExecutionMetricsOverview';
import { CollapsibleAgentCard } from '../components/CollapsibleAgentCard';
import { PrintProvider } from '../contexts/PrintContext';

import type { ExecutionResult } from '../types';

// Import print styles
import '../components/print-styles.css';


function ExecutionTimeline({ execution }: { execution: ExecutionResult }) {
  const timelineEvents = [];

  // Add execution start
  timelineEvents.push({
    timestamp: execution.started_at,
    event: 'Execution Started',
    type: 'start',
    description: `Template: ${execution.template_name}`
  });

  // Add agent events
  execution.agent_results.forEach(agent => {
    timelineEvents.push({
      timestamp: agent.started_at,
      event: `${agent.agent_name} Started`,
      type: 'agent_start',
      description: `Agent ID: ${agent.agent_id}`
    });

    if (agent.completed_at) {
      timelineEvents.push({
        timestamp: agent.completed_at,
        event: `${agent.agent_name} ${agent.success ? 'Completed' : 'Failed'}`,
        type: agent.success ? 'agent_success' : 'agent_error',
        description: agent.success 
          ? `Duration: ${agent.duration_seconds.toFixed(1)}s, Cost: $${agent.cost.toFixed(3)}`
          : agent.error || 'Unknown error'
      });
    }
  });

  // Add execution end
  if (execution.completed_at) {
    timelineEvents.push({
      timestamp: execution.completed_at,
      event: `Execution ${execution.status === 'completed' ? 'Completed' : 'Failed'}`,
      type: execution.status === 'completed' ? 'success' : 'error',
      description: `Total duration: ${execution.total_duration.toFixed(1)}s`
    });
  }

  // Sort by timestamp
  timelineEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'start': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'agent_start': return <RefreshCw className="w-4 h-4 text-yellow-600" />;
      case 'agent_success': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'agent_error': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-4">
      {timelineEvents.map((event, index) => (
        <div key={index} className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            {getEventIcon(event.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900">{event.event}</div>
            <div className="text-xs text-gray-500 mt-1">{event.description}</div>
            <div className="text-xs text-gray-400 mt-1">
              {new Date(event.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ExecutionDetailPageContent() {
  const { executionId } = useParams<{ executionId: string }>();
  const navigate = useNavigate();
  
  const { 
    execution, 
    isLoading, 
    error, 
    refresh,
  } = useExecutionDetail({
    executionId: executionId || '',
    enableRealTimeMonitoring: true,
    autoStopOnComplete: true,
  });

  if (!executionId) {
    return <NotFoundDisplay message="Execution ID not provided" />;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-96" />
          <Skeleton className="h-8 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
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

  const handleRerun = () => {
    // Navigate to template execution page with pre-filled data
    if (execution) {
      const templateId = execution.template_id;
      const query = encodeURIComponent(execution.query);
      navigate(`/templates/execute?templateId=${templateId}&query=${query}`);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div id="execution-detail-content" className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={`Execution: ${execution.template_name}`}
        description={`${execution.query.substring(0, 100)}${execution.query.length > 100 ? '...' : ''}`}
        actions={
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBack}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to History
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refresh}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button 
              size="sm" 
              onClick={handleRerun}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Run Again
            </Button>
          </div>
        }
      />

      {/* Metrics Overview */}
      <ExecutionMetricsOverview execution={execution} />

      {/* Main Content Tabs */}
      <Tabs defaultValue="agents" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            Agent Results
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Results
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Details
          </TabsTrigger>
        </TabsList>

        {/* Agent Results Tab */}
        <TabsContent value="agents" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Agent Results ({execution.agent_results.length})
            </h3>
            {execution.agent_results.length > 0 ? (
              <div className="space-y-6">
                {execution.agent_results.map((agentResult, index) => (
                  <CollapsibleAgentCard key={agentResult.agent_id || index} agentResult={agentResult} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Bot className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No agent results available</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Execution Timeline
            </h3>
            <Card>
              <CardContent className="pt-6">
                <ExecutionTimeline execution={execution} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Final Results
            </h3>
            {execution.final_result ? (
              <div className="space-y-6">
                {/* Executive Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="w-4 h-4 text-blue-600" />
                      Execution Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{execution.agent_results.length}</div>
                        <div className="text-gray-600">Agents Executed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {execution.agent_results.filter(a => a.success).length}
                        </div>
                        <div className="text-gray-600">Successful</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">${execution.total_cost.toFixed(3)}</div>
                        <div className="text-gray-600">Total Cost</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{execution.total_duration.toFixed(1)}s</div>
                        <div className="text-gray-600">Duration</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Combined Insights */}
                {execution.agent_results.some(agent => Array.isArray(agent.result?.key_findings) && agent.result.key_findings.length > 0) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        Key Insights Across All Agents
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {execution.agent_results.map((agent, index) => {
                          const keyFindings = agent.result?.key_findings as string[] || [];
                          if (keyFindings.length === 0) return null;
                          
                          return (
                            <div key={index} className="border-l-4 border-blue-200 pl-4">
                              <div className="font-medium text-gray-800 mb-2">{agent.agent_name}</div>
                              <ul className="space-y-1">
                                {keyFindings.slice(0, 3).map((finding, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                                    <span className="text-gray-700">{finding}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Combined Recommendations */}
                {execution.agent_results.some(agent => Array.isArray(agent.result?.recommendations) && agent.result.recommendations.length > 0) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Lightbulb className="w-4 h-4 text-yellow-600" />
                        Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {execution.agent_results.map((agent, index) => {
                          const recommendations = agent.result?.recommendations as string[] || [];
                          if (recommendations.length === 0) return null;
                          
                          return (
                            <div key={index} className="border-l-4 border-yellow-200 pl-4">
                              <div className="font-medium text-gray-800 mb-2">{agent.agent_name}</div>
                              <ul className="space-y-1">
                                {recommendations.slice(0, 3).map((rec, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm">
                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-600 mt-2 flex-shrink-0" />
                                    <span className="text-gray-700">{rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* All Sources Combined */}
                {execution.agent_results.some(agent => Array.isArray(agent.result?.all_sources) && agent.result.all_sources.length > 0) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Globe className="w-4 h-4 text-green-600" />
                        Research Sources
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {execution.agent_results.flatMap(agent => 
                          Array.isArray(agent.result?.all_sources) ? agent.result.all_sources.slice(0, 6) : []
                        ).map((source, index) => (
                          <div key={index} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                            <div className="font-medium text-sm mb-1 line-clamp-2">
                              {typeof source === 'object' && source && 'title' in source ? String(source.title) : 'Unknown Source'}
                            </div>
                            <div className="text-xs text-gray-500 mb-2">
                              Relevance: {
                                typeof source === 'object' && source && 'relevance_score' in source 
                                  ? Math.round((Number(source.relevance_score) || 0) * 100)
                                  : 0
                              }%
                            </div>
                            <a 
                              href={typeof source === 'object' && source && 'url' in source ? String(source.url) : '#'} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span className="truncate">
                                {typeof source === 'object' && source && 'url' in source ? String(source.url) : 'No URL'}
                              </span>
                            </a>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Raw Data (Collapsible) */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Settings className="w-4 h-4 text-gray-600" />
                      Raw Data (Advanced)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <details className="group">
                      <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 transition-colors">
                        Click to view raw execution data
                      </summary>
                      <ScrollArea className="h-[300px] w-full mt-4 border rounded p-4 bg-gray-50">
                        <pre className="text-xs whitespace-pre-wrap">
                          {JSON.stringify(execution.final_result, null, 2)}
                        </pre>
                      </ScrollArea>
                    </details>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No final results available</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Execution Details
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-gray-600">Execution ID:</span>
                    <span className="col-span-2 font-mono text-xs">{execution.execution_id}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-gray-600">Template:</span>
                    <span className="col-span-2 font-medium">{execution.template_name}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-gray-600">Query:</span>
                    <span className="col-span-2">{execution.query}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span className="col-span-2">
                      <Badge variant={execution.status === 'completed' ? "default" : execution.status === 'failed' ? "destructive" : "secondary"}>
                        {execution.status.charAt(0).toUpperCase() + execution.status.slice(1)}
                      </Badge>
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-gray-600">Duration:</span>
                    <span className="col-span-2 font-medium">{execution.total_duration.toFixed(1)}s</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-gray-600">Cost:</span>
                    <span className="col-span-2 font-medium">${execution.total_cost.toFixed(3)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-gray-600">Tokens:</span>
                    <span className="col-span-2 font-medium">{execution.total_tokens.toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-gray-600">Confidence:</span>
                    <span className="col-span-2 font-medium">
                      {execution.overall_confidence > 0 ? `${Math.round(execution.overall_confidence * 100)}%` : 'N/A'}
                    </span>
                  </div>
                  {execution.total_tavily_credits > 0 && (
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <span className="text-gray-600">Tavily Credits:</span>
                      <span className="col-span-2 font-medium">{execution.total_tavily_credits}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function ExecutionDetailPage() {
  return (
    <PrintProvider>
      <ExecutionDetailPageContent />
    </PrintProvider>
  );
}

export default ExecutionDetailPage;
