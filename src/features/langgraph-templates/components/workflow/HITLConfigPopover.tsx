/**
 * HITL Configuration Popover Component
 * Clickable popover for configuring agent-level HITL settings
 */

import { useState } from 'react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../../components/ui/popover';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../../../components/ui/collapsible';
import { User, ChevronUp, ChevronDown } from 'lucide-react';
import { HITL_PRESETS, INTERVENTION_TYPES, INTERVENTION_POINTS } from './constants';
import type { Agent, HITLConfig, InterventionType } from '../../types';

interface HITLConfigPopoverProps {
  agent: Agent;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateAgent: (updates: Partial<Agent>) => void;
}

export function HITLConfigPopover({ 
  agent, 
  isOpen, 
  onOpenChange, 
  onUpdateAgent 
}: HITLConfigPopoverProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const getCurrentPreset = () => {
    if (!agent.hitl_config?.enabled) return 'none';
    
    const config = agent.hitl_config;
    for (const [key, preset] of Object.entries(HITL_PRESETS)) {
      if (key === 'none') continue;
      const presetConfig = preset.config!;
      if (
        config.intervention_points.length === presetConfig.intervention_points.length &&
        config.intervention_points.every(p => presetConfig.intervention_points.includes(p)) &&
        config.intervention_type === presetConfig.intervention_type
      ) {
        return key;
      }
    }
    return 'custom';
  };

  const handlePresetChange = (presetKey: string) => {
    const preset = HITL_PRESETS[presetKey as keyof typeof HITL_PRESETS];
    
    if (presetKey === 'none') {
      onUpdateAgent({ hitl_config: undefined });
    } else {
      onUpdateAgent({ hitl_config: preset.config! });
    }
    
    if (presetKey !== 'custom') {
      setShowAdvanced(false);
    }
  };

  const updateHITLConfig = (updates: Partial<HITLConfig>) => {
    if (agent.hitl_config) {
      onUpdateAgent({
        hitl_config: { ...agent.hitl_config, ...updates }
      });
    }
  };

  const currentPreset = getCurrentPreset();

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <div /> {/* This will be triggered programmatically */}
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <h3 className="font-semibold">{agent.name} HITL</h3>
          </div>
          
          {/* Quick Presets */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quick Presets</Label>
            <div className="space-y-2">
              {Object.entries(HITL_PRESETS).map(([key, preset]) => {
                const IconComponent = preset.icon;
                return (
                  <button
                    key={key}
                    onClick={() => handlePresetChange(key)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                      currentPreset === key
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    <div>
                      <div className="text-sm font-medium">{preset.label}</div>
                      <div className="text-xs text-muted-foreground">{preset.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Advanced Settings */}
          {agent.hitl_config?.enabled && (
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  Advanced Settings
                  {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-4">
                <div>
                  <Label className="text-sm">Intervention Points</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {INTERVENTION_POINTS.map(point => (
                      <label key={point.value} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={agent.hitl_config?.intervention_points.includes(point.value) || false}
                          onChange={(e) => {
                            const currentPoints = agent.hitl_config?.intervention_points || [];
                            const newPoints = e.target.checked
                              ? [...currentPoints, point.value]
                              : currentPoints.filter(p => p !== point.value);
                            updateHITLConfig({ intervention_points: newPoints });
                          }}
                          className="rounded"
                        />
                        <span>{point.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm">Intervention Type</Label>
                  <Select
                    value={agent.hitl_config.intervention_type}
                    onValueChange={(value: InterventionType) => 
                      updateHITLConfig({ intervention_type: value })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERVENTION_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Timeout (seconds)</Label>
                    <Input
                      type="number"
                      min="30"
                      max="3600"
                      value={agent.hitl_config.timeout_seconds}
                      onChange={(e) => 
                        updateHITLConfig({ timeout_seconds: parseInt(e.target.value) })
                      }
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      id={`auto-approve-${agent.id}`}
                      checked={agent.hitl_config.auto_approve_after_timeout}
                      onChange={(e) => 
                        updateHITLConfig({ auto_approve_after_timeout: e.target.checked })
                      }
                      className="rounded"
                    />
                    <Label htmlFor={`auto-approve-${agent.id}`} className="text-sm">
                      Auto-approve
                    </Label>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm">Custom Instructions (optional)</Label>
                  <Textarea
                    placeholder="Instructions for human reviewers..."
                    value={agent.hitl_config.custom_prompt || ''}
                    onChange={(e) => 
                      updateHITLConfig({ custom_prompt: e.target.value })
                    }
                    className="mt-1 min-h-[60px]"
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
          
          <div className="flex gap-2 pt-2 border-t">
            <Button onClick={() => onOpenChange(false)} className="flex-1">
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
