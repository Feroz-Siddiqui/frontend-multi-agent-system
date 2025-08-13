/**
 * ExecutionResultsDisplay Component
 * 
 * Beautiful display for completed execution results with structured data
 */

import { useState } from 'react';
import { CheckCircle, Lightbulb, TrendingUp, BarChart3, FileText, ExternalLink, Download, RefreshCw, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { StructuredAgentResult } from '../../execution-history/components/StructuredAgentResult';
import { PDFPreviewModal } from './PDFPreviewModal';
import type { ExecutionResult, AgentResult } from '../services/execution.service';

interface ExecutionResultsDisplayProps {
  execution: ExecutionResult;
  onExport?: () => Promise<void>;
  onRunAgain?: () => void;
  isExporting?: boolean;
  className?: string;
}

interface ExecutionSummaryProps {
  execution: ExecutionResult;
}

function ExecutionSummary({ execution }: ExecutionSummaryProps) {
  const successRate = execution.agent_results.length > 0 
    ? (execution.agent_results.filter(r => r.success).length / execution.agent_results.length) * 100 
    : 0;

  return (
    <Card className="border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
          <CheckCircle className="w-5 h-5" />
          Execution Completed Successfully
        </CardTitle>
        <CardDescription className="text-green-700 dark:text-green-300">
          Multi-agent workflow completed with {execution.agent_results.length} agents
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">${execution.total_cost.toFixed(4)}</div>
            <div className="text-sm text-muted-foreground">Total Cost</div>
          </div>
          <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">{execution.total_duration.toFixed(1)}s</div>
            <div className="text-sm text-muted-foreground">Duration</div>
          </div>
          <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border">
            <div className="text-2xl font-bold text-purple-600">{Math.round(execution.overall_confidence * 100)}%</div>
            <div className="text-sm text-muted-foreground">Confidence</div>
          </div>
          <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border">
            <div className="text-2xl font-bold text-orange-600">{successRate.toFixed(0)}%</div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-green-600">
              {execution.agent_results.filter(r => r.success).length}/{execution.agent_results.length} Agents Successful
            </Badge>
            <Badge variant="secondary">
              {execution.total_tokens.toLocaleString()} Tokens
            </Badge>
            {execution.total_tavily_credits > 0 && (
              <Badge variant="outline">
                {execution.total_tavily_credits} Tavily Credits
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface KeyInsightsProps {
  execution: ExecutionResult;
}

function KeyInsights({ execution }: KeyInsightsProps) {
  // Extract insights from agent results
  const allFindings: string[] = [];
  const allRecommendations: string[] = [];
  const allDataPoints: string[] = [];

  execution.agent_results.forEach(result => {
    if (result.success && result.result) {
      // Extract key findings
      if (result.result.key_findings && Array.isArray(result.result.key_findings)) {
        allFindings.push(...result.result.key_findings);
      }
      
      // Extract recommendations
      if (result.result.recommendations && Array.isArray(result.result.recommendations)) {
        allRecommendations.push(...result.result.recommendations);
      }
      
      // Extract data points
      if (result.result.data_points && Array.isArray(result.result.data_points)) {
        allDataPoints.push(...result.result.data_points);
      }
    }
  });

  // Remove duplicates and limit to top items
  const uniqueFindings = [...new Set(allFindings)].slice(0, 5);
  const uniqueRecommendations = [...new Set(allRecommendations)].slice(0, 5);
  const uniqueDataPoints = [...new Set(allDataPoints)].slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Key Findings */}
      {uniqueFindings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Key Findings (Across All Agents)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {uniqueFindings.map((finding, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                  <span className="text-foreground leading-relaxed">{finding}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Strategic Recommendations */}
      {uniqueRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              Strategic Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {uniqueRecommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-600 mt-2 flex-shrink-0" />
                  <span className="text-foreground leading-relaxed">{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Key Data Points */}
      {uniqueDataPoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              Key Data Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {uniqueDataPoints.map((dataPoint, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <BarChart3 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-foreground">{dataPoint}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface AgentResultsTabProps {
  agentResults: AgentResult[];
}

function AgentResultsTab({ agentResults }: AgentResultsTabProps) {
  return (
    <div className="space-y-6">
      {agentResults.map((result, index) => (
        <div key={index}>
          <StructuredAgentResult 
            agentResult={result} 
            hideHeader={false}
          />
        </div>
      ))}
    </div>
  );
}

interface ExecutionMetadataProps {
  execution: ExecutionResult;
}

function ExecutionMetadata({ execution }: ExecutionMetadataProps) {
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const executionDuration = execution.completed_at && execution.started_at
    ? (new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()) / 1000
    : execution.total_duration;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-600" />
          Execution Metadata
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium text-muted-foreground mb-1">Execution ID</div>
            <div className="font-mono text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded">
              {execution.execution_id}
            </div>
          </div>
          <div>
            <div className="font-medium text-muted-foreground mb-1">Template</div>
            <div>{execution.template_name}</div>
          </div>
          <div>
            <div className="font-medium text-muted-foreground mb-1">Started At</div>
            <div>{formatDateTime(execution.started_at)}</div>
          </div>
          <div>
            <div className="font-medium text-muted-foreground mb-1">Completed At</div>
            <div>{execution.completed_at ? formatDateTime(execution.completed_at) : 'N/A'}</div>
          </div>
          <div>
            <div className="font-medium text-muted-foreground mb-1">Total Duration</div>
            <div>{executionDuration.toFixed(2)} seconds</div>
          </div>
          <div>
            <div className="font-medium text-muted-foreground mb-1">Status</div>
            <Badge variant={execution.status === 'completed' ? 'default' : 'destructive'}>
              {execution.status.toUpperCase()}
            </Badge>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="font-medium text-muted-foreground mb-2">Original Query</div>
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <p className="text-sm leading-relaxed">{execution.query}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ExecutionResultsDisplay({
  execution,
  onExport,
  onRunAgain,
  isExporting = false,
  className
}: ExecutionResultsDisplayProps) {
  const [showPreview, setShowPreview] = useState(false);

  if (execution.status !== 'completed') {
    return null;
  }

  const handleExportWithPreview = async () => {
    if (onExport) {
      await onExport();
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Execution Summary */}
      <ExecutionSummary execution={execution} />

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {onExport && (
          <>
            <Button
              onClick={() => setShowPreview(true)}
              variant="outline"
              className="flex items-center gap-2"
              disabled={isExporting}
            >
              <Eye className="w-4 h-4" />
              Preview PDF
            </Button>
            <Button
              onClick={onExport}
              variant="default"
              className="flex items-center gap-2"
              disabled={isExporting}
            >
              {isExporting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isExporting ? 'Generating PDF...' : 'Download PDF'}
            </Button>
          </>
        )}
        {onRunAgain && (
          <Button onClick={onRunAgain} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Run Again
          </Button>
        )}
        <Button variant="outline" className="flex items-center gap-2" asChild>
          <a href={`/execution-history/${execution.execution_id}`}>
            <ExternalLink className="w-4 h-4" />
            View in History
          </a>
        </Button>
      </div>

      {/* Results Tabs */}
      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Key Insights
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Agent Results ({execution.agent_results.length})
          </TabsTrigger>
          <TabsTrigger value="metadata" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Metadata
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights">
          <div className="max-h-[800px] overflow-y-auto">
            <KeyInsights execution={execution} />
          </div>
        </TabsContent>

        <TabsContent value="agents">
          <div className="max-h-[800px] overflow-y-auto">
            <AgentResultsTab agentResults={execution.agent_results} />
          </div>
        </TabsContent>

        <TabsContent value="metadata">
          <ExecutionMetadata execution={execution} />
        </TabsContent>
      </Tabs>

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        executionId={execution.execution_id}
        onDownload={handleExportWithPreview}
        isDownloading={isExporting}
      />
    </div>
  );
}

export default ExecutionResultsDisplay;
