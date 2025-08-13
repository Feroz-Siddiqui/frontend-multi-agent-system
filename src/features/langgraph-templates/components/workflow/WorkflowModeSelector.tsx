/**
 * Workflow Mode Selector Component
 * Clean component for selecting workflow execution mode
 */

import { Alert, AlertDescription } from '../../../../components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { WORKFLOW_MODES } from './constants';
import type { WorkflowMode, Agent } from '../../types';

interface WorkflowModeSelectorProps {
  selectedMode: WorkflowMode;
  agents: Agent[];
  onModeChange: (mode: WorkflowMode) => void;
}

export function WorkflowModeSelector({
  selectedMode,
  agents,
  onModeChange,
}: WorkflowModeSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Workflow Mode</h3>
        <p className="text-sm text-muted-foreground">
          Choose how your agents will execute
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {WORKFLOW_MODES.map((mode) => {
          const isSelected = selectedMode === mode.value;
          const isDisabled = agents.length === 0;
          const IconComponent = mode.icon;
          
          return (
            <button
              key={mode.value}
              onClick={() => !isDisabled && onModeChange(mode.value)}
              disabled={isDisabled}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                isSelected 
                  ? 'border-primary bg-primary/5' 
                  : isDisabled
                  ? 'border-muted bg-muted/20 cursor-not-allowed opacity-50'
                  : 'border-muted hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                <h4 className="font-semibold">{mode.label}</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                {mode.description}
              </p>
            </button>
          );
        })}
      </div>

      {agents.length === 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Add at least one agent before configuring the workflow.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
