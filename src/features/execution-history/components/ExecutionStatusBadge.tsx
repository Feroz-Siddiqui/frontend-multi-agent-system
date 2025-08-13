/**
 * ExecutionStatusBadge Component
 * 
 * Shadcn Badge component for execution status display
 */

import { Badge } from '../../../components/ui/badge';
import type { ExecutionStatus } from '../types';

interface ExecutionStatusBadgeProps {
  status: ExecutionStatus;
  className?: string;
}

const statusConfig = {
  pending: {
    variant: 'secondary' as const,
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  },
  running: {
    variant: 'default' as const,
    label: 'Running',
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-200 animate-pulse',
  },
  completed: {
    variant: 'default' as const,
    label: 'Completed',
    className: 'bg-green-100 text-green-800 hover:bg-green-200',
  },
  failed: {
    variant: 'destructive' as const,
    label: 'Failed',
    className: 'bg-red-100 text-red-800 hover:bg-red-200',
  },
  cancelled: {
    variant: 'outline' as const,
    label: 'Cancelled',
    className: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  },
  timeout: {
    variant: 'destructive' as const,
    label: 'Timeout',
    className: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
  },
  waiting_intervention: {
    variant: 'secondary' as const,
    label: 'Waiting for Intervention',
    className: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
  },
  paused: {
    variant: 'secondary' as const,
    label: 'Paused',
    className: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
  },
} as const;

export function ExecutionStatusBadge({ status, className }: ExecutionStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      className={`${config.className} ${className || ''}`}
    >
      {config.label}
    </Badge>
  );
}

export default ExecutionStatusBadge;
