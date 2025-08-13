/**
 * ProfileHeader Component
 * Header component matching ExecutionHistoryHeader structure
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface ProfileHeaderProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  onRefresh,
  isRefreshing = false,
  className = ''
}) => {
  return (
    <div className={`flex items-start justify-between ${className}`}>
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    </div>
  );
};
