/**
 * Execution Status Utilities
 * 
 * Utility functions for execution status handling
 */

import type { ExecutionStatus } from '../types';

/**
 * Check if execution is in a running state
 */
export function isExecutionRunning(status: ExecutionStatus): boolean {
  return status === 'running' || status === 'pending';
}

/**
 * Check if execution is completed
 */
export function isExecutionCompleted(status: ExecutionStatus): boolean {
  return status === 'completed';
}

/**
 * Check if execution has failed
 */
export function isExecutionFailed(status: ExecutionStatus): boolean {
  return status === 'failed';
}

/**
 * Check if execution is in a final state (not running)
 */
export function isExecutionFinal(status: ExecutionStatus): boolean {
  return ['completed', 'failed', 'cancelled'].includes(status);
}

/**
 * Get execution status color for UI
 */
export function getExecutionStatusColor(status: ExecutionStatus): string {
  switch (status) {
    case 'pending':
      return 'yellow';
    case 'running':
      return 'blue';
    case 'completed':
      return 'green';
    case 'failed':
      return 'red';
    case 'cancelled':
      return 'gray';
    default:
      return 'gray';
  }
}

/**
 * Get execution status priority for sorting
 */
export function getExecutionStatusPriority(status: ExecutionStatus): number {
  switch (status) {
    case 'running':
      return 1;
    case 'pending':
      return 2;
    case 'failed':
      return 3;
    case 'completed':
      return 4;
    case 'cancelled':
      return 5;
    default:
      return 6;
  }
}

/**
 * Sort executions by status priority
 */
export function sortExecutionsByStatus<T extends { status: ExecutionStatus }>(
  executions: T[]
): T[] {
  return [...executions].sort((a, b) => {
    const priorityA = getExecutionStatusPriority(a.status);
    const priorityB = getExecutionStatusPriority(b.status);
    return priorityA - priorityB;
  });
}
