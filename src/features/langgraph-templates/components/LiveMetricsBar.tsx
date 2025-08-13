/**
 * LiveMetricsBar Component
 * 
 * Beautiful animated metrics bar for real-time execution data
 */

import { useEffect, useState } from 'react';
import { DollarSign, Zap, Clock, Target, Search, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';

interface LiveMetricsBarProps {
  cost: number;
  tokens: number;
  duration: number;
  confidence: number;
  tavilyCredits: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  className?: string;
}

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  formatter?: (value: number) => string;
}

function AnimatedCounter({ value, duration = 1000, formatter }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(value * easeOutQuart);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration]);

  return <span>{formatter ? formatter(displayValue) : Math.round(displayValue)}</span>;
}

export function LiveMetricsBar({ 
  cost, 
  tokens, 
  duration, 
  confidence, 
  tavilyCredits, 
  status,
  className 
}: LiveMetricsBarProps) {
  const formatCost = (value: number) => {
    if (value === 0) return '$0.00';
    if (value < 0.001) return '<$0.001';
    return `$${value.toFixed(3)}`;
  };

  const formatDuration = (value: number) => {
    if (value < 60) return `${value.toFixed(1)}s`;
    const minutes = Math.floor(value / 60);
    const seconds = value % 60;
    return `${minutes}m ${seconds.toFixed(0)}s`;
  };

  const formatTokens = (value: number) => {
    if (value < 1000) return Math.round(value).toString();
    if (value < 1000000) return `${(value / 1000).toFixed(1)}K`;
    return `${(value / 1000000).toFixed(1)}M`;
  };

  const formatConfidence = (value: number) => `${Math.round(value * 100)}%`;

  const getStatusColor = () => {
    switch (status) {
      case 'completed': return 'border-green-500 bg-green-50 dark:bg-green-950/20';
      case 'running': return 'border-blue-500 bg-blue-50 dark:bg-blue-950/20';
      case 'failed': return 'border-red-500 bg-red-50 dark:bg-red-950/20';
      default: return 'border-gray-300 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'completed': return <Badge variant="default" className="bg-green-600">COMPLETED</Badge>;
      case 'running': return <Badge variant="secondary" className="bg-blue-600 text-white animate-pulse">RUNNING</Badge>;
      case 'failed': return <Badge variant="destructive">FAILED</Badge>;
      case 'pending': return <Badge variant="outline">PENDING</Badge>;
      default: return null;
    }
  };

  return (
    <Card className={`border-l-4 ${getStatusColor()} ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-semibold">Live Execution Metrics</h3>
          </div>
          {getStatusBadge()}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* Cost */}
          <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg border">
            <div className="flex items-center justify-center mb-1">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-lg font-bold text-green-600">
              <AnimatedCounter value={cost} formatter={formatCost} />
            </div>
            <div className="text-xs text-muted-foreground">Cost</div>
          </div>

          {/* Tokens */}
          <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg border">
            <div className="flex items-center justify-center mb-1">
              <Zap className="w-4 h-4 text-yellow-600" />
            </div>
            <div className="text-lg font-bold text-yellow-600">
              <AnimatedCounter value={tokens} formatter={formatTokens} />
            </div>
            <div className="text-xs text-muted-foreground">Tokens</div>
          </div>

          {/* Duration */}
          <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg border">
            <div className="flex items-center justify-center mb-1">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-lg font-bold text-blue-600">
              <AnimatedCounter value={duration} formatter={formatDuration} />
            </div>
            <div className="text-xs text-muted-foreground">Duration</div>
          </div>

          {/* Confidence */}
          <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg border">
            <div className="flex items-center justify-center mb-1">
              <Target className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-lg font-bold text-purple-600">
              <AnimatedCounter value={confidence} formatter={formatConfidence} />
            </div>
            <div className="text-xs text-muted-foreground">Confidence</div>
          </div>

          {/* Tavily Credits */}
          <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg border">
            <div className="flex items-center justify-center mb-1">
              <Search className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-lg font-bold text-orange-600">
              <AnimatedCounter value={tavilyCredits} />
            </div>
            <div className="text-xs text-muted-foreground">Tavily</div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}

export default LiveMetricsBar;
