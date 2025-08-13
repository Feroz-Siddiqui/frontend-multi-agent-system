/**
 * LoadingSpinner Component
 * Consistent loading state across the application
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
      <div className="flex items-center space-x-2">
        <Loader2 className={`${sizeClasses[size]} animate-spin`} />
        <span className="text-muted-foreground">{message}</span>
      </div>
    </div>
  );
};
