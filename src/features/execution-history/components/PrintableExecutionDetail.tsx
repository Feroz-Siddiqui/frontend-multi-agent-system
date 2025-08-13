/**
 * PrintableExecutionDetail Component
 * 
 * Print-optimized version of ExecutionDetailPage with vertical layout
 * Converts tabbed interface to full vertical content for PDF generation
 */

import { 
  Clock, 
  DollarSign, 
  Target, 
  CheckCircle2,
  TrendingUp,
  Zap,
  FileText,
  Lightbulb,
  Globe,
  ExternalLink,
  Bot,
  Activity
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';

import { ExecutionMetricsOverview } from './ExecutionMetricsOverview';
import type { ExecutionResult, AgentResult } from '../types';
import type { TavilySource } from '../types/execution-result.types';

interface PrintableExecutionDetailProps {
  execution: ExecutionResult;
  className?: string;
}

function PrintableExecutionTimeline({ execution }: { execution: ExecutionResult }) {
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
      case 'agent_start': return <Activity className="w-4 h-4 text-yellow-600" />;
      case 'agent_success': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'agent_error': return <CheckCircle2 className="w-4 h-4 text-red-600" />;
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'error': return <CheckCircle2 className="w-4 h-4 text-red-600" />;
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

function PrintableAgentCard({ agentResult, agentNumber }: { agentResult: AgentResult; agentNumber: number }) {
  const config = agentResult.success 
    ? { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' }
    : { icon: CheckCircle2, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
  
  const Icon = config.icon;

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };

  const formatCost = (cost: number) => {
    if (cost === 0) return '$0.00';
    if (cost < 0.01) return '<$0.01';
    return `$${cost.toFixed(3)}`;
  };

  return (
    <Card className={`w-full border ${config.border} mb-6 avoid-break`}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg font-semibold">
              Agent {agentNumber}: {agentResult.agent_name}
            </CardTitle>
            <div className={`font-medium ${config.color}`}>
              {agentResult.success ? 'Completed Successfully' : 'Failed'}
            </div>
          </div>
          <Badge variant={agentResult.success ? "default" : "destructive"} className="text-xs">
            {agentResult.success ? 'Success' : 'Failed'}
          </Badge>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="font-medium">Duration:</span>
            <span>{formatDuration(agentResult.duration_seconds)}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-500" />
            <span className="font-medium">Cost:</span>
            <span>{formatCost(agentResult.cost)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-gray-500" />
            <span className="font-medium">Confidence:</span>
            <span>{Math.round(agentResult.confidence_score * 100)}%</span>
          </div>
          {agentResult.tokens_used > 0 && (
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-gray-500" />
              <span className="font-medium">Tokens:</span>
              <span>{agentResult.tokens_used.toLocaleString()}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Error message if failed */}
        {!agentResult.success && agentResult.error ? (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            <div className="font-medium mb-1">Error:</div>
            <div>{agentResult.error}</div>
          </div>
        ) : null}

        {/* Analysis */}
        {agentResult.result?.analysis && typeof agentResult.result.analysis === 'string' ? (
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Analysis
            </h4>
            <div className="text-sm text-gray-700 leading-relaxed">
              {agentResult.result.analysis.split('\n').map((paragraph: string, index: number) => (
                paragraph.trim() ? (
                  <p key={index} className="mb-2">{paragraph.trim()}</p>
                ) : null
              ))}
            </div>
          </div>
        ) : null}

        {/* Key Findings */}
        {agentResult.result?.key_findings && Array.isArray(agentResult.result.key_findings) && agentResult.result.key_findings.length > 0 ? (
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Key Findings
            </h4>
            <ul className="space-y-1">
              {agentResult.result.key_findings.map((finding: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                  <span className="text-gray-700">{finding}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Recommendations */}
        {agentResult.result?.recommendations && Array.isArray(agentResult.result.recommendations) && agentResult.result.recommendations.length > 0 ? (
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-600" />
              Recommendations
            </h4>
            <ul className="space-y-1">
              {agentResult.result.recommendations.map((rec: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-600 mt-2 flex-shrink-0" />
                  <span className="text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Sources */}
        {agentResult.result?.all_sources && Array.isArray(agentResult.result.all_sources) && agentResult.result.all_sources.length > 0 ? (
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4 text-green-600" />
              Research Sources ({agentResult.result.all_sources.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {agentResult.result.all_sources.slice(0, 6).map((source: TavilySource, index: number) => (
                <div key={index} className="border rounded-lg p-3 text-sm">
                  <div className="font-medium mb-1 line-clamp-2">{source.title}</div>
                  <div className="text-xs text-gray-500 mb-2">
                    Relevance: {Math.round((source.relevance_score || 0) * 100)}%
                  </div>
                  <div className="text-xs text-blue-600 flex items-center gap-1 truncate">
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{source.url}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function PrintableExecutionDetail({ execution, className = '' }: PrintableExecutionDetailProps) {
  return (
    <div className={`print-layout bg-white ${className}`}>
      {/* Header Section */}
      <div className="mb-8 text-center">
        <div className="text-4xl mb-2">🤖</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Multi-Agent System</h1>
        <h2 className="text-xl text-gray-600 mb-1">Execution Report</h2>
        <p className="text-lg text-gray-700 font-medium">{execution.template_name}</p>
        <div className="mt-4 text-sm text-gray-500">
          <p>Generated: {new Date().toLocaleString()}</p>
          <p>Execution ID: {execution.execution_id}</p>
        </div>
      </div>

      {/* Executive Summary */}
      <section className="mb-8 avoid-break">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          Executive Summary
        </h2>
        
        {/* Status */}
        <div className="mb-4">
          <Badge 
            variant={execution.status === 'completed' ? "default" : execution.status === 'failed' ? "destructive" : "secondary"}
            className="text-sm px-3 py-1"
          >
            Status: {execution.status.charAt(0).toUpperCase() + execution.status.slice(1)}
          </Badge>
        </div>

        {/* Query */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-2">Query:</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-700">
            {execution.query}
          </div>
        </div>

        {/* Key Insights */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Key Insights:</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
              Successfully executed {execution.agent_results.length} agents with {Math.round(execution.overall_confidence * 100)}% confidence.
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
              Total execution cost of ${execution.total_cost.toFixed(3)} demonstrates efficient resource utilization.
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
              Completed in {execution.total_duration.toFixed(1)} seconds, indicating optimal performance.
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
              Generated comprehensive analysis across multiple domains for implementation.
            </li>
          </ul>
        </div>
      </section>

      {/* Metrics Overview */}
      <section className="mb-8 avoid-break">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          Performance Metrics
        </h2>
        <ExecutionMetricsOverview execution={execution} />
      </section>

      {/* Agent Results */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Bot className="w-6 h-6 text-blue-600" />
          Agent Results ({execution.agent_results.length})
        </h2>
        {execution.agent_results.map((agentResult, index) => (
          <PrintableAgentCard 
            key={agentResult.agent_id || index} 
            agentResult={agentResult} 
            agentNumber={index + 1}
          />
        ))}
      </section>

      {/* Timeline */}
      <section className="mb-8 page-break">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-600" />
          Execution Timeline
        </h2>
        <Card>
          <CardContent className="pt-6">
            <PrintableExecutionTimeline execution={execution} />
          </CardContent>
        </Card>
      </section>

      {/* Combined Results */}
      {execution.final_result && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Final Results
          </h2>
          
          {/* Executive Summary */}
          <Card className="mb-6">
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
          {execution.agent_results.some(agent => {
            const keyFindings = agent.result?.key_findings;
            return Array.isArray(keyFindings) && keyFindings.length > 0;
          }) && (
            <Card className="mb-6">
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
          {execution.agent_results.some(agent => {
            const recommendations = agent.result?.recommendations;
            return Array.isArray(recommendations) && recommendations.length > 0;
          }) && (
            <Card className="mb-6">
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
        </section>
      )}

      {/* Technical Details */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-600" />
          Technical Details
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-gray-600">Execution ID:</span>
                <span className="col-span-2 font-mono text-xs break-all">{execution.execution_id}</span>
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
      </section>
    </div>
  );
}

export default PrintableExecutionDetail;
