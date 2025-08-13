/**
 * ErrorDisplay Component
 * Consistent error state across the application
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try Again',
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center min-h-[400px] space-y-4 ${className}`}>
      <div className="text-center space-y-2">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        <h3 className="text-lg font-semibold text-red-600">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md">{message}</p>
      </div>
      
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
};
