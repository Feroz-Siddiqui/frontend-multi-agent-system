import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PasswordRequirement {
  id: string;
  label: string;
  met: boolean;
}

export interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
  showProgress?: boolean;
  showRequirements?: boolean;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  className = '',
  showProgress = true,
  showRequirements = true,
}) => {
  // Define password requirements based on backend policy
  const requirements: PasswordRequirement[] = [
    {
      id: 'length',
      label: 'At least 8 characters',
      met: password.length >= 8,
    },
    {
      id: 'uppercase',
      label: 'Contains uppercase letter',
      met: /[A-Z]/.test(password),
    },
    {
      id: 'lowercase',
      label: 'Contains lowercase letter',
      met: /[a-z]/.test(password),
    },
    {
      id: 'digit',
      label: 'Contains at least one digit',
      met: /\d/.test(password),
    },
  ];

  // Calculate password strength
  const metRequirements = requirements.filter(req => req.met).length;
  const strengthPercentage = (metRequirements / requirements.length) * 100;

  // Determine strength level and color
  const getStrengthInfo = () => {
    if (metRequirements === 0) {
      return { level: 'No password', color: 'text-gray-500', bgColor: 'bg-gray-200' };
    } else if (metRequirements === 1) {
      return { level: 'Very weak', color: 'text-red-600', bgColor: 'bg-red-500' };
    } else if (metRequirements === 2) {
      return { level: 'Weak', color: 'text-orange-600', bgColor: 'bg-orange-500' };
    } else if (metRequirements === 3) {
      return { level: 'Good', color: 'text-yellow-600', bgColor: 'bg-yellow-500' };
    } else {
      return { level: 'Strong', color: 'text-green-600', bgColor: 'bg-green-500' };
    }
  };

  const strengthInfo = getStrengthInfo();

  return (
    <div className={cn('space-y-3', className)}>
      {showProgress && password.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">
              Password strength
            </span>
            <span className={cn('text-sm font-medium', strengthInfo.color)}>
              {strengthInfo.level}
            </span>
          </div>
          <Progress 
            value={strengthPercentage} 
            className="h-2"
            // Custom progress bar color based on strength
            style={{
              '--progress-background': strengthInfo.bgColor,
            } as React.CSSProperties}
          />
        </div>
      )}

      {showRequirements && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-muted-foreground">
            Password requirements:
          </span>
          <div className="space-y-2">
            {requirements.map((requirement) => (
              <div
                key={requirement.id}
                className="flex items-center gap-2 text-sm"
              >
                <div
                  className={cn(
                    'flex items-center justify-center w-4 h-4 rounded-full',
                    requirement.met
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 text-gray-400'
                  )}
                >
                  {requirement.met ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <X className="w-3 h-3" />
                  )}
                </div>
                <span
                  className={cn(
                    requirement.met
                      ? 'text-green-700'
                      : 'text-muted-foreground'
                  )}
                >
                  {requirement.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
