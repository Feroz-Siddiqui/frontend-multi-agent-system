/**
 * Unified Toolbar Component
 * One-click workflow template creation tools
 */

import { Button } from '../../../../../components/ui/button';
import { Badge } from '../../../../../components/ui/badge';
import { 
  ArrowRight, 
  GitBranch, 
  GitMerge, 
  Zap, 
  Trash2
} from 'lucide-react';

interface UnifiedToolbarProps {
  onCreateSequential: () => void;
  onCreateParallel: () => void;
  onCreateConditional: () => void;
  onCreateCustom: () => void;
  currentWorkflowType: string;
  agentCount: number;
}

export function UnifiedToolbar({
  onCreateSequential,
  onCreateParallel,
  onCreateConditional,
  onCreateCustom,
  currentWorkflowType,
  agentCount
}: UnifiedToolbarProps) {
  
  const getWorkflowTypeColor = (type: string) => {
    switch (type) {
      case 'sequential': return 'bg-blue-500';
      case 'parallel': return 'bg-green-500';
      case 'conditional': return 'bg-orange-500';
      case 'custom': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const isDisabled = agentCount === 0;
  const needsMinAgents = (type: string) => {
    if (type === 'conditional') return agentCount < 3;
    if (type === 'sequential') return agentCount < 2;
    return agentCount === 0;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Current Workflow Type Indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getWorkflowTypeColor(currentWorkflowType)}`} />
          <span className="text-sm font-medium capitalize">{currentWorkflowType}</span>
          <Badge variant="outline" className="text-xs">
            {agentCount} agents
          </Badge>
        </div>

        <div className="w-px h-6 bg-gray-300" />

        {/* Template Creation Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant={currentWorkflowType === 'sequential' ? 'default' : 'outline'}
            size="sm"
            onClick={onCreateSequential}
            disabled={needsMinAgents('sequential')}
            className="flex items-center gap-2"
            title="Create sequential workflow: Agent1 → Agent2 → Agent3 → End"
          >
            <ArrowRight className="h-4 w-4" />
            Sequential
          </Button>

          <Button
            variant={currentWorkflowType === 'parallel' ? 'default' : 'outline'}
            size="sm"
            onClick={onCreateParallel}
            disabled={isDisabled}
            className="flex items-center gap-2"
            title="Create parallel workflow: All agents execute simultaneously"
          >
            <GitBranch className="h-4 w-4" />
            Parallel
          </Button>

          <Button
            variant={currentWorkflowType === 'conditional' ? 'default' : 'outline'}
            size="sm"
            onClick={onCreateConditional}
            disabled={needsMinAgents('conditional')}
            className="flex items-center gap-2"
            title="Create conditional workflow: Success/failure branching (requires 3+ agents)"
          >
            <GitMerge className="h-4 w-4" />
            Conditional
          </Button>

          <Button
            variant={currentWorkflowType === 'custom' ? 'default' : 'outline'}
            size="sm"
            onClick={onCreateCustom}
            className="flex items-center gap-2"
            title="Clear all connections for custom workflow design"
          >
            <Zap className="h-4 w-4" />
            Custom
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onCreateCustom}
            className="flex items-center gap-2 text-red-600"
            title="Clear all connections"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        {isDisabled && "Add agents to create workflows"}
        {!isDisabled && currentWorkflowType === 'sequential' && "Linear chain: Each agent processes after the previous one"}
        {!isDisabled && currentWorkflowType === 'parallel' && "Concurrent execution: All agents run simultaneously"}
        {!isDisabled && currentWorkflowType === 'conditional' && "Branching logic: Different paths based on conditions"}
        {!isDisabled && currentWorkflowType === 'custom' && "Drag and connect handles to create custom workflows"}
      </div>
    </div>
  );
}
