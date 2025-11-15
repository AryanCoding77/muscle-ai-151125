// Data Transformer - Converts API responses to chart-ready formats

import { 
  MuscleAnalysisResponse, 
  MuscleAnalysis, 
  OverallAssessment,
  Recommendation 
} from '../../types/api.types';
import { COLORS, MUSCLE_GROUPS } from '../../config/constants';

export interface ChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }>;
}

export interface PieChartData {
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

export interface ProgressData {
  muscle: string;
  score: number;
  percentage: number;
  color: string;
  category: string;
}

export class DataTransformer {
  /**
   * Transform muscle analysis to bar chart data
   */
  public static toBarChartData(muscleAnalysis: MuscleAnalysis[]): ChartData {
    const sortedMuscles = [...muscleAnalysis].sort(
      (a, b) => b.development_score - a.development_score
    );

    return {
      labels: sortedMuscles.map(m => m.common_name),
      datasets: [{
        data: sortedMuscles.map(m => m.development_score),
        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
        strokeWidth: 2,
      }],
    };
  }

  /**
   * Transform muscle groups to pie chart data
   */
  public static toPieChartData(muscleAnalysis: MuscleAnalysis[]): PieChartData[] {
    const groupScores: { [key: string]: { total: number; count: number } } = {};

    // Calculate average scores per muscle group
    muscleAnalysis.forEach(muscle => {
      if (!groupScores[muscle.muscle_group]) {
        groupScores[muscle.muscle_group] = { total: 0, count: 0 };
      }
      groupScores[muscle.muscle_group].total += muscle.development_score;
      groupScores[muscle.muscle_group].count++;
    });

    return Object.entries(groupScores).map(([group, scores]) => {
      const avgScore = scores.total / scores.count;
      const groupConfig = MUSCLE_GROUPS[group] || { 
        name: group, 
        color: '#888888' 
      };

      return {
        name: groupConfig.name,
        population: Math.round(avgScore * 10), // Scale to 0-100
        color: groupConfig.color,
        legendFontColor: '#FFFFFF',
        legendFontSize: 12,
      };
    });
  }

  /**
   * Transform to progress bar data
   */
  public static toProgressData(muscleAnalysis: MuscleAnalysis[]): ProgressData[] {
    return muscleAnalysis.map(muscle => ({
      muscle: muscle.common_name,
      score: muscle.development_score,
      percentage: (muscle.development_score / 10) * 100,
      color: this.getScoreColor(muscle.development_score),
      category: muscle.development_category,
    }));
  }

  /**
   * Get color based on development score
   */
  private static getScoreColor(score: number): string {
    if (score >= 9) return COLORS.muscleExceptional;
    if (score >= 7) return COLORS.muscleWellDeveloped;
    if (score >= 5) return COLORS.muscleModerate;
    if (score >= 3) return COLORS.muscleDeveloping;
    return COLORS.muscleUnderdeveloped;
  }

  /**
   * Transform to ranked muscle list
   */
  public static toRankedList(
    muscleAnalysis: MuscleAnalysis[]
  ): Array<{
    rank: number;
    muscle: string;
    score: number;
    category: string;
    color: string;
    notes: string;
  }> {
    const sorted = [...muscleAnalysis].sort(
      (a, b) => b.development_score - a.development_score
    );

    return sorted.map((muscle, index) => ({
      rank: index + 1,
      muscle: muscle.common_name,
      score: muscle.development_score,
      category: muscle.development_category,
      color: this.getScoreColor(muscle.development_score),
      notes: muscle.specific_notes,
    }));
  }

  /**
   * Transform to comparison data
   */
  public static toComparisonData(
    before: MuscleAnalysisResponse,
    after: MuscleAnalysisResponse
  ) {
    const beforeMuscles = new Map(
      before.muscle_analysis.map(m => [m.muscle_name, m.development_score])
    );
    const afterMuscles = new Map(
      after.muscle_analysis.map(m => [m.muscle_name, m.development_score])
    );

    const muscles = [];
    const improvements = [];
    const declines = [];
    
    for (const [muscle, beforeScore] of beforeMuscles) {
      const afterScore = afterMuscles.get(muscle) || beforeScore;
      const change = afterScore - beforeScore;
      
      const muscleData = {
        name: muscle.replace(/_/g, ' '),
        before: beforeScore,
        after: afterScore,
        change,
      };
      
      muscles.push(muscleData);
      
      if (change > 0) {
        improvements.push({
          muscle: muscleData.name,
          improvement: change,
        });
      } else if (change < 0) {
        declines.push({
          muscle: muscleData.name,
          decline: change,
        });
      }
    }

    // Sort improvements and declines
    improvements.sort((a, b) => b.improvement - a.improvement);
    declines.sort((a, b) => a.decline - b.decline);

    // Calculate overall stats
    const overall = {
      physiqueBefore: before.overall_assessment.overall_physique_score,
      physiqueAfter: after.overall_assessment.overall_physique_score,
      physiqueChange: after.overall_assessment.overall_physique_score - before.overall_assessment.overall_physique_score,
      symmetryBefore: before.overall_assessment.body_symmetry_score,
      symmetryAfter: after.overall_assessment.body_symmetry_score,
      symmetryChange: after.overall_assessment.body_symmetry_score - before.overall_assessment.body_symmetry_score,
      averageChange: muscles.reduce((sum, m) => sum + m.change, 0) / muscles.length,
    };

    return {
      muscles: muscles.sort((a, b) => Math.abs(b.change) - Math.abs(a.change)),
      improvements,
      declines,
      overall,
    };
  }

  /**
   * Transform recommendations to actionable items
   */
  public static toActionableRecommendations(
    recommendations: Recommendation[]
  ): Array<{
    id: string;
    title: string;
    priority: 'low' | 'medium' | 'high';
    exercises: string[];
    frequency: string;
    color: string;
    icon: string;
  }> {
    return recommendations.map((rec, index) => ({
      id: `rec_${index}`,
      title: `Improve ${rec.muscle_target}`,
      priority: rec.priority,
      exercises: rec.suggested_exercises,
      frequency: rec.training_frequency,
      color: rec.priority === 'high'
        ? COLORS.danger
        : rec.priority === 'medium'
        ? COLORS.warning
        : COLORS.info,
      icon: rec.priority === 'high' ? '🔥' : rec.priority === 'medium' ? '⚡' : '💪',
    }));
  }

  /**
   * Calculate body symmetry data
   */
  public static toSymmetryData(
    muscleAnalysis: MuscleAnalysis[]
  ): {
    leftSide: number[];
    rightSide: number[];
    symmetryScore: number;
    imbalances: string[];
  } {
    const leftMuscles = muscleAnalysis.filter(m => 
      m.muscle_name.toLowerCase().includes('left')
    );
    const rightMuscles = muscleAnalysis.filter(m => 
      m.muscle_name.toLowerCase().includes('right')
    );

    const leftScores = leftMuscles.map(m => m.development_score);
    const rightScores = rightMuscles.map(m => m.development_score);

    // Calculate symmetry score
    let symmetryScore = 100;
    const imbalances: string[] = [];

    leftMuscles.forEach((leftMuscle, index) => {
      const rightMuscle = rightMuscles[index];
      if (rightMuscle) {
        const diff = Math.abs(
          leftMuscle.development_score - rightMuscle.development_score
        );
        if (diff > 1) {
          symmetryScore -= diff * 5;
          imbalances.push(
            `${leftMuscle.common_name}: ${diff} point difference`
          );
        }
      }
    });

    return {
      leftSide: leftScores,
      rightSide: rightScores,
      symmetryScore: Math.max(0, symmetryScore),
      imbalances,
    };
  }

  /**
   * Generate summary statistics
   */
  public static toSummaryStats(
    analysis: MuscleAnalysisResponse
  ): {
    totalMusclesAnalyzed: number;
    averageScore: number;
    strongestMuscle: string;
    weakestMuscle: string;
    overallCategory: string;
    confidenceLevel: number;
    imageQuality: string;
  } {
    const muscles = analysis.muscle_analysis;
    const avgScore = muscles.reduce((sum, m) => sum + m.development_score, 0) / muscles.length;

    const strongest = muscles.reduce((max, m) => 
      m.development_score > max.development_score ? m : max
    );
    const weakest = muscles.reduce((min, m) => 
      m.development_score < min.development_score ? m : min
    );

    return {
      totalMusclesAnalyzed: muscles.length,
      averageScore: Math.round(avgScore * 10) / 10,
      strongestMuscle: strongest.common_name,
      weakestMuscle: weakest.common_name,
      overallCategory: this.getOverallCategory(avgScore),
      confidenceLevel: analysis.analysis_metadata.analysis_confidence,
      imageQuality: analysis.analysis_metadata.image_quality,
    };
  }

  /**
   * Get overall category based on average score
   */
  private static getOverallCategory(avgScore: number): string {
    if (avgScore >= 8) return 'Exceptional';
    if (avgScore >= 6) return 'Well-Developed';
    if (avgScore >= 4) return 'Developing';
    if (avgScore >= 2) return 'Beginner';
    return 'Just Starting';
  }

  /**
   * Transform to timeline data for progress tracking
   */
  public static toTimelineData(
    analyses: Array<{ date: Date; analysis: MuscleAnalysisResponse }>
  ): {
    dates: string[];
    muscleProgress: Map<string, number[]>;
    overallProgress: number[];
  } {
    const dates = analyses.map(a => 
      a.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );

    const muscleProgress = new Map<string, number[]>();
    const overallProgress: number[] = [];

    analyses.forEach(({ analysis }) => {
      // Track individual muscle progress
      analysis.muscle_analysis.forEach(muscle => {
        if (!muscleProgress.has(muscle.common_name)) {
          muscleProgress.set(muscle.common_name, []);
        }
        muscleProgress.get(muscle.common_name)!.push(muscle.development_score);
      });

      // Track overall progress
      overallProgress.push(analysis.overall_assessment.overall_physique_score);
    });

    return {
      dates,
      muscleProgress,
      overallProgress,
    };
  }

  /**
   * Generate workout plan from recommendations
   */
  public static toWorkoutPlan(
    recommendations: Recommendation[]
  ): Array<{
    day: string;
    muscleGroups: string[];
    exercises: Array<{
      name: string;
      sets: string;
      reps: string;
      rest: string;
    }>;
  }> {
    // Group recommendations by muscle group
    const highPriority = recommendations.filter(r => r.priority === 'high');
    const mediumPriority = recommendations.filter(r => r.priority === 'medium');
    const lowPriority = recommendations.filter(r => r.priority === 'low');

    // Create a sample workout plan
    const workoutPlan = [];

    if (highPriority.length > 0) {
      workoutPlan.push({
        day: 'Day 1 - Priority Focus',
        muscleGroups: highPriority.map(r => r.muscle_target),
        exercises: highPriority.flatMap(r => 
          r.suggested_exercises.map(exercise => ({
            name: exercise,
            sets: '4',
            reps: '8-12',
            rest: '90 seconds',
          }))
        ),
      });
    }

    if (mediumPriority.length > 0) {
      workoutPlan.push({
        day: 'Day 2 - Secondary Focus',
        muscleGroups: mediumPriority.map(r => r.muscle_target),
        exercises: mediumPriority.flatMap(r => 
          r.suggested_exercises.slice(0, 2).map(exercise => ({
            name: exercise,
            sets: '3',
            reps: '10-15',
            rest: '60 seconds',
          }))
        ),
      });
    }

    return workoutPlan;
  }
}
