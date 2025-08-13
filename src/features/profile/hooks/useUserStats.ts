/**
 * useUserStats Hook
 * Custom hook for fetching and managing user statistics
 */

import { useState, useEffect, useCallback } from 'react';
import { profileService, type UserStats } from '../services/profile.service';

interface UseUserStatsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

interface UseUserStatsReturn {
  stats: UserStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: string | null;
}

export function useUserStats(options: UseUserStatsOptions = {}): UseUserStatsReturn {
  const { autoRefresh = false, refreshInterval = 300000 } = options; // Default 5 minutes

  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const userStats = await profileService.getUserStats();
      setStats(userStats);
      setLastUpdated(new Date().toISOString());

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user statistics';
      setError(errorMessage);
      console.error('Error fetching user stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh || !refreshInterval) return;

    const interval = setInterval(() => {
      fetchStats();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchStats]);

  return {
    stats,
    loading,
    error,
    refresh,
    lastUpdated,
  };
}
