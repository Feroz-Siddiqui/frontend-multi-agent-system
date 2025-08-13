/**
 * Workflow Mode Indicator Component
 * Shows current workflow type and statistics
 */

import { Badge } from '../../../../../components/ui/badge';
import { 
  ArrowRight, 
  GitBranch, 
  GitMerge, 
  Zap,
  Network
} from 'lucide-react';

interface WorkflowModeIndicatorProps {
  type: string;
}

export function WorkflowModeIndicator({
  type
}: WorkflowModeIndicatorProps) {
  
  const getWorkflowInfo = (workflowType: string) => {
    switch (workflowType) {
      case 'sequential':
        return {
          icon: ArrowRight,
          color: 'bg-blue-500 text-white',
          label: 'Sequential',
          description: 'Linear chain execution'
        };
      case 'parallel':
        return {
          icon: GitBranch,
          color: 'bg-green-500 text-white',
          label: 'Parallel',
          description: 'Concurrent execution'
        };
      case 'conditional':
        return {
          icon: GitMerge,
          color: 'bg-orange-500 text-white',
          label: 'Conditional',
          description: 'Branching logic'
        };
      case 'custom':
        return {
          icon: Zap,
          color: 'bg-purple-500 text-white',
          label: 'Custom',
          description: 'Advanced workflow'
        };
      default:
        return {
          icon: Network,
          color: 'bg-gray-500 text-white',
          label: 'Unknown',
          description: 'Workflow type'
        };
    }
  };

  const workflowInfo = getWorkflowInfo(type);
  const Icon = workflowInfo.icon;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
      <div className="flex items-center gap-3">
        {/* Workflow Type Badge */}
        <Badge className={`${workflowInfo.color} flex items-center gap-2 px-3 py-1`}>
          <Icon className="h-4 w-4" />
          {workflowInfo.label}
        </Badge>
      </div>

      {/* Description */}
      <div className="mt-2 text-xs text-gray-500">
        {workflowInfo.description}
      </div>
    </div>
  );
}
