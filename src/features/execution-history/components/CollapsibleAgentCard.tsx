/**
 * CollapsibleAgentCard Component
 * 
 * Full-width collapsible card wrapper for agent results
 * Shows summary when collapsed, full StructuredAgentResult when expanded
 */

import { useState } from 'react';
import { 
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Target,
  Zap
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../../components/ui/collapsible';

import { StructuredAgentResult } from './StructuredAgentResult';
import { usePrintMode } from '../contexts/PrintContext';
import type { AgentResult } from '../types';

interface CollapsibleAgentCardProps {
  agentResult: AgentResult;
  defaultExpanded?: boolean;
}

export function CollapsibleAgentCard({ agentResult, defaultExpanded = false }: CollapsibleAgentCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { isPrintMode } = usePrintMode();
  
  // Force expansion in print mode
  const shouldBeExpanded = isPrintMode || isExpanded;

  const config = agentResult.success 
    ? { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' }
    : { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
  
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
    <Card className={`w-full border ${config.border} transition-all duration-200`}>
      <Collapsible open={shouldBeExpanded} onOpenChange={isPrintMode ? undefined : setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors pb-4" onClick={(e) => {
            // Only handle clicks that are directly on the header, not on child elements
            if (e.target === e.currentTarget || (e.target as Element).closest('.collapsible-trigger-area')) {
              // Let the collapsible handle this
            } else {
              e.stopPropagation();
            }
          }}>
            <div className="flex items-center justify-between">
              {/* Left side: Agent info */}
              <div className="flex items-center gap-3 collapsible-trigger-area">
                <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-lg font-semibold truncate">
                    {agentResult.agent_name}
                  </CardTitle>
                  <CardDescription className={`font-medium ${config.color}`}>
                    {agentResult.success ? 'Completed Successfully' : 'Failed'}
                  </CardDescription>
                </div>
              </div>
              
              {/* Right side: Key metrics + expand button */}
              <div className="flex items-center gap-4 collapsible-trigger-area">
                {/* Key Metrics */}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDuration(agentResult.duration_seconds)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    <span>{formatCost(agentResult.cost)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    <span>{Math.round(agentResult.confidence_score * 100)}%</span>
                  </div>
                  {agentResult.tokens_used > 0 && (
                    <div className="flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      <span>{agentResult.tokens_used.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <Badge variant={agentResult.success ? "default" : "destructive"} className="text-xs">
                  {agentResult.success ? 'Success' : 'Failed'}
                </Badge>

                {/* Expand/Collapse Button */}
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Error message preview when collapsed */}
            {!agentResult.success && agentResult.error && !isExpanded && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                <div className="font-medium">Error:</div>
                <div className="truncate">{agentResult.error}</div>
              </div>
            )}
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 border-t border-gray-100">
            <div className="pt-4">
              <StructuredAgentResult agentResult={agentResult} hideHeader={true} />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default CollapsibleAgentCard;
