import { useState, useEffect, useCallback } from 'react';
import { 
  getUserStreakData, 
  updateUserStreak, 
  getStreakMilestones, 
  getNextMilestone, 
  getStreakMotivation,
  StreakData,
  StreakUpdateResult 
} from '../services/streakService';

export const useStreak = () => {
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastAnalysisDate: null,
    streakFreezeCount: 0,
    daysSinceLast: 0,
    streakStatus: 'new'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStreakData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserStreakData();
      setStreakData(data);
    } catch (err) {
      console.error('Error loading streak data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load streak data');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshStreak = useCallback(async (): Promise<StreakUpdateResult | null> => {
    try {
      const result = await updateUserStreak();
      // Refresh the data after update
      await loadStreakData();
      return result;
    } catch (err) {
      console.error('Error updating streak:', err);
      setError(err instanceof Error ? err.message : 'Failed to update streak');
      return null;
    }
  }, [loadStreakData]);

  useEffect(() => {
    loadStreakData();
  }, [loadStreakData]);

  // Computed values
  const milestones = getStreakMilestones(streakData.currentStreak);
  const nextMilestone = getNextMilestone(streakData.currentStreak);
  const motivation = getStreakMotivation(streakData);
  const isActive = streakData.currentStreak > 0;
  const latestMilestone = milestones[milestones.length - 1];

  return {
    // Data
    streakData,
    loading,
    error,
    
    // Computed values
    milestones,
    nextMilestone,
    motivation,
    isActive,
    latestMilestone,
    
    // Actions
    loadStreakData,
    refreshStreak,
  };
};
