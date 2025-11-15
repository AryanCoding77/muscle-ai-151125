import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastAnalysisDate: string | null;
  streakFreezeCount: number;
  daysSinceLast: number;
  streakStatus: 'new' | 'active_today' | 'ready' | 'broken';
}

export interface StreakUpdateResult {
  currentStreak: number;
  longestStreak: number;
  isNewRecord: boolean;
  milestoneAchieved: string | null;
}

export interface StreakMilestone {
  days: number;
  title: string;
  description: string;
  icon: string;
  color: string;
}

const STREAK_MILESTONES: StreakMilestone[] = [
  {
    days: 7,
    title: 'Dedicated Analyzer',
    description: '7 days strong!',
    icon: '🔥',
    color: '#FF6B35'
  },
  {
    days: 14,
    title: 'Consistent Tracker',
    description: '2 weeks of dedication!',
    icon: '⚡',
    color: '#FF8E53'
  },
  {
    days: 30,
    title: 'Muscle Expert',
    description: '30 days of progress!',
    icon: '💪',
    color: '#FFB347'
  },
  {
    days: 60,
    title: 'Fitness Champion',
    description: '2 months of commitment!',
    icon: '🏆',
    color: '#FFD700'
  },
  {
    days: 100,
    title: 'Streak Master',
    description: '100 days legendary!',
    icon: '👑',
    color: '#FF4500'
  }
];

const OFFLINE_STREAK_KEY = 'muscle_ai_offline_streak';

/**
 * Get user's streak data
 */
export const getUserStreakData = async (): Promise<StreakData> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Call the database function to get streak data
    const { data, error } = await supabase.rpc('get_user_streak_data', {
      user_uuid: user.id
    });

    if (error) {
      console.error('Error fetching streak data:', error);
      // Return offline data if available
      return await getOfflineStreakData();
    }

    const streakData = data[0];
    const result: StreakData = {
      currentStreak: streakData.current_streak || 0,
      longestStreak: streakData.longest_streak || 0,
      lastAnalysisDate: streakData.last_analysis_date,
      streakFreezeCount: streakData.streak_freeze_count || 0,
      daysSinceLast: streakData.days_since_last || 0,
      streakStatus: streakData.streak_status || 'new'
    };

    // Cache offline for backup
    await cacheOfflineStreakData(result);
    
    return result;
  } catch (error) {
    console.error('Error in getUserStreakData:', error);
    return await getOfflineStreakData();
  }
};

/**
 * Update user's streak after completing an analysis
 */
export const updateUserStreak = async (): Promise<StreakUpdateResult> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Call the database function to update streak
    const { data, error } = await supabase.rpc('update_user_streak', {
      user_uuid: user.id
    });

    if (error) {
      console.error('Error updating streak:', error);
      // Handle offline update
      return await updateOfflineStreak();
    }

    const result = data[0];
    const streakResult: StreakUpdateResult = {
      currentStreak: result.current_streak || 0,
      longestStreak: result.longest_streak || 0,
      isNewRecord: result.is_new_record || false,
      milestoneAchieved: result.milestone_achieved
    };

    // Update offline cache
    const streakData: StreakData = {
      currentStreak: streakResult.currentStreak,
      longestStreak: streakResult.longestStreak,
      lastAnalysisDate: new Date().toISOString().split('T')[0],
      streakFreezeCount: 0,
      daysSinceLast: 0,
      streakStatus: 'active_today'
    };
    await cacheOfflineStreakData(streakData);

    return streakResult;
  } catch (error) {
    console.error('Error in updateUserStreak:', error);
    return await updateOfflineStreak();
  }
};

/**
 * Get streak milestones achieved for a given streak count
 */
export const getStreakMilestones = (streakCount: number): StreakMilestone[] => {
  return STREAK_MILESTONES.filter(milestone => streakCount >= milestone.days);
};

/**
 * Get the next milestone to achieve
 */
export const getNextMilestone = (streakCount: number): StreakMilestone | null => {
  return STREAK_MILESTONES.find(milestone => streakCount < milestone.days) || null;
};

/**
 * Get motivational message based on streak status
 */
export const getStreakMotivation = (streakData: StreakData): string => {
  const { currentStreak, streakStatus } = streakData;

  if (streakStatus === 'broken' || currentStreak === 0) {
    return 'Start your streak!';
  }

  if (streakStatus === 'active_today') {
    return 'Great job today!';
  }

  if (streakStatus === 'ready') {
    return 'Keep it going!';
  }

  if (currentStreak >= 100) {
    return 'Legendary streak!';
  } else if (currentStreak >= 30) {
    return 'Amazing dedication!';
  } else if (currentStreak >= 7) {
    return 'Keep it up!';
  } else {
    return 'Building momentum!';
  }
};

/**
 * Cache streak data offline for backup
 */
const cacheOfflineStreakData = async (streakData: StreakData): Promise<void> => {
  try {
    await AsyncStorage.setItem(OFFLINE_STREAK_KEY, JSON.stringify(streakData));
  } catch (error) {
    console.error('Error caching offline streak data:', error);
  }
};

/**
 * Get offline streak data
 */
const getOfflineStreakData = async (): Promise<StreakData> => {
  try {
    const cached = await AsyncStorage.getItem(OFFLINE_STREAK_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error('Error getting offline streak data:', error);
  }

  // Return default data if no cache
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastAnalysisDate: null,
    streakFreezeCount: 0,
    daysSinceLast: 0,
    streakStatus: 'new'
  };
};

/**
 * Update streak offline
 */
const updateOfflineStreak = async (): Promise<StreakUpdateResult> => {
  try {
    const currentData = await getOfflineStreakData();
    const today = new Date().toISOString().split('T')[0];
    
    let newStreak = 1;
    let isNewRecord = false;
    
    if (!currentData.lastAnalysisDate) {
      // First analysis ever - start streak at 1
      newStreak = 1;
    } else {
      const lastDate = new Date(currentData.lastAnalysisDate);
      const todayDate = new Date(today);
      const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0) {
        // Same day, no change
        newStreak = currentData.currentStreak;
      } else if (daysDiff === 1) {
        // Consecutive day
        newStreak = currentData.currentStreak + 1;
      } else {
        // Streak broken, reset to 1
        newStreak = 1;
      }
    }
    
    const newLongest = Math.max(newStreak, currentData.longestStreak);
    isNewRecord = newLongest > currentData.longestStreak;
    
    const updatedData: StreakData = {
      ...currentData,
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastAnalysisDate: today,
      daysSinceLast: 0,
      streakStatus: 'active_today'
    };
    
    await cacheOfflineStreakData(updatedData);
    
    // Check for milestone
    const milestone = STREAK_MILESTONES.find(m => m.days === newStreak);
    
    return {
      currentStreak: newStreak,
      longestStreak: newLongest,
      isNewRecord,
      milestoneAchieved: milestone?.title || null
    };
  } catch (error) {
    console.error('Error updating offline streak:', error);
    return {
      currentStreak: 0,
      longestStreak: 0,
      isNewRecord: false,
      milestoneAchieved: null
    };
  }
};

/**
 * Reset user streak (admin function)
 */
export const resetUserStreak = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('user_streaks')
      .update({
        current_streak: 0,
        last_analysis_date: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error resetting streak:', error);
      return false;
    }

    // Clear offline cache
    await AsyncStorage.removeItem(OFFLINE_STREAK_KEY);
    
    return true;
  } catch (error) {
    console.error('Error in resetUserStreak:', error);
    return false;
  }
};
