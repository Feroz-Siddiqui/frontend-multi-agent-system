/**
 * Execution Time Utilities
 * 
 * Utility functions for time formatting and calculations
 */

/**
 * Format duration in seconds to human readable format
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  
  if (seconds < 3600) {
    const minutes = seconds / 60;
    return `${minutes.toFixed(1)}m`;
  }
  
  const hours = seconds / 3600;
  return `${hours.toFixed(1)}h`;
}

/**
 * Format duration with more detail
 */
export function formatDetailedDuration(seconds: number): string {
  if (seconds < 1) {
    return `${(seconds * 1000).toFixed(0)}ms`;
  }
  
  if (seconds < 60) {
    return `${seconds.toFixed(1)} seconds`;
  }
  
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  }
  
  const hours = Math.floor(seconds / 3600);
  const remainingMinutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  
  if (diffInSeconds < 2592000) {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }
  
  const months = Math.floor(diffInSeconds / 2592000);
  return `${months} month${months > 1 ? 's' : ''} ago`;
}

/**
 * Format timestamp to local date and time
 */
export function formatDateTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

/**
 * Format timestamp to local date only
 */
export function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString();
}

/**
 * Format timestamp to local time only
 */
export function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
}

/**
 * Calculate execution duration from start and end timestamps
 */
export function calculateDuration(startTime: string, endTime?: string): number {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  return Math.floor((end.getTime() - start.getTime()) / 1000);
}

/**
 * Check if execution is taking too long (over threshold)
 */
export function isExecutionTakingTooLong(
  startTime: string, 
  thresholdMinutes: number = 30
): boolean {
  const duration = calculateDuration(startTime);
  return duration > (thresholdMinutes * 60);
}

/**
 * Get estimated completion time based on progress
 */
export function getEstimatedCompletion(
  startTime: string, 
  progressPercentage: number
): string | null {
  if (progressPercentage <= 0) return null;
  
  const elapsed = calculateDuration(startTime);
  const totalEstimated = (elapsed / progressPercentage) * 100;
  const remaining = totalEstimated - elapsed;
  
  if (remaining <= 0) return 'Completing soon';
  
  return `~${formatDuration(remaining)} remaining`;
}

/**
 * Format execution time (alias for formatDuration)
 */
export function formatExecutionTime(seconds: number): string {
  return formatDuration(seconds);
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(amount);
}
