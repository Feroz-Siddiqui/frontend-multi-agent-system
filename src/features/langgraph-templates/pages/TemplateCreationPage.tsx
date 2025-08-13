/**
 * Enhanced Template Creation Page
 *
 * Complete template creation with workflow configuration and HITL support
 * Uses only shadcn/ui components with clean validation
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Progress } from '../../../components/ui/progress';
import { Badge } from '../../../components/ui/badge';
import { PageHeader } from '../../../components/common/PageHeader';
import { 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight, 
  Save,
  Eye,
  AlertCircle
} from 'lucide-react';

import { useTemplateCreation } from '../hooks';
import {
  TemplateBasicInfoForm,
  EnhancedTemplatePreview
} from '../components';

// Import our merged workflow builder
import { MergedWorkflowBuilder } from '../components/workflow-visualizations/components/MergedWorkflowBuilder';

// Import comprehensive validation
import { validateTemplate, canProceedToStep } from '../utils/comprehensive-validation';

// Import template service
import { templateService } from '../services';

import type { Template } from '../types';

interface TemplateCreationPageProps {
  initialTemplate?: Partial<Template>;
  onSave?: (template: Template) => Promise<void>;
}

type Step = 'basic' | 'workflow' | 'preview';

const STEPS: Array<{ id: Step; title: string; description: string }> = [
  {
    id: 'basic',
    title: 'Basic Information',
    description: 'Template name and description',
  },
  {
    id: 'workflow',
    title: 'Configure Agents & Build Workflow',
    description: 'Add agents and design your workflow in one unified interface',
  },
  {
    id: 'preview',
    title: 'Review & Save',
    description: 'Preview and save your template',
  },
];

export function TemplateCreationPage({ initialTemplate, onSave }: TemplateCreationPageProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [showValidation, setShowValidation] = useState(false);
  
  // Simple validation state
  const [showErrors, setShowErrors] = useState(false);

  const {
    template,
    updateTemplate,
    updateWorkflow,
    workflowSummary,
    canSave,
    isSubmitting,
    save,
  } = useTemplateCreation({
    initialTemplate,
    onSave: onSave || (async (template) => {
      // Default save handler - navigate to templates after successful save
      if (template.id) {
        await templateService.updateTemplate(template.id, template);
      } else {
        await templateService.createTemplate(template);
      }
      navigate('/templates');
    }),
  });

  // Get current step index
  const currentStepIndex = STEPS.findIndex(step => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  // Navigation handlers
  const goToStep = (step: Step) => {
    setCurrentStep(step);
  };

  const goNext = () => {
    // Show errors when trying to proceed
    setShowErrors(true);
    
    // Only proceed if step is valid
    if (canProceedToStepValidated(currentStep)) {
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < STEPS.length) {
        setCurrentStep(STEPS[nextIndex].id);
        // Reset error display for new step
        setShowErrors(false);
      }
    }
  };

  const goPrevious = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id);
    }
  };

  // Comprehensive validation using our validation system
  const validationResult = React.useMemo(() => {
    return validateTemplate(template);
  }, [template]);

  const canProceedToStepValidated = (stepId: Step): boolean => {
    const result = canProceedToStep(template, stepId);
    
    // Debug logging to help identify validation issues
    if (!result) {
      console.log(`❌ Cannot proceed to step "${stepId}":`, {
        step: stepId,
        template: template,
        validationResult: validationResult,
        stepErrors: validationResult.errors.filter(error => {
          switch (stepId) {
            case 'basic':
              return error.field.startsWith('name') || error.field.startsWith('description');
            case 'workflow':
              return error.field.startsWith('agents') || error.field.startsWith('workflow');
            case 'preview':
              return true;
            default:
              return false;
          }
        })
      });
    } else {
      console.log(`✅ Can proceed to step "${stepId}"`);
    }
    
    return result;
  };

  const isStepValid = (stepId: Step) => {
    return canProceedToStepValidated(stepId);
  };

  const getStepErrorCount = (stepId: Step) => {
    // Only show error counts if we're showing errors
    if (!showErrors) return 0;
    
    // Use comprehensive validation to count errors for each step
    const stepErrors = validationResult.errors.filter(error => {
      switch (stepId) {
        case 'basic':
          return error.field.startsWith('name') || error.field.startsWith('description');
        case 'workflow':
          return error.field.startsWith('agents') || error.field.startsWith('workflow');
        case 'preview':
          return true; // All errors are relevant for preview
        default:
          return false;
      }
    });
    
    return stepErrors.length;
  };

  // Helper function to update agents array
  const handleUpdateAgents = (agents: typeof template.agents) => {
    updateTemplate({ agents });
  };

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <TemplateBasicInfoForm
            template={template}
            onUpdate={updateTemplate}
            validation={{ isValid: true, errors: [], warnings: [] }}
            onNext={() => {}}
          />
        );

      case 'workflow':
        return (
          <MergedWorkflowBuilder
            agents={template.agents}
            workflow={template.workflow}
            onUpdateWorkflow={updateWorkflow}
            onUpdateAgents={handleUpdateAgents}
          />
        );

      case 'preview':
        return (
          <EnhancedTemplatePreview
            template={template}
            validation={validationResult}
            workflowSummary={workflowSummary}
            showActions={false}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Create Template"
        description="Build a multi-agent workflow template with complete enum support"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowValidation(!showValidation)}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {showValidation ? 'Hide' : 'Show'} Validation
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/templates')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Templates
            </Button>
          </div>
        }
      />

      {/* Progress */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
            
            {/* Step indicators */}
            <div className="flex justify-between">
              {STEPS.map((step, index) => {
                const isActive = step.id === currentStep;
                const isCompleted = isStepValid(step.id);
                const isPast = index < currentStepIndex;
                const errorCount = getStepErrorCount(step.id);
                
                // Determine if user can click on this step
                const canClickStep = isActive || isPast || (index === currentStepIndex + 1 && canProceedToStepValidated(currentStep));
                
                return (
                  <button
                    key={step.id}
                    onClick={() => canClickStep && goToStep(step.id)}
                    disabled={!canClickStep}
                    className={`flex flex-col items-center space-y-2 p-2 rounded-lg transition-colors ${
                      !canClickStep
                        ? 'opacity-50 cursor-not-allowed text-muted-foreground'
                        : isActive
                        ? 'bg-primary/10 text-primary'
                        : isPast
                        ? 'text-muted-foreground hover:text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 relative ${
                      !canClickStep
                        ? 'border-muted-foreground/20 bg-muted/20'
                        : isCompleted
                        ? 'bg-green-100 border-green-500 text-green-700'
                        : errorCount > 0
                        ? 'bg-red-100 border-red-500 text-red-700'
                        : isActive
                        ? 'border-primary bg-primary/10'
                        : 'border-muted-foreground/30'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : errorCount > 0 ? (
                        <AlertCircle className="h-4 w-4" />
                      ) : (
                        <span className="text-xs font-medium">{index + 1}</span>
                      )}
                      {errorCount > 0 && (
                        <Badge
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
                        >
                          {errorCount}
                        </Badge>
                      )}
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-medium">{step.title}</div>
                      <div className="text-xs text-muted-foreground hidden sm:block">
                        {step.description}
                      </div>
                      {!canClickStep && index > currentStepIndex && (
                        <div className="text-xs text-red-500 mt-1">
                          Complete previous steps
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content - Full Width */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-between w-full">
              <CardTitle className="flex items-center gap-2">
                {STEPS[currentStepIndex].title}
                {isStepValid(currentStep) && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Valid
                  </Badge>
                )}
                {showErrors && getStepErrorCount(currentStep) > 0 && (
                  <Badge variant="destructive">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {getStepErrorCount(currentStep)} Error{getStepErrorCount(currentStep) !== 1 ? 's' : ''}
                  </Badge>
                )}
              </CardTitle>
            </div>
          </div>
          <p className="text-muted-foreground">
            {STEPS[currentStepIndex].description}
          </p>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-6">
        <Button
          variant="outline"
          onClick={goPrevious}
          disabled={currentStepIndex === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex gap-2">
          {currentStep === 'preview' ? (
            <Button
              onClick={save}
              disabled={!canSave}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Template
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={goNext}
              disabled={currentStepIndex === STEPS.length - 1 || !canProceedToStepValidated(currentStep)}
            >
              {!canProceedToStepValidated(currentStep) ? 'Complete Step to Continue' : 'Next'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

    </div>
  );
}

export default TemplateCreationPage;
