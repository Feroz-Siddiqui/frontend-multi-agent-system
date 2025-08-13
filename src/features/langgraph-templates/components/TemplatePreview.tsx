/**
 * Template Preview Component
 * 
 * Final preview and summary of the template before saving
 */

import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Bot, 
  Workflow
} from 'lucide-react';
import type { Template, ValidationResult } from '../types';

interface TemplatePreviewProps {
  template: Template;
  validation: ValidationResult;
  workflowSummary: string;
}

export function TemplatePreview({ template, validation, workflowSummary }: TemplatePreviewProps) {
  const { isValid, errors, warnings } = validation;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Template Preview</h3>
          <p className="text-sm text-muted-foreground">
            Review your template configuration before saving
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isValid ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Ready to Save
            </Badge>
          ) : (
            <Badge variant="destructive">
              <AlertCircle className="h-3 w-3 mr-1" />
              {errors.length} Error{errors.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Validation Status */}
      {!isValid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please fix the validation errors before saving your template.
          </AlertDescription>
        </Alert>
      )}

      {warnings.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            {warnings.length} warning{warnings.length !== 1 ? 's' : ''} found. 
            Your template will work but consider reviewing these items.
          </AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-medium text-muted-foreground">Name</div>
            <div className="text-base">{template.name || 'Untitled Template'}</div>
          </div>
          
          <div>
            <div className="text-sm font-medium text-muted-foreground">Description</div>
            <div className="text-sm mt-1">
              {template.description || 'No description provided'}
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Agents Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Agents ({template.agents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {template.agents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No agents configured
            </div>
          ) : (
            <div className="space-y-3">
              {template.agents.map((agent, index) => (
                <div key={agent.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{agent.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {agent.type} • {agent.llm_config.model}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {agent.type}
                    </Badge>
                    {agent.tavily_config && (
                      <Badge variant="secondary" className="text-xs">
                        Tavily
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workflow Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Workflow Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-medium text-muted-foreground">Mode</div>
            <Badge variant="outline" className="mt-1 capitalize">
              {template.workflow.mode}
            </Badge>
          </div>

          <div>
            <div className="text-sm font-medium text-muted-foreground">Summary</div>
            <div className="text-sm mt-1">{workflowSummary}</div>
          </div>

          {/* Mode-specific details */}
          {template.workflow.mode === 'parallel' && template.workflow.parallel_groups && (
            <div>
              <div className="text-sm font-medium text-muted-foreground">Parallel Groups</div>
              <div className="space-y-2 mt-2">
                {template.workflow.parallel_groups.map((group: string[], index: number) => (
                  <div key={index} className="p-2 border rounded text-sm">
                    <div className="font-medium">Group {index + 1}</div>
                    <div className="text-muted-foreground">
                      {group.length} agents: {group.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {template.workflow.mode === 'conditional' && template.workflow.conditions && (
            <div>
              <div className="text-sm font-medium text-muted-foreground">Conditional Rules</div>
              <div className="text-sm mt-1 text-muted-foreground">
                {Object.keys(template.workflow.conditions).length} condition{Object.keys(template.workflow.conditions).length !== 1 ? 's' : ''} configured
              </div>
            </div>
          )}
        </CardContent>
      </Card>


      {/* Final Status */}
      <Alert className={isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
        {isValid ? (
          <>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Template is ready!</strong> All validation checks passed. 
              You can now save your template and start using it for executions.
            </AlertDescription>
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Template has issues.</strong> Please review and fix the validation errors 
              before saving your template.
            </AlertDescription>
          </>
        )}
      </Alert>
    </div>
  );
}

export default TemplatePreview;
