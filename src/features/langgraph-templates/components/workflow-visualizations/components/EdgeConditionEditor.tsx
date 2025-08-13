/**
 * Edge Condition Editor Modal
 * Allows users to configure edge conditions for conditional workflows
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../../../components/ui/dialog';
import { Button } from '../../../../../components/ui/button';
import { Label } from '../../../../../components/ui/label';
import { Input } from '../../../../../components/ui/input';
import { Textarea } from '../../../../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../../components/ui/select';
import { Badge } from '../../../../../components/ui/badge';
import { Separator } from '../../../../../components/ui/separator';
import { 
  Settings, 
  CheckCircle, 
  XCircle, 
  Code, 
  Info,
  AlertTriangle
} from 'lucide-react';

interface EdgeConditionEditorProps {
  isOpen: boolean;
  onClose: () => void;
  edge: any;
  onSave: (edgeId: string, conditionData: any) => void;
  sourceAgentName?: string;
  targetAgentName?: string;
}

type ConditionType = 'always' | 'success' | 'failure' | 'custom';

interface CustomConditionData {
  field: 'confidence_score' | 'execution_time' | 'content' | 'token_count';
  operator: 'greater_than' | 'less_than' | 'equals' | 'contains' | 'not_contains';
  value: string | number;
  description?: string;
}

export function EdgeConditionEditor({
  isOpen,
  onClose,
  edge,
  onSave,
  sourceAgentName,
  targetAgentName
}: EdgeConditionEditorProps) {
  const [conditionType, setConditionType] = useState<ConditionType>('always');
  const [customCondition, setCustomCondition] = useState<CustomConditionData>({
    field: 'confidence_score',
    operator: 'greater_than',
    value: 0.8,
    description: ''
  });
  const [conditionDescription, setConditionDescription] = useState('');

  // Initialize form data when edge changes
  useEffect(() => {
    if (edge) {
      setConditionType(edge.data?.condition_type || 'always');
      setConditionDescription(edge.data?.condition || '');
      
      if (edge.data?.condition_data) {
        setCustomCondition({
          field: edge.data.condition_data.field || 'confidence_score',
          operator: edge.data.condition_data.operator || 'greater_than',
          value: edge.data.condition_data.value || 0.8,
          description: edge.data.condition_data.description || ''
        });
      }
    }
  }, [edge]);

  // Generate human-readable condition preview
  const getConditionPreview = (): string => {
    switch (conditionType) {
      case 'always':
        return 'Always execute this path';
      case 'success':
        return 'Execute only if previous agent succeeds';
      case 'failure':
        return 'Execute only if previous agent fails';
      case 'custom':
        const { field, operator, value } = customCondition;
        const fieldLabel = {
          confidence_score: 'confidence score',
          execution_time: 'execution time',
          content: 'output content',
          token_count: 'token count'
        }[field];
        
        const operatorLabel = {
          greater_than: 'is greater than',
          less_than: 'is less than',
          equals: 'equals',
          contains: 'contains',
          not_contains: 'does not contain'
        }[operator];
        
        return `Execute if ${fieldLabel} ${operatorLabel} ${value}`;
      default:
        return 'Unknown condition';
    }
  };

  // Get condition type color and icon
  const getConditionStyle = (type: ConditionType) => {
    switch (type) {
      case 'always':
        return { color: 'text-blue-600', bg: 'bg-blue-50', icon: CheckCircle };
      case 'success':
        return { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle };
      case 'failure':
        return { color: 'text-red-600', bg: 'bg-red-50', icon: XCircle };
      case 'custom':
        return { color: 'text-orange-600', bg: 'bg-orange-50', icon: Code };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-50', icon: Settings };
    }
  };

  const handleSave = () => {
    const conditionData = {
      condition_type: conditionType,
      condition: conditionType === 'custom' ? 
        customCondition.description || getConditionPreview() : 
        conditionDescription || getConditionPreview(),
      condition_data: conditionType === 'custom' ? {
        field: customCondition.field,
        operator: customCondition.operator,
        value: customCondition.value,
        description: customCondition.description
      } : undefined
    };

    onSave(edge.id, conditionData);
    onClose();
  };

  const currentStyle = getConditionStyle(conditionType);
  const CurrentIcon = currentStyle.icon;

  if (!edge) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configure Edge Condition
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Edge Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">
                  {sourceAgentName || 'Source'} → {targetAgentName || 'Target'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Edge ID: {edge.id}
                </div>
              </div>
              <Badge variant="outline" className={`${currentStyle.color} ${currentStyle.bg}`}>
                <CurrentIcon className="h-3 w-3 mr-1" />
                {conditionType}
              </Badge>
            </div>
          </div>

          {/* Condition Type Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Condition Type</Label>
            <Select value={conditionType} onValueChange={(value: ConditionType) => setConditionType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="always">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span>Always</span>
                    <span className="text-xs text-gray-500">- Execute unconditionally</span>
                  </div>
                </SelectItem>
                <SelectItem value="success">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Success</span>
                    <span className="text-xs text-gray-500">- Only if previous succeeds</span>
                  </div>
                </SelectItem>
                <SelectItem value="failure">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span>Failure</span>
                    <span className="text-xs text-gray-500">- Only if previous fails</span>
                  </div>
                </SelectItem>
                <SelectItem value="custom">
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-orange-600" />
                    <span>Custom</span>
                    <span className="text-xs text-gray-500">- Custom logic condition</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Condition Builder */}
          {conditionType === 'custom' && (
            <div className="space-y-4 p-4 border rounded-lg bg-orange-50">
              <div className="flex items-center gap-2 text-orange-800">
                <Code className="h-4 w-4" />
                <span className="font-medium">Custom Condition Logic</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Field Selection */}
                <div className="space-y-2">
                  <Label className="text-sm">Field</Label>
                  <Select 
                    value={customCondition.field} 
                    onValueChange={(value: any) => setCustomCondition(prev => ({ ...prev, field: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confidence_score">Confidence Score</SelectItem>
                      <SelectItem value="execution_time">Execution Time</SelectItem>
                      <SelectItem value="content">Output Content</SelectItem>
                      <SelectItem value="token_count">Token Count</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Operator Selection */}
                <div className="space-y-2">
                  <Label className="text-sm">Operator</Label>
                  <Select 
                    value={customCondition.operator} 
                    onValueChange={(value: any) => setCustomCondition(prev => ({ ...prev, operator: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="greater_than">Greater Than</SelectItem>
                      <SelectItem value="less_than">Less Than</SelectItem>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="not_contains">Not Contains</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Value Input */}
                <div className="space-y-2">
                  <Label className="text-sm">Value</Label>
                  <Input
                    type={customCondition.field === 'content' ? 'text' : 'number'}
                    value={customCondition.value}
                    onChange={(e) => setCustomCondition(prev => ({ 
                      ...prev, 
                      value: customCondition.field === 'content' ? e.target.value : parseFloat(e.target.value) || 0
                    }))}
                    placeholder={customCondition.field === 'content' ? 'Enter text...' : '0.8'}
                  />
                </div>
              </div>

              {/* Custom Description */}
              <div className="space-y-2">
                <Label className="text-sm">Description (Optional)</Label>
                <Textarea
                  value={customCondition.description}
                  onChange={(e) => setCustomCondition(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe when this condition should trigger..."
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Basic Condition Description */}
          {conditionType !== 'custom' && (
            <div className="space-y-2">
              <Label>Condition Description (Optional)</Label>
              <Input
                value={conditionDescription}
                onChange={(e) => setConditionDescription(e.target.value)}
                placeholder={getConditionPreview()}
              />
            </div>
          )}

          <Separator />

          {/* Condition Preview */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500" />
              <span className="font-medium text-sm">Condition Preview</span>
            </div>
            <div className={`p-3 rounded-lg ${currentStyle.bg}`}>
              <div className={`text-sm ${currentStyle.color} font-medium`}>
                {getConditionPreview()}
              </div>
              {conditionType === 'custom' && customCondition.description && (
                <div className="text-xs text-gray-600 mt-1">
                  {customCondition.description}
                </div>
              )}
            </div>
          </div>

          {/* Help Text */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <div className="font-medium mb-1">Condition Evaluation:</div>
                <ul className="text-xs space-y-1">
                  <li>• <strong>Always:</strong> Path is always taken</li>
                  <li>• <strong>Success:</strong> Path taken only if previous agent succeeds</li>
                  <li>• <strong>Failure:</strong> Path taken only if previous agent fails</li>
                  <li>• <strong>Custom:</strong> Path taken based on custom logic evaluation</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Condition
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EdgeConditionEditor;
