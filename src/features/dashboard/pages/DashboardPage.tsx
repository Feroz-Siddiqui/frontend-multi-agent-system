/**
 * Dashboard Page
 * 
 * Main dashboard page that combines all dashboard components
 */

import { useNavigate } from 'react-router-dom';
import { 
  RefreshCw,
  Settings,
  Calendar,
  TrendingUp
} from 'lucide-react';

import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Badge } from '../../../components/ui/badge';
import { PageHeader } from '../../../components/common/PageHeader';
import { ErrorDisplay } from '../../../components/common/ErrorDisplay';

import { SystemOverviewCards } from '../components/SystemOverviewCards';
import { LiveExecutionMonitor } from '../components/LiveExecutionMonitor';
import { useDashboardData } from '../hooks/useDashboardData';

import type { DashboardPageProps } from '../types';

export function DashboardPage({ initialFilters }: DashboardPageProps) {
  const navigate = useNavigate();
  
  const {
    // Data
    systemOverview,
    liveExecutions,
    templateHub,
    activityFeed,
    
    // State
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
    isRealTimeConnected,
    
    // Actions
    refresh,
    executeTemplate,
    stopExecution,
    pauseExecution,
    resumeExecution,
    toggleRealTime
  } = useDashboardData({
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
    enableRealTime: true,
    initialFilters
  });

  const handleExecuteTemplate = async (templateId: string) => {
    try {
      const executionId = await executeTemplate(templateId);
      navigate(`/executions/${executionId}`);
    } catch (error) {
      console.error('Failed to execute template:', error);
    }
  };

  const handleViewExecution = (executionId: string) => {
    navigate(`/executions/${executionId}`);
  };

  const handleViewTemplate = (templateId: string) => {
    navigate(`/templates/${templateId}`);
  };

  if (error && isLoading) {
    return (
      <ErrorDisplay 
        title="Dashboard Error"
        message={error}
        onRetry={refresh}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        description="Monitor your multi-agent system performance and executions"
        actions={
          <div className="flex items-center gap-2">
            {/* Real-time indicator */}
            {isRealTimeConnected && (
              <Badge variant="outline" className="text-green-600 border-green-200">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse mr-1" />
                Live
              </Badge>
            )}
            
            {/* Last updated */}
            {lastUpdated && (
              <span className="text-sm text-muted-foreground">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            
            {/* Actions */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleRealTime}
              className={isRealTimeConnected ? 'text-green-600' : ''}
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              {isRealTimeConnected ? 'Live' : 'Connect'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-1" />
              Settings
            </Button>
          </div>
        }
      />

      {/* System Overview */}
      <section>
        <SystemOverviewCards 
          data={systemOverview} 
          isLoading={isLoading && !systemOverview} 
        />
      </section>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="executions">
            Live Executions
            {liveExecutions.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {liveExecutions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Executions */}
            <LiveExecutionMonitor
              executions={liveExecutions}
              isLoading={isLoading && liveExecutions.length === 0}
              onStop={stopExecution}
              onPause={pauseExecution}
              onResume={resumeExecution}
              onViewDetails={handleViewExecution}
            />

            {/* Template Hub */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-purple-600" />
                    Popular Templates
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <a href="/templates">View All</a>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading && templateHub.length === 0 ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="border rounded-lg p-4">
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                          <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                          <div className="flex gap-2 mt-2">
                            <div className="h-6 bg-gray-200 rounded w-16 animate-pulse" />
                            <div className="h-6 bg-gray-200 rounded w-20 animate-pulse" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : templateHub.length === 0 ? (
                  <div className="text-center py-8">
                    <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No Templates</h3>
                    <p className="text-muted-foreground mb-4">Create your first template to get started.</p>
                    <Button asChild>
                      <a href="/templates/create">Create Template</a>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {templateHub.map((template) => (
                      <div key={template.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate text-foreground">{template.name}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                          </div>
                          {template.isFeatured && (
                            <Badge variant="secondary" className="ml-2">Featured</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                          <span>{template.usageCount} uses</span>
                          <span>{template.successRate.toFixed(1)}% success</span>
                          <span>${template.averageCost.toFixed(3)} avg</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleExecuteTemplate(template.id)}
                            className="flex-1"
                          >
                            Execute
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewTemplate(template.id)}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && activityFeed.length === 0 ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                      <div className="flex-1 space-y-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                        <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : activityFeed.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Recent Activity</h3>
                  <p className="text-muted-foreground">Activity will appear here as you use the system.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {activityFeed.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.severity === 'error' ? 'bg-red-500' :
                        activity.severity === 'warning' ? 'bg-yellow-500' :
                        activity.severity === 'success' ? 'bg-green-500' :
                        'bg-blue-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Executions Tab */}
        <TabsContent value="executions">
          <LiveExecutionMonitor
            executions={liveExecutions}
            isLoading={isLoading && liveExecutions.length === 0}
            onStop={stopExecution}
            onPause={pauseExecution}
            onResume={resumeExecution}
            onViewDetails={handleViewExecution}
          />
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Template Hub</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Template hub content will be implemented here.</p>
                <Button asChild>
                  <a href="/templates">Browse All Templates</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>System Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Detailed activity feed will be implemented here.</p>
                <Button asChild>
                  <a href="/executions">View Execution History</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default DashboardPage;
