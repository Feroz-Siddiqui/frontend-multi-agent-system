/**
 * PageHeader Component
 * Consistent page header across the application
 */

import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  className = ''
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 ${className}`}>
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      
      {actions && (
        <div className="flex items-center space-x-2">
          {actions}
        </div>
      )}
    </div>
  );
};
