import { useEffect, useMemo, useState } from 'react';
import { MuscleAnalysisResponse, MuscleAnalysis } from '../types/api.types';
import { ExerciseDBService, ExercisesByTarget, ExerciseDBItem } from '../services/api/ExerciseDBService';
import { EXERCISEDB_CONFIG } from '../config/constants';

export interface MuscleWithExercises {
  muscle: MuscleAnalysis;
  exercises: ExerciseDBItem[];
  exerciseCount: number;
}

export interface UseExerciseRecsResult {
  loading: boolean;
  error: string | null;
  hasApiKey: boolean;
  musclesWithExercises: MuscleWithExercises[];
}

function mapMuscleToTargets(m: MuscleAnalysis): string[] {
  const common = m.common_name.toLowerCase();
  const group = m.muscle_group.toLowerCase();

  // Direct detections by name
  if (/(bicep|biceps)/.test(common)) return ['biceps'];
  if (/(tricep|triceps)/.test(common)) return ['triceps'];
  if (/forearm/.test(common)) return ['forearms'];
  if (/(quad|quadriceps)/.test(common)) return ['quads'];
  if (/(hamstring|hamstrings)/.test(common)) return ['hamstrings'];
  if (/(calf|calves|gastrocnemius|soleus)/.test(common)) return ['calves'];
  if (/(lat|lats|latissimus)/.test(common)) return ['lats'];
  if (/(trap|trapezius)/.test(common)) return ['traps'];
  if (/(deltoid|delts|shoulder)/.test(common)) return ['delts'];
  if (/(pec|pectoralis|chest)/.test(common)) return ['pectorals'];
  if (/(glute|glutes|gluteus)/.test(common)) return ['glutes'];
  if (/(ab|abs|abdominals|rectus abdominis|core)/.test(common)) return ['abs'];
  if (/serratus/.test(common)) return ['serratus anterior'];
  if (/spine|erector/.test(common)) return ['spine'];
  if (/upper back/.test(common)) return ['upper back'];

  // Fallback by group
  switch (group) {
    case 'chest':
      return ['pectorals'];
    case 'shoulders':
      return ['delts'];
    case 'arms':
      return ['biceps', 'triceps'];
    case 'back':
      return ['lats', 'traps', 'upper back'];
    case 'legs':
      return ['quads', 'hamstrings', 'calves'];
    case 'abs':
      return ['abs'];
    case 'glutes':
      return ['glutes'];
    default:
      return [];
  }
}

export function useExerciseRecommendations(analysis: MuscleAnalysisResponse | null): UseExerciseRecsResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [musclesWithExercises, setMusclesWithExercises] = useState<MuscleWithExercises[]>([]);

  const hasApiKey = useMemo(() => !!EXERCISEDB_CONFIG.RAPIDAPI_KEY, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!analysis) {
        setMusclesWithExercises([]);
        return;
      }
      
      setLoading(true);
      setError(null);

      try {
        const service = ExerciseDBService.getInstance();
        if (!service.hasApiKey()) {
          setError('Missing RapidAPI key. Set EXPO_PUBLIC_RAPIDAPI_KEY in your .env');
          setLoading(false);
          return;
        }

        // Sort muscles by score (weakest first) and take up to 8 muscles
        const sortedMuscles = [...analysis.muscle_analysis]
          .sort((a, b) => a.development_score - b.development_score)
          .slice(0, 8);

        const muscleResults: MuscleWithExercises[] = [];

        for (const muscle of sortedMuscles) {
          const targets = mapMuscleToTargets(muscle);
          let allExercises: ExerciseDBItem[] = [];

          // Fetch exercises for all targets of this muscle
          for (const target of targets) {
            const exercises = await service.fetchExercisesByTarget(target, 3);
            allExercises = [...allExercises, ...exercises];
          }

          // Remove duplicates by exercise name
          const uniqueExercises = allExercises.filter((exercise, index, arr) => 
            arr.findIndex(e => e.name.toLowerCase() === exercise.name.toLowerCase()) === index
          );

          muscleResults.push({
            muscle,
            exercises: uniqueExercises.slice(0, 4), // Max 4 exercises per muscle
            exerciseCount: uniqueExercises.length,
          });
        }

        if (!cancelled) setMusclesWithExercises(muscleResults);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to fetch exercises');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [analysis, hasApiKey]);

  return {
    loading,
    error,
    hasApiKey,
    musclesWithExercises,
  };
}
