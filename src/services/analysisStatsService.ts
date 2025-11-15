import { supabase } from '../lib/supabase';

export interface DailyAnalysisStats {
  analysesCount: number;
  averageScore: number;
  bestScore: number;
  previousDayScore: number;
  improvement: number;
}

/**
 * Fetch analysis statistics for a specific date
 */
export const getAnalysisStatsForDate = async (date: Date): Promise<DailyAnalysisStats> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get start and end of the selected day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch analyses for the selected date
    const { data: analyses, error } = await supabase
      .from('analysis_history')
      .select('overall_score, created_at')
      .eq('user_id', user.id)
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching analysis stats:', error);
      throw error;
    }

    // Calculate stats for selected date
    const analysesCount = analyses?.length || 0;
    const scores = analyses?.map(a => a.overall_score).filter(s => s != null) || [];
    const averageScore = scores.length > 0 
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 0;
    const bestScore = scores.length > 0 ? Math.max(...scores) : 0;

    // Get previous day's average score
    const previousDay = new Date(date);
    previousDay.setDate(previousDay.getDate() - 1);
    const prevStartOfDay = new Date(previousDay);
    prevStartOfDay.setHours(0, 0, 0, 0);
    const prevEndOfDay = new Date(previousDay);
    prevEndOfDay.setHours(23, 59, 59, 999);

    const { data: prevAnalyses } = await supabase
      .from('analysis_history')
      .select('overall_score')
      .eq('user_id', user.id)
      .gte('created_at', prevStartOfDay.toISOString())
      .lte('created_at', prevEndOfDay.toISOString());

    const prevScores = prevAnalyses?.map(a => a.overall_score).filter(s => s != null) || [];
    const previousDayScore = prevScores.length > 0
      ? Math.round(prevScores.reduce((sum, score) => sum + score, 0) / prevScores.length)
      : 0;

    // Calculate improvement
    const improvement = previousDayScore > 0 
      ? Math.round(((averageScore - previousDayScore) / previousDayScore) * 100)
      : 0;

    return {
      analysesCount,
      averageScore,
      bestScore,
      previousDayScore,
      improvement,
    };
  } catch (error) {
    console.error('Error in getAnalysisStatsForDate:', error);
    // Return default values on error
    return {
      analysesCount: 0,
      averageScore: 0,
      bestScore: 0,
      previousDayScore: 0,
      improvement: 0,
    };
  }
};
