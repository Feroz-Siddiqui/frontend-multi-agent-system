/**
 * Template Basic Info Form Component
 * 
 * Form for basic template information using shadcn components
 */

import React from 'react';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { Template, ValidationResult } from '../types';

interface TemplateBasicInfoFormProps {
  template: Template;
  onUpdate: (updates: Partial<Template>) => void;
  validation: ValidationResult;
  onNext: () => void;
  className?: string;
}

export function TemplateBasicInfoForm({
  template,
  onUpdate,
  validation: _validation, // eslint-disable-line @typescript-eslint/no-unused-vars
  onNext: _onNext, // eslint-disable-line @typescript-eslint/no-unused-vars
  className: _className, // eslint-disable-line @typescript-eslint/no-unused-vars
}: TemplateBasicInfoFormProps) {
  const [touchedFields, setTouchedFields] = React.useState<Set<string>>(new Set());

  // Simple validation - only show errors when appropriate
  const shouldShowError = (fieldName: string) => {
    return touchedFields.has(fieldName);
  };

  const getFieldError = (field: string) => {
    if (!shouldShowError(field)) return null;
    
    // Simple client-side validation
    switch (field) {
      case 'name':
        return !template.name.trim() ? 'Template name is required' : null;
      case 'description':
        return !template.description.trim() ? 'Description is required' : null;
      default:
        return null;
    }
  };

  const handleInputChange = (field: keyof Template, value: string) => {
    onUpdate({ [field]: value });
  };

  const handleFieldBlur = (fieldName: string) => {
    setTouchedFields(prev => new Set(prev).add(fieldName));
  };



  return (
    <div className="space-y-6">
      {/* Template Name */}
      <div className="space-y-2">
        <Label htmlFor="template-name">
          Template Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="template-name"
          placeholder="Enter template name..."
          value={template.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          onBlur={() => handleFieldBlur('name')}
          className={getFieldError('name') ? 'border-red-500' : ''}
        />
        {getFieldError('name') && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-3 w-3" />
            <AlertDescription className="text-xs">
              {getFieldError('name')}
            </AlertDescription>
          </Alert>
        )}
        <p className="text-xs text-muted-foreground">
          A descriptive name for your multi-agent template
        </p>
      </div>

      {/* Template Description */}
      <div className="space-y-2">
        <Label htmlFor="template-description">
          Description <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="template-description"
          placeholder="Describe what this template does and when to use it..."
          value={template.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          onBlur={() => handleFieldBlur('description')}
          className={`min-h-[100px] ${getFieldError('description') ? 'border-red-500' : ''}`}
        />
        {getFieldError('description') && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-3 w-3" />
            <AlertDescription className="text-xs">
              {getFieldError('description')}
            </AlertDescription>
          </Alert>
        )}
        <p className="text-xs text-muted-foreground">
          Explain the purpose, use cases, and expected outcomes
        </p>
      </div>


      {/* Help Text */}
      <div className="space-y-2 pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          <strong>Next:</strong> Configure your AI agents in Step 2
        </p>
      </div>
    </div>
  );
}

export default TemplateBasicInfoForm;
