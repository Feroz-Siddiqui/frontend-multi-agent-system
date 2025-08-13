/**
 * ProfileList Component
 * Main profile listing component matching ExecutionHistoryList structure
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Activity, Settings, Edit, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/api';
import { ProfileHeader } from './ProfileHeader';
import { useUserStats } from '../hooks/useUserStats';

interface ProfileListProps {
  className?: string;
}

export const ProfileList: React.FC<ProfileListProps> = ({
  className = ''
}) => {
  const { user, refreshUser } = useAuth();
  const { stats, loading: statsLoading, error: statsError, refresh: refreshStats } = useUserStats();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
  });

  // Load user data
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await authService.updateProfile({
        full_name: formData.full_name,
        email: formData.email,
      });

      await refreshUser();
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await refreshUser();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Function to generate initials from full name
  const getInitials = (fullName: string) => {
    if (!fullName) return 'U';
    
    const names = fullName.trim().split(' ');
    if (names.length === 1) {
      // If only one name, return first two characters
      return names[0].substring(0, 2).toUpperCase();
    } else {
      // If multiple names, return first letter of first and last name
      return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <ProfileHeader
        onRefresh={handleRefresh}
      />

      {/* Profile Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side - Profile Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{isEditing ? 'Profile Information' : 'Profile Overview'}</CardTitle>
              {!isEditing ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              ) : null}
            </div>
            {isEditing && (
              <CardDescription>
                Update your personal information and contact details
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {!isEditing ? (
              <>
                {/* Profile Overview - Display Mode */}
                {/* User Info */}
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getInitials(user.full_name || '')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{user.full_name || 'User'}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                {/* Account Details */}
                <div className="space-y-3 pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    <Badge className={user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Role</span>
                    <Badge variant="outline">
                      {user.role || 'User'}
                    </Badge>
                  </div>

                  {user.created_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Member Since</span>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(user.created_at)}
                      </span>
                    </div>
                  )}

                  {user.last_login && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Last Login</span>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(user.last_login)}
                      </span>
                    </div>
                  )}

                  {user.login_count && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Login Count</span>
                      <span className="text-sm text-muted-foreground">
                        {user.login_count}
                      </span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Profile Information - Edit Mode */}
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      type="text"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                      placeholder="Enter your email address"
                    />
                  </div>

                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                      {success}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Settings className="h-4 w-4 mr-2" />
                          Update Profile
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </>
            )}
          </CardContent>
        </Card>

        {/* Right Side - Activity Stats */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span>Activity</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshStats}
                disabled={statsLoading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">Loading statistics...</span>
              </div>
            ) : statsError ? (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                Failed to load statistics: {statsError}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Workflows Executed</span>
                  <span className="text-sm font-medium">{stats?.totalExecutions || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Cost</span>
                  <span className="text-sm font-medium">
                    ${(stats?.totalCost || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Success Rate</span>
                  <span className="text-sm font-medium">
                    {stats?.totalExecutions && stats.totalExecutions > 0 
                      ? `${stats.successRate.toFixed(1)}%` 
                      : 'N/A'
                    }
                  </span>
                </div>
                {stats?.averageExecutionTime && stats.averageExecutionTime > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avg. Execution Time</span>
                    <span className="text-sm font-medium">
                      {Math.round(stats.averageExecutionTime)}s
                    </span>
                  </div>
                )}
                {stats?.lastExecutionDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last Execution</span>
                    <span className="text-sm font-medium">
                      {formatDate(stats.lastExecutionDate)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
