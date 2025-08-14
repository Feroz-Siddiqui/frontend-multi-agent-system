/**
 * Template Summary Card Component
 * Shows basic template information and status
 */

import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Users,
  Globe,
  Lock
} from 'lucide-react';

import type { Template, ValidationResult } from '../../types';

interface TemplateSummaryCardProps {
  template: Template;
  validation: ValidationResult;
}

export function TemplateSummaryCard({ template, validation }: TemplateSummaryCardProps) {
  const { isValid, errors } = validation;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Template Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Template Name */}
        <div>
          <div className="text-sm font-medium text-muted-foreground">Name</div>
          <div className="text-lg font-semibold">{template.name || 'Untitled Template'}</div>
        </div>
        
        {/* Description */}
        <div>
          <div className="text-sm font-medium text-muted-foreground">Description</div>
          <div className="text-sm mt-1 text-gray-700">
            {template.description || 'No description provided'}
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge 
            variant={isValid ? "default" : "destructive"}
            className={isValid ? 'bg-green-100 text-green-800' : ''}
          >
            {isValid ? (
              <CheckCircle className="w-3 h-3 mr-1" />
            ) : (
              <AlertCircle className="w-3 h-3 mr-1" />
            )}
            {isValid ? 'Valid' : `${errors.length} Error${errors.length !== 1 ? 's' : ''}`}
          </Badge>

          <Badge variant="outline" className="text-gray-600">
            <Users className="w-3 h-3 mr-1" />
            {template.agents.length} Agent{template.agents.length !== 1 ? 's' : ''}
          </Badge>

          <Badge variant="outline" className="text-gray-600">
            {template.is_public ? (
              <>
                <Globe className="w-3 h-3 mr-1 text-blue-500" />
                Public
              </>
            ) : (
              <>
                <Lock className="w-3 h-3 mr-1 text-gray-500" />
                Private
              </>
            )}
          </Badge>
        </div>

        {/* Metadata */}
        <div className="pt-2 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Created: {new Date().toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
