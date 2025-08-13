/**
 * Not Found Display Component
 * Shows user-friendly messages when resources are not found
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';

interface NotFoundDisplayProps {
  title?: string;
  message?: string;
  type?: 'execution' | 'template' | 'generic';
  onGoBack?: () => void;
  onRetry?: () => void;
  className?: string;
}

export function NotFoundDisplay({
  title,
  message,
  type = 'generic',
  onGoBack,
  onRetry,
  className = ''
}: NotFoundDisplayProps): React.ReactElement {
  
  const getDefaultContent = () => {
    switch (type) {
      case 'execution':
        return {
          title: 'Execution Not Found',
          message: 'The execution you\'re looking for doesn\'t exist or may have been deleted. This could happen if the execution was removed or if you don\'t have permission to view it.'
        };
      case 'template':
        return {
          title: 'Template Not Found',
          message: 'The template you\'re looking for doesn\'t exist or may have been deleted. This could happen if the template was removed or if you don\'t have permission to view it.'
        };
      default:
        return {
          title: 'Resource Not Found',
          message: 'The resource you\'re looking for doesn\'t exist or may have been deleted.'
        };
    }
  };

  const defaultContent = getDefaultContent();
  const displayTitle = title || defaultContent.title;
  const displayMessage = message || defaultContent.message;

  return (
    <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            {displayTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            {displayMessage}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            {onGoBack && (
              <Button
                variant="outline"
                onClick={onGoBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
            )}
            
            {onRetry && (
              <Button
                variant="default"
                onClick={onRetry}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            )}
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500">
              If you believe this is an error, please contact support or try refreshing the page.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
