/**
 * PendingActionsBar Component
 * 
 * Global HITL actions bar that shows all pending interventions prominently at the top
 */

import { AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import type { InterventionRequest } from '../services/execution.service';
import type { WorkflowVisualization } from '../hooks/useTemplateExecution';

interface PendingActionsBarProps {
  interventions: InterventionRequest[];
  workflow?: WorkflowVisualization | null;
  onResolve: (interventionId: string) => void;
  className?: string;
}

export function PendingActionsBar({ interventions, workflow, onResolve, className }: PendingActionsBarProps) {
  if (interventions.length === 0) {
    return null;
  }

  // Sort by urgency (timeout)
  const sortedInterventions = [...interventions].sort((a, b) => {
    const timeoutA = new Date(a.timeout_at).getTime();
    const timeoutB = new Date(b.timeout_at).getTime();
    return timeoutA - timeoutB;
  });

  const getTimeRemaining = (timeoutAt: string) => {
    const now = new Date().getTime();
    const timeout = new Date(timeoutAt).getTime();
    const remaining = Math.max(0, timeout - now);
    const seconds = Math.floor(remaining / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  };

  const getUrgencyColor = (timeoutAt: string) => {
    const now = new Date().getTime();
    const timeout = new Date(timeoutAt).getTime();
    const remaining = Math.max(0, timeout - now);
    const seconds = Math.floor(remaining / 1000);
    
    if (seconds <= 30) return 'destructive';
    if (seconds <= 60) return 'destructive';
    if (seconds <= 120) return 'secondary';
    return 'outline';
  };

  return (
    <div className={`pending-actions-bar ${className || ''}`}>
      <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 shadow-lg">
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600 animate-pulse" />
              <h3 className="font-semibold text-red-800 dark:text-red-300">
                🛑 Pending Human Actions ({interventions.length})
              </h3>
            </div>
            <Badge variant="destructive" className="animate-pulse">
              Action Required
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedInterventions.map((intervention) => {
              // Get agent name from workflow or fallback to agent_id
              const agentName = workflow?.nodes.find(node => node.id === intervention.agent_id)?.name || intervention.agent_id;
              
              return (
                <div
                  key={intervention.intervention_id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-red-950/10 rounded-lg border border-red-200 dark:border-red-800"
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="font-medium text-sm text-red-800 dark:text-red-300 truncate">
                      {agentName}: "{intervention.intervention_type}"
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Clock className="h-3 w-3 text-red-600" />
                      <span className="text-xs text-red-600">
                        {getTimeRemaining(intervention.timeout_at)} remaining
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant={getUrgencyColor(intervention.timeout_at)}
                    onClick={() => onResolve(intervention.intervention_id)}
                    className="flex items-center space-x-1 flex-shrink-0"
                  >
                    <span className="text-xs">Resolve</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
          
          <div className="mt-3 text-xs text-red-600 dark:text-red-400 text-center">
            💡 Click "Resolve" to handle each intervention in the details panel
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PendingActionsBar;
