/**
 * Enhanced Template Preview Component
 * Main preview component that combines all preview cards
 */

import { Alert, AlertDescription } from '../../../../components/ui/alert';
import { Button } from '../../../../components/ui/button';
import { 
  CheckCircle, 
  AlertCircle, 
  Play,
  Download
} from 'lucide-react';

import { TemplateSummaryCard } from './TemplateSummaryCard';
import { AgentOverviewCard } from './AgentOverviewCard';
import { WorkflowPreviewCard } from './WorkflowPreviewCard';

import type { Template, ValidationResult } from '../../types';

interface EnhancedTemplatePreviewProps {
  template: Template;
  validation: ValidationResult;
  workflowSummary: string;
  onExecute?: () => void;
  onDownloadJSON?: () => void;
  showActions?: boolean;
}

export function EnhancedTemplatePreview({ 
  template, 
  validation, 
  workflowSummary,
  onExecute,
  onDownloadJSON,
  showActions = true
}: EnhancedTemplatePreviewProps) {
  const { isValid, errors, warnings } = validation;

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      {showActions && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Template Preview</h3>
            <p className="text-sm text-muted-foreground">
              Review your complete template configuration
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onDownloadJSON && (
              <Button variant="outline" size="sm" onClick={onDownloadJSON}>
                <Download className="w-4 h-4 mr-2" />
                Download JSON
              </Button>
            )}
            {onExecute && (
              <Button 
                size="sm" 
                onClick={onExecute}
                disabled={!isValid}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Execute Template
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Validation Status */}
      {!isValid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">
                {errors.length} validation error{errors.length !== 1 ? 's' : ''} found:
              </div>
              <ul className="text-sm space-y-1 ml-4">
                {errors.slice(0, 3).map((error, index) => (
                  <li key={index} className="list-disc">
                    {error.message}
                  </li>
                ))}
                {errors.length > 3 && (
                  <li className="list-disc text-muted-foreground">
                    ... and {errors.length - 3} more error{errors.length - 3 !== 1 ? 's' : ''}
                  </li>
                )}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {warnings.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div className="space-y-1">
              <div className="font-medium">
                {warnings.length} warning{warnings.length !== 1 ? 's' : ''} found:
              </div>
              <ul className="text-sm space-y-1 ml-4">
                {warnings.slice(0, 2).map((warning, index) => (
                  <li key={index} className="list-disc">
                    {warning}
                  </li>
                ))}
                {warnings.length > 2 && (
                  <li className="list-disc text-muted-foreground">
                    ... and {warnings.length - 2} more warning{warnings.length - 2 !== 1 ? 's' : ''}
                  </li>
                )}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Success Status */}
      {isValid && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="font-medium">Template is ready!</div>
            <div className="text-sm mt-1">
              All validation checks passed. You can now save your template and start using it for executions.
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Full-width Workflow Visualization */}
      <div className="w-full">
        <WorkflowPreviewCard template={template} workflowSummary={workflowSummary} />
      </div>

      {/* Full-width Agent Overview */}
      <div className="w-full">
        <AgentOverviewCard agents={template.agents} />
      </div>


      {/* Full-width Template Summary */}
      <div className="w-full">
        <TemplateSummaryCard template={template} validation={validation} />
      </div>
    </div>
  );
}
